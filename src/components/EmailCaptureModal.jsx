import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { identifyProfile, trackEmailCaptured, detectPeakSeason } from '@/lib/klaviyo';
import PrimaryButton from '@/components/ui/PrimaryButton';

const INPUT_CLASS = "w-full bg-transparent border-0 border-b border-white/20 rounded-none px-0 py-3 text-lg text-left text-foreground placeholder:text-[#B1B1B1] focus:border-primary focus:ring-0 transition outline-none";

export default function EmailCaptureModal({ isOpen, onClose, chartData, artworkUrl, formData }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState(() => formData?.name?.split(' ')[0] || '');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setErrorMsg('');
      setEmail('');
      setFirstName(formData?.name?.split(' ')[0] || '');
    }
  }, [isOpen, formData]);

  if (!isOpen) return null;

  const sunSign = chartData?.sun?.sign;
  const moonSign = chartData?.moon?.sign;
  const risingSign = chartData?.rising;
  const elementBalance = chartData?.element_balance;
  const dominantElement = elementBalance
    ? Object.keys(elementBalance).reduce((a, b) =>
        elementBalance[a] > elementBalance[b] ? a : b
      )
    : undefined;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    const artworkId = sessionStorage.getItem('celestial_artwork_id');
    const sessionId = sessionStorage.getItem('celestial_session_id');
    const peakSeason = detectPeakSeason();
    const captureTimestamp = new Date().toISOString();

    const profileData = {
      email: email.trim(),
      firstName: firstName.trim(),
      sunSign,
      moonSign,
      risingSign,
      artworkUrl,
      emailMockupUrl: artworkUrl,
      artworkId,
      captureTimestamp,
      peakSeason,
      dominantElement,
      elementBalance,
    };

    try {
      const { error } = await supabase.functions.invoke('capture-email', {
        body: { ...profileData, sessionId },
      });

      if (error) {
        console.warn('[EmailCaptureModal] Edge function error:', error);
      }

      identifyProfile(profileData);
      trackEmailCaptured(profileData);

      sessionStorage.setItem('celestial_captured_email', email.trim());
      sessionStorage.setItem('celestial_captured_first_name', firstName.trim());

      setStatus('success');

      setTimeout(() => {
        if (artworkUrl) {
          const a = document.createElement('a');
          a.href = artworkUrl;
          a.download = 'celestial-artwork-preview.png';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        onClose();
      }, 2000);
    } catch (err) {
      console.error('[EmailCaptureModal] Unexpected error:', err);
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div
        className="relative w-full max-w-sm"
        style={{
          background: 'rgba(17, 17, 17, 0.70)',
          backdropFilter: 'blur(17px)',
          WebkitBackdropFilter: 'blur(17px)',
          padding: '40px 24px 24px',
          borderRadius: '12px',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {status === 'success' ? (
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <span className="text-4xl">✨</span>
            <h3 className="text-a2 font-display text-foreground">
              Check your inbox!
            </h3>
            <p className="text-body font-body text-white/60">
              We've sent your hi-res preview and a little surprise to <strong className="text-foreground">{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 24 }}>
            {/* Artwork thumbnail with bottom fade */}
            {artworkUrl && (
              <div className="relative mx-auto overflow-hidden rounded-lg" style={{ maxHeight: 80, width: '60%', opacity: 0.7 }}>
                <img
                  src={artworkUrl}
                  alt="Your artwork"
                  className="w-full h-full object-cover object-top"
                  style={{ maxHeight: 80 }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{
                    height: '60%',
                    background: 'linear-gradient(to bottom, transparent, rgba(17, 17, 17, 1))',
                  }}
                />
              </div>
            )}

            <div className="text-center">
              <h3 className="text-a2 font-display text-foreground">
                Get Your Free Hi-Res Artwork
              </h3>
              <p className="text-body font-body text-white/60 mt-2">
                Enter your email to download the full-resolution version — plus a surprise gift inside.
              </p>
            </div>

            <input
              type="text"
              placeholder="First name (optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={INPUT_CLASS}
              style={{ fontFamily: 'var(--font-body)' }}
            />

            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              required
              className={INPUT_CLASS}
              style={{
                fontFamily: 'var(--font-body)',
                borderBottomColor: status === 'error' ? 'hsl(0 84.2% 60.2%)' : undefined,
              }}
            />

            {status === 'error' && errorMsg && (
              <p className="text-body-sm text-destructive -mt-3">{errorMsg}</p>
            )}

            <div className="flex flex-col" style={{ gap: 8 }}>
              <PrimaryButton
                type="submit"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending...' : 'Send My Preview ✦'}
              </PrimaryButton>

              <button
                type="button"
                onClick={onClose}
                className="btn-base btn-dark-outline w-full"
              >
                Cancel
              </button>
            </div>

            <p className="text-body-sm text-center text-white/40 -mt-2">
              We'll email you the download link and a $10 off code. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
