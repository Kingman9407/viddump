import { NextResponse } from "next/server";
import { getDriveConfigStatus, listDriveVideos } from "@/lib/google-drive";

export async function GET() {
  const config = getDriveConfigStatus();
  if (!config.configured) {
    return NextResponse.json(
      {
        configured: false,
        files: [],
        missing: config.missing,
      },
      { status: 200 }
    );
  }

  try {
    const files = await listDriveVideos();
    return NextResponse.json({ configured: true, files });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Drive videos.";
    return NextResponse.json({ configured: true, error: message, files: [] }, { status: 500 });
  }
}
