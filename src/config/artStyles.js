// Art style definitions — MVP uses 3 "Cosmic Collage" variants.
// Only "Bold & Vibrant" has a trained LoRA. The other two route to the same model for now.

export const ART_STYLES = [
  {
    id: 'bold-vibrant',
    name: 'Galaxy Bloom — Bold & Vibrant',
    description: 'Rich, saturated layers of celestial imagery with bold textures and warm, vivid tones.',
    model: 'aviadtend-blip/galaxy-bloom',
    triggerWord: 'galaxybloom',
    preview: '🎀',
    accentColor: 'from-pink-400 to-rose-500',
  },
  {
    id: 'minimal-architectural',
    name: 'Stellar Blueprint — Minimal & Architectural',
    description: 'Clean lines, structured composition, and restrained palettes with precise geometric forms.',
    model: 'aviadtend-blip/galaxy-bloom', // routes to same model for MVP
    triggerWord: 'galaxybloom',
    preview: '🏛️',
    accentColor: 'from-slate-400 to-zinc-500',
    popular: true,
  },
  {
    id: 'organic-flowing',
    name: 'Nebula Flow — Organic & Flowing',
    description: 'Fluid, natural forms with soft gradients and gentle movement inspired by water and growth.',
    model: 'aviadtend-blip/galaxy-bloom', // routes to same model for MVP
    triggerWord: 'galaxybloom',
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
