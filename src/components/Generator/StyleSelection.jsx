import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { VerticalImageStack } from '@/components/ui/vertical-image-stack';
import { ART_STYLES, ADDITIONAL_STYLES } from '@/config/artStyles';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

import StyleCarousel from '@/components/Generator/StyleCarousel';

// Canvas style images (default)
import prismThumb from '@/assets/gallery/styles/prism-storm-thumb.webp';
import prism2 from '@/assets/gallery/styles/prism-storm-2.webp';
import prism3 from '@/assets/gallery/styles/prism-storm-3.webp';
import prism4 from '@/assets/gallery/styles/prism-storm-4.webp';

import folkThumb from '@/assets/gallery/styles/folk-oracle-thumb.webp';
import folk2 from '@/assets/gallery/styles/folk-oracle-2.webp';
import folk3 from '@/assets/gallery/styles/folk-oracle-3.webp';
import folk4 from '@/assets/gallery/styles/folk-oracle-4.webp';

import fableThumb from '@/assets/gallery/styles/cosmic-fable-thumb.webp';
import fable2 from '@/assets/gallery/styles/cosmic-fable-2.webp';
import fable3 from '@/assets/gallery/styles/cosmic-fable-3.webp';
import fable4 from '@/assets/gallery/styles/cosmic-fable-4.webp';

import paperThumb from '@/assets/gallery/styles/paper-carnival-thumb.webp';
import paper2 from '@/assets/gallery/styles/paper-carnival-2.webp';
import paper3 from '@/assets/gallery/styles/paper-carnival-3.webp';
import paper4 from '@/assets/gallery/styles/paper-carnival-4.webp';

import redThumb from '@/assets/gallery/styles/red-eclipse-thumb.webp';
import red2 from '@/assets/gallery/styles/red-eclipse-2.webp';
import red3 from '@/assets/gallery/styles/red-eclipse-3.webp';
import red4 from '@/assets/gallery/styles/red-eclipse-4.webp';

import collisionThumb from '@/assets/gallery/styles/cosmic-collision-thumb.webp';
import collision2 from '@/assets/gallery/styles/cosmic-collision-2.webp';
import collision3 from '@/assets/gallery/styles/cosmic-collision-3.webp';
import collision4 from '@/assets/gallery/styles/cosmic-collision-4.webp';

const DEFAULT_STYLE_IMAGES = {
  'prism-storm': prismThumb,
  'folk-oracle': folkThumb,
  'cosmic-fable': fableThumb,
  'paper-carnival': paperThumb,
  'red-eclipse': redThumb,
  'cosmic-collision': collisionThumb,
};

const DEFAULT_STYLE_GALLERY = {
  'prism-storm': [prismThumb, prism2, prism3, prism4],
  'folk-oracle': [folkThumb, folk2, folk3, folk4],
  'cosmic-fable': [fableThumb, fable2, fable3, fable4],
  'paper-carnival': [paperThumb, paper2, paper3, paper4],
  'red-eclipse': [redThumb, red2, red3, red4],
  'cosmic-collision': [collisionThumb, collision2, collision3, collision4],
};

const DEFAULT_STYLE_LABELS = {
  'prism-storm': { title: 'PRISM STORM', sub: 'Abstract expressionist cosmos' },
  'folk-oracle': { title: 'FOLK ORACLE', sub: 'Dark folklore, rich warmth' },
  'cosmic-fable': { title: 'COSMIC FABLE', sub: 'Retro cosmic storytelling' },
  'paper-carnival': { title: 'PAPER CARNIVAL', sub: 'Bright naive wonder' },
  'red-eclipse': { title: 'RED ECLIPSE', sub: 'Bold ink, crimson fire' },
  'cosmic-collision': { title: 'COSMIC COLLISION', sub: 'Explosive mixed-media surrealism' },
};

const toCarouselShape = (s, styleImages, styleLabels) => ({
  id: s.id,
  name: styleLabels[s.id]?.title || s.name,
  subtitle: styleLabels[s.id]?.sub || '',
  imageSrc: styleImages[s.id],
  mostPopular: !!s.popular,
});

export default function StyleSelection({
  onSelect, onBack, chartData, formData, onEditBirthData, isLoading = false, isPortraitEdition = false,
  // New props for reusability — defaults to canvas styles
  primaryStyles,        // array of style objects (replaces ART_STYLES)
  additionalStyles,     // array of style objects (replaces ADDITIONAL_STYLES), null = no "show more"
  styleImages,          // { [id]: thumbSrc }
  styleGallery,         // { [id]: [src, src, src, src] }
  styleLabels,          // { [id]: { title, sub } }
}) {
  const _styleImages = styleImages || DEFAULT_STYLE_IMAGES;
  const _styleGallery = styleGallery || DEFAULT_STYLE_GALLERY;
  const _styleLabels = styleLabels || DEFAULT_STYLE_LABELS;
  const _primaryStyles = primaryStyles || ART_STYLES;
  const _additionalStyles = additionalStyles !== undefined ? additionalStyles : ADDITIONAL_STYLES;

  const baseStyles = _primaryStyles.map(s => toCarouselShape(s, _styleImages, _styleLabels));
  const extraStyles = _additionalStyles ? _additionalStyles.map(s => toCarouselShape(s, _styleImages, _styleLabels)) : [];
  const allStylesCombined = [...baseStyles, ...extraStyles];
  const [showAll, setShowAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [prevLabel, setPrevLabel] = useState(null); // for crossfade

  const hasShowMore = _additionalStyles && _additionalStyles.length > 0;
  const carouselStyles = (showAll || !hasShowMore) ? allStylesCombined : baseStyles;
  const currentStyle = carouselStyles[activeIndex];
  const selectedStyleId = currentStyle?.id;

  // Crossfade label transition
  useEffect(() => {
    setPrevLabel(null); // reset on index change — triggers fade-in
  }, [activeIndex]);

  const handleContinue = () => {
    if (isLoading) {
      toast({ title: 'Almost ready…', description: 'Still calculating your birth chart. Try again in a moment.' });
      return;
    }
    if (selectedStyleId) onSelect(selectedStyleId);
  };

  const handleSurpriseMe = () => {
    if (isLoading) {
      toast({ title: 'Almost ready…', description: 'Still calculating your birth chart. Try again in a moment.' });
      return;
    }
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


  const handleShowMore = () => {
    setShowAll(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <Header variant="dark" />


      {/* Progress bar */}
      <div style={{ borderBottom: '1px solid #2A2A2A' }}>
        <StepProgressBar currentStep={1} />
      </div>

      {/* Main content */}
      <div className="flex-1 w-full py-10 md:py-14 px-5 md:px-0">
        <div className="text-center max-w-[600px] mx-auto" style={{ paddingTop: 32, paddingBottom: 32 }}>
          <h2 className="font-display text-a2 md:text-[40px] text-surface-foreground tracking-tight" style={{ fontWeight: 400 }}>
            {isPortraitEdition ? 'Choose your portrait style' : 'Choose your artistic style'}
          </h2>
          <p className="text-body font-body text-surface-muted" style={{ marginTop: 10 }}>
            {isPortraitEdition
              ? 'Each style will render YOUR face in a unique cosmic portrait. Pick the one that resonates.'
              : 'Each style reveals your cosmic blueprint differently. Pick the one that resonates.'}
          </p>
          {isPortraitEdition && (
            <div className="inline-flex items-center justify-center gap-2 mt-3" style={{ padding: '6px 14px', borderRadius: '999px', backgroundColor: '#FFF5DD' }}>
              <span style={{ fontSize: 14, color: '#C99700' }} className="font-body">
                🧑 Portrait Edition — your face will be woven into the artwork
              </span>
            </div>
          )}
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

        {/* Title + subtitle with arrows — crossfade */}
        <div className="flex items-center justify-center mt-3 relative gap-4 px-4" style={{ minHeight: 44 }}>
          {/* Left arrow */}
          <button
            onClick={() => { if (activeIndex > 0) setActiveIndex(activeIndex - 1); }}
            className="flex items-center justify-center shrink-0 transition-opacity"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#F5F5F5',
              opacity: activeIndex > 0 ? 1 : 0.3,
              cursor: activeIndex > 0 ? 'pointer' : 'default',
            }}
            disabled={activeIndex <= 0}
            aria-label="Previous style"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: '#191919' }} />
          </button>

          {/* Label */}
          <div
            key={activeIndex}
            className="animate-in fade-in slide-in-from-bottom-1 duration-300 text-center"
            style={{ minWidth: 180 }}
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

          {/* Right arrow */}
          <button
            onClick={() => { if (activeIndex < carouselStyles.length - 1) setActiveIndex(activeIndex + 1); }}
            className="flex items-center justify-center shrink-0 transition-opacity"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#F5F5F5',
              opacity: activeIndex < carouselStyles.length - 1 ? 1 : 0.3,
              cursor: activeIndex < carouselStyles.length - 1 ? 'pointer' : 'default',
            }}
            disabled={activeIndex >= carouselStyles.length - 1}
            aria-label="Next style"
          >
            <ChevronRight className="w-4 h-4" style={{ color: '#191919' }} />
          </button>
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

      {/* Lightbox Modal — Vertical Image Stack */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col transition-all duration-250"
          style={{
            backgroundColor: lightboxVisible ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0)',
            opacity: lightboxVisible ? 1 : 0,
          }}
          onClick={closeLightbox}
        >
          {/* Fixed top header */}
          <div className="shrink-0 px-6 pt-6 pb-4 z-10 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-subtitle text-white/50">{STYLE_LABELS[lightbox.styleId]?.title}</p>
            <h2 className="font-display text-a2 text-white mt-1">Additional examples</h2>
          </div>

          {/* Scrollable image area */}
          <div
            className="flex-1 flex items-center justify-center w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <VerticalImageStack
              images={lightboxImages.map((src, i) => ({
                id: `${lightbox.styleId}-${i}`,
                src,
                alt: `${STYLE_LABELS[lightbox.styleId]?.title || 'Style'} example ${i + 1}`,
              }))}
            />
          </div>

          {/* Fixed bottom buttons */}
          <div className="shrink-0 px-6 pb-6 pt-4 z-10 flex flex-col md:flex-row-reverse md:justify-center mx-auto w-full" style={{ gap: 12, maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                if (isLoading) {
                  toast({ title: 'Almost ready…', description: 'Still calculating your birth chart. Try again in a moment.' });
                  return;
                }
                const styleId = lightbox.styleId;
                closeLightbox();
                const idx = carouselStyles.findIndex(s => s.id === styleId);
                if (idx !== -1) setActiveIndex(idx);
                setTimeout(() => {
                  if (styleId) onSelect(styleId);
                }, 300);
              }}
              className="btn-base btn-primary w-full"
            >
              Choose style
            </button>
            <button
              onClick={closeLightbox}
              className="btn-base btn-dark-outline w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
