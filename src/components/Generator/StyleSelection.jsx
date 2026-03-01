import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ART_STYLES, ADDITIONAL_STYLES } from '@/config/artStyles';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';
import ThumbnailStrip from '@/components/ui/ThumbnailStrip';
import StyleCarousel from '@/components/Generator/StyleCarousel';

// Prism Storm images
import prismThumb from '@/assets/gallery/styles/prism-storm-thumb.webp';
import prism2 from '@/assets/gallery/styles/prism-storm-2.webp';
import prism3 from '@/assets/gallery/styles/prism-storm-3.webp';
import prism4 from '@/assets/gallery/styles/prism-storm-4.webp';

// Folk Oracle images
import folkThumb from '@/assets/gallery/styles/folk-oracle-thumb.webp';
import folk2 from '@/assets/gallery/styles/folk-oracle-2.webp';
import folk3 from '@/assets/gallery/styles/folk-oracle-3.webp';
import folk4 from '@/assets/gallery/styles/folk-oracle-4.webp';

// Cosmic Fable images
import fableThumb from '@/assets/gallery/styles/cosmic-fable-thumb.webp';
import fable2 from '@/assets/gallery/styles/cosmic-fable-2.webp';
import fable3 from '@/assets/gallery/styles/cosmic-fable-3.webp';
import fable4 from '@/assets/gallery/styles/cosmic-fable-4.webp';

// Paper Carnival images
import paperThumb from '@/assets/gallery/styles/paper-carnival-thumb.webp';
import paper2 from '@/assets/gallery/styles/paper-carnival-2.webp';
import paper3 from '@/assets/gallery/styles/paper-carnival-3.webp';
import paper4 from '@/assets/gallery/styles/paper-carnival-4.webp';

// Red Eclipse images
import redThumb from '@/assets/gallery/styles/red-eclipse-thumb.webp';
import red2 from '@/assets/gallery/styles/red-eclipse-2.webp';
import red3 from '@/assets/gallery/styles/red-eclipse-3.webp';
import red4 from '@/assets/gallery/styles/red-eclipse-4.webp';

// Cosmic Collision images
import collisionThumb from '@/assets/gallery/styles/cosmic-collision-thumb.webp';
import collision2 from '@/assets/gallery/styles/cosmic-collision-2.webp';
import collision3 from '@/assets/gallery/styles/cosmic-collision-3.webp';
import collision4 from '@/assets/gallery/styles/cosmic-collision-4.webp';

const STYLE_IMAGES = {
  'prism-storm': prismThumb,
  'folk-oracle': folkThumb,
  'cosmic-fable': fableThumb,
  'paper-carnival': paperThumb,
  'red-eclipse': redThumb,
  'cosmic-collision': collisionThumb,
};

const STYLE_GALLERY = {
  'prism-storm': [prismThumb, prism2, prism3, prism4],
  'folk-oracle': [folkThumb, folk2, folk3, folk4],
  'cosmic-fable': [fableThumb, fable2, fable3, fable4],
  'paper-carnival': [paperThumb, paper2, paper3, paper4],
  'red-eclipse': [redThumb, red2, red3, red4],
  'cosmic-collision': [collisionThumb, collision2, collision3, collision4],
};

const STYLE_LABELS = {
  'prism-storm': { title: 'PRISM STORM', sub: 'Abstract expressionist cosmos' },
  'folk-oracle': { title: 'FOLK ORACLE', sub: 'Dark folklore, rich warmth' },
  'cosmic-fable': { title: 'COSMIC FABLE', sub: 'Retro cosmic storytelling' },
  'paper-carnival': { title: 'PAPER CARNIVAL', sub: 'Bright naive wonder' },
  'red-eclipse': { title: 'RED ECLIPSE', sub: 'Bold ink, crimson fire' },
  'cosmic-collision': { title: 'COSMIC COLLISION', sub: 'Explosive mixed-media surrealism' },
};

const toCarouselShape = (s) => ({
  id: s.id,
  name: STYLE_LABELS[s.id]?.title || s.name,
  subtitle: STYLE_LABELS[s.id]?.sub || '',
  imageSrc: STYLE_IMAGES[s.id],
  mostPopular: !!s.popular,
});

const baseStyles = ART_STYLES.map(toCarouselShape);
const additionalStyles = ADDITIONAL_STYLES.map(toCarouselShape);
const allStyles = [...baseStyles, ...additionalStyles];

export default function StyleSelection({ onSelect, onBack, chartData, formData, onEditBirthData }) {
  const [showAll, setShowAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [prevLabel, setPrevLabel] = useState(null); // for crossfade
  const touchStartRef = useRef({ x: 0, y: 0 });
  const swipeHandledRef = useRef(false);

  const carouselStyles = showAll ? allStyles : baseStyles;
  const currentStyle = carouselStyles[activeIndex];
  const selectedStyleId = currentStyle?.id;

  // Crossfade label transition
  useEffect(() => {
    setPrevLabel(null); // reset on index change — triggers fade-in
  }, [activeIndex]);

  const handleContinue = () => {
    if (selectedStyleId) onSelect(selectedStyleId);
  };

  const handleSurpriseMe = () => {
    const dominantElement = chartData?.dominant_element;
    let autoId = ART_STYLES[0].id;
    if (dominantElement === 'Water' || dominantElement === 'Earth') {
      autoId = 'folk-oracle';
    } else if (dominantElement === 'Air') {
      autoId = 'cosmic-fable';
    } else {
      autoId = 'prism-storm';
    }
    onSelect(autoId);
  };

  const openLightbox = (styleId) => {
    setLightbox({ styleId, index: 0 });
    requestAnimationFrame(() => setLightboxVisible(true));
  };

  const closeLightbox = useCallback(() => {
    setLightboxVisible(false);
    setTimeout(() => setLightbox(null), 250);
  }, []);

  const lightboxImages = lightbox ? STYLE_GALLERY[lightbox.styleId] || [] : [];

  const navigateLightbox = (dir) => {
    if (!lightbox) return;
    const len = lightboxImages.length;
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index + dir + len) % len,
    }));
  };

  const handleShowMore = () => {
    setShowAll(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <nav className="flex items-center justify-between" style={{ backgroundColor: '#121212', padding: '26px 30px' }}>
        <div className="text-a4 text-white font-display">Celestial Artworks</div>
        <button className="text-white/70 hover:text-white transition">
          <div className="space-y-1.5">
            <div className="w-6 h-0.5 bg-current" />
            <div className="w-6 h-0.5 bg-current" />
          </div>
        </button>
      </nav>

      {/* Progress bar */}
      <div style={{ borderBottom: '1px solid #2A2A2A' }}>
        <StepProgressBar currentStep={1} />
      </div>

      {/* Main content */}
      <div className="flex-1 w-full py-10 md:py-14">
        <div className="text-center max-w-[230px] mx-auto" style={{ paddingTop: 32, paddingBottom: 32 }}>
          <h2 className="font-display text-a2 md:text-[40px] text-surface-foreground tracking-tight" style={{ fontWeight: 400 }}>
            Choose your artistic expression
          </h2>
          <p className="text-body font-body text-surface-muted" style={{ marginTop: 10 }}>
            Each style reveals your cosmic blueprint differently. Pick the one that resonates.
          </p>
        </div>

        {/* Carousel */}
        <StyleCarousel
          styles={carouselStyles}
          activeIndex={activeIndex}
          onActiveChange={setActiveIndex}
          onZoom={openLightbox}
          onShowMore={handleShowMore}
          showingAll={showAll}
        />

        {/* Title + subtitle below carousel — crossfade */}
        <div className="text-center mt-3 relative" style={{ minHeight: 44 }}>
          <div
            key={activeIndex}
            className="animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            <h3
              className="font-display text-subtitle"
              style={{ color: '#000000' }}
            >
              {currentStyle?.name}
            </h3>
            <p
              className="font-body"
              style={{ fontSize: 14, color: '#727272', opacity: 0.7, marginTop: 2 }}
            >
              {currentStyle?.subtitle}
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="text-center space-y-4 mt-8 px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            <button
              onClick={handleContinue}
              className="btn-base btn-primary"
            >
              Select Style
            </button>
            <button
              onClick={handleSurpriseMe}
              className="btn-base btn-secondary"
            >
              Surprise me
            </button>
          </div>
          <p className="text-body font-body text-surface-muted">Can't decide? Let us choose the best style based on your chart</p>
          <div className="inline-flex items-center justify-center gap-2.5 mt-2" style={{ padding: '8px', borderRadius: '2px', backgroundColor: '#FFF5DD' }}>
            <p className="text-body font-body" style={{ color: '#C99700' }}>💡 You'll see your preview before committing.</p>
          </div>
        </div>
      </div>

      {/* Birth data bar */}
      <BirthDataBar formData={formData} onEdit={onEditBirthData} />

      {/* Footer */}
      <Footer />

      {/* Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-250"
          style={{
            backgroundColor: lightboxVisible ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0)',
            opacity: lightboxVisible ? 1 : 0,
          }}
          onClick={closeLightbox}
          onTouchStart={(e) => {
            const t = e.touches[0];
            touchStartRef.current = { x: t.clientX, y: t.clientY };
            swipeHandledRef.current = false;
          }}
          onTouchMove={(e) => {
            if (swipeHandledRef.current) return;
            const t = e.touches[0];
            const dx = t.clientX - touchStartRef.current.x;
            const dy = t.clientY - touchStartRef.current.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              swipeHandledRef.current = true;
              navigateLightbox(dx < 0 ? 1 : -1);
            }
            if (dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.5) {
              swipeHandledRef.current = true;
              closeLightbox();
            }
          }}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 z-60 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="absolute top-6 left-6 text-white/80">
            <p className="text-a4 font-display">{STYLE_LABELS[lightbox.styleId]?.title}</p>
            <p className="text-body text-white/50">{STYLE_LABELS[lightbox.styleId]?.sub}</p>
          </div>

          <div
            className="flex-1 flex items-center justify-center w-full px-0 md:px-16 py-10 md:py-20 transition-transform duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImages[lightbox.index]}
              alt={`Gallery ${lightbox.index + 1}`}
              className="max-h-[80vh] w-full md:w-auto md:max-w-full object-contain"
              style={{ borderRadius: '2px' }}
            />
          </div>

          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors hidden md:flex"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors hidden md:flex"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          <div className="pb-6" onClick={(e) => e.stopPropagation()}>
            <ThumbnailStrip
              images={lightboxImages}
              activeIndex={lightbox.index}
              onSelect={(i) => setLightbox((prev) => ({ ...prev, index: i }))}
              size={56}
            />
          </div>
        </div>
      )}
    </div>
  );
}
