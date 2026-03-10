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
      className="flex items-center justify-center md:justify-between"
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
          width={170}
          height={28}
          className="w-[155px] md:w-[170px] h-auto"
          style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
        />
      </Link>
    </nav>
  );
}
