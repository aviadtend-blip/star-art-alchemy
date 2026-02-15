import { generateChartExplanation } from '@/lib/explanations/generateExplanation';

export function ChartExplanation({ chartData, selectedImage }) {
  const explanation = generateChartExplanation(chartData);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent mb-4">
          Your Personalized Birth Chart Artwork
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
          {explanation.overview}
        </p>
      </div>

      {/* Main Grid: Image + Explanation Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Image */}
        <div className="flex flex-col items-center">
          <div className="rounded-xl overflow-hidden border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <img
              src={selectedImage}
              alt="Your natal chart artwork"
              className="w-full h-auto max-w-md"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center italic">
            Generated with magical pink watercolor LoRA based on your unique natal chart
          </p>
        </div>

        {/* Right: Explanations */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-amber-300 mb-4">
            How Your Chart Influenced This Artwork
          </h3>

          {explanation.elements.map((element, index) => (
            <div
              key={index}
              className="rounded-lg border border-amber-500/10 bg-card/50 backdrop-blur-sm p-5 space-y-3"
            >
              {/* Icon and Title */}
              <div className="flex items-start gap-3">
                <span className="text-2xl">{element.icon}</span>
                <div>
                  <h4 className="text-base font-semibold text-foreground">
                    {element.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {element.subtitle}
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {element.explanation}
              </p>

              {/* Visual Cues */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Visual Cues
                </span>
                <ul className="space-y-1">
                  {element.visualCues.map((cue, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Meaning */}
              <p className="text-xs italic text-amber-200/60 border-t border-amber-500/10 pt-2">
                {element.meaning}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
