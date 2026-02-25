import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import LoadingScreen from '@/components/Generator/LoadingScreen';



export default function GenerateLoading() {
  const navigate = useNavigate();
  const ctx = useGenerator();

  useEffect(() => {
    if (!ctx.chartData) navigate('/');
  }, [ctx.chartData, navigate]);

  if (!ctx.chartData) return null;

  const chartData = ctx.chartData;

  return (
    <LoadingScreen
      chartData={chartData}
      selectedStyle={ctx.selectedStyle}
      generationProgress={ctx.generationProgress || 'Creating your artwork...'}
    />
  );
}
