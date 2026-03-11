import { forwardRef } from 'react';
import { Link } from "react-router-dom";
import footerBg from "@/assets/footer-bg.jpg";
import footerMobileBg from "@/assets/footer-mobile-bg.jpg";
import logo from "@/assets/logo-horizontal.svg";

/**
 * Reusable site footer matching Figma design.
 * @param {{ onScrollToForm?: () => void }} props
 */
const Footer = forwardRef(function Footer({ onScrollToForm }, ref) {
  return (
    <footer ref={ref} className="relative bg-black overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={footerMobileBg} alt="" className="md:hidden w-full h-full object-cover" loading="lazy" />
        <img src={footerBg} alt="" className="hidden md:block w-full h-full object-cover" loading="lazy" />
      </div>

      <div className="relative z-10">
        {/* Top section */}
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-8">
          {/* Left — Brand */}
          <div>
            <Link to="/" className="hover:opacity-80 transition">
              <img src={logo} alt="Celestial Artworks" width={170} height={28} className="w-[155px] md:w-[170px] h-auto brightness-0 invert" />
            </Link>
          </div>

          {/* Right — Help */}
          <div>
            <p className="text-subtitle text-white tracking-[2px] mb-4">NEED HELP?</p>
            
            <p className="text-body-sm text-white/80 mb-1.5">hello@celestialartworks.com</p>
            <p className="text-body-sm text-white/60 mb-1.5">Available Mon-Fri 9am-6pm EST</p>
            <p className="text-body-sm text-white/80">(+1) 407-768-4186</p>
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

        </div>
      </div>
    </footer>
  );
});

export default Footer;
