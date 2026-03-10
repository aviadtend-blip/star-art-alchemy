"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageMarqueeProps {
  images: string[];
  className?: string;
  /** Duration in seconds for one full cycle. Default: 30 */
  duration?: number;
}

// Alternating angles for the tilted card effect
const ANGLES = [-3, 2, -2, 3, -1, 2.5, -2.5, 1.5];

export const ImageMarquee: React.FC<ImageMarqueeProps> = ({
  images,
  className,
  duration = 30,
}) => {
  const duplicatedImages = [...images, ...images];

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
        {duplicatedImages.map((src, index) => {
          const angle = ANGLES[index % ANGLES.length];
          return (
            <div
              key={index}
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
                alt={`Gallery image ${(index % images.length) + 1}`}
                className="h-full w-full object-cover"
                loading={index < images.length ? "eager" : "lazy"}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-[40%] pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};
