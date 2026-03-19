import PopularTag from '@/components/ui/PopularTag';

/**
 * @typedef {{ label: string; onClick: () => void }} ButtonConfig
 *
 * @param {{ image: string; title: string; description: string; badge?: string;
 *           primaryButton: ButtonConfig; secondaryButton?: ButtonConfig;
 *           trustLine: string; showProcessingBar?: boolean }} props
 */
export default function ProductCard({
  image,
  imageSlot,
  title,
  description,
  badge,
  primaryButton,
  secondaryButton,
  trustLine,
  showProcessingBar = true,
}) {
  return (
    <div className="relative flex flex-col flex-1 overflow-hidden min-w-0" style={{ borderRadius: 2 }}>
      {/* Product image */}
      <div className="relative w-full" style={{ aspectRatio: '147 / 110' }}>
        {imageSlot || (
          <>
            <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80" />
          </>
        )}
        {badge && (
          <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2">
            <PopularTag>{badge}</PopularTag>
          </div>
        )}
      </div>

      {/* Dark content area */}
      <div
        className="flex flex-col items-center gap-6 flex-1 px-5 pb-8 pt-5"
        style={{ boxShadow: '0 0 114px 0 #000 inset' }}
      >
        {/* Title + description */}
        <div className="flex flex-col items-center gap-4 w-full relative">
          <h3 className="text-a2 text-white text-center" style={{ whiteSpace: 'pre-line' }}>
            {title}
          </h3>
          <p className="text-body-sm font-body text-white/70 text-center max-w-[281px]">
            {description}
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          <button onClick={primaryButton.onClick} className="btn-base btn-primary w-full">
            {primaryButton.label}
          </button>
          {secondaryButton && (
            <button onClick={secondaryButton.onClick} className="btn-base btn-dark-outline w-full">
              {secondaryButton.label}
            </button>
          )}
        </div>

        {/* Trust line */}
        <p className="text-body-sm font-body text-white/70 text-center">
          {trustLine}
        </p>

        {/* Same-day processing bar */}
        {showProcessingBar && (
          <div className="rounded-sm flex items-center justify-center px-3 py-2" style={{ backgroundColor: '#30434B' }}>
            <p className="text-body-sm font-body text-white text-center">
              ⏰ Order by 5pm for same-day processing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
