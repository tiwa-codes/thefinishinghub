import Image from "next/image";
import Link from "next/link";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { publicAssetExists } from "@/lib/public-asset";

type RoomTile = {
  label: string;
  image: string;
  objectPosition: string;
  fontSize: string;
};

const ROOMS: RoomTile[] = [
  { label: "Living Room", image: "/images/room-living.jpg", objectPosition: "center", fontSize: "text-[30px]" },
  { label: "Dining", image: "/images/room-dining.webp", objectPosition: "center 42%", fontSize: "text-[28px]" },
  { label: "Workspace", image: "/images/room-workspace.webp", objectPosition: "center 38%", fontSize: "text-[28px]" },
  { label: "Bedroom", image: "/images/bed-luxe-palm-mural.webp", objectPosition: "center", fontSize: "text-[30px]" },
];

export function ShopByRoom() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-11 pt-16 lg:px-10 lg:pt-24">
      <div className="mb-8 text-center lg:mb-[52px]">
        <h2 className="mb-[10px] font-serif text-[28px] font-normal text-ink lg:text-[38px]">
          Shop by Room
        </h2>
        <p className="text-sm tracking-wide text-[#8a8073]">
          Sorted by where you&apos;re building
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-[22px]">
        {ROOMS.map((room) => {
          const relativePath = room.image.replace(/^\//, "");
          const hasImage = publicAssetExists(relativePath);
          return (
            <Link
              key={room.label}
              href="#"
              className="relative block h-[320px] overflow-hidden bg-[#e2dccf] no-underline sm:h-[400px] lg:h-[480px]"
            >
              {hasImage ? (
                <Image
                  src={room.image}
                  alt={room.label}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: room.objectPosition }}
                />
              ) : (
                <PlaceholderBlock
                  label={`[ ${room.label.toLowerCase()} — finished scene ]`}
                  className="absolute inset-0"
                />
              )}
              <span
                className={`absolute bottom-7 left-8 font-serif ${room.fontSize} text-cream`}
                style={{ textShadow: "0 1px 12px rgba(7,40,24,0.55)" }}
              >
                {room.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
