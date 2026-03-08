"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface VerticalImageStackProps {
  images: { id: string | number; src: string; alt: string }[];
  className?: string;
}

export function VerticalImageStack({ images, className }: VerticalImageStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastNavigationTime = useRef(0);
  const navigationCooldown = 400;

  const navigate = useCallback(
    (newDirection: number) => {
      const now = Date.now();
      if (now - lastNavigationTime.current < navigationCooldown) return;
      lastNavigationTime.current = now;

      setCurrentIndex((prev) => {
        if (newDirection > 0) {
          return prev === images.length - 1 ? 0 : prev + 1;
        }
        return prev === 0 ? images.length - 1 : prev - 1;
      });
    },
    [images.length]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.y < -threshold) {
      navigate(1);
    } else if (info.offset.y > threshold) {
      navigate(-1);
    }
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 30) {
        e.preventDefault();
        if (e.deltaY > 0) {
          navigate(1);
        } else {
          navigate(-1);
        }
      }
    },
    [navigate]
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const getCardStyle = (index: number) => {
    const total = images.length;
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 5, rotateX: 0 };
    } else if (diff === -1) {
      return { y: -160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: 8 };
    } else if (diff === -2) {
      return { y: -280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: 15 };
    } else if (diff === 1) {
      return { y: 160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: -8 };
    } else if (diff === 2) {
      return { y: 280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: -15 };
    } else {
      return {
        y: diff > 0 ? 400 : -400,
        scale: 0.6,
        opacity: 0,
        zIndex: 0,
        rotateX: diff > 0 ? -20 : 20,
      };
    }
  };

  const isVisible = (index: number) => {
    const total = images.length;
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return Math.abs(diff) <= 2;
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col items-center justify-center", className)}
      style={{ height: "100%", perspective: 1200 }}
    >
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-64 h-64 rounded-full blur-3xl"
          style={{ backgroundColor: "hsl(var(--primary) / 0.08)" }}
        />
      </div>

      {/* Card Stack */}
      <div className="relative" style={{ width: 320, height: 440 }}>
        {images.map((image, index) => {
          if (!isVisible(index)) return null;
          const style = getCardStyle(index);
          const isCurrent = index === currentIndex;

          return (
            <motion.div
              key={image.id}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              style={{ zIndex: style.zIndex }}
              animate={{
                y: style.y,
                scale: style.scale,
                opacity: style.opacity,
                rotateX: style.rotateX,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
              drag={isCurrent ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={isCurrent ? handleDragEnd : undefined}
            >
              <div
                className="relative w-full h-full overflow-hidden shadow-2xl"
                style={{ borderRadius: 2 }}
              >
                {/* Card inner glow */}
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    borderRadius: 2,
                    boxShadow: "inset 0 1px 0 0 hsl(var(--foreground) / 0.06)",
                  }}
                />

                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: 2 }}
                  draggable={false}
                />

                {/* Bottom gradient overlay */}
                <div
                  className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
                  style={{
                    borderRadius: 2,
                    background:
                      "linear-gradient(to top, hsl(var(--background) / 0.6), transparent)",
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation dots */}
      <div className="flex flex-col items-center gap-2 mt-6">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (index !== currentIndex) setCurrentIndex(index);
            }}
            className={cn(
              "w-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "h-6 bg-foreground"
                : "h-2 bg-foreground/30 hover:bg-foreground/50"
            )}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Instruction hint */}
      <div className="mt-4">
        <div className="flex items-center gap-2 text-muted-foreground/50 text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <span>Scroll or drag</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Counter */}
      <div className="mt-3">
        <div className="flex items-center gap-1 text-sm font-medium tabular-nums text-foreground">
          <span className="text-foreground">
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
          <span className="text-muted-foreground/40 mx-1">/</span>
          <span className="text-muted-foreground/60">
            {String(images.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
