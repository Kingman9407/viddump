import { NextResponse } from "next/server";
import { getDriveConfigStatus } from "@/lib/google-drive";

export async function GET() {
  const status = getDriveConfigStatus();
  return NextResponse.json({
    configured: status.configured,
    passcodeRequired: status.passcodeRequired,
  });
}
