/**
 * Reusable site header / navigation bar.
 * Absolutely positioned so it overlays hero sections.
 */
export default function Header() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-30 py-5 px-6 md:px-10 flex items-center justify-between">
      <div className="text-a4 text-foreground">
        Celestial Artworks
      </div>
      <button className="text-body-sm text-foreground/70 hover:text-foreground transition">Login</button>
    </nav>
  );
}
