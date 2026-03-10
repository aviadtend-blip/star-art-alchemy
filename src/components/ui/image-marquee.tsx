"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageMarqueeProps {
  images: string[];
  className?: string;
  /** Duration in seconds for one full cycle. Default: 30 */
  duration?: number;
  /** Height of images. Default: "h-48" */
  imageHeight?: string;
}

export const ImageMarquee: React.FC<ImageMarqueeProps> = ({
  images,
  className,
  duration = 30,
  imageHeight = "h-48",
}) => {
  // Duplicate for seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <motion.div
        className="flex gap-4"
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
          <div
            key={index}
            className={cn(
              "relative flex-shrink-0 overflow-hidden rounded-lg",
              imageHeight
            )}
            style={{ aspectRatio: "3/4" }}
          >
            <img
              src={src}
              alt={`Gallery image ${(index % images.length) + 1}`}
              className="h-full w-full object-cover"
              loading={index < images.length ? "eager" : "lazy"}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};
