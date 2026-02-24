import { Check } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Enter data' },
  { number: 2, label: 'Choose style' },
  { number: 3, label: 'Preview' },
  { number: 4, label: 'Size' },
];

/**
 * Persistent 4-step progress bar.
 * @param {{ currentStep: number }} props – 1-based step (1–4)
 */
export default function StepProgressBar({ currentStep = 1 }) {
  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isLast = i === STEPS.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-body font-medium transition-all
                    ${isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                        ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(45_80%_65%/0.4)]'
                        : 'bg-secondary text-muted-foreground border border-border'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-body tracking-wide whitespace-nowrap
                    ${isActive ? 'text-primary font-medium' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}
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
                      step.number < currentStep ? 'bg-primary' : 'bg-border'
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
