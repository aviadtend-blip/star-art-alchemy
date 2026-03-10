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
  const normalizedImages = React.useMemo(() => images.map(normalizeImage), [images]);
  const duplicatedImages = [...normalizedImages, ...normalizedImages];
  const mobileDuration = Math.max(duration, 6);

  if (isMobile) {
    return <MobileMarquee images={normalizedImages} className={className} duration={mobileDuration} />;
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
        {duplicatedImages.map((img, index) => (
          <MarqueeCard key={index} image={img} index={index} totalImages={normalizedImages.length} />
        ))}
      </motion.div>
    </div>
  );
};

function MobileMarquee({
  images,
  className,
  duration,
}: {
  images: MarqueeImage[];
  className?: string;
  duration: number;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const pauseUntilRef = React.useRef(0);
  const isInteractingRef = React.useRef(false);
  const duplicatedImages = React.useMemo(() => [...images, ...images], [images]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let frameId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const container = scrollRef.current;
      if (!container) return;

      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      const loopWidth = container.scrollWidth / 2;
      const pixelsPerSecond = loopWidth / duration;

      if (!isInteractingRef.current && now > pauseUntilRef.current) {
        container.scrollLeft += pixelsPerSecond * deltaSeconds;

        if (container.scrollLeft >= loopWidth) {
          container.scrollLeft -= loopWidth;
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [duration, duplicatedImages]);

  const pauseAutoScroll = () => {
    pauseUntilRef.current = performance.now() + 1800;
  };

  return (
    <div
      ref={scrollRef}
      className={cn("w-full overflow-x-auto overflow-y-visible touch-pan-x", className)}
      style={{
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none" as React.CSSProperties["msOverflowStyle"],
      }}
      onTouchStart={() => {
        isInteractingRef.current = true;
        pauseAutoScroll();
      }}
      onTouchEnd={() => {
        isInteractingRef.current = false;
        pauseAutoScroll();
      }}
      onMouseDown={() => {
        isInteractingRef.current = true;
        pauseAutoScroll();
      }}
      onMouseUp={() => {
        isInteractingRef.current = false;
        pauseAutoScroll();
      }}
      onScroll={pauseAutoScroll}
    >
      <style>{`.mobile-marquee::-webkit-scrollbar { display: none; }`}</style>
      <div className="mobile-marquee flex w-max items-center px-4 pb-2 pt-1" style={{ gap: "16px" }}>
        {duplicatedImages.map((img, index) => (
          <MarqueeCard key={index} image={img} index={index} totalImages={images.length} />
        ))}
      </div>
    </div>
  );
}


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
