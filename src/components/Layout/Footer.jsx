import footerMobile from "@/assets/footer-mobile.webp";
import footerDesktop from "@/assets/footer-desktop.webp";

/**
 * Reusable site footer with background imagery and link columns.
 * @param {{ onScrollToForm?: () => void }} props
 */
export default function Footer({ onScrollToForm }) {
  return (
    <footer className="relative bg-card border-t border-border overflow-hidden">
      {/* Background image — responsive */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={footerMobile} alt="" className="md:hidden w-full h-full object-cover" />
        <img src={footerDesktop} alt="" className="hidden md:block w-full h-full object-cover" />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="text-a4 text-primary text-glow mb-3">
                Celestial Artworks
              </div>
              <p className="text-body-sm text-muted-foreground mb-2">Transforming birth charts into personalized artwork.</p>
              <p className="text-body-sm text-muted-foreground">📧 hello@celestialartworks.com</p>
              <p className="text-body-sm text-muted-foreground">📞 (555) 123-4567</p>
              <p className="text-body-sm text-muted-foreground/60 mt-1">Mon-Fri 9am-6pm EST</p>
            </div>
            <div>
              <h3 className="text-subtitle text-foreground mb-3">Product</h3>
              <ul className="space-y-1.5 text-body-sm text-muted-foreground">
                <li><button onClick={onScrollToForm} className="hover:text-foreground transition">Create Artwork</button></li>
                <li><a href="#gallery" className="hover:text-foreground transition">Gallery</a></li>
                <li><a href="#faq" className="hover:text-foreground transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-subtitle text-foreground mb-3">Policies</h3>
              <ul className="space-y-1.5 text-body-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-foreground transition">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-foreground transition">Terms and Conditions</a></li>
                <li><a href="/returns" className="hover:text-foreground transition">Returns Policy</a></li>
                <li><a href="/shipping" className="hover:text-foreground transition">Shipping Policy</a></li>
              </ul>
            </div>
            <div className="md:block">
              <h3 className="text-subtitle text-foreground mb-3">Connect</h3>
              <div className="flex gap-3 text-muted-foreground">
                <a href="#" className="hover:text-foreground transition text-body-sm">𝕏</a>
                <a href="#" className="hover:text-foreground transition text-body-sm">📷</a>
                <a href="#" className="hover:text-foreground transition text-body-sm">in</a>
                <a href="#" className="hover:text-foreground transition text-body-sm">▶️</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-body-sm text-center text-muted-foreground">© 2026 Celestial Artworks. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
