import { NextRequest, NextResponse } from "next/server";
import {
  createResumableUploadSession,
  getDriveConfigStatus,
} from "@/lib/google-drive";

interface UploadSessionRequestBody {
  fileName?: string;
  customName?: string;
  mimeType?: string;
  fileSize?: number;
  uploaderName?: string;
  note?: string;
  passcode?: string;
}

function sanitizePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim();
}

function buildSavedFileName(
  originalName: string,
  customName: string | undefined,
  uploaderName: string
): string {
  const dotIndex = originalName.lastIndexOf(".");
  const ext = dotIndex > 0 ? originalName.slice(dotIndex) : "";
  const originalBase = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;

  const titlePart = sanitizePart(customName?.trim() || originalBase) || "video";
  const userPart = sanitizePart(uploaderName) || "user";

  return `${titlePart} - ${userPart}${ext}`;
}

export async function POST(request: NextRequest) {
  const config = getDriveConfigStatus();
  if (!config.configured) {
    return NextResponse.json(
      {
        error: "Google Drive is not configured yet.",
        missing: config.missing,
      },
      { status: 503 }
    );
  }

  let body: UploadSessionRequestBody;
  try {
    body = (await request.json()) as UploadSessionRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const expectedPasscode = process.env.UPLOAD_PASSCODE?.trim();
  if (expectedPasscode && body.passcode?.trim() !== expectedPasscode) {
    return NextResponse.json(
      { error: "Incorrect upload passcode." },
      { status: 401 }
    );
  }

  const fileName = body.fileName?.trim();
  const mimeType = body.mimeType?.trim();
  const fileSize = body.fileSize;
  const uploaderName = body.uploaderName?.trim();

  if (!fileName || !mimeType || typeof fileSize !== "number" || fileSize <= 0) {
    return NextResponse.json(
      { error: "Valid fileName, mimeType, and fileSize are required." },
      { status: 400 }
    );
  }

  if (!mimeType.startsWith("video/")) {
    return NextResponse.json(
      { error: "Only video files are allowed." },
      { status: 400 }
    );
  }

  if (!uploaderName) {
    return NextResponse.json(
      { error: "Uploader name is required." },
      { status: 400 }
    );
  }

  const savedFileName = buildSavedFileName(
    fileName,
    body.customName,
    uploaderName
  );

  try {
    const origin = request.headers.get("origin");
    const uploadUrl = await createResumableUploadSession({
      fileName: savedFileName,
      mimeType,
      fileSize,
      uploaderName,
      note: body.note,
      origin,
    });

    return NextResponse.json({ uploadUrl, savedFileName });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to initialize upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
