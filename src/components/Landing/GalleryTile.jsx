import { useState } from 'react';
import tappingIcon from "@/assets/tapping-icon.svg";

/**
 * Reusable gallery tile for the social proof section.
 *
 * @param {{
 *   image: string,
 *   name: string,
 *   signs: string,
 *   explanations: Array<{ icon: string, title: string, description: string }>,
 *   showTapHint?: boolean,
 * }} props
 */
export default function GalleryTile({ image, name, signs, explanations = [], showTapHint = false }) {
  const [tapped, setTapped] = useState(false);

  const handleTap = () => setTapped((prev) => !prev);

  return (
    <div className="flex flex-col items-center flex-shrink-0 snap-center w-[282px] lg:w-full lg:max-w-[281px]">
      {/* Image container */}
      <div
        className="relative w-full overflow-hidden cursor-pointer group"
        style={{ height: 367, borderRadius: 2 }}
        onClick={handleTap}
      >
        <img
          src={image}
          alt={`${name} artwork`}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Tap hint icon — centered, pulsing, disappears on first tap */}
        {showTapHint && !tapped && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <img src={tappingIcon} alt="" width="40" height="40" className="animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] opacity-70" />
          </div>
        )}

        {/* Hover / tap overlay */}
        <div
          className={`
            absolute inset-0 flex flex-col items-start p-5 gap-4 transition-opacity duration-300 overflow-y-auto
            md:opacity-0 md:group-hover:opacity-100
            ${tapped ? 'opacity-100' : 'opacity-0 md:opacity-0'}
          `}
          style={{
            background: 'rgba(102, 95, 81, 0.7)',
            backdropFilter: 'blur(7px)',
            WebkitBackdropFilter: 'blur(7px)',
            borderRadius: 2,
          }}
        >
          {/* Close button (mobile only) */}
          <button
            onClick={(e) => { e.stopPropagation(); setTapped(false); }}
            className="absolute top-5 right-5 md:hidden w-7 h-7 flex items-center justify-center"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L15 15M15 1L1 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Header */}
          <p className="text-subtitle text-white tracking-widest">{name.toUpperCase()}'S CHART</p>

          {/* Explanations */}
          {explanations.map((exp, i) => (
            <div key={i} className="space-y-1">
              <p className="text-a5 text-white">
                {exp.icon} {exp.title}
              </p>
              <p className="text-body text-white/80 leading-relaxed">
                {exp.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Label below image */}
      <div className="w-full text-center py-[10px]">
        <p className="text-subtitle text-surface-foreground">{name.toUpperCase()}'S CHART</p>
        <p className="text-body text-surface-muted">{signs}</p>
      </div>
    </div>
  );
}
