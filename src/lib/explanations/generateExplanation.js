import { CONCRETE_SUN_VISUALS, CONCRETE_MOON_VISUALS, CONCRETE_RISING_VISUALS, CONCRETE_ELEMENT_PALETTES } from '@/data/concreteVisualPrompts';

export function generateChartExplanation(chartData) {
  const sunVisuals = CONCRETE_SUN_VISUALS[chartData.sun.sign];
  const moonVisuals = CONCRETE_MOON_VISUALS[chartData.moon.sign];
  const risingVisuals = CONCRETE_RISING_VISUALS[chartData.rising];

  const dominantElement = getDominantElement(chartData.element_balance);
  const palette = CONCRETE_ELEMENT_PALETTES[dominantElement + '-dominant'];

  return {
    overview: `Every visual choice in this piece was inspired by your birth chart — from the flowers and colors to the composition and mood.`,

    elements: [
      {
        chartElement: `Sun in ${chartData.sun.sign}, House ${chartData.sun.house}`,
        artworkElement: getSunArtworkElement(chartData.sun.sign),
        icon: "☀️",
        explanation: getSunArtistNote(chartData.sun.sign, sunVisuals),
      },
      {
        chartElement: `Moon in ${chartData.moon.sign}, House ${chartData.moon.house}`,
        artworkElement: getMoonArtworkElement(chartData.moon.sign),
        icon: "🌙",
        explanation: getMoonArtistNote(chartData.moon.sign, moonVisuals),
      },
      {
        chartElement: `${chartData.rising} Rising`,
        artworkElement: getRisingArtworkElement(chartData.rising),
        icon: "⬆️",
        explanation: getRisingArtistNote(chartData.rising, risingVisuals),
      },
      {
        chartElement: `${dominantElement} Dominant`,
        artworkElement: getElementArtworkElement(dominantElement),
        icon: getElementIcon(dominantElement),
        explanation: getElementArtistNote(dominantElement, chartData.element_balance, palette),
      }
    ]
  };
}

function getDominantElement(elementBalance) {
  return Object.keys(elementBalance).reduce((a, b) =>
    elementBalance[a] > elementBalance[b] ? a : b
  );
}

function getElementIcon(element) {
  const icons = { 'Fire': '🔥', 'Water': '💧', 'Earth': '🌍', 'Air': '💨' };
  return icons[element] || '✨';
}

// ─── SUN: Artist's note on the central focal point ───

function getSunArtistNote(sign, visuals) {
  const notes = {
    'Aries': `Your ${sign} Sun blazes at the center — fierce rays and red poppies that refuse to be ignored.`,
    'Taurus': `A golden sun anchored in lush dahlias and roses. Your ${sign} Sun demanded something you could almost touch.`,
    'Gemini': `Twin suns and paired elements throughout — your ${sign} Sun's restless duality made visible.`,
    'Cancer': `A luminous sun wrapped in soft concentric ripples. Your ${sign} Sun turns the whole piece into a warm embrace.`,
    'Leo': `Your ${sign} Sun commands center stage — dramatic golden rays with a crown of bold sunflowers.`,
    'Virgo': `Every petal placed with quiet intention. Your ${sign} Sun speaks through precision, not volume.`,
    'Libra': `Rose-gold sun, perfect bilateral symmetry. Your ${sign} Sun wouldn't settle for anything less than harmony.`,
    'Scorpio': `Deep burgundy-purple at the core, pulling you in. Your ${sign} Sun doesn't radiate — it magnetizes.`,
    'Sagittarius': `A warm orange-gold sun reaching past open horizons. Your ${sign} Sun needed room to roam.`,
    'Capricorn': `Golden sun at the summit, crystalline and precise. Your ${sign} Sun climbs — the artwork follows.`,
    'Aquarius': `Unconventional geometry, nothing predictable. Your ${sign} Sun breaks every rule on purpose.`,
    'Pisces': `The sun glows through mist and water, edges dissolving. Your ${sign} Sun exists between worlds.`,
  };
  return notes[sign] || `Your ${sign} Sun shaped the heart of this piece.`;
}

function getSunArtistInsight(sign) {
  const insights = {
    'Aries': `I wanted the viewer's eye to hit that fiery center immediately — the same way an Aries enters a room. Those sharp, angular florals aren't decoration; they're the visual translation of breakthrough energy.`,
    'Taurus': `The abundance of botanicals here is deliberate — a Taurus Sun builds beauty through layering, through richness. Every petal adds to the sense of something lasting and valuable.`,
    'Gemini': `The duality running through this piece is the key creative choice. Where most charts get one sun, yours got two — and that playful twin energy ripples through every paired element you spot.`,
    'Cancer': `Those soft, concentric circles radiating from the center are my favorite detail — they create a visual sense of protection, like the piece itself is a safe space. That's what Cancer Sun energy feels like to translate visually.`,
    'Leo': `I deliberately gave the sun more canvas space than usual — about 35-40% of the entire composition. A Leo Sun shouldn't share the spotlight. The generous scale is the point.`,
    'Virgo': `The restraint in this piece is intentional. Where other charts get bold, dramatic suns, yours has a quieter elegance — because a Virgo Sun's power is in the details, not the volume.`,
    'Libra': `If you fold this piece in half mentally, it should feel nearly identical on both sides. That symmetry was the hardest creative challenge — and the most rewarding, because it's exactly what this placement demands.`,
    'Scorpio': `I placed the sun lower and darker than typical — almost like it's pulling you in rather than radiating outward. That magnetic, inward intensity is what makes Scorpio Sun pieces so visually distinct.`,
    'Sagittarius': `The sense of distance in this piece — mountains fading into horizon — that's the Sagittarius influence. I wanted it to feel like there's always more to explore beyond the frame.`,
    'Capricorn': `The vertical structure here — sun at the summit, angular forms building upward — creates a visual narrative of ascent. That deliberate, step-by-step rise is the Capricorn Sun story.`,
    'Aquarius': `You might notice the composition doesn't follow the golden ratio or typical centering — that's intentional. An Aquarius Sun resists convention, and the artwork should too.`,
    'Pisces': `The way the boundaries dissolve at the edges is my favorite part. Most artwork has clear borders — a Pisces Sun piece should feel like it's melting into something larger than itself.`,
  };
  return insights[sign] || `The way the sun element is positioned and rendered was directly guided by what your ${sign} placement brings to the chart.`;
}

// ─── MOON: Artist's note on mood and emotional texture ───

function getMoonArtistNote(sign, visuals) {
  const notes = {
    'Aries': `Bold crescents and warm shimmer — your ${sign} Moon keeps the emotional undercurrent restless and alive.`,
    'Taurus': `A full, warm moon anchored in blooming botanicals. Your ${sign} Moon roots feeling in something you can almost smell.`,
    'Gemini': `Multiple moon phases and quicksilver light. Your ${sign} Moon never settles on one feeling for long.`,
    'Cancer': `The Moon in its home sign — luminous, protective, tidal. I gave it the prominence your chart demands.`,
    'Leo': `Golden glow and heart-shaped warmth radiating outward. Your ${sign} Moon doesn't whisper — it shines.`,
    'Virgo': `Clean crescent edges with hexagonal patterns woven in. Your ${sign} Moon processes feeling with quiet care.`,
    'Libra': `The moon sits in perfect proportion to the sun — mirror-balanced. Your ${sign} Moon seeks beauty in equilibrium.`,
    'Scorpio': `Deep shadows, an almost-eclipsed moon. Your ${sign} Moon demanded I push past the surface into the dark.`,
    'Sagittarius': `An ascending moon reaching toward distant stars. Your ${sign} Moon is always searching for something bigger.`,
    'Capricorn': `Crystalline, geometric moon with architectural precision. Your ${sign} Moon holds everything together — steady and strong.`,
    'Aquarius': `Lightning zigzags and unusual configurations. Your ${sign} Moon operates on its own wavelength entirely.`,
    'Pisces': `The moon dissolves into water, edges blurring. Your ${sign} Moon has no hard boundaries — and neither does this.`,
  };
  return notes[sign] || `Your Moon in ${sign} shaped the mood and atmosphere throughout.`;
}

function getMoonArtistInsight(sign) {
  const insights = {
    'Aries': `The heat shimmer effect near the moon was a deliberate choice — I wanted the emotional layer to feel alive and restless, like it could shift at any moment. That's the Aries Moon energy speaking.`,
    'Taurus': `I spent extra time on the botanical details blooming from the lunar surface. A Taurus Moon needs to feel like something you could almost touch and smell — sensory richness is the whole point.`,
    'Gemini': `The twin moon motif was one of my favorite creative decisions here. It captures that constant mental dialogue — two perspectives, two feelings, always in conversation with each other.`,
    'Cancer': `Cancer is the Moon's own sign, so I treated it like the emotional anchor of the entire piece. The tidal pool patterns and shell-like curves create a sense of emotional home — which is exactly what this placement craves.`,
    'Leo': `The golden glow from the moon is warmer than most — intentionally. A Leo Moon's emotional expression is generous and theatrical, and I wanted that warmth to physically radiate across the composition.`,
    'Virgo': `The hexagonal patterns integrated into the moon are subtle but intentional — they represent the way a Virgo Moon organizes feeling into something useful. There's care in the precision.`,
    'Libra': `The mirror-reflection quality near the moon creates a visual sense of emotional equilibrium. A Libra Moon needs balance in the feeling space — and if you look closely, the symmetry is most precise around this element.`,
    'Scorpio': `I deliberately made the moon the most visually complex element — layers upon layers, shadows hiding details. A Scorpio Moon reveals its depth only to those who really look. The artwork does the same.`,
    'Sagittarius': `The upward arc of the moon — almost like it's mid-journey — captures the Sagittarius emotional restlessness. It's reaching for something just out of frame, and I wanted that sense of longing to be felt.`,
    'Capricorn': `The geometric structure of the moon is the quiet backbone of the piece. A Capricorn Moon holds everything together — composed, steady, strong. It's not the flashiest element, but try removing it and the whole piece falls apart.`,
    'Aquarius': `The lightning patterns and unusual configuration around the moon are meant to surprise. A conventional moon for an Aquarius placement would have been a lie — your chart's emotional circuitry is beautifully unconventional.`,
    'Pisces': `The dissolving edges of the moon are the most technically challenging element in the piece — making something feel like it's simultaneously there and not there. That liminal quality is pure Pisces Moon.`,
  };
  return insights[sign] || `The mood and emotional texture throughout the piece were directly shaped by your ${sign} Moon — it's the undercurrent you feel when you look at the artwork as a whole.`;
}

// ─── RISING: Artist's note on overall style and composition ───

function getRisingArtistNote(sign, visuals) {
  const notes = {
    'Aries': `Sharp compositional lines breaking the frame — your ${sign} Rising gives this piece its raw, forward-charging feel.`,
    'Taurus': `Thick botanicals frame everything with weight and presence. Your ${sign} Rising grounds the entire composition.`,
    'Gemini': `Playful asymmetry and paired elements in visual conversation. Your ${sign} Rising keeps the eye dancing.`,
    'Cancer': `Soft curves wrap protectively around the center. Your ${sign} Rising turns the whole piece into a warm shelter.`,
    'Leo': `Ornate borders, generous space, regal framing. Your ${sign} Rising gave me permission to be bold.`,
    'Virgo': `Delicate line work and botanical-illustration precision. Your ${sign} Rising rewards anyone who looks closely.`,
    'Libra': `Mirrored elements and sweeping Art Nouveau curves. Your ${sign} Rising is pure effortless grace.`,
    'Scorpio': `Hidden details that reveal themselves slowly, shadows with purpose. Your ${sign} Rising draws you in deeper.`,
    'Sagittarius': `The composition pulls outward toward open horizons. Your ${sign} Rising points toward the next adventure.`,
    'Capricorn': `Angular forms and clear vertical hierarchy — almost architectural. Your ${sign} Rising builds upward with authority.`,
    'Aquarius': `The composition breaks standard rules on purpose. Your ${sign} Rising thinks differently — so does this piece.`,
    'Pisces': `Dissolving edges, boundary-less transitions. Your ${sign} Rising lets everything flow into everything else.`,
  };
  return notes[sign] || `Your ${sign} Rising shaped the overall style and composition.`;
}

function getRisingArtistInsight(sign) {
  const insights = {
    'Aries': `The compositional energy here is deliberately off-balance — tilted forward, pushing outward. That "about to leap" feeling? That's your Rising sign making its entrance.`,
    'Taurus': `I used heavier, more textured elements in the framing than I typically would. A Taurus Rising needs the artwork to feel like it has physical presence — like you could reach out and feel the surface.`,
    'Gemini': `If you notice your eye jumping between different elements rather than settling on one, that's by design. A Gemini Rising keeps things moving, and the composition invites exploration rather than meditation.`,
    'Cancer': `The circular, nest-like quality of the overall framing is the Rising sign's signature. Everything curves inward slightly, creating a visual sense of home — welcoming, safe, and deeply personal.`,
    'Leo': `The generous empty space around the central elements is intentional — a Leo Rising needs breathing room to command attention. Crowding it would have contradicted everything your chart projects.`,
    'Virgo': `The level of fine detail in the border and framing elements is noticeably higher than usual. A Virgo Rising rewards close inspection, and I wanted the craftsmanship itself to be part of the story.`,
    'Libra': `The Art Nouveau influence is strongest in the framing — those elegant, sweeping curves that guide the eye evenly across both halves. A Libra Rising creates a first impression of effortless beauty.`,
    'Scorpio': `I layered elements so that new details emerge the longer you look. A Scorpio Rising doesn't reveal everything at once — there's always something deeper underneath, and the artwork reflects that.`,
    'Sagittarius': `The composition pulls outward from center — away from the expected, toward the edges and beyond. A Sagittarius Rising is always pointing toward the next adventure, and the piece captures that restless, optimistic pull.`,
    'Capricorn': `The vertical structure and upward momentum in the composition create an almost architectural quality. A Capricorn Rising projects competence and ambition — the artwork is built, not just painted.`,
    'Aquarius': `You might feel like the composition "shouldn't work" by traditional standards — and yet it does. That's the Aquarius Rising influence: breaking expectations while creating something that feels inevitable.`,
    'Pisces': `The way elements bleed into each other without hard borders is the Rising sign's gift to the piece. A Pisces Rising doesn't draw lines between self and world — and neither does this artwork.`,
  };
  return insights[sign] || `The compositional approach and overall aesthetic were directly shaped by your ${sign} Rising — it's the artistic "first impression" of the piece.`;
}

// ─── ELEMENT: Artist's note on color palette ───

function getElementArtistNote(element, balance, palette) {
  const count = balance[element];
  const notes = {
    'Fire': `${count} Fire placements — the whole palette burns with reds, oranges, and golds. Pure heat made visible.`,
    'Water': `${count} Water placements flowing through in deep blues, purples, and teals. The colors move like currents.`,
    'Earth': `${count} Earth placements grounding everything in rich greens and warm browns. It feels grown, not painted.`,
    'Air': `${count} Air placements opening the palette into soft blues, whites, and airy pastels. The piece breathes.`,
  };
  return notes[element] || `Your chart's elemental balance shaped the entire color palette.`;
}

function getElementArtistInsight(element) {
  const insights = {
    'Fire': `The warm tones aren't just in the focal points — they tint everything, even the shadows. When a chart is Fire-dominant, the entire world of the artwork needs to feel lit from within.`,
    'Water': `I let the colors transition without hard edges — blues melting into purples, teals fading into indigo. A Water-dominant chart needs the palette itself to flow, not just the forms.`,
    'Earth': `The palette here feels more grounded and natural than most pieces. I avoided anything too electric or artificial — an Earth-dominant chart deserves colors that feel like they belong in the natural world.`,
    'Air': `Notice how much light gets through the composition? That airiness in the palette is deliberate — an Air-dominant chart needs the colors themselves to feel spacious and intellectually clear.`,
  };
  return insights[element] || `The color relationships throughout the piece were guided by your chart's elemental balance.`;
}

// ─── Supporting lookup functions (used by visualCues, not shown to user directly) ───

function getSunSymbolicCue(sign) {
  const cues = {
    'Aries': 'Ram horn V-shapes, forward-thrusting energy, breakthrough patterns',
    'Taurus': 'Crescent horn curves, botanical abundance, garden imagery',
    'Gemini': 'Twin elements, paired patterns, communication symbols (birds, butterflies)',
    'Cancer': 'Shell-like protective curves, tidal patterns, nest formations',
    'Leo': 'Crown formations, pride rock positioning, regal emblems',
    'Virgo': 'Wheat stalks, hexagonal patterns, healing herbs',
    'Libra': 'Scales balance, mirrored forms, golden mean proportions',
    'Scorpio': 'Scorpion tail S-curves, phoenix transformation, serpent spirals',
    'Sagittarius': 'Arrow patterns, centaur bow arcs, adventure pathways',
    'Capricorn': 'Mountain peaks, stair-step ascension, crystalline structures',
    'Aquarius': 'Lightning bolts, water-bearer waves, futuristic geometry',
    'Pisces': 'Two fish forms, infinity symbols (∞), dissolving boundaries'
  };
  return cues[sign] || 'Symbolic solar imagery';
}

function getMoonSymbolicCue(sign) {
  const cues = {
    'Aries': 'Heat shimmer, ram horn edges, warrior spirit energy',
    'Taurus': 'Sensual curves, garden blooming from lunar surface',
    'Gemini': 'Twin moons, butterfly wings, mental curiosity patterns',
    'Cancer': 'Shell protection, crab carapace markings, tidal pools',
    'Leo': 'Heart shapes, regal warmth, generous emotional glow',
    'Virgo': 'Wheat integration, hexagonal patterns, healing herb garden',
    'Libra': 'Mirror reflections, scales symbolism, aesthetic proportions',
    'Scorpio': 'Scorpion tail curve, phoenix phases, serpent coiling',
    'Sagittarius': 'Arrows to stars, centaur quest, adventure pathways',
    'Capricorn': 'Mountain framing, goat climb positioning, Saturn rings',
    'Aquarius': 'Water-bearer waves, lightning zigzags, community stars',
    'Pisces': 'Two fish swimming opposite, infinity flow, Neptune trident'
  };
  return cues[sign] || 'Lunar symbolic patterns';
}

function getRisingVisualCue(sign) {
  const cues = {
    'Aries': 'Bold, sharp lines and dynamic composition breaking through frame',
    'Taurus': 'Thick botanical details and grounded, substantial feel',
    'Gemini': 'Light, varied details with playful asymmetry and paired elements',
    'Cancer': 'Soft curves and protective circular framing with shell motifs',
    'Leo': 'Ornate, confident presentation with generous space and regal borders',
    'Virgo': 'Delicate botanical line work with perfect symmetry',
    'Libra': 'Balanced, mirrored elements with elegant Art Nouveau curves',
    'Scorpio': 'Deep shadows and mysterious layered details with hidden elements',
    'Sagittarius': 'Expansive composition with adventurous directional elements',
    'Capricorn': 'Geometric, structured details with angular mountain forms',
    'Aquarius': 'Unconventional patterns and innovative geometric design',
    'Pisces': 'Soft, dissolving edges with ethereal, boundary-less quality'
  };
  return cues[sign] || 'Distinctive aesthetic presentation';
}

function getRisingSymbolicCue(sign) {
  const cues = {
    'Aries': 'Ram horns in borders, breakthrough energy, forward thrust',
    'Taurus': 'Bull strength in borders, botanical abundance framing',
    'Gemini': 'Communication symbols (birds, butterflies), dual framing',
    'Cancer': 'Protective shells, nest-like borders, tidal wave patterns',
    'Leo': 'Crown formations, throne-like frames, mane flourishes',
    'Virgo': 'Wheat borders, hexagonal patterns, harvest field organization',
    'Libra': 'Scales balance, mirrored symmetry, justice symbolism',
    'Scorpio': 'Scorpion tail curves, phoenix rising, serpent spirals in borders',
    'Sagittarius': 'Arrows in borders, centaur bow arcs, distant horizons',
    'Capricorn': 'Mountain peaks, ascending stairs, sea-goat duality',
    'Aquarius': 'Water-bearer waves, lightning bolts, futuristic frames',
    'Pisces': 'Two fish in borders, infinity symbols, dissolving boundaries'
  };
  return cues[sign] || 'Symbolic framing elements';
}

function getElementalVisualCue(elementBalance, dominantElement) {
  const balance = Object.entries(elementBalance)
    .map(([el, count]) => `${el}: ${count}`)
    .join(', ');

  const cues = {
    'Fire': `Warm reds, oranges, and golds dominate throughout (${balance})`,
    'Water': `Cool blues, purples, and teals flow throughout (${balance})`,
    'Earth': `Natural greens, browns, and earth tones ground the piece (${balance})`,
    'Air': `Light blues, whites, and airy pastels create spaciousness (${balance})`
  };
  return cues[dominantElement] || `Balanced elemental expression (${balance})`;
}
