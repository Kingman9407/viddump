"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { UploadProgress } from "@/components/UploadProgress";
import { VideoDropzone } from "@/components/VideoDropzone";

interface DriveStatus {
  configured: boolean;
  passcodeRequired: boolean;
}

interface FieldErrors {
  file?: string;
  uploaderName?: string;
  passcode?: string;
}

function getPreviewSavedName(
  file: File | null,
  customName: string,
  uploaderName: string
): string | null {
  if (!file && !customName.trim()) return null;
  const original = file?.name || "video.mp4";
  const dotIndex = original.lastIndexOf(".");
  const ext = dotIndex > 0 ? original.slice(dotIndex) : "";
  const originalBase = dotIndex > 0 ? original.slice(0, dotIndex) : original;
  const title = customName.trim() || originalBase;
  const user = uploaderName.trim() || "your-name";
  return `${title} - ${user}${ext}`;
}

export function UploadForm() {
  const customNameId = useId();
  const customNameHintId = useId();
  const uploaderId = useId();
  const uploaderHintId = useId();
  const uploaderErrId = useId();
  const noteId = useId();
  const passcodeId = useId();
  const passcodeErrId = useId();

  const uploaderRef = useRef<HTMLInputElement>(null);
  const passcodeRef = useRef<HTMLInputElement>(null);

  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [note, setNote] = useState("");
  const [passcode, setPasscode] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "preparing" | "uploading" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/drive/status")
      .then((res) => res.json())
      .then((data: DriveStatus) => {
        if (active) setDriveStatus(data);
      })
      .catch(() => {
        if (active) setDriveStatus({ configured: false, passcodeRequired: false });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const validateUploaderName = (value: string): string | undefined => {
    if (!value.trim()) return "Please enter your name so we know who uploaded this.";
    if (value.trim().length < 2) return "Name must be at least 2 characters.";
    return undefined;
  };

  const validatePasscode = (value: string): string | undefined => {
    if (driveStatus?.passcodeRequired && !value.trim()) {
      return "Please enter the shared upload passcode.";
    }
    return undefined;
  };

  const validateFile = (selected: File | null): string | undefined => {
    if (!selected) return "Please select a video file to upload.";
    if (!selected.type.startsWith("video/")) {
      return "Selected file does not look like a video.";
    }
    return undefined;
  };

  const handleFileSelect = (selected: File | null) => {
    setFile(selected);
    if (selected) {
      setErrors((prev) => ({ ...prev, file: validateFile(selected) }));
    } else {
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
    if (uploadStatus === "success" || uploadStatus === "error") {
      setUploadStatus("idle");
      setProgress(0);
      setStatusMessage("");
    }
  };

  const uploadToDrive = (
    uploadUrl: string,
    videoFile: File
  ): Promise<{ driveFileId?: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", videoFile.type || "video/mp4");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const pct = (event.loaded / event.total) * 100;
          setProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          let driveFileId: string | undefined;
          try {
            const parsed = JSON.parse(xhr.responseText) as { id?: string };
            driveFileId = parsed.id;
          } catch {
            // Response body may be empty or non-JSON; Drive upload still succeeded.
          }
          resolve({ driveFileId });
        } else {
          reject(
            new Error(
              `Google Drive returned status ${xhr.status}. Please check your Drive permissions.`
            )
          );
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error while uploading video to Google Drive."));
      };

      xhr.send(videoFile);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {
      file: validateFile(file),
      uploaderName: validateUploaderName(uploaderName),
      passcode: validatePasscode(passcode),
    };

    setErrors(nextErrors);

    if (nextErrors.uploaderName) {
      uploaderRef.current?.focus();
      return;
    }
    if (nextErrors.passcode) {
      passcodeRef.current?.focus();
      return;
    }
    if (nextErrors.file || !file) {
      return;
    }

    try {
      setUploadStatus("preparing");
      setProgress(0);
      setStatusMessage("Connecting to Google Drive...");

      const sessionRes = await fetch("/api/drive/upload-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          customName: customName.trim(),
          mimeType: file.type || "video/mp4",
          fileSize: file.size,
          uploaderName: uploaderName.trim(),
          note: note.trim(),
          passcode: passcode.trim(),
        }),
      });

      const sessionData = (await sessionRes.json()) as {
        uploadUrl?: string;
        savedFileName?: string;
        error?: string;
      };

      if (!sessionRes.ok || !sessionData.uploadUrl) {
        throw new Error(sessionData.error || "Could not start upload session.");
      }

      const finalName = sessionData.savedFileName || file.name;

      setUploadStatus("uploading");
      setStatusMessage(`Uploading "${finalName}" to your Google Drive folder...`);

      const { driveFileId } = await uploadToDrive(sessionData.uploadUrl, file);

      let discordNote = "";
      try {
        const notifyRes = await fetch("/api/discord/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: finalName,
            uploaderName: uploaderName.trim(),
            note: note.trim(),
            fileSize: file.size,
            driveFileId,
            passcode: passcode.trim(),
          }),
        });
        const notifyData = (await notifyRes.json()) as { sent?: boolean };
        if (notifyData.sent) {
          discordNote = " Discord notification sent.";
        }
      } catch {
        // Don't fail the upload if Discord notification fails.
      }

      setUploadStatus("success");
      setStatusMessage(
        `Saved as "${finalName}" in Google Drive.${discordNote}`
      );
    } catch (error) {
      setUploadStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Upload failed. Please try again."
      );
    }
  };

  const isBusy = uploadStatus === "preparing" || uploadStatus === "uploading";
  const previewSavedName = getPreviewSavedName(file, customName, uploaderName);

  return (
    <div className="space-y-6">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-950 sm:p-8"
      >
        <VideoDropzone
          file={file}
          onFileSelect={handleFileSelect}
          disabled={isBusy}
          error={errors.file}
        />

        {previewUrl && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-800">
            <video
              src={previewUrl}
              controls
              preload="metadata"
              className="max-h-72 w-full object-contain"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor={customNameId}
            className="block text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Custom video name (optional)
          </label>
          <input
            id={customNameId}
            name="customName"
            type="text"
            enterKeyHint="next"
            disabled={isBusy}
            value={customName}
            aria-describedby={customNameHintId}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Beach Trip Clip 1"
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <p
            id={customNameHintId}
            className="text-xs text-slate-500 dark:text-slate-400"
          >
            {previewSavedName
              ? `Will be saved in Drive as: ${previewSavedName}`
              : "Leave blank to use the original filename + your name."}
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={uploaderId}
            className="block text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Your name <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            ref={uploaderRef}
            id={uploaderId}
            name="uploaderName"
            type="text"
            required
            autoComplete="name"
            enterKeyHint="next"
            disabled={isBusy}
            value={uploaderName}
            aria-invalid={errors.uploaderName ? "true" : undefined}
            aria-describedby={
              errors.uploaderName
                ? `${uploaderHintId} ${uploaderErrId}`
                : uploaderHintId
            }
            onChange={(e) => {
              const next = e.target.value;
              setUploaderName(next);
              if (errors.uploaderName) {
                setErrors((prev) => ({
                  ...prev,
                  uploaderName: validateUploaderName(next),
                }));
              }
            }}
            onBlur={(e) => {
              if (e.target.value) {
                setErrors((prev) => ({
                  ...prev,
                  uploaderName: validateUploaderName(e.target.value),
                }));
              }
            }}
            placeholder="e.g. Aseem or Alex"
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <p
            id={uploaderHintId}
            className="text-xs text-slate-500 dark:text-slate-400"
          >
            Included in the saved filename and the Google Drive file description.
          </p>
          {errors.uploaderName && (
            <p id={uploaderErrId} className="text-sm text-red-600 dark:text-red-400">
              {errors.uploaderName}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={noteId}
            className="block text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Note (optional)
          </label>
          <textarea
            id={noteId}
            name="note"
            rows={2}
            disabled={isBusy}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What is this clip about?"
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {driveStatus?.passcodeRequired && (
          <div className="space-y-1.5">
            <label
              htmlFor={passcodeId}
              className="block text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              Shared upload passcode{" "}
              <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              ref={passcodeRef}
              id={passcodeId}
              name="passcode"
              type="password"
              required
              autoComplete="current-password"
              enterKeyHint="done"
              disabled={isBusy}
              value={passcode}
              aria-invalid={errors.passcode ? "true" : undefined}
              aria-describedby={errors.passcode ? passcodeErrId : undefined}
              onChange={(e) => {
                const next = e.target.value;
                setPasscode(next);
                if (errors.passcode) {
                  setErrors((prev) => ({
                    ...prev,
                    passcode: validatePasscode(next),
                  }));
                }
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  setErrors((prev) => ({
                    ...prev,
                    passcode: validatePasscode(e.target.value),
                  }));
                }
              }}
              placeholder="Enter shared passcode"
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {errors.passcode && (
              <p id={passcodeErrId} className="text-sm text-red-600 dark:text-red-400">
                {errors.passcode}
              </p>
            )}
          </div>
        )}

        <UploadProgress
          status={uploadStatus}
          progress={progress}
          statusMessage={statusMessage}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="submit"
            disabled={isBusy}
            className="min-h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? "Uploading..." : "Upload to Google Drive"}
          </button>

          {uploadStatus === "success" && (
            <Link
              href="/videos"
              className="min-h-12 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Download Videos →
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
