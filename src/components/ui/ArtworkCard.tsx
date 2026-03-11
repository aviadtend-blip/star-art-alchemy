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
  /** Set to 'high' for LCP / above-the-fold cards, leave undefined for others */
  fetchPriority?: 'high' | 'low' | 'auto';
}

export default function ArtworkCard({
  imageSrc,
  imageAlt = "Celestial artwork",
  tags = [],
  className,
  fetchPriority,
}: ArtworkCardProps) {
  return (
    <div className={`relative flex-shrink-0 ${className ?? ""}`}>
      {/* Tags row — sits above the image */}
      {tags.length > 0 && (
        <div className="flex items-center justify-center gap-px mb-[-8px] relative z-10">
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
      {/* Image */}
      <div className="relative w-[200px] lg:w-[280px] overflow-hidden rounded-[2px]" style={{ aspectRatio: '2/3' }}>
        <img
          alt={imageAlt}
          className="absolute inset-0 size-full object-cover pointer-events-none"
          src={imageSrc}
          fetchPriority={fetchPriority ?? 'auto'}
        />
      </div>
    </div>
  );
}
