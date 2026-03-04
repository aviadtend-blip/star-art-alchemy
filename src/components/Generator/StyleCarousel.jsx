import { useRef, useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const canScrollLeft = activeIndex > 0;
  const canScrollRight = activeIndex < styles.length - 1;

  const goLeft = () => {
    if (activeIndex > 0) {
      onActiveChange(activeIndex - 1);
      scrollToIndex(activeIndex - 1);
    }
  };

  const goRight = () => {
    if (activeIndex < styles.length - 1) {
      onActiveChange(activeIndex + 1);
      scrollToIndex(activeIndex + 1);
    }
  };

  return (
    <div className="w-full flex justify-center relative" style={{ overflow: 'clip' }}>
      {/* Left arrow — desktop only, when all styles shown */}
      {showingAll && (
        <button
          onClick={goLeft}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center transition-opacity"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.9)',
            opacity: canScrollLeft ? 1 : 0.3,
            cursor: canScrollLeft ? 'pointer' : 'default',
          }}
          disabled={!canScrollLeft}
          aria-label="Previous style"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: '#191919' }} />
        </button>
      )}

      {/* Right arrow — desktop only, when all styles shown */}
      {showingAll && (
        <button
          onClick={goRight}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center transition-opacity"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.9)',
            opacity: canScrollRight ? 1 : 0.3,
            cursor: canScrollRight ? 'pointer' : 'default',
          }}
          disabled={!canScrollRight}
          aria-label="Next style"
        >
          <ChevronRight className="w-5 h-5" style={{ color: '#191919' }} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex items-end overflow-x-auto overflow-y-hidden scrollbar-hide justify-start lg:justify-center"
        style={{
          scrollSnapType: 'x mandatory',
          padding: `0 ${PAD}px 8px`,
          gap: `${GAP}px`,
          WebkitOverflowScrolling: 'touch',
          height: ACTIVE_H + 8,
          maxWidth: showingAll
            ? (ACTIVE_W + (styles.length - 1) * (INACTIVE_W + GAP) + GAP + PAD * 2)
            : ((styles.length + 1) * (INACTIVE_W + GAP) + PAD * 2),
        }}
      >
        {styles.map((style, i) => {
          const isActive = i === activeIndex;

          return (
            <div
              key={style.id}
              ref={(el) => (cardRefs.current[i] = el)}
              className="shrink-0 relative group md:hover:scale-[1.04] md:hover:z-10"
              style={{
                width: INACTIVE_W,
                height: INACTIVE_H,
                scrollSnapAlign: 'center',
                borderRadius: 2,
                overflow: 'visible',
                transition: 'transform 0.2s ease',
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

              {/* Hover overlay — desktop only */}
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none"
                style={{ borderRadius: 2 }}
              >
                <div
                  className="flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-md"
                  style={{ width: 36, height: 36, borderRadius: '50%' }}
                >
                  <Search className="w-4 h-4" style={{ color: '#191919' }} />
                </div>
              </div>

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

              {/* Most popular badge */}
              {style.mostPopular && (
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

              {/* Hover label — desktop only, below card */}
              <div
                className="absolute left-0 right-0 hidden md:block text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ top: '100%', paddingTop: style.mostPopular ? 20 : 10 }}
              >
                <h3 className="font-display text-subtitle" style={{ color: '#000000' }}>
                  {style.name}
                </h3>
                <p className="font-body" style={{ fontSize: 14, color: '#727272', opacity: 0.7, marginTop: 2 }}>
                  {style.subtitle}
                </p>
              </div>
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
