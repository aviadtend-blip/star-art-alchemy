import { CONCRETE_SUN_VISUALS, CONCRETE_MOON_VISUALS, CONCRETE_RISING_VISUALS } from '@/data/concreteVisualPrompts.js';
import buildInterpretationLayer from './buildInterpretationLayer.js';
import getAIInterpretation from './getAIInterpretation.js';

export async function buildConcretePrompt(chartData, style) {
  chartData = buildInterpretationLayer(chartData);
  const triggerWord = style?.triggerWord ?? 'magicalpink';
  const sunVisuals = CONCRETE_SUN_VISUALS[chartData.sun.sign];
  const moonVisuals = CONCRETE_MOON_VISUALS[chartData.moon.sign];
  const risingVisuals = CONCRETE_RISING_VISUALS[chartData.rising];

  const aiNarrative = await getAIInterpretation(chartData);

  const prompt = `${triggerWord}

WHO THIS PERSON IS:
${aiNarrative}

SUN (${chartData.sun.sign}):
${sunVisuals.circleDescription}
${sunVisuals.additionalElements}
Botanicals: ${sunVisuals.botanicals}
Positioning: ${sunVisuals.positioning}

MOON (${chartData.moon.sign}):
${moonVisuals.circleDescription}
${moonVisuals.atmosphere}

RISING (${chartData.rising}):
${risingVisuals.compositionalStyle}
${risingVisuals.borderElements}

COMPOSITION:
Overall shape: ${getOverallShape(chartData.rising)}
Layout: ${getLayoutDescription(chartData.sun.sign, chartData.moon.sign)}
Aesthetic: ${risingVisuals.overallEnergy}

SPATIAL ARRANGEMENT:
${getSpatialArrangement(chartData.sun.sign, chartData.moon.sign, chartData.rising)}`;

  if (import.meta.env.DEV) {
    console.log('🎨 Built concrete visual prompt for:', {
      sun: chartData.sun.sign,
      moon: chartData.moon.sign,
      rising: chartData.rising
    });
  }

  return prompt;
}

// Keep backward-compatible export name
export const buildCanonicalPrompt = buildConcretePrompt;

// Helper functions

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

function getSpatialArrangement(sunSign, moonSign, rising) {
  return `${getRisingImpact(rising)}
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
