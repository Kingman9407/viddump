export interface DriveConfigStatus {
  configured: boolean;
  passcodeRequired: boolean;
  missing: string[];
}

export interface DriveVideoFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  webViewLink?: string;
  description?: string;
}

const REQUIRED_ENV_VARS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_DRIVE_FOLDER_ID",
] as const;

/**
 * Checks whether all required Google Drive environment variables are set.
 */
export function getDriveConfigStatus(): DriveConfigStatus {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
  return {
    configured: missing.length === 0,
    passcodeRequired: Boolean(process.env.UPLOAD_PASSCODE?.trim()),
    missing: [...missing],
  };
}

/**
 * Exchanges the stored OAuth2 refresh token for a short-lived Google Drive access token.
 */
export async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Drive OAuth credentials are not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Google access token: ${errorText}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google OAuth response did not include an access_token.");
  }

  return data.access_token;
}

/**
 * Creates a Google Drive resumable upload session URI for direct browser-to-Drive upload.
 */
export async function createResumableUploadSession(params: {
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploaderName: string;
  note?: string;
  origin?: string | null;
}): Promise<string> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured.");
  }

  const accessToken = await getGoogleAccessToken();

  const descriptionParts = [`Uploaded by: ${params.uploaderName}`];
  if (params.note?.trim()) {
    descriptionParts.push(`Note: ${params.note.trim()}`);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json; charset=UTF-8",
    "X-Upload-Content-Type": params.mimeType,
    "X-Upload-Content-Length": String(params.fileSize),
  };

  // Passing Origin lets Google Drive attach matching CORS headers to the resumable session URI.
  if (params.origin) {
    headers.Origin = params.origin;
  }

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: params.fileName,
        mimeType: params.mimeType,
        parents: [folderId],
        description: descriptionParts.join("\n"),
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive upload session failed: ${errorText}`);
  }

  const uploadUrl = response.headers.get("location");
  if (!uploadUrl) {
    throw new Error("Google Drive did not return a resumable upload Location header.");
  }

  return uploadUrl;
}

/**
 * Lists video files inside the configured Google Drive folder.
 */
export async function listDriveVideos(): Promise<DriveVideoFile[]> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured.");
  }

  const accessToken = await getGoogleAccessToken();
  const query = `'${folderId}' in parents and trashed = false and mimeType contains 'video/'`;
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", query);
  url.searchParams.set("orderBy", "createdTime desc");
  url.searchParams.set("pageSize", "50");
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("includeItemsFromAllDrives", "true");
  url.searchParams.set(
    "fields",
    "files(id,name,mimeType,size,createdTime,webViewLink,description)"
  );

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list Google Drive videos: ${errorText}`);
  }

  const data = (await response.json()) as { files?: DriveVideoFile[] };
  return data.files ?? [];
}
