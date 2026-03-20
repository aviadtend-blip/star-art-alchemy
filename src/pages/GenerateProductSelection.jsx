import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import BirthDataBar from '@/components/ui/BirthDataBar';
import StepProgressBar from '@/components/ui/StepProgressBar';
import PrimaryButton from '@/components/ui/PrimaryButton';
import phoneCaseImg from '@/assets/product-selection/phone-case.webp';
import canvasImg from '@/assets/product-selection/stretched-canvas.webp';

const PRODUCTS = [
  {
    id: 'phone-case',
    image: phoneCaseImg,
    imageAlt: 'Eco-friendly phone case',
    title: 'Phone case',
    description: 'Take it anywhere',
    badge: 'New',
    imageStyle: { objectFit: 'contain', objectPosition: 'center', padding: '24px 0' },
  },
  {
    id: 'stretched-canvas',
    image: canvasImg,
    imageAlt: 'Stretched canvas print',
    title: 'Stretched canvas',
    description: 'Make it part of your home',
    badge: null,
    imageStyle: { objectFit: 'cover' },
  },
];

function ProductCard({ product, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center text-center transition-shadow"
      style={{
        width: '304px',
        flexShrink: 0,
        borderRadius: '2px',
        backgroundColor: '#FFFFFF',
        outline: selected ? '2px solid #2396A3' : 'none',
        outlineOffset: '2px',
      }}
    >
      {/* Image area */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: '450px',
          borderRadius: '2px',
          backgroundColor: '#F6F6F6',
        }}
      >
        <img
          src={product.image}
          alt={product.imageAlt}
          className="w-full h-full select-none pointer-events-none"
          style={product.imageStyle}
        />

        {/* Badge */}
        {product.badge && (
          <span
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: '12px',
              borderRadius: '1px',
              backgroundColor: '#BEF9FF',
              padding: '2px 4px',
              fontSize: '13px',
              lineHeight: '1.13',
              letterSpacing: '-0.39px',
              color: '#2396A3',
            }}
          >
            {product.badge}
          </span>
        )}
      </div>

      {/* Labels */}
      <div className="flex flex-col w-full" style={{ gap: '4px', padding: '18px 0 16px' }}>
        <p className="text-subtitle" style={{ color: '#000000' }}>
          {product.title}
        </p>
        <p className="text-body" style={{ color: 'rgba(114, 114, 114, 0.7)' }}>
          {product.description}
        </p>
      </div>
    </button>
  );
}

const CARD_W = 304;
const CARD_GAP = 16;

export default function GenerateProductSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { chartData, formData, handleFormSubmit, handleEditBirthData } = useGenerator();
  const [selectedId, setSelectedId] = useState(PRODUCTS[0].id);
  const autoSubmitted = useRef(false);

  // Carousel refs
  const scrollRef = useRef(null);
  const cardRefs = useRef([]);
  const isProgrammaticScroll = useRef(false);

  // If arrived with query params (from landing), start chart calculation
  useEffect(() => {
    if (autoSubmitted.current || chartData) return;

    const month = searchParams.get('month');
    const day = searchParams.get('day');
    const year = searchParams.get('year');
    const city = searchParams.get('city');

    if (month && day && year && city) {
      autoSubmitted.current = true;
      const lat = searchParams.get('lat');
      const lng = searchParams.get('lng');
      handleFormSubmit({
        name: searchParams.get('name') || '',
        month: Number(month),
        day: Number(day),
        year: Number(year),
        hour: Number(searchParams.get('hour') || '12'),
        minute: Number(searchParams.get('minute') || '0'),
        city,
        nation: searchParams.get('nation') || 'US',
        ...(lat && lng ? { lat: Number(lat), lng: Number(lng) } : {}),
        userPhotoUrl: searchParams.get('userPhotoUrl') || null,
      });
    }
    // Allow direct access without data for preview/testing
  }, [searchParams, chartData, handleFormSubmit]);

  // Build display formData from query params while chart loads
  const displayFormData = formData || (() => {
    const city = searchParams.get('city');
    if (!city) return null;
    return {
      name: searchParams.get('name') || '',
      birthMonth: searchParams.get('month') || '',
      birthDay: searchParams.get('day') || '',
      birthYear: searchParams.get('year') || '',
      birthCity: city,
      birthCountry: searchParams.get('nation') || 'US',
    };
  })();

  // Detect which card is centered after scroll
  const detectCenter = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    // Auto-select the centered product
    if (closest < PRODUCTS.length) {
      setSelectedId(PRODUCTS[closest].id);
    }
  }, []);

  // Scroll to a card index (centers it)
  const scrollToIndex = useCallback((idx) => {
    const card = cardRefs.current[idx];
    const el = scrollRef.current;
    if (!card || !el) return;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const scrollTarget = cardCenter - el.clientWidth / 2;
    isProgrammaticScroll.current = true;
    el.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
  }, []);

  // Scroll end detection — only update from manual scrolls
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let timeout;
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!isProgrammaticScroll.current) {
          detectCenter();
        }
      }, 100);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearTimeout(timeout);
    };
  }, [detectCenter]);

  const handleContinue = () => {
    if (!selectedId) return;
    sessionStorage.setItem('celestial_product_format', selectedId);
    navigate('/generate/style');
  };

  const handleCardSelect = (index) => {
    setSelectedId(PRODUCTS[index].id);
    scrollToIndex(index);
  };

  const selectedProduct = PRODUCTS.find(p => p.id === selectedId);
  const sidePad = `calc(50% - ${CARD_W / 2}px)`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      <Header variant="dark" />
      <StepProgressBar currentStep={1} />

      <main className="flex-1 flex flex-col items-center pt-12 pb-12 md:pt-16 md:pb-16 md:justify-center">
        {/* Header */}
        <div className="flex flex-col items-center text-center px-4 max-w-[250px] md:max-w-[317px]" style={{ marginBottom: '32px' }}>
          <h2 className="text-a2 w-full" style={{ color: '#1E1E1E', fontWeight: 400 }}>
            Two Ways to Treasure Your Art
          </h2>
          <p className="text-body w-full" style={{ color: 'rgba(114, 114, 114, 0.7)', marginTop: '10px' }}>
            Choose How to Display Your Artwork
          </p>
        </div>

        {/* Product cards — center-snap carousel on mobile, side-by-side on desktop */}
        <div className="w-full md:flex md:justify-center md:px-4">
          {/* Mobile: snap carousel */}
          <div
            className="w-full flex justify-center relative md:hidden"
            style={{ overflow: 'clip', padding: '4px 0' }}
          >
            <div
              ref={scrollRef}
              className="flex items-start overflow-x-auto overflow-y-hidden scrollbar-hide"
              style={{
                scrollSnapType: 'x mandatory',
                gap: `${CARD_GAP}px`,
                WebkitOverflowScrolling: 'touch',
                paddingLeft: sidePad,
                paddingRight: sidePad,
                paddingBottom: 8,
              }}
            >
              {PRODUCTS.map((product, i) => (
                <div
                  key={product.id}
                  ref={(el) => (cardRefs.current[i] = el)}
                  className="shrink-0"
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <ProductCard
                    product={product}
                    selected={selectedId === product.id}
                    onSelect={() => handleCardSelect(i)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: side-by-side */}
          <div className="hidden md:flex gap-4 justify-center">
            {PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selected={selectedId === product.id}
                onSelect={() => setSelectedId(product.id)}
              />
            ))}
          </div>
        </div>

        {/* Continue button */}
        <div className="px-4" style={{ marginTop: '16px' }}>
          <PrimaryButton
            onClick={handleContinue}
            style={{ width: '330px', maxWidth: '100%' }}
          >
            <span className="md:hidden">
              Continue with {selectedProduct?.title || 'Phone case'}
            </span>
            <span className="hidden md:inline">
              Continue
            </span>
          </PrimaryButton>
        </div>
      </main>

      <BirthDataBar formData={displayFormData} onEditBirthData={handleEditBirthData} />
      <Footer />
    </div>
  );
}
