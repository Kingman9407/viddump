import { NextRequest, NextResponse } from "next/server";

interface DiscordNotifyBody {
  fileName?: string;
  uploaderName?: string;
  note?: string;
  fileSize?: number;
  driveFileId?: string;
  passcode?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return NextResponse.json({ sent: false, reason: "DISCORD_WEBHOOK_URL not set" });
  }

  let body: DiscordNotifyBody;
  try {
    body = (await request.json()) as DiscordNotifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const expectedPasscode = process.env.UPLOAD_PASSCODE?.trim();
  if (expectedPasscode && body.passcode?.trim() !== expectedPasscode) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const fileName = body.fileName?.trim() || "Untitled video";
  const uploaderName = body.uploaderName?.trim() || "Unknown";
  const driveLink = body.driveFileId
    ? `https://drive.google.com/file/d/${body.driveFileId}/view`
    : undefined;

  const fields = [
    { name: "Uploaded by", value: uploaderName, inline: true },
    { name: "File size", value: formatBytes(body.fileSize), inline: true },
  ];

  if (body.note?.trim()) {
    fields.push({ name: "Note", value: body.note.trim(), inline: false });
  }

  if (driveLink) {
    fields.push({
      name: "Google Drive",
      value: `[Open video in Drive](${driveLink})`,
      inline: false,
    });
  }

  const discordResponse = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "DriveDrop",
      embeds: [
        {
          title: `New video uploaded: ${fileName}`,
          color: 0x2563eb,
          fields,
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!discordResponse.ok) {
    const errorText = await discordResponse.text();
    return NextResponse.json(
      { sent: false, error: `Discord webhook failed: ${errorText}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ sent: true });
}
