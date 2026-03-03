import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import StyleSelection from '@/components/Generator/StyleSelection';

export default function GenerateStyle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { chartData, formData, handleFormSubmit, handleStyleSelect, handleEditBirthData, handleRetry } = useGenerator();
  const autoSubmitted = useRef(false);

  // If we arrived with query params (from landing page), start chart calculation
  useEffect(() => {
    if (autoSubmitted.current || chartData) return;

    const month = searchParams.get('month');
    const day = searchParams.get('day');
    const year = searchParams.get('year');
    const city = searchParams.get('city');

    if (month && day && year && city) {
      autoSubmitted.current = true;
      handleFormSubmit({
        name: searchParams.get('name') || '',
        month: Number(month),
        day: Number(day),
        year: Number(year),
        hour: Number(searchParams.get('hour') || '12'),
        minute: Number(searchParams.get('minute') || '0'),
        city,
        nation: searchParams.get('nation') || 'US',
      });
    } else if (!chartData) {
      navigate('/');
    }
  }, [searchParams, navigate, chartData, handleFormSubmit]);

  // Build a minimal formData object from query params for the birth data bar while chart loads
  const displayFormData = formData || (() => {
    const name = searchParams.get('name');
    const city = searchParams.get('city');
    if (!city) return null;
    return {
      name: name || '',
      birthMonth: searchParams.get('month') || '',
      birthDay: searchParams.get('day') || '',
      birthYear: searchParams.get('year') || '',
      birthCity: city,
      birthCountry: searchParams.get('nation') || 'US',
    };
  })();

  // Show style selection immediately — with isLoading flag if chart isn't ready yet
  return (
    <StyleSelection
      onSelect={handleStyleSelect}
      onBack={handleRetry}
      chartData={chartData}
      formData={displayFormData}
      onEditBirthData={handleEditBirthData}
      isLoading={!chartData}
    />
  );
}
