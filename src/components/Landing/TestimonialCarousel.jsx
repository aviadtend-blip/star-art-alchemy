import { useState, useEffect, useRef, useCallback } from 'react';
import { Star } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

const TESTIMONIALS = [
  {
    quote: "I ordered this for my sister's birthday and she literally cried. The artwork captured her personality in a way I can't explain — the colors, the energy, everything felt like HER.",
    name: "Sarah L.",
    city: "Austin, TX",
  },
  {
    quote: "I'm a Scorpio rising and somehow this artwork just KNEW. The intensity, the depth, the dark jewel tones — it's like looking into a mirror. Hanging it in my office.",
    name: "Michelle K.",
    city: "Brooklyn, NY",
  },
  {
    quote: "Bought one for myself and immediately ordered three more as gifts. My mom's was so accurate it's scary — she said it's the most thoughtful gift she's ever received.",
    name: "Jessica R.",
    city: "Denver, CO",
  },
  {
    quote: "I've seen birth chart art online before but nothing comes close to this. The level of detail and how personal it feels — it's not generic zodiac stuff, it's actually based on YOUR chart.",
    name: "Amanda T.",
    city: "Portland, OR",
  },
  {
    quote: "Got this as a last-minute Mother's Day gift and it arrived beautifully framed and on time. My mom keeps telling everyone about it. Already planning to order for my best friend.",
    name: "Lauren M.",
    city: "Nashville, TN",
  },
  {
    quote: "As someone who's really into astrology, I was skeptical — but this blew me away. My Pisces moon energy is SO visible in the artwork. The canvas quality is museum-level too.",
    name: "Nicole W.",
    city: "San Diego, CA",
  },
];

export default function TestimonialCarousel() {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const autoplayRef = useRef(null);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => api.off('select', onSelect);
  }, [api]);

  // Auto-rotate every 5s, pause on interaction
  const resetAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      api?.scrollNext();
    }, 5000);
  }, [api]);

  useEffect(() => {
    if (!api) return;
    resetAutoplay();
    // Pause on pointer interaction, resume after
    const onPointerDown = () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
    const onSettle = () => resetAutoplay();
    api.on('pointerDown', onPointerDown);
    api.on('settle', onSettle);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      api.off('pointerDown', onPointerDown);
      api.off('settle', onSettle);
    };
  }, [api, resetAutoplay]);

  return (
    <section
      className="py-20 md:py-28"
      style={{ backgroundColor: 'hsl(var(--surface))' }}
    >
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-a2 text-surface-foreground font-display text-center mb-12">
          What Our Customers Say
        </h2>

        <Carousel
          setApi={setApi}
          opts={{ align: 'center', loop: true }}
          className="w-full"
        >
          <CarouselContent>
            {TESTIMONIALS.map((t, index) => (
              <CarouselItem key={index} className="basis-full">
                <div
                  className="py-10 px-8 md:px-12 text-center rounded-sm"
                  style={{
                    backgroundColor: 'hsl(var(--surface-card))',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    minHeight: 260,
                  }}
                >
                  {/* Stars */}
                  <div className="flex justify-center gap-1 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill="#F59E0B" stroke="#F59E0B" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-body-big font-body text-surface-foreground leading-relaxed mb-6" style={{ fontStyle: 'italic' }}>
                    "{t.quote}"
                  </p>

                  {/* Attribution */}
                  <p className="text-body-sm font-body text-surface-muted">
                    — {t.name}, {t.city}
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                backgroundColor: i === current ? '#FE6781' : 'hsl(var(--surface-border))',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
