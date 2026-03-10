"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ArtworkCard from "@/components/ui/ArtworkCard";

export interface MarqueeImage {
  src: string;
  tags?: { emoji: string; label: string }[];
}

interface ImageMarqueeProps {
  images: (string | MarqueeImage)[];
  className?: string;
  duration?: number;
}

const ANGLES = [-3, 2, -2, 3, -1, 2.5, -2.5, 1.5];

function normalizeImage(img: string | MarqueeImage): MarqueeImage {
  return typeof img === "string" ? { src: img } : img;
}

export const ImageMarquee: React.FC<ImageMarqueeProps> = ({
  images,
  className,
  duration = 30,
}) => {
  const isMobile = useIsMobile();
  const duplicatedImages = [...images, ...images];
  const mobileDuration = isMobile ? Math.max(duration * 0.7, 15) : duration;

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
            duration: mobileDuration,
            ease: "linear",
          },
        }}
      >
        {duplicatedImages.map((img, index) => (
          <MarqueeCard key={index} image={normalizeImage(img)} index={index} totalImages={images.length} />
        ))}
      </motion.div>
    </div>
  );
};

function MarqueeCard({ image, index, totalImages }: { image: MarqueeImage; index: number; totalImages: number }) {
  const angle = ANGLES[index % ANGLES.length];
  return (
    <div
      className="relative flex-shrink-0"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <ArtworkCard
        imageSrc={image.src}
        imageAlt={`Gallery image ${(index % totalImages) + 1}`}
        tags={image.tags}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[40%] pointer-events-none rounded-[2px]"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}
      />
    </div>
  );
}
