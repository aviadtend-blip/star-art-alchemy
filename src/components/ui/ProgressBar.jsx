import { Check } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Enter data' },
  { number: 2, label: 'Choose style' },
  { number: 3, label: 'Preview' },
  { number: 4, label: 'Size' },
];

/**
 * Horizontal 4-step progress bar.
 * @param {{ currentStep: number, className?: string }} props
 */
export default function ProgressBar({ currentStep = 1, className = '' }) {
  return (
    <div className={`w-full max-w-2xl mx-auto py-6 px-4 ${className}`}>
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isLast = i === STEPS.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-body font-medium transition-all
                    ${isCompleted
                      ? 'bg-[hsl(352,68%,66%)] text-white'
                      : isActive
                        ? 'bg-[hsl(352,68%,66%)] text-white shadow-[0_0_12px_hsl(352_68%_66%/0.4)]'
                        : 'bg-secondary text-muted-foreground border border-border'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-body tracking-wide whitespace-nowrap
                    ${isActive
                      ? 'text-[hsl(352,68%,66%)] font-medium'
                      : isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-3 mt-[-1.25rem]">
                  <div
                    className={`h-px transition-colors ${
                      step.number < currentStep ? 'bg-[hsl(352,68%,66%)]' : 'bg-border'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
