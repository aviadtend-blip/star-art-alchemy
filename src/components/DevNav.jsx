import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGenerator } from '@/contexts/GeneratorContext';
import demoImage from '@/assets/gallery/demo-cosmic-collision.webp';

const PAGES = [
  { path: '/', label: '🏠 Landing', needsContext: false },
  { path: '/generate/style', label: '🎨 Style Selection', needsContext: true },
  { path: '/generate/loading', label: '⏳ Loading', needsContext: true },
  { path: '/generate/preview', label: '🖼 Artwork Preview', needsContext: true },
  { path: '/generate/size', label: '📐 Size Selection', needsContext: true },
  { path: '/order-confirmation', label: '✅ Order Confirmation', needsContext: true },
  { path: '/shipping', label: '📦 Shipping Policy', needsContext: false },
  { path: '/privacy', label: '🔒 Privacy Policy', needsContext: false },
  { path: '/terms', label: '📄 Terms & Conditions', needsContext: false },
  { path: '/returns', label: '↩️ Returns Policy', needsContext: false },
];

const MOCK_CHART_DATA = {
  sun: { sign: 'Pisces', house: 10, degree: 12 },
  moon: { sign: 'Scorpio', house: 5, degree: 8 },
  rising: { sign: 'Leo', degree: 22 },
  mercury: { sign: 'Aquarius', house: 9, degree: 15 },
  venus: { sign: 'Aries', house: 11, degree: 3 },
  mars: { sign: 'Capricorn', house: 6, degree: 27 },
  jupiter: { sign: 'Gemini', house: 11, degree: 19 },
  saturn: { sign: 'Pisces', house: 8, degree: 5 },
  elements: { Fire: 3, Water: 4, Earth: 2, Air: 3 },
  modalities: { Cardinal: 3, Fixed: 4, Mutable: 5 },
  dominantElement: 'Water',
  aspects: [
    { planet1: 'Sun', planet2: 'Moon', type: 'Trine', orb: 1.2 },
    { planet1: 'Venus', planet2: 'Mars', type: 'Square', orb: 2.8 },
  ],
};

const MOCK_FORM_DATA = {
  name: 'Test User',
  birthMonth: '3',
  birthDay: '2',
  birthYear: '1995',
  birthCity: 'New York',
  birthCountry: 'US',
  lat: 40.7128,
  lng: -74.006,
};

const MOCK_ANALYSIS = {
  title: 'Your Cosmic Blueprint',
  description: 'A vivid tapestry of water and fire elements creates a dynamic tension in your chart.',
  hotspots: [
    { id: 1, emoji: '☀️', placement: 'Pisces Sun', theme: 'Dreamy Intuition', paragraph1: 'The swirling aquamarine forms at the center represent your Pisces Sun — fluid, empathetic, deeply creative.', paragraph2: 'Notice how the colors blend without hard edges, mirroring your ability to dissolve boundaries.' },
    { id: 2, emoji: '🌙', placement: 'Scorpio Moon', theme: 'Emotional Depth', paragraph1: 'Deep crimson and obsidian textures emerge from the lower composition, channeling your Scorpio Moon\'s intensity.', paragraph2: 'These darker tones suggest hidden emotional reservoirs and transformative inner power.' },
    { id: 3, emoji: '⬆️', placement: 'Leo Rising', theme: 'Radiant Presence', paragraph1: 'Golden rays burst outward from the composition\'s crown, embodying your Leo Rising\'s magnetic charisma.', paragraph2: 'This luminous energy draws the eye immediately — just as you naturally command attention.' },
    { id: 4, emoji: '♂️', placement: 'Capricorn Mars', theme: 'Disciplined Drive', paragraph1: 'Structured geometric forms anchor the base, reflecting your Capricorn Mars\'s methodical ambition.', paragraph2: 'Stone-like textures and angular shapes speak to your grounded, persistent approach to goals.' },
  ],
};

export default function DevNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const {
    setFormData, setChartData, setGeneratedImage,
    setArtworkAnalysis, setGenerationComplete, setArtworkId,
  } = useGenerator();

  const seedContext = () => {
    setFormData(MOCK_FORM_DATA);
    setChartData(MOCK_CHART_DATA);
    setGeneratedImage(demoImage);
    setArtworkAnalysis(MOCK_ANALYSIS);
    setGenerationComplete(true);
    setArtworkId('test-artwork-id');
  };

  const handleNav = (page) => {
    if (page.needsContext) seedContext();
    navigate(page.path);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {open && (
        <div
          className="mb-2 rounded-xl shadow-2xl border overflow-hidden"
          style={{
            background: 'rgba(20,20,20,0.95)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(255,255,255,0.1)',
            minWidth: 220,
          }}
        >
          <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="text-xs font-bold tracking-wider" style={{ color: '#FE6781' }}>DEV NAVIGATION</span>
          </div>
          {PAGES.map((p) => (
            <button
              key={p.path}
              onClick={() => handleNav(p)}
              className="block w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10"
              style={{
                color: pathname === p.path ? '#FE6781' : '#fff',
                fontWeight: pathname === p.path ? 600 : 400,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-lg transition-transform hover:scale-110"
        style={{ background: '#FE6781', color: '#fff' }}
      >
        {open ? '✕' : '🧭'}
      </button>
    </div>
  );
}
