import { useRef, useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import PopularTag from '@/components/ui/PopularTag';
import starsBg from '@/assets/stars-bg.jpg';

/**
 * Horizontal snap-scroll carousel for style selection.
 * Active (centered) card is larger; inactive cards are smaller.
 * Includes a "Show More" CTA as the final card.
 */
export default function StyleCarousel({
  styles,        // [{ id, name, subtitle, imageSrc, mostPopular? }]
  activeIndex,
  onActiveChange,
  onZoom,        // (styleId) => void
  onShowMore,    // () => void
  showingAll,    // boolean — hide "Show More" card when true
}) {
  const scrollRef = useRef(null);
  const cardRefs = useRef([]);
  const isScrollingRef = useRef(false);
  const userScrollRef = useRef(false);

  const ACTIVE_W = 304;
  const ACTIVE_H = 450;
  const INACTIVE_W = 290;
  const INACTIVE_H = 425;
  const GAP = 8;
  const PAD = 36;

  // Total items = styles + optional show-more card
  const totalCards = showingAll ? styles.length : styles.length + 1;

  // Detect which card is centered after scroll
  const detectCenter = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    if (closest !== activeIndex && closest < styles.length) {
      onActiveChange(closest);
    }
  }, [activeIndex, onActiveChange, styles.length]);

  // Scroll to active card programmatically
  const scrollToIndex = useCallback((idx) => {
    const card = cardRefs.current[idx];
    const el = scrollRef.current;
    if (!card || !el) return;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const scrollTarget = cardCenter - el.clientWidth / 2;
    isScrollingRef.current = true;
    el.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    setTimeout(() => { isScrollingRef.current = false; }, 400);
  }, []);

  // On mount and when activeIndex changes externally, scroll to it
  useEffect(() => {
    if (!userScrollRef.current) {
      scrollToIndex(activeIndex);
    }
    userScrollRef.current = false;
  }, [activeIndex, scrollToIndex]);

  // Scroll end detection
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let timeout;
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        userScrollRef.current = true;
        detectCenter();
      }, 80);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearTimeout(timeout);
    };
  }, [detectCenter]);

  return (
    <div className="w-full overflow-hidden">
      <div
        ref={scrollRef}
        className="flex items-end overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          padding: `0 ${PAD}px 8px`,
          gap: `${GAP}px`,
          WebkitOverflowScrolling: 'touch',
          height: ACTIVE_H + 8,
        }}
      >
        {styles.map((style, i) => {
          const isActive = i === activeIndex;
          const w = isActive ? ACTIVE_W : INACTIVE_W;
          const h = isActive ? ACTIVE_H : INACTIVE_H;

          return (
            <div
              key={style.id}
              ref={(el) => (cardRefs.current[i] = el)}
              className="shrink-0 relative"
              style={{
                width: w,
                height: h,
                scrollSnapAlign: 'center',
                borderRadius: 2,
                overflow: 'visible',
                transition: 'width 0.3s ease, height 0.3s ease',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (!isActive) {
                  onActiveChange(i);
                  scrollToIndex(i);
                }
              }}
            >
              {/* Artwork image */}
              <img
                src={style.imageSrc}
                alt={style.name}
                className="w-full h-full object-cover"
                style={{ borderRadius: 2, display: 'block' }}
              />

              {/* Zoom button — active card only */}
              {isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onZoom?.(style.id);
                  }}
                  className="absolute flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-md"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bottom: 16,
                    right: 16,
                  }}
                >
                  <Search className="w-4 h-4" style={{ color: '#191919' }} />
                </button>
              )}

              {/* Most popular badge — active card only */}
              {isActive && style.mostPopular && (
                <div
                  className="absolute left-1/2"
                  style={{
                    bottom: -8,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <PopularTag />
                </div>
              )}
            </div>
          );
        })}

        {/* "Show More" CTA card — hidden when all styles are shown */}
        {!showingAll && (
          <div
            ref={(el) => (cardRefs.current[styles.length] = el)}
            className="shrink-0 flex flex-col items-center justify-center"
            style={{
              width: INACTIVE_W,
              height: INACTIVE_H,
              scrollSnapAlign: 'center',
              borderRadius: 2,
              backgroundImage: `url(${starsBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <p
              className="text-center font-body"
              style={{ fontSize: 16, color: '#000000', padding: '0 24px' }}
            >
              Need to see more options?
            </p>
            <button
              onClick={() => onShowMore?.()}
              className="btn-secondary font-body"
              style={{
                marginTop: 17,
                padding: '12px 16px',
                fontSize: 16,
                width: 'calc(100% - 48px)',
                borderRadius: 40,
                backgroundColor: '#FFFFFF',
              }}
            >
              Show 3 additional styles
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
