"use client";

import { useState } from "react";
import Image from "next/image";

export type GalleryImage = {
  url: string;
  alt: string;
};

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div>
      <div
        className="relative mb-3.5 overflow-hidden bg-[#e2dccf]"
        style={{ aspectRatio: "1400 / 1002" }}
      >
        {active ? (
          <Image
            src={active.url}
            alt={active.alt}
            fill
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-[#8a8073]">
            [ no photo yet ]
          </div>
        )}
      </div>

      {/* Only worth a thumbnail strip once there's more than one real
          photo to switch between. */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show photo ${i + 1} of ${productName}`}
              aria-current={i === activeIndex}
              className="overflow-hidden border-2 bg-[#e2dccf] p-0"
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
    </div>
  );
}
