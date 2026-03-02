import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

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
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const pausedUntil = useRef(0);
  const touchStartX = useRef(0);

  const goTo = useCallback((index) => {
    setFading(true);
    setTimeout(() => {
      setActive(index);
      setFading(false);
    }, 200);
  }, []);

  const next = useCallback(() => goTo((active + 1) % TESTIMONIALS.length), [active, goTo]);
  const prev = useCallback(() => goTo((active - 1 + TESTIMONIALS.length) % TESTIMONIALS.length), [active, goTo]);

  // Auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      goTo((active + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [active, goTo]);

  const pauseInteraction = () => {
    pausedUntil.current = Date.now() + 8000; // pause while interacting + 3s after
  };

  const handleArrow = (fn) => () => { pauseInteraction(); fn(); };

  const t = TESTIMONIALS[active];

  return (
    <section
      className="py-20 md:py-28"
      style={{ backgroundColor: 'hsl(var(--surface))' }}
      onMouseEnter={() => { pausedUntil.current = Infinity; }}
      onMouseLeave={() => { pausedUntil.current = Date.now() + 3000; }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        pausedUntil.current = Infinity;
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) {
          dx < 0 ? next() : prev();
        }
        pausedUntil.current = Date.now() + 3000;
      }}
    >
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-a2 text-surface-foreground font-display text-center mb-12">
          What Our Customers Say
        </h2>

        {/* Card + arrows */}
        <div className="flex items-center gap-4">
          {/* Left arrow — desktop only */}
          <button
            onClick={handleArrow(prev)}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-full shrink-0"
            style={{ border: '1px solid hsl(var(--surface-border))' }}
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={18} className="text-surface-muted" />
          </button>

          {/* Card */}
          <div
            className="flex-1 py-10 px-8 md:px-12 text-center rounded-sm"
            style={{
              backgroundColor: 'hsl(var(--surface-card))',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              minHeight: 260,
            }}
          >
            <div
              style={{
                opacity: fading ? 0 : 1,
                transition: 'opacity 0.4s ease',
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
          </div>

          {/* Right arrow — desktop only */}
          <button
            onClick={handleArrow(next)}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-full shrink-0"
            style={{ border: '1px solid hsl(var(--surface-border))' }}
            aria-label="Next testimonial"
          >
            <ChevronRight size={18} className="text-surface-muted" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => { pauseInteraction(); goTo(i); }}
              aria-label={`Go to testimonial ${i + 1}`}
              className="rounded-full transition-colors duration-300"
              style={{
                width: 8,
                height: 8,
                backgroundColor: i === active ? '#FE6781' : 'hsl(var(--surface-border))',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
