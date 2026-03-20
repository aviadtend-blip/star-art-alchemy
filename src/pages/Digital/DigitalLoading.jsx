import { useEffect } from 'react';
import { useGenerator } from '@/contexts/GeneratorContext';
import GenerateLoadingPage from '@/pages/GenerateLoading';

/**
 * Digital funnel loading screen (/d/loading).
 * Ensures funnelMode is 'digital', then renders the shared loading page.
 */
export default function DigitalLoading() {
  const { setFunnelMode } = useGenerator();

  useEffect(() => {
    setFunnelMode('digital');
  }, [setFunnelMode]);

  return <GenerateLoadingPage />;
}
