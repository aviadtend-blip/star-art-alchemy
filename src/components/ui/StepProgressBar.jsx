import { Check } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Enter data' },
  { number: 2, label: 'Choose style' },
  { number: 3, label: 'Preview' },
  { number: 4, label: 'Size' },
];

/**
 * Persistent 4-step progress bar matching Figma design.
 * Dark background, text labels with pink accent on active step + pink bar above.
 * @param {{ currentStep: number }} props – 1-based step (1–4)
 */
export default function StepProgressBar({ currentStep = 1 }) {
  return (
    <div className="w-full" style={{ backgroundColor: '#1A1A1A' }}>
      <div className="max-w-4xl mx-auto flex">
        {STEPS.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div
              key={step.number}
              className="flex-1 flex flex-col items-center relative"
            >
              {/* Pink accent bar above active step */}
              <div
                className="w-full h-[3px]"
                style={{
                  backgroundColor: isActive ? 'hsl(var(--primary))' : 'transparent',
                }}
              />

              {/* Label row */}
              <div className="flex items-center gap-1.5 py-3">
                <span
                  className={`text-body-sm font-body tracking-wide whitespace-nowrap ${
                    isActive
                      ? 'text-primary'
                      : isCompleted
                        ? 'text-white/60'
                        : 'text-white/30'
                  }`}
                >
                  {step.number}. {step.label}
                </span>
                {isCompleted && (
                  <Check className="w-3.5 h-3.5 text-white/60" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
