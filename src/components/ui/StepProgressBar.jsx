import { Check, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { number: 1, label: 'Choose style' },
  { number: 2, label: 'Preview' },
  { number: 3, label: 'Size Selection' },
];

/**
 * Persistent 3-step progress bar.
 * Mobile: single active step with back arrow + step counter (40px height).
 * Desktop: all steps visible with pink accent bar on active step + back arrow.
 * @param {{ currentStep: number, onBack?: () => void }} props – 1-based step (1–3)
 */
export default function StepProgressBar({ currentStep = 1, onBack }) {
  const navigate = useNavigate();
  const activeStep = STEPS.find(s => s.number === currentStep);

  const handleBack = onBack || (() => navigate(-1));

  return (
    <div className="w-full relative" style={{ backgroundColor: '#121212', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
      {/* Mobile: single step display */}
      <div className="md:hidden" style={{ padding: '0 20px' }}>
        {/* Segmented accent bar */}
        <div className="flex" style={{ gap: 3 }}>
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="flex-1"
              style={{
                height: '3px',
                backgroundColor: step.number <= currentStep ? '#FE6781' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between" style={{ height: '37px' }}>
          <button onClick={handleBack} className="flex items-center justify-center" style={{ width: 24, height: 24 }}>
            <ChevronLeft className="w-5 h-5" style={{ color: '#FFFFFF' }} />
          </button>
          <span className="text-a5 font-body" style={{ color: '#FE6781' }}>
            {activeStep?.label}
          </span>
          <span className="text-a5 font-body" style={{ color: '#B0B0B0' }}>
            {currentStep}/{STEPS.length}
          </span>
        </div>
      </div>

      {/* Desktop: all steps visible */}
      <div className="hidden md:flex items-center" style={{ height: '40px', padding: '0 31px' }}>
        <button onClick={handleBack} className="flex items-center justify-center mr-6" style={{ width: 24, height: 24 }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#FFFFFF' }} />
        </button>
        {STEPS.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div
              key={step.number}
              className="flex items-center gap-1.5 whitespace-nowrap"
              style={{ marginRight: step.number < 3 ? '40px' : 0 }}
            >
              <span
                className="text-a5 font-body tracking-wide"
                style={{ color: isActive ? '#FE6781' : '#B0B0B0' }}
              >
                {step.number}. {step.label}
              </span>
              {isCompleted && (
                <Check className="w-3.5 h-3.5" style={{ color: '#B0B0B0' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
