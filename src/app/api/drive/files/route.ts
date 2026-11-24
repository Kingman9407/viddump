import { NextRequest, NextResponse } from "next/server";
import { getDriveConfigStatus, listDriveVideos } from "@/lib/google-drive";

interface FilesRequestBody {
  passcode?: string;
}

export async function POST(request: NextRequest) {
  const config = getDriveConfigStatus();
  if (!config.configured) {
    return NextResponse.json(
      { configured: false, files: [] },
      { status: 503 }
    );
  }

  const expectedPasscode = process.env.UPLOAD_PASSCODE?.trim();
  if (expectedPasscode) {
    let body: FilesRequestBody = {};
    try {
      body = (await request.json()) as FilesRequestBody;
    } catch {
      return NextResponse.json({ error: "Passcode required." }, { status: 401 });
    }

    if (body.passcode?.trim() !== expectedPasscode) {
      return NextResponse.json(
        { error: "Incorrect passcode." },
        { status: 401 }
      );
    }
  }

  try {
    const files = await listDriveVideos();
    return NextResponse.json({ configured: true, files });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Drive videos.";
    return NextResponse.json(
      { configured: true, error: message, files: [] },
      { status: 500 }
    );
  }
}
