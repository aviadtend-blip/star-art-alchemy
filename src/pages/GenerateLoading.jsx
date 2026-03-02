import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import LoadingScreen from '@/components/Generator/LoadingScreen';

export default function GenerateLoading() {
  const navigate = useNavigate();
  const ctx = useGenerator();

  useEffect(() => {
    if (!ctx.chartData) navigate('/');
  }, [ctx.chartData, navigate]);

  const handleNavigateToPreview = useCallback(() => {
    ctx.setGenerationComplete(false);
    navigate('/generate/preview');
  }, [ctx, navigate]);

  if (!ctx.chartData) return null;

  return (
    <LoadingScreen
      chartData={ctx.chartData}
      selectedStyle={ctx.selectedStyle}
      generationProgress={ctx.generationProgress || 'Creating your artwork...'}
      isComplete={ctx.generationComplete}
      onNavigateToPreview={handleNavigateToPreview}
    />
  );
}
