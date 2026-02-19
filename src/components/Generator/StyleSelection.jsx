import { useState } from 'react';
import { ART_STYLES } from '@/config/artStyles';

export default function StyleSelection({ onSelect, onBack, chartData }) {
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

      {/* Natal Chart Summary */}
      {chartData && (
        <div className="mb-10 bg-secondary/30 border border-border rounded-xl p-6 max-w-2xl mx-auto">
          <h3 className="font-display text-xl text-foreground text-center mb-4">
            Your Celestial Blueprint
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center mb-5">
            <div className="bg-card/60 border border-border rounded-lg p-3">
              <div className="text-2xl mb-1">☀️</div>
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-body">Sun</span>
              <span className="block text-sm text-foreground capitalize font-display mt-0.5">{chartData.sun.sign}</span>
              <span className="text-xs text-muted-foreground">House {chartData.sun.house}</span>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-3">
              <div className="text-2xl mb-1">🌙</div>
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-body">Moon</span>
              <span className="block text-sm text-foreground capitalize font-display mt-0.5">{chartData.moon.sign}</span>
              <span className="text-xs text-muted-foreground">House {chartData.moon.house}</span>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-3">
              <div className="text-2xl mb-1">⬆️</div>
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-body">Rising</span>
              <span className="block text-sm text-foreground capitalize font-display mt-0.5">{chartData.rising}</span>
              <span className="text-xs text-muted-foreground">Ascendant</span>
            </div>
          </div>
          {chartData.element_balance && (
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Elemental Balance</p>
              <div className="flex justify-center gap-4 text-xs text-foreground">
                <span>🔥 Fire: {chartData.element_balance.Fire}</span>
                <span>💧 Water: {chartData.element_balance.Water}</span>
                <span>🌍 Earth: {chartData.element_balance.Earth}</span>
                <span>💨 Air: {chartData.element_balance.Air}</span>
              </div>
            </div>
          )}
        </div>
      )}

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
