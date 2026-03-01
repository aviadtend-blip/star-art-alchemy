import { Link } from 'react-router-dom';
import logo from '@/assets/logo-horizontal.svg';

/**
 * Reusable site header / navigation bar.
 * variant="dark" → solid dark background with inverted (white) logo.
 * Default → transparent overlay for hero sections.
 */
export default function Header({ variant }) {
  const isDark = variant === 'dark';

  return (
    <nav
      className="flex items-center justify-between"
      style={{
        backgroundColor: isDark ? '#121212' : 'transparent',
        padding: isDark ? '26px 30px' : undefined,
        ...(isDark ? {} : { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, padding: '20px 24px' }),
      }}
    >
      <Link to="/" className="hover:opacity-80 transition">
        <img
          src={logo}
          alt="Celestial Artworks"
          className="w-[155px] md:w-[170px] h-auto"
          style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
        />
      </Link>
      <button className={`${isDark ? 'text-white/70 hover:text-white' : 'text-body-sm text-foreground/70 hover:text-foreground'} transition`}>
        {isDark ? (
          <div className="space-y-1.5">
            <div className="w-6 h-0.5 bg-current" />
            <div className="w-6 h-0.5 bg-current" />
          </div>
        ) : 'Login'}
      </button>
    </nav>
  );
}
