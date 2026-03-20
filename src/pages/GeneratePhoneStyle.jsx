import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import StyleSelection from '@/components/Generator/StyleSelection';
import { PHONE_ART_STYLES } from '@/config/artStyles';

// Phone case style images
import blockThumb from '@/assets/gallery/styles-phone/block-print-thumb.webp';
import block2 from '@/assets/gallery/styles-phone/block-print-2.webp';
import block3 from '@/assets/gallery/styles-phone/block-print-3.webp';
import block4 from '@/assets/gallery/styles-phone/block-print-4.webp';
import block5 from '@/assets/gallery/styles-phone/block-print-5.webp';

import folkThumb from '@/assets/gallery/styles-phone/folk-oracle-thumb.webp';
import folk2 from '@/assets/gallery/styles-phone/folk-oracle-2.webp';
import folk3 from '@/assets/gallery/styles-phone/folk-oracle-3.webp';
import folk4 from '@/assets/gallery/styles-phone/folk-oracle-4.webp';
import folk5 from '@/assets/gallery/styles-phone/folk-oracle-5.webp';

import paleThumb from '@/assets/gallery/styles-phone/pale-studio-thumb.webp';
import pale2 from '@/assets/gallery/styles-phone/pale-studio-2.webp';
import pale3 from '@/assets/gallery/styles-phone/pale-studio-3.webp';
import pale4 from '@/assets/gallery/styles-phone/pale-studio-4.webp';
import pale5 from '@/assets/gallery/styles-phone/pale-studio-5.webp';

import paperThumb from '@/assets/gallery/styles-phone/paper-carnival-thumb.webp';
import paper2 from '@/assets/gallery/styles-phone/paper-carnival-2.webp';
import paper3 from '@/assets/gallery/styles-phone/paper-carnival-3.webp';
import paper4 from '@/assets/gallery/styles-phone/paper-carnival-4.webp';
import paper5 from '@/assets/gallery/styles-phone/paper-carnival-5.webp';

import redThumb from '@/assets/gallery/styles-phone/red-eclipse-thumb.webp';
import red2 from '@/assets/gallery/styles-phone/red-eclipse-2.webp';
import red3 from '@/assets/gallery/styles-phone/red-eclipse-3.webp';
import red4 from '@/assets/gallery/styles-phone/red-eclipse-4.webp';
import red5 from '@/assets/gallery/styles-phone/red-eclipse-5.webp';

import risoThumb from '@/assets/gallery/styles-phone/riso-bloom-thumb.webp';
import riso2 from '@/assets/gallery/styles-phone/riso-bloom-2.webp';
import riso3 from '@/assets/gallery/styles-phone/riso-bloom-3.webp';
import riso4 from '@/assets/gallery/styles-phone/riso-bloom-4.webp';
import riso5 from '@/assets/gallery/styles-phone/riso-bloom-5.webp';

const PHONE_STYLE_IMAGES = {
  'block-print': blockThumb,
  'folk-oracle-phone': folkThumb,
  'pale-studio': paleThumb,
  'paper-carnival-phone': paperThumb,
  'red-eclipse-phone': redThumb,
  'riso-bloom': risoThumb,
};

const PHONE_STYLE_GALLERY = {
  'block-print': [blockThumb, block2, block3, block4, block5],
  'folk-oracle-phone': [folkThumb, folk2, folk3, folk4, folk5],
  'pale-studio': [paleThumb, pale2, pale3, pale4, pale5],
  'paper-carnival-phone': [paperThumb, paper2, paper3, paper4, paper5],
  'red-eclipse-phone': [redThumb, red2, red3, red4, red5],
  'riso-bloom': [risoThumb, riso2, riso3, riso4, riso5],
};

const PHONE_STYLE_LABELS = {
  'block-print': { title: 'BLOCK PRINT', sub: 'Heavy ink, raw edges' },
  'folk-oracle-phone': { title: 'FOLK ORACLE', sub: 'Dark folklore, rich warmth' },
  'pale-studio': { title: 'PALE STUDIO', sub: 'Loose paint, quiet space' },
  'paper-carnival-phone': { title: 'PAPER CARNIVAL', sub: 'Bright naive wonder' },
  'red-eclipse-phone': { title: 'RED ECLIPSE', sub: 'Bold ink, crimson fire' },
  'riso-bloom': { title: 'RISO BLOOM', sub: 'Grainy retro layers' },
};

export default function GeneratePhoneStyle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { chartData, formData, handleFormSubmit, handleStyleSelect, handleEditBirthData, handleRetry, isPortraitEdition } = useGenerator();
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
        ...(lat != null ? { lat: Number(lat) } : {}),
        ...(lng != null ? { lng: Number(lng) } : {}),
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

  return (
    <StyleSelection
      onSelect={handleStyleSelect}
      onBack={handleRetry}
      chartData={chartData}
      formData={displayFormData}
      onEditBirthData={handleEditBirthData}
      isLoading={!chartData}
      isPortraitEdition={isPortraitEdition}
      primaryStyles={PHONE_ART_STYLES}
      additionalStyles={null}
      styleImages={PHONE_STYLE_IMAGES}
      styleGallery={PHONE_STYLE_GALLERY}
      styleLabels={PHONE_STYLE_LABELS}
    />
  );
}
