// Art style definitions for the style selection step.
// Each style maps to a specific LoRA model on Replicate.

export const ART_STYLES = [
  {
    id: 'magical-pink',
    name: 'Magical Pink',
    description: 'Ethereal pink watercolor with soft, dreamy atmosphere and delicate celestial details.',
    model: 'aviadtend-blip/magical-pink',
    version: '7f84b4df7d58f1a406097da9cf729e4e3f8840f0e51657137da9956e1fa1362a',
    triggerWord: 'magicalpink',
    preview: '🎀',
    accentColor: 'from-pink-400 to-rose-500',
  },
  {
    id: 'neo-topograph',
    name: 'Neo Topograph',
    description: 'Striking topographic linework with modern cartographic precision and layered contours.',
    model: 'aviadtend-blip/neo_topograph',
    version: 'a6dcfdf5233512d2c60655f9c08f1dee49356d48a571f60ae0443dd4ce3e99a3',
    triggerWord: 'neotopo',
    preview: '🗺️',
    accentColor: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'celestial-ink',
    name: 'Celestial Ink',
    description: 'Bold ink illustration style with high-contrast black and gold cosmic motifs.',
    model: null, // placeholder
    version: null,
    triggerWord: null,
    preview: '🖋️',
    accentColor: 'from-amber-400 to-yellow-500',
    comingSoon: true,
  },
  {
    id: 'vapor-dream',
    name: 'Vapor Dream',
    description: 'Retro-futuristic vaporwave aesthetic with neon gradients and surreal geometry.',
    model: null, // placeholder
    version: null,
    triggerWord: null,
    preview: '🌈',
    accentColor: 'from-violet-400 to-fuchsia-500',
    comingSoon: true,
  },
  {
    id: 'sacred-geometry',
    name: 'Sacred Geometry',
    description: 'Precise mathematical patterns with Fibonacci spirals and golden ratio compositions.',
    model: null, // placeholder
    version: null,
    triggerWord: null,
    preview: '🔮',
    accentColor: 'from-cyan-400 to-blue-500',
    comingSoon: true,
  },
];

/**
 * Get a style by its ID
 */
export function getStyleById(id) {
  return ART_STYLES.find((s) => s.id === id) ?? ART_STYLES[0];
}
