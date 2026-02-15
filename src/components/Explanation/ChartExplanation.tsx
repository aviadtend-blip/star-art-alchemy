import { buildExplanation } from "@/lib/prompts/promptBuilder";
import type { ChartData } from "@/lib/astrology/chartCalculator";
import { zodiacSigns } from "@/lib/data/canonicalDefinitions";

interface ChartExplanationProps {
  chartData: ChartData;
}

const ChartExplanation = ({ chartData }: ChartExplanationProps) => {
  const explanations = buildExplanation(chartData);
  const sun = zodiacSigns[chartData.sunSign as keyof typeof zodiacSigns];
  const moon = zodiacSigns[chartData.moonSign as keyof typeof zodiacSigns];
  const rising = zodiacSigns[chartData.risingSign as keyof typeof zodiacSigns];

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <h3 className="font-display text-2xl text-primary text-glow text-center tracking-wide">
        Your Celestial Blueprint
      </h3>

      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: "Sun", sign: chartData.sunSign, data: sun },
          { label: "Moon", sign: chartData.moonSign, data: moon },
          { label: "Rising", sign: chartData.risingSign, data: rising },
        ].map((item) => (
          <div key={item.label} className="bg-secondary/50 rounded-lg p-4 border border-border">
            <span className="text-3xl block mb-1">{item.data?.symbol}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-body">{item.label}</span>
            <span className="block text-sm text-foreground capitalize font-display mt-1">{item.sign}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {explanations.map((text, i) => (
          <p
            key={i}
            className="text-sm text-secondary-foreground leading-relaxed font-body opacity-0 animate-fade-in"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            {text}
          </p>
        ))}
      </div>
    </div>
  );
};

export default ChartExplanation;
