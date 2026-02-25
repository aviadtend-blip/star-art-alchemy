import { useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ART_STYLES } from '@/config/artStyles';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';

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
      <nav className="bg-surface-foreground py-4 px-6 md:px-10 flex items-center justify-between">
        <div className="text-a4 text-white font-display">Celestial Artworks</div>
        <button className="text-white/70 hover:text-white transition">
          <div className="space-y-1.5">
            <div className="w-6 h-0.5 bg-current" />
            <div className="w-6 h-0.5 bg-current" />
          </div>
        </button>
      </nav>

      {/* Progress bar */}
      <div className="bg-surface border-b border-surface-border">
        <StepProgressBar currentStep={2} />
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 md:py-14">
        <div className="text-center mb-10">
          <h2 className="font-display text-a2 md:text-[40px] text-surface-foreground tracking-tight mb-3" style={{ fontWeight: 400 }}>
            Choose your artistic expression
          </h2>
          <p className="text-body text-surface-muted max-w-md mx-auto">
            Each style reveals your cosmic blueprint differently. Pick the one that resonates.
          </p>
        </div>

        {/* Style cards — horizontal scroll on mobile */}
        <div className="flex gap-5 md:gap-6 mb-10 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide">
          {ART_STYLES.map((style) => {
            const isSelected = selected === style.id;
            const labels = STYLE_LABELS[style.id];

            return (
              <div
                key={style.id}
                className="snap-center shrink-0 flex flex-col"
                style={{ width: '304px' }}
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
                  {/* Badge */}
                  {style.popular && (
                    <span className="absolute z-10 text-subtitle bg-primary text-primary-foreground px-3 py-0.5 tracking-wide whitespace-nowrap" style={{ bottom: '10px', left: '50%', transform: 'translateX(-50%)', borderRadius: '2px' }}>
                      Most popular
                    </span>
                  )}

                  {/* Magnifying glass */}
                  <div
                    onClick={(e) => openLightbox(style.id, e)}
                    className="absolute z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    style={{ bottom: '10px', right: '9px' }}
                  >
                    <Search className="w-4 h-4 text-surface-foreground" />
                  </div>

                  {/* Image */}
                  <div style={{ width: '100%', height: '323px' }} className="overflow-hidden">
                    <img
                      src={STYLE_IMAGES[style.id]}
                      alt={style.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </button>

                {/* Label below card */}
                <div className="text-center pt-3 pb-1">
                  <h3 className="text-a5 text-surface-foreground tracking-wider uppercase">{labels.title}</h3>
                  <p className="text-body text-surface-muted">{labels.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="text-center space-y-4 mt-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleSurpriseMe}
              className="px-10 py-3 rounded-full text-a5 bg-surface-foreground text-white hover:opacity-90 shadow-md transition-all"
            >
              Surprise me
            </button>
            <button
              onClick={handleContinue}
              disabled={!selected}
              className={`
                px-10 py-3 rounded-full text-a5 transition-all border-2
                ${selected
                  ? 'border-surface-foreground bg-transparent text-surface-foreground hover:bg-surface-foreground hover:text-white'
                  : 'border-surface-border text-surface-muted cursor-not-allowed'
                }
              `}
            >
              Select Style
            </button>
          </div>
          <p className="text-body text-surface-muted italic">Can't decide? Let us choose the best style based on your chart</p>
          <div className="inline-block bg-surface-card border border-surface-border rounded-md px-5 py-2.5 mt-2">
            <p className="text-body text-surface-muted">💡 You'll see your preview before committing.</p>
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
            className="flex-1 flex items-center justify-center w-full px-16 py-20"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImages[lightbox.index]}
              alt={`Gallery ${lightbox.index + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-sm"
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
