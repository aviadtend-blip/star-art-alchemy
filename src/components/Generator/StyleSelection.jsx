import { useState } from 'react';
import { ART_STYLES } from '@/config/artStyles';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';

export default function StyleSelection({ onSelect, onBack, chartData, formData, onEditBirthData }) {
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (selected) onSelect(selected);
  };

  const handleSurpriseMe = () => {
    // Auto-select based on dominant element or default to first
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
    <div className="relative z-10">
      <StepProgressBar currentStep={2} />
      <BirthDataBar formData={formData} onEdit={onEditBirthData} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground tracking-wide mb-3">
            Choose your <span className="text-primary text-glow">artistic expression</span>
          </h2>
          <p className="text-muted-foreground font-body text-sm">
            Each style reveals your cosmic blueprint differently. Pick the one that resonates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10">
          {ART_STYLES.map((style) => {
            const isSelected = selected === style.id;

            return (
              <button
                key={style.id}
                onClick={() => setSelected(style.id)}
                className={`
                  relative text-left rounded-xl border-2 p-5 transition-all duration-200 group cursor-pointer
                  ${isSelected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50'
                  }
                `}
              >
                {style.popular && (
                  <span className="absolute -top-2 right-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-body font-medium">
                    Most popular
                  </span>
                )}

                <div className="text-4xl mb-3">{style.preview}</div>
                <h3 className="font-display text-xl text-foreground mb-1">{style.name}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">
                  {style.description}
                </p>

                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-center space-y-4">
          <p className="text-xs text-muted-foreground font-body">Can't decide? Let us choose the best style based on your chart</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleSurpriseMe}
              className="px-8 py-3 rounded-xl font-body text-sm tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all border-glow"
            >
              Surprise me ✨
            </button>
            <button
              onClick={handleContinue}
              disabled={!selected}
              className={`
                px-8 py-3 rounded-xl font-body text-sm tracking-wide transition-all border
                ${selected
                  ? 'border-primary text-primary hover:bg-primary/10'
                  : 'border-border text-muted-foreground cursor-not-allowed'
                }
              `}
            >
              Select Style →
            </button>
          </div>
          <p className="text-xs text-muted-foreground font-body mt-2">💡 You'll see your preview before committing.</p>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-primary transition-colors font-body tracking-wide mt-4">
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
