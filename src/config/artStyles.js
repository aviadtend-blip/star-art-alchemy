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

/**
 * Get a style by its ID
 */
export function getStyleById(id) {
  return ART_STYLES.find((s) => s.id === id) ?? ART_STYLES[0];
}
