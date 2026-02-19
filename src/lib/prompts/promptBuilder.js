import { CONCRETE_SUN_VISUALS, CONCRETE_MOON_VISUALS, CONCRETE_RISING_VISUALS, CONCRETE_ELEMENT_PALETTES } from '@/data/concreteVisualPrompts.js';
import buildInterpretationLayer from './buildInterpretationLayer.js';

export function buildConcretePrompt(chartData, style) {
  chartData = buildInterpretationLayer(chartData);
  const triggerWord = style?.triggerWord ?? 'magicalpink';
  const sunVisuals = CONCRETE_SUN_VISUALS[chartData.sun.sign];
  const moonVisuals = CONCRETE_MOON_VISUALS[chartData.moon.sign];
  const risingVisuals = CONCRETE_RISING_VISUALS[chartData.rising];

  const dominantElement = Object.keys(chartData.element_balance).reduce((a, b) =>
    chartData.element_balance[a] > chartData.element_balance[b] ? a : b
  );
  const paletteVisuals = CONCRETE_ELEMENT_PALETTES[dominantElement + '-dominant'];

  const prompt = `${triggerWord}

MAIN CIRCULAR FORMS:

SUN ELEMENT (${chartData.sun.sign} Sun):
${sunVisuals.circleDescription}
Colors: ${sunVisuals.circleColors}
${sunVisuals.additionalElements}

MOON ELEMENT (${chartData.moon.sign} Moon):
${moonVisuals.circleDescription}
Colors: ${moonVisuals.circleColors}
${moonVisuals.atmosphere}

BOTANICAL DETAILS:
${sunVisuals.botanicals}
Colors: ${sunVisuals.botanicalColors}
Positioning: ${sunVisuals.positioning}

LANDSCAPE/BACKGROUND ELEMENTS (${chartData.rising} Rising):
${risingVisuals.compositionalStyle}
${risingVisuals.borderElements}

COMPOSITION STRUCTURE:
- Overall ${getOverallShape(chartData.rising)}
- ${getLayoutDescription(chartData.sun.sign, chartData.moon.sign)}
- ${risingVisuals.overallEnergy} aesthetic throughout

COLOR PALETTE (${dominantElement}-dominant chart):
Primary colors: ${paletteVisuals.description}
${paletteVisuals.percentageGuideline}
Specific color zones:
${getColorZones(chartData.sun.sign, chartData.moon.sign, dominantElement)}

SPECIFIC OBJECTS CHECKLIST:
${getObjectChecklist(sunVisuals, moonVisuals, risingVisuals)}

SPATIAL ARRANGEMENT:
${getSpatialArrangement(chartData.sun.sign, chartData.moon.sign, chartData.rising)}

PERSONALITY EMPHASIS (weight these heavily in visual storytelling):

Dominant feature: ${chartData.interpretation.dominantFeature}

Core paradox: ${chartData.interpretation.coreParadox}

${chartData.interpretation.aspectWeights
  .filter(a => a.priority === 'critical' || a.priority === 'high')
  .map(a => `- ${a.planet1} ${a.type} ${a.planet2} (${a.orb}° orb, ${a.priority} — emphasize this tension visually)`)
  .join('\n')}

${chartData.interpretation.dignityFlags.length > 0
  ? 'Dignity tensions: ' + chartData.interpretation.dignityFlags.map(d => d.impact).join('; ')
  : ''}`;

  console.log('🎨 Built concrete visual prompt for:', {
    sun: chartData.sun.sign,
    moon: chartData.moon.sign,
    rising: chartData.rising,
    element: dominantElement
  });


  return prompt;
}

// Keep backward-compatible export name
export const buildCanonicalPrompt = buildConcretePrompt;

// Helper functions

function getSunPercentage(sunSign) {
  const percentages = {
    'Leo': 40, 'Aries': 35, 'Sagittarius': 32,
    'Taurus': 30, 'Cancer': 30, 'Libra': 30,
    'Gemini': 28, 'Capricorn': 28, 'Scorpio': 25,
    'Virgo': 25, 'Pisces': 25, 'Aquarius': 24
  };
  return percentages[sunSign] || 30;
}

function getMoonPercentage(moonSign) {
  const percentages = {
    'Cancer': 28, 'Leo': 25, 'Pisces': 24, 'Scorpio': 24,
    'Taurus': 22, 'Libra': 22, 'Sagittarius': 22, 'Aquarius': 22,
    'Aries': 20, 'Capricorn': 20, 'Virgo': 20, 'Gemini': 22
  };
  return percentages[moonSign] || 20;
}

function getOverallShape(rising) {
  const shapes = {
    'Aries': 'dynamic asymmetrical shape',
    'Taurus': 'solid circular or square-based shape',
    'Gemini': 'irregular or dual-part shape',
    'Cancer': 'soft circular or oval shape with curved borders',
    'Leo': 'circular or radial mandala-like shape',
    'Virgo': 'precisely defined geometric shape',
    'Libra': 'perfectly symmetrical oval or circle',
    'Scorpio': 'irregular layered shape with hidden sections',
    'Sagittarius': 'expansive rectangular or wide oval shape',
    'Capricorn': 'vertical rectangular or pyramid-like shape',
    'Aquarius': 'unconventional asymmetrical or polygonal shape',
    'Pisces': 'soft irregular shape with flowing boundaries'
  };
  return shapes[rising] || 'oval shape';
}

function getLayoutDescription(sunSign, moonSign) {
  return `Sun positioned ${getSunPosition(sunSign)}, moon positioned ${getMoonPosition(moonSign)}`;
}

function getSunPosition(sunSign) {
  const positions = {
    'Aries': 'upper center area commanding attention',
    'Taurus': 'upper left creating grounded anchor',
    'Gemini': 'upper section in dual placement',
    'Cancer': 'center with nurturing presence',
    'Leo': 'center stage dominating composition',
    'Virgo': 'center-left with refined precision',
    'Libra': 'center-top in balanced harmony',
    'Scorpio': 'center-right with intense presence',
    'Sagittarius': 'upper section with expansive quality',
    'Capricorn': 'upper center elevated like summit',
    'Aquarius': 'asymmetrically placed breaking norms',
    'Pisces': 'soft placement with dissolving edges'
  };
  return positions[sunSign] || 'upper section';
}

function getMoonPosition(moonSign) {
  const positions = {
    'Aries': 'dynamically with movement quality',
    'Taurus': 'lower section grounded and stable',
    'Gemini': 'in dual or changing aspect',
    'Cancer': 'prominently with protective elements',
    'Leo': 'with regal dramatic presence',
    'Virgo': 'precisely with clean execution',
    'Libra': 'in balanced symmetrical placement',
    'Scorpio': 'in shadowy lower-right section',
    'Sagittarius': 'upper section near horizons',
    'Capricorn': 'elevated with structured framing',
    'Aquarius': 'unconventionally or asymmetrically',
    'Pisces': 'softly with dissolved boundaries'
  };
  return positions[moonSign] || 'lower section';
}

function getColorZones(sunSign, moonSign, element) {
  const sunColors = CONCRETE_SUN_VISUALS[sunSign].botanicalColors;
  const moonColors = CONCRETE_MOON_VISUALS[moonSign].circleColors;

  return `- Sun area (${getSunPosition(sunSign)}): ${sunColors}
- Moon area (${getMoonPosition(moonSign)}): ${moonColors}
- Background/borders: ${CONCRETE_ELEMENT_PALETTES[element + '-dominant'].description}`;
}

function getObjectChecklist(sunVisuals, moonVisuals, risingVisuals) {
  return `✓ 1 main sun circle as described above
✓ 1 main moon circle as described above
✓ Botanical elements as specified for sun sign
✓ Rising sign compositional elements
✓ Landscape or background elements if specified
✓ All elements positioned as described in spatial arrangement`;
}

function getSpatialArrangement(sunSign, moonSign, rising) {
  const sunArea = getSunPercentage(sunSign);
  const moonArea = getMoonPercentage(moonSign);
  const risingImpact = getRisingImpact(rising);

  return `Sun area occupies approximately ${sunArea}% of composition
Moon area occupies approximately ${moonArea}% of composition
${risingImpact}
Clear visual hierarchy with sun as primary focal point`;
}

function getRisingImpact(rising) {
  const impacts = {
    'Aries': 'Dynamic asymmetrical layout breaking traditional structure',
    'Taurus': 'Botanical elements frame and ground entire composition',
    'Gemini': 'Dual perspective creates conversational layout',
    'Cancer': 'Protective circular forms embrace main elements',
    'Leo': 'Regal radial structure commands attention',
    'Virgo': 'Precise geometric grid underlies entire composition',
    'Libra': 'Perfect bilateral symmetry structures everything',
    'Scorpio': 'Layered depth with mysterious shadowy sections',
    'Sagittarius': 'Expansive depth from foreground to distant horizons',
    'Capricorn': 'Vertical hierarchy with structured elevation',
    'Aquarius': 'Innovative unconventional spatial relationships',
    'Pisces': 'Soft flowing boundaries throughout'
  };
  return impacts[rising] || 'Balanced compositional structure';
}
