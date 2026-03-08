
import review1 from '@/assets/gallery/reviews/review-1.webp';
import review2 from '@/assets/gallery/reviews/review-2.webp';
import review3 from '@/assets/gallery/reviews/review-3.webp';
import review4 from '@/assets/gallery/reviews/review-4.webp';
import review5 from '@/assets/gallery/reviews/review-5.webp';
import review6 from '@/assets/gallery/reviews/review-6.webp';
import review7 from '@/assets/gallery/reviews/review-7.webp';
import review8 from '@/assets/gallery/reviews/review-8.webp';
import review9 from '@/assets/gallery/reviews/review-9.webp';
import { TestimonialCarousel } from '@/components/ui/testimonial-carousel';

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
 * Reusable reviews carousel with star header and swipeable cards.
 *
 * @param {{
 *   theme?: 'dark' | 'light',
 *   className?: string,
 * }} props
 */
export default function ReviewsList({ theme = 'dark', className = '' }) {
  return (
    <TestimonialCarousel
      testimonials={TESTIMONIALS}
      theme={theme}
      className={className}
    />
  );
}
