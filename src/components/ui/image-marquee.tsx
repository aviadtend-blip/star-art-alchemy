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
  const isMobile = useIsMobile() || (typeof window !== "undefined" && window.innerWidth < 768);
  const normalizedImages = React.useMemo(() => images.map(normalizeImage), [images]);
  const duplicatedImages = [...normalizedImages, ...normalizedImages];
  const mobileDuration = Math.max(duration, 2.5);

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
  const isDraggingRef = React.useRef(false);
  const activePointerIdRef = React.useRef<number | null>(null);
  const pointerStartXRef = React.useRef(0);
  const scrollStartLeftRef = React.useRef(0);
  const duplicatedImages = React.useMemo(() => [...images, ...images], [images]);

  const normalizeScrollPosition = React.useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const loopWidth = container.scrollWidth / 2;
    if (!loopWidth) return;

    if (container.scrollLeft < loopWidth * 0.5) {
      container.scrollLeft += loopWidth;
    } else if (container.scrollLeft >= loopWidth * 1.5) {
      container.scrollLeft -= loopWidth;
    }
  }, []);

  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const loopWidth = container.scrollWidth / 2;
    if (loopWidth) {
      container.scrollLeft = loopWidth;
    }
  }, [duplicatedImages]);

  React.useEffect(() => {
    let frameId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const container = scrollRef.current;
      if (!container) return;

      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      const loopWidth = container.scrollWidth / 2;
      const pixelsPerSecond = loopWidth / duration;

      if (loopWidth && !isDraggingRef.current && now > pauseUntilRef.current) {
        container.scrollLeft += pixelsPerSecond * deltaSeconds;
        normalizeScrollPosition();
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [duration, duplicatedImages, normalizeScrollPosition]);

  const pauseAutoScroll = () => {
    pauseUntilRef.current = performance.now() + 900;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;

    isDraggingRef.current = true;
    activePointerIdRef.current = event.pointerId;
    pointerStartXRef.current = event.clientX;
    scrollStartLeftRef.current = container.scrollLeft;
    container.setPointerCapture?.(event.pointerId);
    pauseAutoScroll();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container || !isDraggingRef.current || activePointerIdRef.current !== event.pointerId) return;

    const deltaX = event.clientX - pointerStartXRef.current;
    container.scrollLeft = scrollStartLeftRef.current - deltaX;
    normalizeScrollPosition();
    pauseAutoScroll();
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (container && activePointerIdRef.current === event.pointerId) {
      container.releasePointerCapture?.(event.pointerId);
    }

    isDraggingRef.current = false;
    activePointerIdRef.current = null;
    normalizeScrollPosition();
    pauseAutoScroll();
  };

  return (
    <div
      ref={scrollRef}
      className={cn("w-full overflow-x-auto overflow-y-visible select-none", className)}
      style={{
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none" as React.CSSProperties["msOverflowStyle"],
        touchAction: "pan-y",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onScroll={() => {
        if (!isDraggingRef.current) {
          normalizeScrollPosition();
          pauseAutoScroll();
        }
      }}
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
