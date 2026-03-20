import giftImg from '@/assets/gallery/more-than-art-gift.webp';
import storyImg from '@/assets/story-phone-wallpaper.webp';
import blueprintImg from '@/assets/gallery/more-than-art-blueprint.webp';

const ITEMS = [
  {
    image: giftImg,
    title: "The Gift They'll Never Forget",
    description: 'No two birth charts are alike. This artwork can never be duplicated, never be regifted, never feel generic.',
  },
  {
    image: storyImg,
    title: 'A Story Only You Can Tell',
    description: 'The art that expresses what makes you you — and starts a conversation every time someone sees it.',
  },
  {
    image: blueprintImg,
    title: 'Your Cosmic Blueprint, Included',
    description: 'A personal guide to the celestial story behind your artwork — printed inside every order, or delivered digitally.',
  },
];

export default function MoreThanArtSection() {
  return (
    <section className="w-full py-12 md:py-16">
      <h2 className="text-a1-special text-white text-center mb-10">More Than Art</h2>

      <div className="flex flex-col md:flex-row gap-8 md:gap-5">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex-1 flex flex-col">
            <div className="w-full overflow-hidden" style={{ aspectRatio: '3 / 2', borderRadius: 2 }}>
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <h3 className="text-a3 text-white mt-4">{item.title}</h3>
            <p className="text-body font-body mt-3" style={{ color: '#c7c7c7' }}>
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
