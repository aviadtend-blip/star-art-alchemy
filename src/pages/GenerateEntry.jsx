import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';

/**
 * Entry point for /generate — reads query params, calculates chart, redirects to /generate/style.
 * If no valid params, redirects home.
 */
export default function GenerateEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleFormSubmit } = useGenerator();
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (autoSubmitted.current) return;
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
    } else {
      navigate('/');
    }
  }, [searchParams, navigate, handleFormSubmit]);

  // Show a simple loading state while chart is being calculated
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <svg className="w-full h-full" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#F5F5F5" strokeWidth="4" />
          </svg>
          <svg className="w-full h-full absolute inset-0 animate-spin" viewBox="0 0 64 64" style={{ animationDuration: '1.2s' }}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="#FE6781" strokeWidth="4" strokeLinecap="round" strokeDasharray="44 132" />
          </svg>
        </div>
        <p className="text-body font-body text-surface-muted">Calculating your birth chart...</p>
      </div>
    </div>
  );
}
