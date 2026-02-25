import { Link } from "react-router-dom";
import footerBg from "@/assets/footer-bg.jpg";
import footerMobileBg from "@/assets/footer-mobile-bg.jpg";

/**
 * Reusable site footer matching Figma design.
 * @param {{ onScrollToForm?: () => void }} props
 */
export default function Footer({ onScrollToForm }) {
  return (
    <footer className="relative bg-black overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={footerMobileBg} alt="" className="md:hidden w-full h-full object-cover" />
        <img src={footerBg} alt="" className="hidden md:block w-full h-full object-cover" />
      </div>

      <div className="relative z-10">
        {/* Top section */}
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-8">
          {/* Left — Brand */}
          <div>
            <Link to="/" className="text-subtitle text-white tracking-[3px] mb-1 hover:opacity-80 transition">CELESTIAL ARTWORKS</Link>
          </div>

          {/* Right — Help */}
          <div>
            <p className="text-subtitle text-white tracking-[2px] mb-4">NEED HELP?</p>
            <p className="text-white/60 mb-3">✦</p>
            <p className="text-body-sm text-white/80 mb-1.5">hello@celestialartworks.com</p>
            <p className="text-body-sm text-white/60 mb-1.5">Available Mon-Fri 9am-6pm EST</p>
            <p className="text-body-sm text-white/80">(555) 123-4567</p>
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-white/15" />
        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Policy links — left */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-white/70">
            <Link to="/privacy" onClick={() => window.scrollTo(0, 0)} className="hover:text-white transition">Privacy Policy</Link>
            <Link to="/terms" onClick={() => window.scrollTo(0, 0)} className="hover:text-white transition">Terms and Conditions</Link>
            <Link to="/returns" onClick={() => window.scrollTo(0, 0)} className="hover:text-white transition">Returns Policy</Link>
            <Link to="/shipping" onClick={() => window.scrollTo(0, 0)} className="hover:text-white transition">Shipping Policy</Link>
          </div>

          {/* Copyright — center */}
          <p className="text-body-sm text-white/50">© 2026 Celestial Artworks</p>

          {/* Social icons — right */}
          <div className="flex items-center gap-5 text-white/70">
            <a href="#" aria-label="X" className="hover:text-white transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-white transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="#" aria-label="LinkedIn" className="hover:text-white transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="#" aria-label="YouTube" className="hover:text-white transition">
              <svg width="20" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
