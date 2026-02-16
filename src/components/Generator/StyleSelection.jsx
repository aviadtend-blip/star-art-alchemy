import { useState } from 'react';
import { ART_STYLES } from '@/config/artStyles';

export default function StyleSelection({ onSelect, onBack }) {
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (selected) onSelect(selected);
  };

  return (
    <div className="max-w-4xl mx-auto relative z-10 px-4">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-light text-foreground tracking-wide mb-3">
          Choose Your <span className="text-primary text-glow">Style</span>
        </h2>
        <p className="text-muted-foreground font-body text-sm tracking-widest uppercase">
          Select an artistic style for your birth chart artwork
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
        {ART_STYLES.map((style) => {
          const isSelected = selected === style.id;
          const isDisabled = style.comingSoon;

          return (
            <button
              key={style.id}
              onClick={() => !isDisabled && setSelected(style.id)}
              disabled={isDisabled}
              className={`
                relative text-left rounded-xl border-2 p-5 transition-all duration-200 group
                ${isDisabled
                  ? 'border-border/50 opacity-50 cursor-not-allowed'
                  : isSelected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 cursor-pointer'
                }
              `}
            >
              {isDisabled && (
                <span className="absolute top-3 right-3 text-xs font-body uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Coming Soon
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

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-primary transition-colors font-body tracking-wide uppercase"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`
            px-8 py-3 rounded-xl font-body text-sm tracking-wide uppercase transition-all
            ${selected
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          Generate Artwork →
        </button>
      </div>
    </div>
  );
}
