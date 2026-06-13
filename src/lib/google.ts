import fs from "fs";
import path from "path";

// Google Photos Picker API integration.
//
// Flow (the only Google-sanctioned way to pull from a user's library
// since the March 2025 Library API restrictions):
//   1. /api/google/auth        -> OAuth consent (photospicker.mediaitems.readonly)
//   2. /api/google/callback    -> store refresh token locally
//   3. POST picker session     -> user picks photos in the Google Photos UI
//   4. poll session            -> mediaItemsSet becomes true
//   5. list picked media items -> download baseUrl=d bytes into our storage
//
// Requires GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env.local.

const TOKEN_PATH = path.join(process.cwd(), "data", "google-tokens.json");
const SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleConnected(): boolean {
  return fs.existsSync(TOKEN_PATH);
}

function redirectUri(origin: string): string {
  return `${origin}/api/google/callback`;
}

export function authUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

type Tokens = { access_token: string; refresh_token?: string; expires_at: number };

function readTokens(): Tokens | null {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
}

function writeTokens(t: Tokens) {
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(t, null, 2));
}

export async function exchangeCode(code: string, origin: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const data = await res.json();
  writeTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  });
}

export async function accessToken(): Promise<string> {
  const tokens = readTokens();
  if (!tokens) throw new Error("Google account not connected");
  if (Date.now() < tokens.expires_at - 60_000) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error("Google session expired — reconnect");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: tokens.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const data = await res.json();
  const next: Tokens = {
    access_token: data.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  writeTokens(next);
  return next.access_token;
}

const PICKER = "https://photospicker.googleapis.com/v1";

export type PickerSession = {
  id: string;
  pickerUri: string;
  mediaItemsSet?: boolean;
  pollingConfig?: { pollInterval?: string };
};

export async function createPickerSession(): Promise<PickerSession> {
  const token = await accessToken();
  const res = await fetch(`${PICKER}/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error(`Picker session failed: ${await res.text()}`);
  return res.json();
}

export async function getPickerSession(sessionId: string): Promise<PickerSession> {
  const token = await accessToken();
  const res = await fetch(`${PICKER}/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Picker session poll failed: ${await res.text()}`);
  return res.json();
}

export type PickedItem = {
  id: string;
  type: string;
  mediaFile: { baseUrl: string; filename: string; mimeType: string };
};

export async function listPickedItems(sessionId: string): Promise<PickedItem[]> {
  const token = await accessToken();
  const items: PickedItem[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ sessionId });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`${PICKER}/mediaItems?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Listing picked items failed: ${await res.text()}`);
    const data = await res.json();
    items.push(...(data.mediaItems || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

export async function downloadPickedItem(item: PickedItem): Promise<Buffer> {
  const token = await accessToken();
  // "=d" requests the original-quality bytes
  const res = await fetch(`${item.mediaFile.baseUrl}=d`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Download failed for ${item.mediaFile.filename}`);
  return Buffer.from(await res.arrayBuffer());
}
