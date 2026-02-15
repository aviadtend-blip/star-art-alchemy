// Canonical astrological visual definitions for artwork generation
// Maps zodiac signs, planets, houses to visual attributes

export const zodiacSigns = {
  aries: { symbol: "♈", element: "fire", color: "crimson", motif: "ram horns, sparks, jagged lines" },
  taurus: { symbol: "♉", element: "earth", color: "emerald", motif: "bull, rolling hills, blooming flowers" },
  gemini: { symbol: "♊", element: "air", color: "amber", motif: "twins, mirrors, butterflies" },
  cancer: { symbol: "♋", element: "water", color: "silver", motif: "crescent moon, shells, ocean waves" },
  leo: { symbol: "♌", element: "fire", color: "gold", motif: "lion, sunburst, crown" },
  virgo: { symbol: "♍", element: "earth", color: "sage", motif: "wheat stalks, maiden, intricate patterns" },
  libra: { symbol: "♎", element: "air", color: "rose", motif: "scales, symmetry, feathers" },
  scorpio: { symbol: "♏", element: "water", color: "obsidian", motif: "scorpion, phoenix, deep water" },
  sagittarius: { symbol: "♐", element: "fire", color: "violet", motif: "centaur, arrow, starfield" },
  capricorn: { symbol: "♑", element: "earth", color: "charcoal", motif: "mountain goat, peaks, ancient stone" },
  aquarius: { symbol: "♒", element: "air", color: "electric blue", motif: "water bearer, lightning, networks" },
  pisces: { symbol: "♓", element: "water", color: "seafoam", motif: "twin fish, nebula, dissolving forms" },
};

export const planets = {
  sun: { symbol: "☉", domain: "identity, vitality", visualWeight: "dominant" },
  moon: { symbol: "☽", domain: "emotions, intuition", visualWeight: "prominent" },
  mercury: { symbol: "☿", domain: "communication, thought", visualWeight: "subtle" },
  venus: { symbol: "♀", domain: "love, beauty", visualWeight: "moderate" },
  mars: { symbol: "♂", domain: "drive, passion", visualWeight: "moderate" },
  jupiter: { symbol: "♃", domain: "expansion, wisdom", visualWeight: "prominent" },
  saturn: { symbol: "♄", domain: "structure, discipline", visualWeight: "prominent" },
  uranus: { symbol: "♅", domain: "innovation, rebellion", visualWeight: "subtle" },
  neptune: { symbol: "♆", domain: "dreams, mysticism", visualWeight: "subtle" },
  pluto: { symbol: "♇", domain: "transformation, power", visualWeight: "subtle" },
};

export const elements = {
  fire: { palette: ["crimson", "gold", "orange"], texture: "dynamic, flickering, luminous" },
  earth: { palette: ["emerald", "brown", "sage"], texture: "grounded, textured, organic" },
  air: { palette: ["sky blue", "lavender", "white"], texture: "ethereal, wispy, transparent" },
  water: { palette: ["deep blue", "silver", "seafoam"], texture: "flowing, reflective, deep" },
};

export const aspects = {
  conjunction: { angle: 0, nature: "fusion", visual: "overlapping, merged forms" },
  sextile: { angle: 60, nature: "harmony", visual: "gentle connecting lines" },
  square: { angle: 90, nature: "tension", visual: "sharp angles, fractures" },
  trine: { angle: 120, nature: "flow", visual: "smooth curves, golden ratio spirals" },
  opposition: { angle: 180, nature: "polarity", visual: "mirror images, duality" },
};
