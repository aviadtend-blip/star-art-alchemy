import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { identifyProfile, trackEmailCaptured, detectPeakSeason } from '@/lib/klaviyo';

export default function EmailCaptureModal({ isOpen, onClose, chartData, artworkUrl, formData }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState(() => formData?.name?.split(' ')[0] || '');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  // Reset state when modal opens
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

    // Validate email
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
      // Call edge function
      const { error } = await supabase.functions.invoke('capture-email', {
        body: {
          ...profileData,
          sessionId,
        },
      });

      if (error) {
        console.warn('[EmailCaptureModal] Edge function error:', error);
        // Non-blocking — still proceed with client-side tracking
      }

      // Client-side Klaviyo backup
      identifyProfile(profileData);
      trackEmailCaptured(profileData);

      // Persist to sessionStorage
      sessionStorage.setItem('celestial_captured_email', email.trim());
      sessionStorage.setItem('celestial_captured_first_name', firstName.trim());

      setStatus('success');

      // After 2s, trigger download and close
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
      <div className="bg-white rounded-lg p-6 max-w-sm w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-surface-muted hover:text-surface-foreground transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {status === 'success' ? (
          /* ---- Success State ---- */
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <span className="text-4xl">✨</span>
            <h3 className="text-a2 font-display text-surface-foreground">
              Check your inbox!
            </h3>
            <p className="text-body font-body text-surface-muted">
              We've sent your hi-res preview and a little surprise to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          /* ---- Form State ---- */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="text-center">
              <h3 className="text-a2 font-display text-surface-foreground">
                Get Your Free Hi-Res Artwork
              </h3>
              <p className="text-body font-body text-surface-muted mt-2">
                Enter your email to download the full-resolution version — plus a surprise gift inside.
              </p>
            </div>

            <input
              type="text"
              placeholder="First name (optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border px-4 py-3 text-body font-body"
              style={{ borderColor: '#D4D4D4', borderRadius: '2px' }}
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
              className="w-full border px-4 py-3 text-body font-body"
              style={{
                borderColor: status === 'error' ? '#ef4444' : '#D4D4D4',
                borderRadius: '2px',
              }}
            />

            {status === 'error' && errorMsg && (
              <p className="text-body-sm text-red-500 -mt-2">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="btn-base btn-primary w-full"
            >
              {status === 'submitting' ? 'Sending...' : 'Send My Preview ✦'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-base btn-tertiary w-full text-surface-muted"
            >
              Cancel
            </button>

            <p className="text-center" style={{ fontSize: 11, color: '#999', lineHeight: 1.4 }}>
              We'll email you the download link and a $10 off code. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
