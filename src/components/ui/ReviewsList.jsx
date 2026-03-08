import { LazyImage } from '@/components/ui/lazy-image';
import review1 from '@/assets/gallery/reviews/review-1.webp';
import review2 from '@/assets/gallery/reviews/review-2.webp';
import review3 from '@/assets/gallery/reviews/review-3.webp';
import review4 from '@/assets/gallery/reviews/review-4.webp';
import review5 from '@/assets/gallery/reviews/review-5.webp';
import review6 from '@/assets/gallery/reviews/review-6.webp';
import review7 from '@/assets/gallery/reviews/review-7.webp';
import review8 from '@/assets/gallery/reviews/review-8.webp';
import review9 from '@/assets/gallery/reviews/review-9.webp';

export const TESTIMONIALS = [
  { img: review1, quote: '"got this for my mom\'s birthday and she literally cried when she opened it. best gift ive ever given her"', name: 'JORDAN M, VERIFIED BUYER' },
  { img: review2, quote: '"I was skeptical at first but the quality is amazing. It looks stunning on my living room wall."', name: 'ALEX L, VERIFIED BUYER' },
  { img: review3, quote: '"ordered this last minute for valentines day and it came in time!! my partner loved it"', name: 'RILEY R, VERIFIED BUYER' },
  { img: review4, quote: '"ok i dont usually leave reviews but this was too beautiful not to. the colors are gorgeous"', name: 'MORGAN K, VERIFIED BUYER' },
  { img: review5, quote: '"Bought one for myself and now I\'ve ordered three more as gifts. Everyone keeps asking where I got it!"', name: 'TAYLOR W, VERIFIED BUYER' },
  { img: review6, quote: '"my sister is super into astrology so i got her this for christmas and she says its her favorite gift ever"', name: 'CASEY D, VERIFIED BUYER' },
  { img: review7, quote: '"The framing is really high quality. Not what I expected at this price point honestly. Very impressed."', name: 'QUINN H, VERIFIED BUYER' },
  { img: review8, quote: '"i stare at mine every morning lol its so unique, nothing like anything youll find at target or wherever"', name: 'AVERY P, VERIFIED BUYER' },
  { img: review9, quote: '"Got one for me and my best friend with our birth charts and we\'re both obsessed. Such a cool concept."', name: 'SAM B, VERIFIED BUYER' },
];

/**
 * Reusable reviews list with star header and vertical review items.
 *
 * @param {{
 *   theme?: 'dark' | 'light',
 *   gap?: number,
 *   py?: number,
 *   className?: string,
 * }} props
 */
export default function ReviewsList({ theme = 'dark', gap = 6, py = 6, className = '' }) {
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : '';
  const mutedColor = isDark ? 'text-white/50' : '';
  const borderColor = isDark ? '#3f3f3f' : '#E0E0E0';

  return (
    <div className={className}>
      <div className="flex items-end gap-3 mb-2">
        <span className="text-a2 font-display" style={{ color: '#FFBF00' }}>★★★★★</span>
        <span className={`text-a2 font-display ${textColor}`} style={isDark ? undefined : { color: '#333333' }}>4.9/5</span>
        <span className={`text-subtitle font-display ${mutedColor} uppercase`} style={isDark ? undefined : { color: '#888888' }}>from 287 customers</span>
      </div>
      <div className="flex flex-col">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className={`flex gap-${gap} items-start py-${py}`}
            style={{ borderBottom: i < TESTIMONIALS.length - 1 ? `1px solid ${borderColor}` : 'none' }}
          >
            <img
              src={t.img}
              alt={t.name}
              className="w-20 object-cover flex-shrink-0"
              style={{ aspectRatio: '3/4', borderRadius: 2 }}
            />
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <p className={`text-body font-body ${textColor} leading-relaxed`} style={isDark ? undefined : { color: '#333333' }}>
                {t.quote}
              </p>
              <p className={`text-subtitle ${mutedColor} uppercase`} style={{ fontSize: 10, ...(isDark ? {} : { color: '#888888' }) }}>
                {t.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
