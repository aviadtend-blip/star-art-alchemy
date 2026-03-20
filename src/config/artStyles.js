// Art style definitions — each style maps to a Midjourney --sref code.

export const ART_STYLES = [
  {
    id: 'prism-storm',
    name: 'Prism Storm',
    description: 'Abstract expressionist cosmos with bold, saturated layers of celestial imagery.',
    sref: '3498857616',
    preview: '🎆',
    accentColor: 'from-pink-400 to-rose-500',
  },
  {
    id: 'folk-oracle',
    name: 'Folk Oracle',
    description: 'Dark folklore with rich warmth — mystical scenes rendered in earthy, intimate tones.',
    sref: '560113199',
    preview: '🦌',
    accentColor: 'from-amber-400 to-orange-500',
    popular: true,
  },
  {
    id: 'cosmic-fable',
    name: 'Cosmic Fable',
    description: 'Retro cosmic storytelling with whimsical, illustrative charm and bold graphic shapes.',
    sref: '2849659324',
    preview: '📖',
    accentColor: 'from-teal-400 to-cyan-500',
  },
];

export const ADDITIONAL_STYLES = [
  {
    id: 'paper-carnival',
    name: 'Paper Carnival',
    description: 'Bright naive wonder with playful folk-art energy and joyful color.',
    sref: '1457152461',
    preview: '🎪',
    accentColor: 'from-yellow-400 to-orange-400',
  },
  {
    id: 'red-eclipse',
    name: 'Red Eclipse',
    description: 'Bold ink and crimson fire — dramatic woodcut-style cosmic illustration.',
    sref: '6815708',
    preview: '🔴',
    accentColor: 'from-red-500 to-red-700',
  },
  {
    id: 'cosmic-collision',
    name: 'Cosmic Collision',
    description: 'Explosive mixed-media surrealism — ink, watercolor, and nebula dreamscapes.',
    sref: 'https://cdn.midjourney.com/44838c30-b1e1-4a71-b6b2-1a39233d379d/0_1.png https://cdn.midjourney.com/3de944b4-2668-4655-98de-d7f7e02f24c8/0_2.png https://cdn.midjourney.com/3de944b4-2668-4655-98de-d7f7e02f24c8/0_1.png https://cdn.midjourney.com/b4acc145-8f89-43f8-a5b6-fb80651dc28c/0_3.png https://cdn.midjourney.com/b4acc145-8f89-43f8-a5b6-fb80651dc28c/0_1.png',
    preview: '💥',
    accentColor: 'from-indigo-400 to-purple-500',
  },
];

// Phone case exclusive styles
export const PHONE_ART_STYLES = [
  {
    id: 'block-print',
    name: 'Block Print',
    description: 'Heavy ink, raw edges — bold graphic marks with tactile energy.',
    sref: '2663806998',
    preview: '🖨️',
    accentColor: 'from-gray-700 to-gray-900',
  },
  {
    id: 'folk-oracle-phone',
    name: 'Folk Oracle',
    description: 'Dark folklore with rich warmth — mystical scenes rendered in earthy, intimate tones.',
    sref: '560113199',
    preview: '🦌',
    accentColor: 'from-amber-400 to-orange-500',
    popular: true,
  },
  {
    id: 'pale-studio',
    name: 'Pale Studio',
    description: 'Loose paint, quiet space — atmospheric scenes with minimal, painterly marks.',
    sref: '3000561154',
    preview: '🎨',
    accentColor: 'from-slate-300 to-blue-300',
  },
  {
    id: 'paper-carnival-phone',
    name: 'Paper Carnival',
    description: 'Bright naive wonder with playful folk-art energy and joyful color.',
    sref: '1457152461',
    preview: '🎪',
    accentColor: 'from-yellow-400 to-orange-400',
  },
  {
    id: 'red-eclipse-phone',
    name: 'Red Eclipse',
    description: 'Bold ink and crimson fire — dramatic woodcut-style cosmic illustration.',
    sref: '6815708',
    preview: '🔴',
    accentColor: 'from-red-500 to-red-700',
  },
  {
    id: 'riso-bloom',
    name: 'Riso Bloom',
    description: 'Grainy retro layers — risograph-inspired color with playful compositions.',
    sref: '269425912',
    preview: '🌸',
    accentColor: 'from-pink-400 to-yellow-400',
  },
];

/**
 * Get a style by its ID
 */
export function getStyleById(id) {
  return ART_STYLES.find((s) => s.id === id) ?? ADDITIONAL_STYLES.find((s) => s.id === id) ?? ART_STYLES[0];
}
