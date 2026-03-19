import ProductCard from '@/components/Explanation/ProductCard';
import CTARoomMockup from '@/components/Explanation/CTARoomMockup';
import PhoneCaseMockup from '@/components/Explanation/PhoneCaseMockup';
import PhoneScreenMockup from '@/components/Explanation/PhoneScreenMockup';

/**
 * "Make It Yours" section with three product offering cards.
 * @param {{ onGetFramed: () => void; onDownloadPreview: () => void; artworkSrc: string }} props
 */
export default function MakeItYoursSection({ onGetFramed, onDownloadPreview, artworkSrc }) {
  return (
    <section className="flex flex-col items-stretch w-full">
      {/* Section header */}
      <div className="flex flex-col justify-center items-center w-full py-6 md:py-8">
        <h2 className="text-a1 text-white text-center">Make It Yours</h2>
      </div>

      {/* Cards row */}
      <div className="flex flex-col md:flex-row items-stretch gap-4 w-full">
        {/* Phone Case */}
        <ProductCard
          imageSlot={
            <>
              <PhoneCaseMockup artworkSrc={artworkSrc} className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80" />
            </>
          }
          title="Carry Your Stars Everywhere"
          description="Your birth chart art, wrapped around a premium eco case"
          badge="Most popular"
          primaryButton={{ label: 'Choose Your Phone ($57)', onClick: () => {} }}
          trustLine="↩️ 30-day quality guarantee · 🔒 Secure checkout"
          showProcessingBar
        />

        {/* Framed Print */}
        <ProductCard
          imageSlot={
            <>
              <CTARoomMockup artworkSrc={artworkSrc} className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80" />
            </>
          }
          title={'Frame it. Hang it.\nTreasure it forever'}
          description="Gallery-quality printing. Solid wood frames. Ready to hang. Built to last 100 years."
          primaryButton={{ label: 'See Sizes ($97 – $179)', onClick: onGetFramed }}
          trustLine="↩️ 30-day quality guarantee · 🔒 Secure checkout"
          showProcessingBar
        />

        {/* Digital File */}
        <ProductCard
          image={artworkSrc}
          title="Own the Original File"
          description="Print-ready resolution for any size, any surface, forever yours"
          primaryButton={{ label: 'Download High Resolution ($25)', onClick: onDownloadPreview }}
          secondaryButton={{ label: 'Download Standard Resolution ($10)', onClick: onDownloadPreview }}
          trustLine="🔒 Instant delivery to your inbox"
          showProcessingBar={false}
        />
      </div>
    </section>
  );
}
