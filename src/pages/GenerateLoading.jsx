import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import LoadingScreen from '@/components/Generator/LoadingScreen';

export default function GenerateLoading() {
  const navigate = useNavigate();
  const ctx = useGenerator();

  useEffect(() => {
    if (!ctx.chartData) navigate('/');
    // If generation already completed (e.g. back-navigation), skip to preview
    if (ctx.generatedImage && ctx.generationComplete) {
      ctx.setGenerationComplete(false);
      navigate('/generate/preview');
    }
  }, [ctx.chartData, ctx.generatedImage, ctx.generationComplete, navigate]);

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
