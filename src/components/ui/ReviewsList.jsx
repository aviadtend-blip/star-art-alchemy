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
  { img: review1, quote: '"got this for my mom\'s birthday and she literally cried when she opened it. best gift ive ever given her"', name: 'SARAH M, VERIFIED BUYER' },
  { img: review2, quote: '"i was skeptical at first but wow the quality is insane, it looks so good on my wall"', name: 'JESSICA L, VERIFIED BUYER' },
  { img: review3, quote: '"ordered this last minute for valentines day and it came in time!! my girlfriend loved it"', name: 'AMANDA R, VERIFIED BUYER' },
  { img: review4, quote: '"ok i dont usually leave reviews but this was too beautiful not to. the colors are gorgeous"', name: 'BRIANNA K, VERIFIED BUYER' },
  { img: review5, quote: '"bought one for myself and now ive ordered three more as gifts lol everyone keeps asking where i got it"', name: 'TAYLOR W, VERIFIED BUYER' },
  { img: review6, quote: '"my sister is super into astrology so i got her this for christmas and she says its her favorite gift ever"', name: 'MEGAN D, VERIFIED BUYER' },
  { img: review7, quote: '"the framing is really high quality, not what i expected at this price honestly. very impressed"', name: 'RACHEL H, VERIFIED BUYER' },
  { img: review8, quote: '"i stare at mine every morning lol its so unique, nothing like anything youll find at target or wherever"', name: 'DANIELLE P, VERIFIED BUYER' },
  { img: review9, quote: '"got one for me and my best friend with our birth charts and we\'re obsessed. such a cool concept"', name: 'COURTNEY B, VERIFIED BUYER' },
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
