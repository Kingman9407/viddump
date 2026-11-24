import { NextRequest, NextResponse } from "next/server";
import {
  fetchDriveFileStream,
  getDriveConfigStatus,
  getDriveFileMetadata,
} from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const config = getDriveConfigStatus();
  if (!config.configured) {
    return NextResponse.json(
      { error: "Google Drive is not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId")?.trim();
  const passcode = searchParams.get("passcode")?.trim();

  const expectedPasscode = process.env.UPLOAD_PASSCODE?.trim();
  if (expectedPasscode && passcode !== expectedPasscode) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "Valid fileId is required." }, { status: 400 });
  }

  try {
    const [metadata, driveResponse] = await Promise.all([
      getDriveFileMetadata(fileId),
      fetchDriveFileStream(fileId),
    ]);

    const safeName = (metadata.name || "video.mp4").replace(/["\r\n]/g, "_");
    const headers = new Headers();
    headers.set(
      "Content-Type",
      metadata.mimeType || "application/octet-stream"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safeName}"`
    );
    if (metadata.size) {
      headers.set("Content-Length", metadata.size);
    }

    return new NextResponse(driveResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to download video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
