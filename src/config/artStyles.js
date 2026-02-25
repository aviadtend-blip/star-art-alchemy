// Art style definitions — MVP uses 3 "Cosmic Collage" variants.
// Only "Bold & Vibrant" has a trained LoRA. The other two route to the same model for now.

export const ART_STYLES = [
  {
    id: 'bold-vibrant',
    name: 'Galaxy Bloom — Bold & Vibrant',
    description: 'Rich, saturated layers of celestial imagery with bold textures and warm, vivid tones.',
    model: 'aviadtend-blip/magical-pink',
    version: '7f84b4df7d58f1a406097da9cf729e4e3f8840f0e51657137da9956e1fa1362a',
    triggerWord: 'magicalpink',
    preview: '🎀',
    accentColor: 'from-pink-400 to-rose-500',
  },
  {
    id: 'minimal-architectural',
    name: 'Stellar Blueprint — Minimal & Architectural',
    description: 'Clean lines, structured composition, and restrained palettes with precise geometric forms.',
    model: 'aviadtend-blip/magical-pink', // routes to same model for MVP
    version: '7f84b4df7d58f1a406097da9cf729e4e3f8840f0e51657137da9956e1fa1362a',
    triggerWord: 'magicalpink',
    preview: '🏛️',
    accentColor: 'from-slate-400 to-zinc-500',
    popular: true,
  },
  {
    id: 'organic-flowing',
    name: 'Nebula Flow — Organic & Flowing',
    description: 'Fluid, natural forms with soft gradients and gentle movement inspired by water and growth.',
    model: 'aviadtend-blip/magical-pink', // routes to same model for MVP
    version: '7f84b4df7d58f1a406097da9cf729e4e3f8840f0e51657137da9956e1fa1362a',
    triggerWord: 'magicalpink',
    preview: '🌊',
    accentColor: 'from-teal-400 to-cyan-500',
  },
];

/**
 * Get a style by its ID
 */
export function getStyleById(id) {
  return ART_STYLES.find((s) => s.id === id) ?? ART_STYLES[0];
}
