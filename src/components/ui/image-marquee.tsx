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
  onInteraction?: () => void;
}

const ANGLES = [-3, 2, -2, 3, -1, 2.5, -2.5, 1.5];

function normalizeImage(img: string | MarqueeImage): MarqueeImage {
  return typeof img === "string" ? { src: img } : img;
}

export const ImageMarquee: React.FC<ImageMarqueeProps> = ({
  images,
  className,
  duration = 30,
  onInteraction,
}) => {
  const isMobile = useIsMobile() || (typeof window !== "undefined" && window.innerWidth < 768);
  const normalizedImages = React.useMemo(() => images.map(normalizeImage), [images]);
  const duplicatedImages = [...normalizedImages, ...normalizedImages];
  const mobileDuration = Math.max(duration, 10);

  if (isMobile) {
    return <MobileMarquee images={normalizedImages} className={className} duration={mobileDuration} onInteraction={onInteraction} />;
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
  onInteraction,
}: {
  images: MarqueeImage[];
  className?: string;
  duration: number;
  onInteraction?: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const pauseUntilRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);
  const dragStartXRef = React.useRef(0);
  const dragStartOffsetRef = React.useRef(0);
  const duplicatedImages = React.useMemo(() => [...images, ...images], [images]);

  // Smooth auto-scroll via transform
  React.useEffect(() => {
    let frameId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const inner = innerRef.current;
      if (!inner) { frameId = requestAnimationFrame(tick); return; }

      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      const halfWidth = inner.scrollWidth / 2;
      if (!halfWidth) { frameId = requestAnimationFrame(tick); return; }

      const pixelsPerSecond = halfWidth / duration;

      if (!isDraggingRef.current && now > pauseUntilRef.current) {
        offsetRef.current -= pixelsPerSecond * deltaSeconds;
      }

      // Wrap around seamlessly
      if (offsetRef.current <= -halfWidth) {
        offsetRef.current += halfWidth;
      } else if (offsetRef.current > 0) {
        offsetRef.current -= halfWidth;
      }

      inner.style.transform = `translateX(${offsetRef.current}px)`;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [duration, duplicatedImages]);

  const pauseAutoScroll = () => {
    pauseUntilRef.current = 0;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    containerRef.current?.setPointerCapture?.(event.pointerId);
    pauseAutoScroll();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = event.clientX - dragStartXRef.current;
    offsetRef.current = dragStartOffsetRef.current + deltaX;
    pauseAutoScroll();
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    containerRef.current?.releasePointerCapture?.(event.pointerId);
    pauseAutoScroll();
  };

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden select-none", className)}
      style={{ touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div
        ref={innerRef}
        className="flex w-max items-center px-4 pb-2 pt-1 will-change-transform"
        style={{ gap: "16px" }}
      >
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
