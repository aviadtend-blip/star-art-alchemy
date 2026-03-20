import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import LoadingScreen from '@/components/Generator/LoadingScreen';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { GENERATE_LOADING_IMAGES, GENERATE_PREVIEW_IMAGES } from '@/data/imageManifest';

export default function GenerateLoading() {
  const navigate = useNavigate();
  const ctx = useGenerator();
  const isDigital = ctx.funnelMode === 'digital';
  const previewPath = isDigital ? '/d/preview' : '/generate/preview';
  // Loading screen asset (gif) — high priority
  useImagePreloader(GENERATE_LOADING_IMAGES);
  // Preload all mockup / preview images while AI is generating — user has ~20s of wait time
  useImagePreloader(GENERATE_PREVIEW_IMAGES, { defer: 500 });

  useEffect(() => {
    if (!ctx.chartData) navigate('/');
    // If generation already completed (e.g. back-navigation), skip to preview
    if (ctx.generatedImage && ctx.generationComplete) {
      ctx.setGenerationComplete(false);
      navigate(previewPath);
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
