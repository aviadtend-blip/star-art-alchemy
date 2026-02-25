import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { ChartExplanation } from '@/components/Explanation/ChartExplanation';
import ProgressBar from '@/components/ui/ProgressBar';

export default function GeneratePreview() {
  const navigate = useNavigate();
  const {
    chartData, generatedImage, formData,
    handleGetFramed, handleEditBirthData, handleBackToStyle, handleRetry,
  } = useGenerator();

  useEffect(() => {
    if (!chartData || !generatedImage) navigate('/');
  }, [chartData, generatedImage, navigate]);

  if (!chartData || !generatedImage) return null;

  return (
    <div className="min-h-screen bg-cosmic">
      <div className="animate-fade-in">
        <ProgressBar currentStep={3} />
        <ChartExplanation
          chartData={chartData}
          selectedImage={generatedImage}
          onGetFramed={handleGetFramed}
          formData={formData}
          onEditBirthData={handleEditBirthData}
        />
        <div className="flex justify-center gap-4 mt-6 pb-8">
          <button onClick={handleBackToStyle} className="text-subtitle text-muted-foreground hover:text-primary transition-colors tracking-wide">
            ← Try Different Style
          </button>
          <button onClick={handleRetry} className="text-subtitle text-muted-foreground hover:text-primary transition-colors tracking-wide">
            ← Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
