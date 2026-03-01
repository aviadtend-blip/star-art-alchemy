import { Link } from 'react-router-dom';
import logo from '@/assets/logo-horizontal.svg';

/**
 * Reusable site header / navigation bar.
 * Absolutely positioned so it overlays hero sections.
 */
export default function Header() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-30 py-5 px-6 md:px-10 flex items-center justify-between">
      <Link to="/" className="hover:opacity-80 transition">
        <img src={logo} alt="Celestial Artworks" className="w-[155px] md:w-[170px] h-auto" />
      </Link>
      <button className="text-body-sm text-foreground/70 hover:text-foreground transition">Login</button>
    </nav>
  );
}
