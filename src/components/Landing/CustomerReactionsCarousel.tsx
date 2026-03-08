import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Testimonial {
  quote: string;
  author: string;
  rating: number;
}

interface CustomerReactionsCarouselProps {
  testimonials?: Testimonial[];
}

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

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1 items-center justify-center" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-5 h-5 text-primary fill-current" strokeWidth={0} />
      ))}
    </div>
  );
}

export default function CustomerReactionsCarousel({
  testimonials = defaultTestimonials,
}: CustomerReactionsCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    const updateActive = () => setActiveIndex(api.selectedScrollSnap());
    updateActive();

    api.on("select", updateActive);
    api.on("reInit", updateActive);

    return () => {
      api.off("select", updateActive);
      api.off("reInit", updateActive);
    };
  }, [api]);

  return (
    <div className="pb-[61px] px-4 w-full">
      <div className="relative z-10 flex flex-col gap-8 items-center justify-center max-w-[566px] mx-auto" style={{ minHeight: 200 }}>
        <Carousel setApi={setApi} opts={{ align: "center", loop: true }} className="w-full">
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="basis-full">
                <div className="flex flex-col gap-5 items-center">
                  <StarRating count={testimonial.rating} />
                  <p
                    className="text-[24px] font-medium text-foreground text-center leading-[1.2] tracking-[-0.48px]"
                    style={{ fontFamily: "'TASA Explorer', sans-serif" }}
                  >
                    "{testimonial.quote}"
                  </p>
                  <p
                    className="text-[12px] font-bold uppercase text-foreground/50 tracking-normal leading-[1.13]"
                    style={{ fontFamily: "'TASA Explorer', sans-serif" }}
                  >
                    — {testimonial.author}
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="flex gap-2 items-center">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === index ? "w-6 bg-primary" : "w-2 bg-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

