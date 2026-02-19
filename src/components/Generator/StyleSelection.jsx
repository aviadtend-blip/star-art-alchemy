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
        <div className="mb-10 bg-secondary/30 border border-border rounded-xl p-6 max-w-3xl mx-auto">
          <h3 className="font-display text-xl text-foreground text-center mb-5">
            Your Celestial Blueprint
          </h3>

          {/* Big Three */}
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div className="bg-card/60 border border-border rounded-lg p-3">
              <div className="text-2xl mb-1">☀️</div>
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-body">Sun</span>
              <span className="block text-sm text-foreground capitalize font-display mt-0.5">{chartData.sun.sign}</span>
              <span className="text-xs text-muted-foreground">House {chartData.sun.house} · {chartData.sun.degree}°</span>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-3">
              <div className="text-2xl mb-1">🌙</div>
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-body">Moon</span>
              <span className="block text-sm text-foreground capitalize font-display mt-0.5">{chartData.moon.sign}</span>
              <span className="text-xs text-muted-foreground">House {chartData.moon.house} · {chartData.moon.degree}°</span>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-3">
              <div className="text-2xl mb-1">⬆️</div>
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-body">Rising</span>
              <span className="block text-sm text-foreground capitalize font-display mt-0.5">{chartData.rising}</span>
              <span className="text-xs text-muted-foreground">Ascendant</span>
            </div>
          </div>

          {/* Planets */}
          <div className="grid grid-cols-5 gap-3 text-center mb-6">
            {[
              { key: 'mercury', icon: '☿', label: 'Mercury' },
              { key: 'venus', icon: '♀', label: 'Venus' },
              { key: 'mars', icon: '♂', label: 'Mars' },
              { key: 'jupiter', icon: '♃', label: 'Jupiter' },
              { key: 'saturn', icon: '♄', label: 'Saturn' },
            ].map(({ key, icon, label }) => {
              const planet = chartData[key];
              if (!planet) return null;
              return (
                <div key={key} className="bg-card/40 border border-border/60 rounded-lg p-2.5">
                  <div className="text-lg mb-0.5 text-primary">{icon}</div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-body">{label}</span>
                  <span className="block text-xs text-foreground capitalize font-display mt-0.5">{planet.sign}</span>
                  <span className="text-[10px] text-muted-foreground">
                    H{planet.house} · {planet.degree}°
                    {planet.isRetrograde && <span className="text-primary ml-0.5">℞</span>}
                  </span>
                  {planet.dignity && (
                    <span className={`block text-[9px] mt-0.5 font-body tracking-wide ${
                      planet.dignity === 'Domicile' || planet.dignity === 'Exaltation'
                        ? 'text-primary'
                        : 'text-destructive/70'
                    }`}>
                      {planet.dignity === 'Domicile' ? '🏠' : planet.dignity === 'Exaltation' ? '⬆' : planet.dignity === 'Detriment' ? '⬇' : '🔻'} {planet.dignity}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dignities for Big Three */}
          <div className="flex justify-center gap-4 mb-6 text-[10px] text-muted-foreground font-body">
            {chartData.sun.dignity && (
              <span>☀️ Sun: <span className={chartData.sun.dignity === 'Domicile' || chartData.sun.dignity === 'Exaltation' ? 'text-primary' : 'text-destructive/70'}>{chartData.sun.dignity}</span></span>
            )}
            {chartData.moon.dignity && (
              <span>🌙 Moon: <span className={chartData.moon.dignity === 'Domicile' || chartData.moon.dignity === 'Exaltation' ? 'text-primary' : 'text-destructive/70'}>{chartData.moon.dignity}</span></span>
            )}
          </div>

          {/* Elemental & Modality Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50 mb-4">
            {chartData.element_balance && (
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Elemental Balance</p>
                <div className="flex justify-center gap-3 text-xs text-foreground flex-wrap">
                  <span>🔥 Fire: {chartData.element_balance.Fire}</span>
                  <span>💧 Water: {chartData.element_balance.Water}</span>
                  <span>🌍 Earth: {chartData.element_balance.Earth}</span>
                  <span>💨 Air: {chartData.element_balance.Air}</span>
                </div>
              </div>
            )}
            {chartData.modality_balance && (
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Modality Balance</p>
                <div className="flex justify-center gap-3 text-xs text-foreground">
                  <span>⚡ Cardinal: {chartData.modality_balance.Cardinal}</span>
                  <span>🔒 Fixed: {chartData.modality_balance.Fixed}</span>
                  <span>🔄 Mutable: {chartData.modality_balance.Mutable}</span>
                </div>
              </div>
            )}
          </div>

          {/* Dominant Element & Modality */}
          {(chartData.dominant_element || chartData.dominant_modality) && (
            <div className="text-center mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Dominant Signature</p>
              <p className="text-sm text-primary font-display">
                {chartData.dominant_element && <span>{chartData.dominant_element}</span>}
                {chartData.dominant_element && chartData.dominant_modality && <span className="text-muted-foreground"> · </span>}
                {chartData.dominant_modality && <span>{chartData.dominant_modality}</span>}
              </p>
            </div>
          )}

          {/* Aspects */}
          {chartData.aspects && chartData.aspects.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider text-center">Planetary Aspects</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {chartData.aspects.map((aspect, i) => (
                  <div key={i} className="bg-card/40 border border-border/40 rounded-md px-3 py-2 text-center">
                    <span className="text-xs text-foreground font-body">
                      {aspect.planet1} <span className="text-primary mx-1">{aspect.symbol}</span> {aspect.planet2}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {aspect.aspect} ({aspect.orb}° orb)
                    </span>
                  </div>
                ))}
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
