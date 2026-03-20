import { useNavigate } from 'react-router-dom';
import ProductCard from '@/components/Explanation/ProductCard';
import CTARoomMockup from '@/components/Explanation/CTARoomMockup';
import PhoneCaseMockup from '@/components/Explanation/PhoneCaseMockup';
import PhoneScreenMockup from '@/components/Explanation/PhoneScreenMockup';

/**
 * "Make It Yours" section with three product offering cards.
 * Mobile: horizontal snap carousel. Desktop: 3-column grid.
 * @param {{ onGetFramed: () => void; onDownloadPreview: () => void; artworkSrc: string }} props
 */
export default function MakeItYoursSection({ onGetFramed, onDownloadPreview, artworkSrc, funnelMode }) {
  const navigate = useNavigate();
  const cards = [
    {
      key: 'phone-case',
      imageSlot: (
        <>
          <PhoneCaseMockup artworkSrc={artworkSrc} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80" />
        </>
      ),
      title: 'Carry Your Stars Everywhere',
      description: 'Your birth chart art, wrapped around a premium eco case',
      badge: 'Most popular',
      primaryButton: { label: 'Choose Your Phone ($57)', onClick: () => navigate('/generate/phone-case') },
      trustLine: '↩️ 30-day quality guarantee · 🔒 Secure checkout',
      showProcessingBar: true,
    },
    {
      key: 'framed-print',
      imageSlot: (
        <>
          <CTARoomMockup artworkSrc={artworkSrc} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80" />
        </>
      ),
      title: 'Frame it. Hang it.\nTreasure it forever',
      description: 'Gallery-quality printing. Solid wood frames. Ready to hang. Built to last 100 years.',
      primaryButton: { label: 'See Sizes ($97 – $179)', onClick: onGetFramed },
      trustLine: '↩️ 30-day quality guarantee · 🔒 Secure checkout',
      showProcessingBar: true,
    },
    {
      key: 'digital-file',
      imageSlot: (
        <>
          <PhoneScreenMockup artworkSrc={artworkSrc} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80" />
        </>
      ),
      title: 'Own the Original File',
      description: 'Print-ready resolution for any size, any surface, forever yours',
      primaryButton: { label: 'Download High Resolution ($25)', onClick: onDownloadPreview },
      secondaryButton: { label: 'Download Standard Resolution ($10)', onClick: onDownloadPreview },
      trustLine: '🔒 Instant delivery to your inbox',
      showProcessingBar: false,
    },
  ];

  return (
    <section className="flex flex-col items-stretch w-full">
      {/* Section header */}
      <div className="flex flex-col justify-center items-center w-full py-6 md:py-8">
        <h2 className="text-a1-special text-white text-center">Make It Yours</h2>
      </div>

      {/* Cards — horizontal snap scroll on mobile, 3-col on desktop */}
      <div
        className="flex items-stretch gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide px-[10vw] md:px-0"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {cards.map((card) => (
          <div
            key={card.key}
            className="flex-shrink-0 w-[80vw] md:w-auto md:flex-1 snap-center min-w-0"
          >
            <ProductCard
              imageSlot={card.imageSlot}
              title={card.title}
              description={card.description}
              badge={card.badge}
              primaryButton={card.primaryButton}
              secondaryButton={card.secondaryButton}
              trustLine={card.trustLine}
              showProcessingBar={card.showProcessingBar}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
