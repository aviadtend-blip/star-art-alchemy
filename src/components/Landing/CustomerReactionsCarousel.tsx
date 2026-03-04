import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";


// --- Types ---

interface Testimonial {
  quote: string;
  author: string;
  rating: number;
}

interface CustomerReactionsCarouselProps {
  testimonials?: Testimonial[];
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

function DotIndicators({ total, active }: { total: number; active: number }) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            i === active ? "bg-[#fe6781]" : "bg-white/40"
          }`}
        />
      ))}
    </div>
  );
}

// --- Arrow Button ---

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ArrowLeft : ArrowRight;
  return (
    <button
      onClick={onClick}
      aria-label={`${direction === "left" ? "Previous" : "Next"} testimonial`}
      className="flex items-center justify-center w-8 h-8 rounded-full border border-white/40 hover:bg-white/10 transition-colors shrink-0"
    >
      <Icon className="w-4 h-4 text-white" strokeWidth={1.5} />
    </button>
  );
}

// --- Main Component ---

export default function CustomerReactionsCarousel({
  testimonials = defaultTestimonials,
}: CustomerReactionsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goLeft = useCallback(() => {
    setActiveIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1,
    );
  }, [testimonials.length]);

  const goRight = useCallback(() => {
    setActiveIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1,
    );
  }, [testimonials.length]);

  const current = testimonials[activeIndex];

  return (
    <div className="pb-[61px] px-4 w-full">

      <div className="relative z-10 flex flex-col gap-8 items-center justify-center max-w-[566px] mx-auto" style={{ minHeight: 200 }}>
      <div className="flex gap-8 items-center justify-center w-full">
        <ArrowButton direction="left" onClick={goLeft} />

        <div className="flex-1 flex flex-col gap-5 items-center">
          <StarRating count={current.rating} />

          <p
            className="text-[24px] font-medium text-white text-center leading-[1.2] tracking-[-0.48px]"
            style={{ fontFamily: "'TASA Explorer', sans-serif" }}
          >
            "{current.quote}"
          </p>

          <p
            className="text-[12px] font-bold uppercase text-white/50 tracking-normal leading-[1.13]"
            style={{ fontFamily: "'TASA Explorer', sans-serif" }}
          >
            — {current.author}
          </p>
        </div>

        <ArrowButton direction="right" onClick={goRight} />
      </div>

      <DotIndicators total={testimonials.length} active={activeIndex} />
      </div>
    </div>
  );
}
