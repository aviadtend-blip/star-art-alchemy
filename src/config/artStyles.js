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
    sref: '2987498144',
    preview: '💥',
    accentColor: 'from-indigo-400 to-purple-500',
  },
];

/**
 * Get a style by its ID
 */
export function getStyleById(id) {
  return ART_STYLES.find((s) => s.id === id) ?? ADDITIONAL_STYLES.find((s) => s.id === id) ?? ART_STYLES[0];
}
