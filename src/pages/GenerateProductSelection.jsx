import { useState, useEffect, useRef } from 'react';
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
      <div className="flex flex-col w-full" style={{ gap: '4px', paddingTop: '18px' }}>
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

export default function GenerateProductSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { chartData, formData, handleFormSubmit, handleEditBirthData } = useGenerator();
  const [selectedId, setSelectedId] = useState(null);
  const autoSubmitted = useRef(false);

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
    // No redirect — allow direct access for preview/testing
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

  const handleContinue = () => {
    if (!selectedId) return;

    // Store the selected product format in session
    sessionStorage.setItem('celestial_product_format', selectedId);

    // Navigate to style selection, passing the product format
    navigate('/generate/style');
  };

  const isDisabled = !selectedId;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      <Header variant="dark" />
      <StepProgressBar currentStep={1} />

      <main className="flex-1 flex flex-col items-center px-4 pt-12 pb-12 md:pt-16 md:pb-16 md:justify-center">
        {/* Header */}
        <div className="flex flex-col items-center text-center" style={{ maxWidth: '317px', marginBottom: '32px' }}>
          <h1 className="text-a1-special w-full" style={{ color: '#1E1E1E' }}>
            Two Ways to Treasure Your Art
          </h1>
          <p className="text-body w-full" style={{ color: 'rgba(114, 114, 114, 0.7)', marginTop: '10px' }}>
            Choose How to Display Your Artwork
          </p>
        </div>

        {/* Product cards — horizontal scroll on mobile, side-by-side on desktop */}
        <div className="w-full overflow-x-auto pb-4 md:overflow-x-visible md:pb-0 scrollbar-hide">
          <div className="flex w-max gap-4 px-4 md:w-auto md:justify-center md:px-0">
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
        <div style={{ marginTop: '48px' }}>
          <PrimaryButton
            disabled={isDisabled}
            onClick={handleContinue}
            style={{ width: '330px', maxWidth: '100%' }}
          >
            Continue
          </PrimaryButton>
        </div>
      </main>

      <BirthDataBar formData={displayFormData} onEditBirthData={handleEditBirthData} />
      <Footer />
    </div>
  );
}
