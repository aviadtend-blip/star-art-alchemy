import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import { ProductCustomization } from '@/components/Purchase/ProductCustomization';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { GENERATE_SIZE_IMAGES } from '@/data/imageManifest';
import { CANVAS_SIZE_MAP } from '@/lib/canvasSizes';
import { supabase } from '@/integrations/supabase/client';
import { buildResumeSessionState } from '@/lib/emailOrderResume';

export default function GenerateSize() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    chartData, generatedImage, formData, artworkId,
    handleCheckout, handleTestCheckout, handleBackToPreview, handleEditBirthData,
    isCheckingOut,
    setChartData,
    setFormData,
    setGeneratedImage,
    setArtworkAnalysis,
    setGenerationComplete,
    setArtworkId,
  } = useGenerator();
  const restoreArtworkId = searchParams.get('artwork_id');
  const restoreSessionId = searchParams.get('session_id');
  const restoreKey = restoreArtworkId
    ? `artwork:${restoreArtworkId}`
    : restoreSessionId
      ? `session:${restoreSessionId}`
      : '';
  const restoreAttemptedKeyRef = useRef('');
  const [isRestoring, setIsRestoring] = useState(() => Boolean(restoreKey));
  const [restoreError, setRestoreError] = useState('');

  // Ensure all size/customization page images are loaded
  useImagePreloader(GENERATE_SIZE_IMAGES);

  useEffect(() => {
    if (!restoreKey) {
      restoreAttemptedKeyRef.current = '';
      setIsRestoring(false);
      return;
    }

    // Email deep links should always override any stale session state in the browser.
    // Without this, an old generator session can block the saved artwork from loading.
    const alreadyRestoredThisLink =
      restoreAttemptedKeyRef.current === restoreKey &&
      ((restoreArtworkId && artworkId === restoreArtworkId) ||
        (!restoreArtworkId && restoreSessionId && generatedImage));

    if (alreadyRestoredThisLink) return;

    restoreAttemptedKeyRef.current = restoreKey;

    let active = true;

    const restoreFromSupabase = async () => {
      setIsRestoring(true);
      setRestoreError('');

      try {
        let artworkQuery = supabase
          .from('artworks')
          .select('id, customer_name, birth_data, chart_data, artwork_url, artwork_analysis, session_id, is_portrait_edition');

        artworkQuery = restoreArtworkId
          ? artworkQuery.eq('id', restoreArtworkId)
          : artworkQuery.eq('session_id', restoreSessionId).order('created_at', { ascending: false }).limit(1);

        const { data: artwork, error: artworkError } = await artworkQuery.maybeSingle();
        if (artworkError) throw artworkError;
        if (!artwork) throw new Error('Could not find the artwork for this email link.');

        let captureQuery = supabase
          .from('email_captures')
          .select('email, first_name, sun_sign, moon_sign, rising_sign, element_balance, artwork_url, email_mockup_url, artwork_id, session_id');

        captureQuery = restoreArtworkId
          ? captureQuery.eq('artwork_id', artwork.id)
          : captureQuery.eq('session_id', artwork.session_id || restoreSessionId).order('capture_timestamp', { ascending: false }).limit(1);

        const { data: capture, error: captureError } = await captureQuery.maybeSingle();
        if (captureError) throw captureError;
        const restored = buildResumeSessionState({ artwork, capture });

        if (!restored.generatorState.generatedImage) {
          throw new Error('Could not load the artwork image for this email link.');
        }

        try {
          sessionStorage.setItem('celestial_generator_state', JSON.stringify(restored.generatorState));
          if (restored.generatorState.formData) {
            sessionStorage.setItem('celestial_form_data', JSON.stringify(restored.generatorState.formData));
          }
          if (restored.artworkId) {
            sessionStorage.setItem('celestial_artwork_id', restored.artworkId);
          }
          if (restored.sessionId) {
            sessionStorage.setItem('celestial_session_id', restored.sessionId);
          }
          if (restored.capturedEmail) {
            sessionStorage.setItem('celestial_captured_email', restored.capturedEmail);
          }
          if (restored.capturedFirstName) {
            sessionStorage.setItem('celestial_captured_first_name', restored.capturedFirstName);
          }
          sessionStorage.setItem('celestial_birth_details', JSON.stringify(restored.birthDetails));
        } catch {
          // Ignore storage write failures and continue with in-memory state.
        }

        if (!active) return;

        setChartData(restored.generatorState.chartData);
        setFormData(restored.generatorState.formData);
        setGeneratedImage(restored.generatorState.generatedImage);
        setArtworkAnalysis(restored.generatorState.artworkAnalysis);
        setGenerationComplete(true);
        setArtworkId(restored.generatorState.artworkId);
      } catch (error) {
        if (!active) return;
        console.error('[GenerateSize] Failed to restore generator state from email link:', error);
        setRestoreError('We could not reload your artwork from that email link. Please generate it again.');
      } finally {
        if (active) {
          setIsRestoring(false);
        }
      }
    };

    restoreFromSupabase();

    return () => {
      active = false;
    };
  }, [
    artworkId,
    restoreArtworkId,
    restoreSessionId,
    restoreKey,
    setArtworkAnalysis,
    setArtworkId,
    setChartData,
    setFormData,
    setGeneratedImage,
    setGenerationComplete,
  ]);

  if (isRestoring) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-2 border-transparent border-t-primary rounded-full mx-auto" />
          <p className="text-a4 text-foreground">Loading your saved artwork...</p>
        </div>
      </div>
    );
  }

  if ((!chartData || !generatedImage) && restoreError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-a3 text-foreground">{restoreError}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-base btn-primary"
          >
            Start again
          </button>
        </div>
      </div>
    );
  }

  if (!chartData || !generatedImage) {
    return null;
  }

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
            const sizeData = CANVAS_SIZE_MAP['16x24'];
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
