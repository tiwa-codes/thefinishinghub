import Link from "next/link";
import { PlaceholderBlock } from "@/components/placeholder-block";
import { PROJECTS } from "./home-data";

export function ProjectsGallery() {
  return (
    <section id="projects" className="mx-auto max-w-[1440px] px-5 pb-16 pt-3 lg:px-10 lg:pb-24">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-[14px] text-xs uppercase tracking-[0.2em] text-gold">
            Recent projects
          </div>
          <h2 className="font-serif text-2xl font-normal text-ink lg:text-[32px]">
            Rooms we&apos;ve finished
          </h2>
        </div>
        <Link
          href="#"
          className="border-b border-gold pb-[3px] text-[13px] font-medium text-forest no-underline"
        >
          All projects
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {PROJECTS.map((project) => (
          <Link key={project.name} href="#" className="block no-underline">
            <div className="h-80 overflow-hidden rounded-[3px]">
              <PlaceholderBlock label={project.placeholderLabel} className="h-full" />
            </div>
            <div className="pt-4">
              <div className="font-serif text-lg text-ink">{project.name}</div>
              <div className="mt-1 text-[13px] tracking-wide text-[#8a8073]">
                {project.meta}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
