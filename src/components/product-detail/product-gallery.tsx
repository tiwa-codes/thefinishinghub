"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { VideoModal } from "./video-modal";

export type GalleryImage = {
  url: string;
  alt: string;
};

const ZOOM_FACTOR = 2.5;
const ZOOM_BOX_SIZE = 260;

export function ProductGallery({
  images,
  productName,
  videoUrl,
}: {
  images: GalleryImage[];
  productName: string;
  videoUrl?: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const active = images[activeIndex];

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ x, y });
  }

  return (
    <div>
      <div
        ref={imageRef}
        className="relative mb-3.5 touch-manipulation overflow-hidden bg-[#e2dccf]"
        style={{ aspectRatio: "1400 / 1002" }}
        onMouseMove={active ? handleMouseMove : undefined}
        onMouseLeave={() => setZoom(null)}
      >
        {active ? (
          <>
            <Image
              src={active.url}
              alt={active.alt}
              fill
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="object-cover"
              priority
            />
            {zoom && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-3 hidden overflow-hidden rounded-[2px] border border-cream/40 shadow-lg lg:block"
                style={{
                  width: ZOOM_BOX_SIZE,
                  height: ZOOM_BOX_SIZE,
                  backgroundImage: `url(${active.url})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${ZOOM_FACTOR * 100}%`,
                  backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                }}
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#e8e1d2]">
            <Image
              src="/images/tfh-monogram.png"
              alt=""
              width={64}
              height={64}
              className="h-16 w-auto opacity-40"
            />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mb-4 grid grid-cols-4 gap-2.5 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show photo ${i + 1} of ${productName}`}
              aria-current={i === activeIndex}
              className="cursor-pointer overflow-hidden border-2 bg-[#e2dccf] p-0"
              style={{
                aspectRatio: "1 / 1",
                borderColor: i === activeIndex ? "#0d3d28" : "#ddd5c4",
              }}
            >
              <Image
                src={img.url}
                alt=""
                width={120}
                height={120}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {videoUrl && (
        <button
          type="button"
          onClick={() => setVideoOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-[2px] border border-forest px-4 py-2.5 text-sm font-medium text-forest hover:bg-forest hover:text-cream"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="6 4 20 12 6 20 6 4"></polygon>
          </svg>
          Watch video
        </button>
      )}

      {videoOpen && videoUrl && (
        <VideoModal
          videoUrl={videoUrl}
          productName={productName}
          onClose={() => setVideoOpen(false)}
        />
      )}
    </div>
  );
}
