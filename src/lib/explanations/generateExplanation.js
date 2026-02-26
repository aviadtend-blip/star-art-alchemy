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
        title: `Sun in ${chartData.sun.sign}`,
        subtitle: "The Heart of Your Piece",
        icon: "☀️",
        explanation: getSunArtistNote(chartData.sun.sign, sunVisuals),
        visualCues: [
          `${sunVisuals.circleDescription}. Botanical elements: ${sunVisuals.botanicals}`,
          getSunSymbolicCue(chartData.sun.sign)
        ],
        meaning: getSunArtistInsight(chartData.sun.sign),
      },
      {
        title: `Moon in ${chartData.moon.sign}`,
        subtitle: "The Mood & Atmosphere",
        icon: "🌙",
        explanation: getMoonArtistNote(chartData.moon.sign, moonVisuals),
        visualCues: [
          `${moonVisuals.circleDescription}. Atmospheric quality: ${moonVisuals.atmosphere}`,
          getMoonSymbolicCue(chartData.moon.sign)
        ],
        meaning: getMoonArtistInsight(chartData.moon.sign),
      },
      {
        title: `${chartData.rising} Rising`,
        subtitle: "The Overall Style & Composition",
        icon: "⬆️",
        explanation: getRisingArtistNote(chartData.rising, risingVisuals),
        visualCues: [
          getRisingVisualCue(chartData.rising),
          getRisingSymbolicCue(chartData.rising)
        ],
        meaning: getRisingArtistInsight(chartData.rising),
      },
      {
        title: `${dominantElement} Dominant`,
        subtitle: "The Color Palette",
        icon: getElementIcon(dominantElement),
        explanation: getElementArtistNote(dominantElement, chartData.element_balance, palette),
        visualCues: [
          getElementalVisualCue(chartData.element_balance, dominantElement),
          `Overall atmosphere: ${palette.description}`
        ],
        meaning: getElementArtistInsight(dominantElement),
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
    'Aries': `Your ${sign} Sun called for something bold at the center — a fierce, blazing sun with sharp rays that feel like they're breaking through the canvas. I surrounded it with red poppies and angular florals to capture that raw, pioneering energy your chart radiates.`,
    'Taurus': `A ${sign} Sun needs weight and warmth, so I anchored the piece with a rich golden sun that feels almost tangible. The lush dahlias and full roses clustered around it were inspired by the abundant, sensual quality your chart carries.`,
    'Gemini': `Your ${sign} Sun is one of the most fun to work with — I used twin suns and paired elements throughout the composition. The butterflies and light, airy florals reflect that quick, curious energy your chart gives off.`,
    'Cancer': `For a ${sign} Sun, I wanted something that feels like a warm embrace. The silvery-white sun sits at the center with soft concentric ripples radiating outward, and the gentle peonies and roses create a sense of shelter and tenderness.`,
    'Leo': `A ${sign} Sun demands center stage — so I gave it exactly that. The radiant golden sun dominates the composition with dramatic, mane-like rays. Bold sunflowers and oversized dahlias arranged in a crown-like pattern echo that natural regality in your chart.`,
    'Virgo': `Your ${sign} Sun inspired the precision you see throughout this piece. Every flower is placed with intention, every wheat stalk aligned just so. The soft honey-golden sun has a quiet elegance — refined rather than loud, exactly like this placement suggests.`,
    'Libra': `A ${sign} Sun is all about harmony, which is why you'll notice the perfect bilateral symmetry in this piece. The rose-gold sun sits center-top, and every floral element on the left is mirrored on the right — that innate sense of balance in your chart guided every placement.`,
    'Scorpio': `Your ${sign} Sun drew me toward depth and intensity. The sun here isn't bright and cheerful — it's a deep burgundy-purple form, almost magnetic. Dark roses and rich magentas surround it, and the shadows aren't accidental — they're essential to capturing the transformative power in your chart.`,
    'Sagittarius': `A ${sign} Sun needs room to breathe, so I built the composition with open horizons and mountain peaks stretching into the distance. The warm orange-gold sun radiates expansively — this placement has a restless, adventurous quality that pushed me to make the piece feel like it extends beyond its borders.`,
    'Capricorn': `Your ${sign} Sun inspired the structured, almost architectural quality of this piece. The golden sun sits at the summit with crystalline precision, and the angular mountain peaks in the background echo that steady, upward climb your chart embodies.`,
    'Aquarius': `A ${sign} Sun breaks every conventional rule, and I leaned into that. The sun uses unexpected patterns and unconventional geometry — nothing here follows a predictable template. Your chart has this visionary, future-facing quality that pushed me to experiment.`,
    'Pisces': `Your ${sign} Sun inspired the most ethereal quality in this piece — the sun seems to glow through a veil of mist and water. I let the edges dissolve intentionally, and the soft florals drift rather than sit rigidly. Your chart has a dreamlike, boundless quality that shaped every brushstroke.`,
  };
  return notes[sign] || `Your ${sign} Sun shaped the central focal point of this piece, inspiring the specific colors and forms you see at the heart of the composition.`;
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
    'Aries': `Your Moon in ${sign} influenced the energetic undercurrent running through the piece. I used bold crescent forms and warm shimmer effects — there's an urgency to the atmosphere that reflects the fast-moving emotional current your chart carries.`,
    'Taurus': `A Moon in ${sign} told me to make the piece feel grounding and lush. The full, warm-toned moon anchors the lower section, and I let garden-like blooms emerge from its surface — your chart's emotional world is rooted in the sensory and the tangible.`,
    'Gemini': `Your ${sign} Moon inspired the shifting, quicksilver quality in the atmosphere. I used multiple moon phases and delicate butterfly motifs — your chart's emotional texture is restless and curious, always catching something new.`,
    'Cancer': `With a Moon in its home sign, I gave it special prominence. The luminous full moon here is one of the most powerful in any chart, and I rendered it with soft protective curves and tidal patterns — your emotional world is deep, intuitive, and fiercely nurturing.`,
    'Leo': `Your ${sign} Moon brought warmth and drama to the emotional layer. The moon glows with a golden, generous quality — heart-shaped forms and regal warmth radiate from it. Your chart's emotional world doesn't hide; it shines.`,
    'Virgo': `A ${sign} Moon shaped the delicate precision in the piece's atmospheric details. The crescent has clean, defined edges, and I wove in hexagonal patterns and subtle herb-like botanicals — your chart processes feeling through careful, thoughtful detail.`,
    'Libra': `Your ${sign} Moon inspired the harmonious quality of the piece's emotional atmosphere. The moon sits in balanced proportion to the sun, with mirror reflections and soft aesthetic proportions — your chart seeks beauty and equilibrium in how it processes feeling.`,
    'Scorpio': `A Moon in ${sign} is one of the most intense placements to translate visually. I used deep shadows and an almost eclipsed moon — dark, layered, magnetic. Your chart's emotional depth demanded that I push past the surface.`,
    'Sagittarius': `Your ${sign} Moon gave the piece its sense of emotional expansiveness. The ascending moon reaches toward stars and distant horizons — your chart's emotional world is restless, philosophical, always searching for meaning in something bigger.`,
    'Capricorn': `A ${sign} Moon brought structure to the emotional layer. The crystalline, geometric moon has almost architectural precision — your chart processes feeling through discipline and composure, and the artwork reflects that steadiness.`,
    'Aquarius': `Your ${sign} Moon inspired the unconventional atmospheric elements. The moon has an unusual configuration with lightning-like zigzags and community-star patterns — your chart's emotional world operates on its own wavelength, and I wanted that to come through.`,
    'Pisces': `A Moon in ${sign} is what inspired the most dreamlike quality in this piece. The moon seems to dissolve into water, its edges blurring and flowing — your chart's emotional world has no hard boundaries, and neither does this element.`,
  };
  return notes[sign] || `Your Moon in ${sign} guided the emotional atmosphere and mood throughout the piece — the textures, the light quality, and the feeling it evokes.`;
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
    'Aries': `Your ${sign} Rising is why this piece feels so dynamic. I used bold, sharp compositional lines and let elements break through the expected frame — ${sign} Rising gives your chart a sense of urgency that demanded an unconventional layout.`,
    'Taurus': `A ${sign} Rising shaped the grounded, substantial feel of the entire piece. Thick botanical details frame everything, and the composition has a weight and presence — your chart's first impression is one of earthy, reliable beauty.`,
    'Gemini': `Your ${sign} Rising inspired the playful, varied detail work throughout. Light asymmetry, paired elements, and a sense of visual conversation between different parts of the composition — your chart presents itself with curiosity and wit.`,
    'Cancer': `A ${sign} Rising is why the overall composition feels protective and embracing. Soft curves and circular framing elements wrap around the central imagery — your chart's first impression is one of warmth and emotional openness.`,
    'Leo': `Your ${sign} Rising gave me permission to be bold with the presentation. Ornate borders, generous negative space, regal framing — the piece is confident in its own beauty because that's exactly what this rising sign projects.`,
    'Virgo': `A ${sign} Rising demanded precision in every detail. Delicate botanical line work, perfect symmetry, and an almost botanical-illustration quality to the rendering — your chart presents itself with quiet, exacting elegance.`,
    'Libra': `Your ${sign} Rising is the reason the overall aesthetic feels so harmonious. Balanced, mirrored elements and elegant Art Nouveau-inspired curves — your chart's first impression is pure grace, and the composition follows that lead.`,
    'Scorpio': `A ${sign} Rising pushed me to add layers and mystery. Deep shadows, hidden details that reveal themselves slowly, and a sense of depth that goes beyond the surface — your chart's first impression draws people in and makes them look closer.`,
    'Sagittarius': `Your ${sign} Rising is why the composition feels so expansive. Directional elements pull the eye outward, and the piece has a sense of movement and adventure — your chart greets the world with openness and optimism.`,
    'Capricorn': `A ${sign} Rising structured the entire composition. Geometric precision, angular forms, and a clear vertical hierarchy — your chart presents itself with authority and dignity, and the artwork's architecture mirrors that.`,
    'Aquarius': `Your ${sign} Rising is why you'll notice unconventional patterns and unexpected geometry throughout. The composition deliberately breaks standard rules — because your chart's first impression is that of someone who thinks differently.`,
    'Pisces': `A ${sign} Rising inspired the soft, ethereal quality of the entire piece. Dissolving edges, boundary-less transitions between elements — your chart greets the world with a dreamlike, open quality that I let flow through the whole composition.`,
  };
  return notes[sign] || `Your ${sign} Rising defined the overall style and compositional approach of the piece — it's the first thing people feel when they see your artwork.`;
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
    'Fire': `With ${count} placements in Fire signs, your chart burns bright — and the color palette follows. I leaned heavily into warm reds, oranges, and golds throughout. The overall energy is passionate and alive, like the piece itself is radiating heat.`,
    'Water': `${count} Water placements gave me a clear direction for the palette — deep blues, purples, and teals that flow through the entire composition. The colors move like currents, never sitting still, creating an emotional depth you can feel.`,
    'Earth': `Your ${count} Earth placements grounded every color choice. Rich greens, warm browns, and natural earth tones anchor the piece with a sense of stability and organic beauty — like something that grew rather than was made.`,
    'Air': `With ${count} Air placements shaping your chart, I chose a palette of light blues, soft whites, and airy pastels. The colors create spaciousness and breathing room — the piece feels open and intellectually alive.`,
  };
  return notes[element] || `Your chart's elemental balance directly guided the color palette and overall energy of the piece.`;
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
