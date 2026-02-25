import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import LoadingScreen from '@/components/Generator/LoadingScreen';

// Mock data for UI development — remove when connecting to real flow
const MOCK_CHART = {
  sun: { sign: 'Taurus', house: 2 },
  moon: { sign: 'Pisces', house: 12 },
  rising: 'Scorpio',
  element_balance: { Fire: 2, Water: 4, Earth: 3, Air: 1 },
  dominant_element: 'Water',
};

export default function GenerateLoading() {
  const navigate = useNavigate();
  const ctx = useGenerator();

  const chartData = ctx.chartData || MOCK_CHART;

  return (
    <LoadingScreen
      chartData={chartData}
      selectedStyle={ctx.selectedStyle}
      generationProgress={ctx.generationProgress || 'Creating your artwork...'}
    />
  );
}
