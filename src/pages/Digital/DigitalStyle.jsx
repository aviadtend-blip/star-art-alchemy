import { useEffect } from 'react';
import { useGenerator } from '@/contexts/GeneratorContext';
import GenerateStyle from '@/pages/GenerateStyle';

/**
 * Digital funnel style selection (/d/style).
 * Ensures funnelMode is 'digital', then renders the shared style page.
 */
export default function DigitalStyle() {
  const { setFunnelMode } = useGenerator();

  useEffect(() => {
    setFunnelMode('digital');
  }, [setFunnelMode]);

  return <GenerateStyle />;
}
