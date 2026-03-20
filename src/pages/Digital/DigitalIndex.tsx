import { useEffect } from 'react';
import { useGenerator } from '@/contexts/GeneratorContext';
import LandingPage from '@/components/Landing/LandingPage';

/**
 * Digital-first funnel landing page (/d/).
 * Sets funnelMode to 'digital' so the generator flow skips product selection
 * and routes through the /d/ funnel.
 *
 * TODO: Replace with digital-specific hero copy and imagery once provided.
 */
const DigitalIndex = () => {
  const { setFunnelMode } = useGenerator();

  useEffect(() => {
    setFunnelMode('digital');
  }, [setFunnelMode]);

  return <LandingPage />;
};

export default DigitalIndex;
