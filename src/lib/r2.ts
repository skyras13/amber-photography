import { AwsClient } from "aws4fetch";

// Cloudflare R2 access via its S3-compatible API, signed with aws4fetch
// (tiny, fetch-based — no heavy AWS SDK). When the four env vars below are
// not set, callers fall back to local-disk storage so the app still runs in
// development without any cloud account.
//
//   R2_ENDPOINT           https://<account-id>.r2.cloudflarestorage.com
//   R2_BUCKET             your bucket name (e.g. amber-photos)
//   R2_ACCESS_KEY_ID      from "Manage R2 API Tokens"
//   R2_SECRET_ACCESS_KEY  from "Manage R2 API Tokens"

const endpoint = process.env.R2_ENDPOINT;
const bucket = process.env.R2_BUCKET;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export function r2Enabled(): boolean {
  return Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
}

let _client: AwsClient | null = null;
function client(): AwsClient {
  if (!_client) {
    _client = new AwsClient({
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
      region: "auto",
      service: "s3",
    });
  }
  return _client;
}

function objectUrl(key: string): string {
  // path-style: <endpoint>/<bucket>/<key>; preserve "/" in key segments
  const safeKey = key.split("/").map(encodeURIComponent).join("/");
  return `${endpoint}/${bucket}/${safeKey}`;
}

// Always hand fetch a concretely ArrayBuffer-backed view (strict lib types
// reject Uint8Array<ArrayBufferLike> as a body).
function toBody(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy;
}

export async function r2Put(
  key: string,
  bytes: Uint8Array,
  contentType?: string
): Promise<void> {
  const res = await client().fetch(objectUrl(key), {
    method: "PUT",
    body: toBody(bytes),
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
  if (!res.ok) {
    throw new Error(`R2 PUT ${key} failed: ${res.status} ${await res.text()}`);
  }
}

export async function r2Get(
  key: string
): Promise<{ bytes: Uint8Array<ArrayBuffer>; contentType: string } | null> {
  const res = await client().fetch(objectUrl(key), { method: "GET" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 GET ${key} failed: ${res.status}`);
  return {
    bytes: new Uint8Array(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") || "application/octet-stream",
  };
}

export async function r2GetText(key: string): Promise<string | null> {
  const res = await client().fetch(objectUrl(key), { method: "GET" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 GET ${key} failed: ${res.status}`);
  return res.text();
}

export async function r2Delete(key: string): Promise<void> {
  const res = await client().fetch(objectUrl(key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 DELETE ${key} failed: ${res.status}`);
  }
}
