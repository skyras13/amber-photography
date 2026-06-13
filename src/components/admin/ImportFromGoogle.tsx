"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Phase = "idle" | "waiting" | "importing" | "done" | "error";

export default function ImportFromGoogle({
  albumId,
  configured,
  connected,
}: {
  albumId: string;
  configured: boolean;
  connected: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!configured) {
    return (
      <div className="text-sm text-ink-soft space-y-2">
        <p>
          Not configured yet. Add <code>GOOGLE_CLIENT_ID</code> and{" "}
          <code>GOOGLE_CLIENT_SECRET</code> to <code>.env.local</code> (see{" "}
          <code>README.md</code> for the 5-minute setup), then restart.
        </p>
        <p>
          Once configured, you&apos;ll pick photos in Google&apos;s own picker and
          they&apos;ll be copied into this album.
        </p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-sm text-ink-soft space-y-3">
        <p>Connect the studio Google account to start importing.</p>
        <a
          href={`/api/google/auth?album=${albumId}`}
          className="inline-block bg-ink text-cream px-6 py-2.5 text-[12px] uppercase tracking-label hover:bg-bronze-dark transition-colors"
        >
          Connect Google Photos
        </a>
      </div>
    );
  }

  async function startImport() {
    setPhase("waiting");
    setMessage("Creating picker session…");
    try {
      const res = await fetch("/api/google/picker", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const session = await res.json();
      window.open(session.pickerUri, "_blank", "noopener");
      setMessage("Pick your photos in the Google Photos tab, then come back here.");

      pollRef.current = setInterval(async () => {
        const poll = await fetch(`/api/google/picker/${session.id}`);
        if (!poll.ok) return;
        const state = await poll.json();
        if (state.mediaItemsSet) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPhase("importing");
          setMessage("Copying photos into the album…");
          const imp = await fetch("/api/google/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: session.id, albumId }),
          });
          if (!imp.ok) {
            setPhase("error");
            setMessage(`Import failed: ${await imp.text()}`);
            return;
          }
          const result = await imp.json();
          setPhase("done");
          setMessage(`Imported ${result.imported} photos.`);
          router.refresh();
        }
      }, 4000);
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="text-sm space-y-3">
      <button
        onClick={startImport}
        disabled={phase === "waiting" || phase === "importing"}
        className="bg-ink text-cream px-6 py-2.5 text-[12px] uppercase tracking-label hover:bg-bronze-dark transition-colors disabled:opacity-50"
      >
        {phase === "waiting"
          ? "Waiting for picks…"
          : phase === "importing"
            ? "Importing…"
            : "Import from Google Photos"}
      </button>
      {message && (
        <p className={phase === "error" ? "text-red-700" : "text-ink-soft"}>{message}</p>
      )}
    </div>
  );
}
