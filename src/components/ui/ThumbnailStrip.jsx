/**
 * Reusable thumbnail strip for image galleries.
 * Yellow (#FFBF00) ring on active thumbnail, 2px border-radius, 10px gap.
 *
 * Props:
 *  - images: string[]
 *  - activeIndex: number
 *  - onSelect: (index: number) => void
 *  - size?: number (default 56 for lightbox, 30 for inline)
 */
export default function ThumbnailStrip({ images, activeIndex, onSelect, size = 56 }) {
  if (!images || images.length <= 1) return null;

  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      {images.map((src, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); onSelect(i); }}
          className={`flex-shrink-0 overflow-hidden transition-all ${
            i === activeIndex ? 'ring-1 ring-[#FFBF00]' : 'opacity-50 hover:opacity-80'
          }`}
          style={{ width: size, height: size, borderRadius: 2 }}
        >
          <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );
}
