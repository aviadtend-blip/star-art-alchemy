import { useNavigate } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { PhoneCaseCustomization } from '@/components/Purchase/PhoneCaseCustomization';
import demoImage from '@/assets/gallery/demo-cosmic-collision.webp';

export default function GeneratePhoneCase() {
  const navigate = useNavigate();
  const {
    chartData, generatedImage, formData,
    handleBackToPreview, handleEditBirthData,
    isCheckingOut,
  } = useGenerator();

  const displayChart = chartData || { sun: { sign: 'Scorpio', house: 8 }, moon: { sign: 'Pisces', house: 12 }, rising: 'Capricorn' };
  const displayImage = generatedImage || demoImage;

  const handleCheckout = (orderData) => {
    // TODO: wire up phone case checkout via Shopify
    console.log('Phone case checkout:', orderData);
  };

  return (
    <>
      <PhoneCaseCustomization
        chartData={displayChart}
        artworkImage={displayImage}
        onCheckout={handleCheckout}
        onBack={handleBackToPreview || (() => navigate('/generate/preview'))}
        formData={formData}
        onEditBirthData={handleEditBirthData || (() => navigate('/'))}
      />

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
