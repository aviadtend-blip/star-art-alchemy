"use client";

import React, { useRef, useState } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImageMarqueeProps {
  images: string[];
  className?: string;
  /** Duration in seconds for one full cycle (desktop auto-scroll). Default: 30 */
  duration?: number;
}

const ANGLES = [-3, 2, -2, 3, -1, 2.5, -2.5, 1.5];

export const ImageMarquee: React.FC<ImageMarqueeProps> = ({
  images,
  className,
  duration = 30,
}) => {
  const isMobile = useIsMobile();
  const duplicatedImages = [...images, ...images];

  if (isMobile) {
    return <MobileMarquee images={images} className={className} />;
  }

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <motion.div
        className="flex items-center"
        style={{ gap: "16px" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration,
            ease: "linear",
          },
        }}
      >
        {duplicatedImages.map((src, index) => (
          <ImageCard key={index} src={src} index={index} totalImages={images.length} />
        ))}
      </motion.div>
    </div>
  );
};

function MobileMarquee({ images, className }: { images: string[]; className?: string }) {
  return (
    <div
      className={cn("w-full overflow-x-auto", className)}
      style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <style>{`.mobile-marquee::-webkit-scrollbar { display: none; }`}</style>
      <div className="mobile-marquee flex items-center px-4" style={{ gap: "16px", width: "max-content" }}>
        {images.map((src, index) => (
          <ImageCard key={index} src={src} index={index} totalImages={images.length} />
        ))}
      </div>
    </div>
  );
}

function ImageCard({ src, index, totalImages }: { src: string; index: number; totalImages: number }) {
  const angle = ANGLES[index % ANGLES.length];
  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{
        width: 200,
        height: 300,
        borderRadius: 2,
        transform: `rotate(${angle}deg)`,
      }}
    >
      <img
        src={src}
        alt={`Gallery image ${(index % totalImages) + 1}`}
        className="h-full w-full object-cover"
        loading={index < totalImages ? "eager" : "lazy"}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[40%] pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}
      />
    </div>
  );
}
