import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { ProductCustomization } from '@/components/Purchase/ProductCustomization';

export default function GenerateSize() {
  const navigate = useNavigate();
  const {
    chartData, generatedImage, formData,
    handleCheckout, handleTestCheckout, handleBackToPreview, handleEditBirthData,
    isCheckingOut,
  } = useGenerator();

  useEffect(() => {
    if (!chartData) navigate('/');
  }, [chartData, navigate]);

  if (!chartData) return null;

  return (
    <>
      <ProductCustomization
        chartData={chartData}
        artworkImage={generatedImage}
        onCheckout={handleCheckout}
        onBack={handleBackToPreview}
        formData={formData}
        onEditBirthData={handleEditBirthData}
      />

      {import.meta.env.DEV && (
        <button
          onClick={() => {
            const sizeData = { id: '16x24', label: '16" × 24"', price: 119 };
            handleTestCheckout({
              size: sizeData.id,
              sizeLabel: sizeData.label,
              frame: 'canvas',
              frameName: 'Canvas Print',
              total: sizeData.price,
            });
          }}
          className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-green-700 transition-colors"
        >
          🧪 Skip to Confirmation
        </button>
      )}

      {isCheckingOut && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-2 border-transparent border-t-primary rounded-full mx-auto" />
            <p className="text-a4 text-foreground">Redirecting to secure checkout...</p>
          </div>
        </div>
      )}

    </>
  );
}
