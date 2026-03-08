"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Testimonial {
  quote: string;
  name: string;
}

interface TestimonialCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  testimonials: Testimonial[];
  theme?: "dark" | "light";
}

export const TestimonialCarousel = React.forwardRef<
  HTMLDivElement,
  TestimonialCarouselProps
>(({ className, testimonials, theme = "dark", ...props }, ref) => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  const isDark = theme === "dark";

  React.useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {/* Star header */}
      <div className="flex items-end gap-3 mb-6">
        <span className="text-a2 font-display" style={{ color: "#FFBF00" }}>
          ★★★★★
        </span>
        <span
          className="text-a2 font-display"
          style={{ color: isDark ? "#ffffff" : "#333333" }}
        >
          4.9/5
        </span>
        <span
          className="text-subtitle font-display uppercase"
          style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#888888" }}
        >
          from 287 customers
        </span>
      </div>

      <Carousel
        setApi={setApi}
        opts={{ align: "center", loop: true }}
        className="w-full"
      >
        <CarouselContent>
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index} className="basis-full">
              <div className="flex flex-col gap-4">
                <p
                  className="text-body font-body leading-relaxed"
                  style={{ color: isDark ? "#ffffff" : "#333333" }}
                >
                  {testimonial.quote}
                </p>
                <p
                  className="text-subtitle uppercase"
                  style={{
                    fontSize: 10,
                    color: isDark ? "rgba(255,255,255,0.5)" : "#888888",
                  }}
                >
                  {testimonial.name}
                </p>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              current === index
                ? "w-6 bg-[hsl(var(--primary))]"
                : isDark
                  ? "w-2 bg-white/30 hover:bg-white/50"
                  : "w-2 bg-black/20 hover:bg-black/40"
            )}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

TestimonialCarousel.displayName = "TestimonialCarousel";
