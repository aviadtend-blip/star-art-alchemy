import { useState, useRef, useCallback, useEffect } from "react";
import { Star } from "lucide-react";

// --- Types ---

interface Testimonial {
  quote: string;
  author: string;
  rating: number;
}

interface CustomerReactionsCarouselMobileProps {
  testimonials?: Testimonial[];
  /** Auto-advance interval in ms (0 to disable) */
  autoPlayInterval?: number;
}

// --- Default Data ---

const defaultTestimonials: Testimonial[] = [
  {
    quote:
      "I've seen birth chart art online before but nothing comes close to this. The level of detail and how personal it feels — it's not generic zodiac stuff, it's actually based on YOUR chart.",
    author: "Amanda T., Portland, OR",
    rating: 5,
  },
  {
    quote:
      "This is the most meaningful piece of art I own. Every time I look at it, I notice something new that connects to my chart.",
    author: "Sarah M., Austin, TX",
    rating: 5,
  },
  {
    quote:
      "Bought this for my partner's birthday and they literally cried. It's so personal and beautifully done.",
    author: "Michael R., Brooklyn, NY",
    rating: 5,
  },
  {
    quote:
      "As a Taurus sun, this spoke to me instantly. Everyone who visits asks about it!",
    author: "Jennifer K., Denver, CO",
    rating: 5,
  },
  {
    quote:
      "The quality of the print is incredible. It looks even better in person than the preview.",
    author: "David L., San Francisco, CA",
    rating: 5,
  },
  {
    quote:
      "I've gifted three of these now. Each one is completely unique. My friends are obsessed.",
    author: "Rachel W., Chicago, IL",
    rating: 5,
  },
];

// --- Stars ---

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1 items-center justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          className="w-5 h-5 fill-[#f5a623] text-[#f5a623]"
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

// --- Dot Indicators ---

function DotIndicators({
  total,
  active,
  onDotClick,
}: {
  total: number;
  active: number;
  onDotClick: (index: number) => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          aria-label={`Go to testimonial ${i + 1}`}
          onClick={() => onDotClick(i)}
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            i === active ? "bg-[#fe6781]" : "bg-[#c1c1c1]"
          }`}
        />
      ))}
    </div>
  );
}

// --- Main Component ---

export default function CustomerReactionsCarouselMobile({
  testimonials = defaultTestimonials,
  autoPlayInterval = 0,
}: CustomerReactionsCarouselMobileProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Swipe detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold) {
      // Swipe left → next
      setActiveIndex((prev) =>
        prev === testimonials.length - 1 ? 0 : prev + 1,
      );
    } else if (diff < -threshold) {
      // Swipe right → previous
      setActiveIndex((prev) =>
        prev === 0 ? testimonials.length - 1 : prev - 1,
      );
    }
  }, [testimonials.length]);

  // Optional auto-advance
  useEffect(() => {
    if (autoPlayInterval <= 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) =>
        prev === testimonials.length - 1 ? 0 : prev + 1,
      );
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlayInterval, testimonials.length]);

  const current = testimonials[activeIndex];

  return (
    <section
      className="flex flex-col gap-8 items-center justify-center px-5 py-[61px] w-full bg-white"
      style={{ minHeight: 400 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Quote content (no arrows on mobile) */}
      <div className="flex flex-col gap-5 items-center w-full">
        {/* Stars */}
        <StarRating count={current.rating} />

        {/* Quote */}
        <p
          className="text-[24px] font-medium text-[#1e1e1e] text-center leading-[1.2] tracking-[-0.48px]"
          style={{ fontFamily: "'TASA Explorer', sans-serif" }}
        >
          "{current.quote}"
        </p>

        {/* Author */}
        <p
          className="text-[12px] font-bold uppercase text-[#727272] tracking-normal leading-[1.13]"
          style={{ fontFamily: "'TASA Explorer', sans-serif" }}
        >
          — {current.author}
        </p>
      </div>

      {/* Dot indicators */}
      <DotIndicators
        total={testimonials.length}
        active={activeIndex}
        onDotClick={goTo}
      />
    </section>
  );
}
