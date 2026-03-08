import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PAGES = [
  { path: '/', label: '🏠 Landing' },
  { path: '/generate/style', label: '🎨 Style Selection' },
  { path: '/generate/loading', label: '⏳ Loading' },
  { path: '/generate/preview', label: '🖼 Artwork Preview' },
  { path: '/generate/size', label: '📐 Size Selection' },
  { path: '/order-confirmation', label: '✅ Order Confirmation' },
  { path: '/shipping', label: '📦 Shipping Policy' },
  { path: '/privacy', label: '🔒 Privacy Policy' },
  { path: '/terms', label: '📄 Terms & Conditions' },
  { path: '/returns', label: '↩️ Returns Policy' },
];

export default function DevNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
              onClick={() => { navigate(p.path); setOpen(false); }}
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
