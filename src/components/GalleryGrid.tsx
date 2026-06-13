"use client";

import { useCallback, useEffect, useState } from "react";
import type { Photo } from "@/lib/types";

export default function GalleryGrid({
  photos,
  downloadable = false,
}: {
  photos: Photo[];
  downloadable?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);

  const step = useCallback(
    (dir: number) => {
      setOpen((cur) =>
        cur === null ? cur : (cur + dir + photos.length) % photos.length
      );
    },
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, step]);

  return (
    <>
      <div className="masonry">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setOpen(i)}
            className="block w-full cursor-zoom-in overflow-hidden bg-line"
            style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
            aria-label={`View photo ${i + 1}`}
          >
            <img
              src={`/api/photos/${photo.id}`}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover photo-hover"
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setOpen(null)}
        >
          <img
            src={`/api/photos/${photos[open].id}`}
            alt=""
            className="max-h-[88vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-5 right-6 text-white/70 hover:text-white text-3xl leading-none"
            onClick={() => setOpen(null)}
            aria-label="Close"
          >
            ×
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl px-3"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl px-3"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
          >
            ›
          </button>
          <div
            className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-6 text-white/60 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <span>
              {open + 1} / {photos.length}
            </span>
            {downloadable && (
              <a
                href={`/api/photos/${photos[open].id}?download=1`}
                className="underline hover:text-white"
              >
                Download
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
