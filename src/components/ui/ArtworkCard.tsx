import React from "react";

interface ZodiacTag {
  emoji: string;
  label: string;
}

interface ArtworkCardProps {
  imageSrc: string;
  imageAlt?: string;
  tags?: ZodiacTag[];
  className?: string;
}

export default function ArtworkCard({
  imageSrc,
  imageAlt = "Celestial artwork",
  tags = [],
  className,
}: ArtworkCardProps) {
  return (
    <div className={`relative h-[300px] w-[200px] flex-shrink-0 overflow-hidden ${className ?? ""}`}>
      <img
        alt={imageAlt}
        className="absolute inset-0 size-full object-cover pointer-events-none"
        src={imageSrc}
      />
      {tags.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-[14px] flex items-center gap-px z-10">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className="flex items-center justify-center rounded-[2px] bg-black/70 backdrop-blur-[17px] px-2 py-1.5 text-[12px] leading-[1.13] tracking-[-0.36px] text-white text-center whitespace-nowrap"
            >
              {tag.emoji} {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
