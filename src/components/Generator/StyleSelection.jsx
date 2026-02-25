import { useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ART_STYLES } from '@/config/artStyles';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';
import PopularTag from '@/components/ui/PopularTag';

import boldImg from '@/assets/gallery/taurus-artwork.jpg';
import minimalImg from '@/assets/gallery/capricorn-gallery.jpg';
import organicImg from '@/assets/gallery/virgo-artwork.jpg';

// Gallery images for the lightbox per style
import galaxyBloom1 from '@/assets/gallery/galaxy-bloom-1.png';
import galaxyBloom2 from '@/assets/gallery/galaxy-bloom-2.png';
import galaxyBloom3 from '@/assets/gallery/galaxy-bloom-3.png';

const STYLE_IMAGES = {
  'bold-vibrant': boldImg,
  'minimal-architectural': minimalImg,
  'organic-flowing': organicImg,
};

const STYLE_GALLERY = {
  'bold-vibrant': [boldImg, galaxyBloom1, galaxyBloom2, galaxyBloom3],
  'minimal-architectural': [minimalImg],
  'organic-flowing': [organicImg],
};

const STYLE_LABELS = {
  'bold-vibrant': { title: 'GALAXY BLOOM', sub: 'Bold & Vibrant' },
  'minimal-architectural': { title: 'COSMIC COLLAGE', sub: 'Minimal & Architectural' },
  'organic-flowing': { title: 'COSMIC COLLAGE', sub: 'Organic & Flowing' },
};

export default function StyleSelection({ onSelect, onBack, chartData, formData, onEditBirthData }) {
  const [selected, setSelected] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { styleId, index }

  const handleContinue = () => {
    if (selected) onSelect(selected);
  };

  const handleSurpriseMe = () => {
    const dominantElement = chartData?.dominant_element;
    let autoId = ART_STYLES[0].id;
    if (dominantElement === 'Water' || dominantElement === 'Earth') {
      autoId = 'organic-flowing';
    } else if (dominantElement === 'Air') {
      autoId = 'minimal-architectural';
    } else {
      autoId = 'bold-vibrant';
    }
    onSelect(autoId);
  };

  const openLightbox = (styleId, e) => {
    e.stopPropagation();
    setLightbox({ styleId, index: 0 });
  };

  const closeLightbox = () => setLightbox(null);

  const lightboxImages = lightbox ? STYLE_GALLERY[lightbox.styleId] || [] : [];

  const navigateLightbox = (dir) => {
    if (!lightbox) return;
    const len = lightboxImages.length;
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index + dir + len) % len,
    }));
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
        <StepProgressBar currentStep={2} />
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 md:py-14">
        <div className="text-center mb-10">
          <h2 className="font-display text-a2 md:text-[40px] text-surface-foreground tracking-tight mb-3" style={{ fontWeight: 400 }}>
            Choose your artistic expression
          </h2>
          <p className="text-body font-body text-surface-muted max-w-md mx-auto">
            Each style reveals your cosmic blueprint differently. Pick the one that resonates.
          </p>
        </div>

        {/* Style cards — horizontal scroll on mobile */}
        <div className="flex gap-[10px] md:gap-4 mb-10 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide">
          {ART_STYLES.map((style) => {
            const isSelected = selected === style.id;
            const labels = STYLE_LABELS[style.id];

            return (
              <div
                key={style.id}
                className="snap-center shrink-0 flex flex-col w-[290px] md:w-[304px] relative"
              >
                <button
                  onClick={() => setSelected(style.id)}
                  className={`
                    relative text-left overflow-hidden transition-all duration-200 group cursor-pointer border-2
                    ${isSelected
                      ? 'border-primary shadow-lg shadow-primary/15 ring-1 ring-primary/30'
                      : 'border-transparent hover:border-surface-muted/30'
                    }
                    bg-white
                  `}
                  style={{ borderRadius: '2px' }}
                >
                  {/* Magnifying glass */}
                  <div
                    onClick={(e) => openLightbox(style.id, e)}
                    className="absolute z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    style={{ bottom: '10px', right: '10px' }}
                  >
                    <Search className="w-4 h-4 text-surface-foreground" />
                  </div>

                  {/* Image */}
                  <div className="w-full h-[348px] md:h-[323px] overflow-hidden">
                    <img
                      src={STYLE_IMAGES[style.id]}
                      alt={style.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </button>

                {/* Popular tag — centered, straddling bottom edge of image */}
                {style.popular && (
                  <>
                    <div className="absolute z-20 left-1/2 -translate-x-1/2 md:hidden" style={{ top: '339px' }}>
                      <PopularTag />
                    </div>
                    <div className="absolute z-20 left-1/2 -translate-x-1/2 hidden md:block" style={{ top: '314px' }}>
                      <PopularTag />
                    </div>
                  </>
                )}

                {/* Label below card */}
                <div className="text-center pt-3 pb-1" style={{ marginTop: '12px', gap: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 className="text-subtitle text-surface-foreground">{labels.title}</h3>
                  <p className="text-body-sm text-surface-muted font-body">{labels.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="text-center space-y-4 mt-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            <button
              onClick={handleContinue}
              disabled={!selected}
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
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 z-60 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Style title */}
          <div className="absolute top-6 left-6 text-white/80">
            <p className="text-a4 font-display">{STYLE_LABELS[lightbox.styleId]?.title}</p>
            <p className="text-body text-white/50">{STYLE_LABELS[lightbox.styleId]?.sub}</p>
          </div>

          {/* Main image */}
          <div
            className="flex-1 flex items-center justify-center w-full px-0 md:px-16 py-10 md:py-20"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImages[lightbox.index]}
              alt={`Gallery ${lightbox.index + 1}`}
              className="max-h-[80vh] w-full md:w-auto md:max-w-full object-contain"
              style={{ borderRadius: '2px' }}
            />
          </div>

          {/* Navigation arrows */}
          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {lightboxImages.length > 1 && (
            <div
              className="flex items-center gap-2 pb-6"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox((prev) => ({ ...prev, index: i }))}
                  className={`
                    w-14 h-14 rounded-sm overflow-hidden border-2 transition-all
                    ${i === lightbox.index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}
                  `}
                >
                  <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
