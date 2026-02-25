import { Check } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Enter data' },
  { number: 2, label: 'Choose style' },
  { number: 3, label: 'Preview' },
  { number: 4, label: 'Size' },
];

/**
 * Persistent 4-step progress bar.
 * Dark background, left-aligned steps with pink accent bar on active step.
 * @param {{ currentStep: number }} props – 1-based step (1–4)
 */
export default function StepProgressBar({ currentStep = 1 }) {
  return (
    <div className="w-full relative" style={{ backgroundColor: '#121212' }}>
      <div className="flex items-stretch overflow-x-auto scrollbar-hide" style={{ padding: '0 0 12px 31px' }}>
        {STEPS.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div
              key={step.number}
              className="flex flex-col items-center"
              style={{ marginRight: step.number < 4 ? '40px' : 0, paddingRight: step.number === 4 ? '30px' : 0 }}
            >
              {/* Pink accent bar above active step */}
              <div
                className="w-full mb-2"
                style={{
                  height: '3px',
                  backgroundColor: isActive ? '#FE6781' : 'transparent',
                }}
              />

              {/* Label */}
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="text-a5 font-body tracking-wide"
                  style={{
                    color: isActive ? '#FE6781' : '#B0B0B0',
                  }}
                >
                  {step.number}. {step.label}
                </span>
                {isCompleted && (
                  <Check className="w-3.5 h-3.5" style={{ color: '#B0B0B0' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Fade hint on right edge for mobile */}
      <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none md:hidden" style={{ background: 'linear-gradient(to right, transparent, #121212)' }} />
    </div>
  );
}
