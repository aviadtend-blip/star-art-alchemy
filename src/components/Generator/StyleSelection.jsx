import { useState } from 'react';
import { Search } from 'lucide-react';
import { ART_STYLES } from '@/config/artStyles';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';

import boldImg from '@/assets/gallery/taurus-artwork.jpg';
import minimalImg from '@/assets/gallery/capricorn-gallery.jpg';
import organicImg from '@/assets/gallery/virgo-artwork.jpg';

const STYLE_IMAGES = {
  'bold-vibrant': boldImg,
  'minimal-architectural': minimalImg,
  'organic-flowing': organicImg,
};

export default function StyleSelection({ onSelect, onBack, chartData, formData, onEditBirthData }) {
  const [selected, setSelected] = useState(null);

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

  return (
    <div className="min-h-screen bg-surface">
      {/* Progress bar */}
      <div className="bg-surface border-b border-surface-border">
        <StepProgressBar currentStep={2} />
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <div className="text-center mb-10">
          <h2 className="text-a2 md:text-5xl text-surface-foreground tracking-tight mb-3">
            Choose your artistic expression
          </h2>
          <p className="text-body-sm text-surface-muted max-w-md mx-auto">
            Each style reveals your cosmic blueprint differently. Pick the one that resonates.
          </p>
        </div>

        {/* Style cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 mb-10">
          {ART_STYLES.map((style) => {
            const isSelected = selected === style.id;

            return (
              <button
                key={style.id}
                onClick={() => setSelected(style.id)}
                className={`
                  relative text-left rounded-2xl overflow-hidden transition-all duration-200 group cursor-pointer border-2
                  ${isSelected
                    ? 'border-primary shadow-lg shadow-primary/15 ring-1 ring-primary/30'
                    : 'border-surface-border hover:border-surface-muted/50 shadow-md'
                  }
                  bg-surface-card
                `}
              >
                {/* Badge */}
                {style.popular && (
                  <span className="absolute top-3 left-3 z-10 text-subtitle bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full tracking-wide">
                    Most popular
                  </span>
                )}

                {/* Magnifying glass */}
                <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-surface-card/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Search className="w-4 h-4 text-surface-foreground" />
                </div>

                {/* Image */}
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={STYLE_IMAGES[style.id]}
                    alt={style.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Label */}
                <div className="p-4">
                  <h3 className="text-a4 text-surface-foreground mb-0.5">{style.name}</h3>
                  <p className="text-body-sm text-surface-muted leading-relaxed">{style.description}</p>
                </div>

                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-3 right-3 z-20 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="text-center space-y-4">
          <p className="text-body-sm text-surface-muted">Can't decide? Let us choose the best style based on your chart</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleSurpriseMe}
              className="px-8 py-3 rounded-full text-a5 bg-surface-foreground text-surface hover:opacity-90 shadow-md transition-all"
            >
              Surprise me ✨
            </button>
            <button
              onClick={handleContinue}
              disabled={!selected}
              className={`
                px-8 py-3 rounded-full text-a5 transition-all border-2
                ${selected
                  ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                  : 'border-surface-border text-surface-muted cursor-not-allowed'
                }
              `}
            >
              Select Style →
            </button>
          </div>
          <p className="text-body-sm text-surface-muted mt-2">💡 You'll see your preview before committing.</p>
        </div>
      </div>

      {/* Birth data bar at bottom */}
      <BirthDataBar formData={formData} onEdit={onEditBirthData} />
    </div>
  );
}
