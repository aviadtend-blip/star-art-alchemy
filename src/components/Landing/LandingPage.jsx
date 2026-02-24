import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroMobile from "@/assets/hero-mobile.webp";
import heroDesktop from "@/assets/hero-desktop.webp";
import capricornWall from "@/assets/gallery/capricorn-wall.jpg";
import taurusArtwork from "@/assets/gallery/taurus-artwork.jpg";
import womanHolding from "@/assets/gallery/woman-holding.jpg";
import galaxyBg from "@/assets/galaxy-bg.jpg";
import saturnPlanet from "@/assets/gallery/saturn-planet.jpg";
import canvasDetail from "@/assets/gallery/canvas-detail.jpg";
import libraWall from "@/assets/gallery/libra-wall.jpg";
import virgoArtwork from "@/assets/gallery/virgo-artwork.jpg";
import gallery2 from "@/assets/gallery/example-2.jpg";
import gallery3 from "@/assets/gallery/example-3.jpg";
import moonSurface from "@/assets/gallery/moon-surface.jpg";
import earthSpace from "@/assets/gallery/earth-space.jpg";
import capricornGallery from "@/assets/gallery/capricorn-gallery.jpg";
import taurusExample from "@/assets/gallery/taurus-example.jpg";
import ProgressBar from "@/components/ui/ProgressBar";
import InteractiveHotspots from "./InteractiveHotspots";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import GalleryTile from "./GalleryTile";

/* ─── Static data ─── */

const reviews = [
  {
    initials: "SJ", name: "Sarah J.", signs: "Capricorn Sun, Pisces Moon",
    text: '"I was blown away by how accurate the symbolism was. The mountain representing my Capricorn sun is stunning!"',
    badge: "Verified Buyer",
  },
  {
    initials: "MR", name: "Michael R.", signs: "Leo Sun, Aquarius Moon",
    text: '"This is the most meaningful piece of art I own. Everyone asks about it when they visit!"',
    badge: "Verified Buyer",
  },
  {
    initials: "AL", name: "Amanda L.", signs: "Virgo Sun, Cancer Moon",
    text: '"Bought one for myself and immediately ordered two more as gifts. The quality is exceptional."',
    badge: "Verified Buyer",
  },
];

const faqs = [
  { q: "Is the preview really free?", a: "Yes! You can generate and preview your artwork completely free with no credit card required. You only pay if you decide to purchase the canvas print." },
  { q: "How is my artwork unique?", a: "Each artwork is generated based on YOUR specific birth data—date, time, and location. The system creates zodiac symbols and patterns unique to your chart. No two people have the exact same birth chart, so no two artworks are identical." },
  { q: "What if I don't know my exact birth time?", a: "No worries! Your artwork will still be deeply personal and beautifully accurate. While the exact time affects your rising sign and house placements, your Sun and Moon signs—the most prominent elements—only require your birth date." },
  { q: "How long until I receive my order?", a: "Production takes 2-3 business days, and shipping takes 5-7 business days. You'll receive tracking information via email once your order ships." },
  { q: "Can I customize the colors or design?", a: "The artwork is automatically generated based on your astrological placements. The colors and symbols are determined by your chart's element balance and zodiac signs, ensuring astronomical accuracy and symbolic meaning." },
  { q: "What if I don't like my preview?", a: "No problem! You only pay if you love it. The preview is completely free—there's zero obligation to purchase." },
  { q: "Can I see examples of different chart combinations?", a: "Yes! Check out our gallery above to see how different astrological placements create unique artwork. Each piece reflects the individual's birth chart." },
  { q: "What sizes and frames are available?", a: "We offer three canvas sizes: 12\"×18\" ($79), 16\"×24\" ($119 — most popular), and 20\"×30\" ($179). All prints are museum-quality canvas." },
  { q: "Do you ship internationally?", a: "Yes! We offer free shipping to the US, UK, Canada, and Australia." },
  { q: "What's your refund policy?", a: "We offer a 30-day money-back guarantee. If you're not completely satisfied with your artwork, contact us for a full refund. No questions asked." },
];

const galleryItems = [
  { img: taurusArtwork, label: "☀️ Taurus Sun • 🌙 Scorpio Moon" },
  { img: moonSurface, label: "" },
  { img: capricornGallery, label: "☀️ Capricorn Sun • 🌙 Cancer Moon" },
  { img: earthSpace, label: "" },
  { img: taurusExample, label: "☀️ Pisces Sun • 🌙 Aries Moon" },
  { img: virgoArtwork, label: "☀️ Virgo Sun • 🌙 Pisces Moon" },
  { img: saturnPlanet, label: "" },
  { img: libraWall, label: "☀️ Libra Sun • 🌙 Aquarius Moon" },
];

/* ─── Component ─── */

export default function LandingPage() {
  const navigate = useNavigate();

  // Step 1a form state
  const [formData, setFormData] = useState({
    name: "", birthMonth: "", birthDay: "", birthYear: "",
    birthCity: "", birthCountry: "US", lat: null, lng: null,
  });

  // Step 1b modal state
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [birthHour, setBirthHour] = useState("12");
  const [birthMinute, setBirthMinute] = useState("00");
  const [birthPeriod, setBirthPeriod] = useState("PM");
  const [dontKnowTime, setDontKnowTime] = useState(false);

  // City autocomplete
  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (cityQuery.length < 2) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { data, error } = await supabase.functions.invoke("google-places-autocomplete", { body: { input: cityQuery } });
        if (!error && data?.predictions) { setSuggestions(data.predictions); setShowSuggestions(true); }
      } catch (e) { console.error("[LandingPage] Autocomplete error:", e); }
      finally { setLoadingSuggestions(false); }
    }, 300);
  }, [cityQuery]);

  const handleSelectCity = async (prediction) => {
    setShowSuggestions(false);
    setCityQuery(prediction.description);
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places-detail", { body: { place_id: prediction.place_id } });
      if (!error && data) {
        setFormData((prev) => ({ ...prev, birthCity: data.city || prediction.description, birthCountry: data.nation || prev.birthCountry, lat: data.lat, lng: data.lng }));
        setCityQuery(data.formatted_address || prediction.description);
      }
    } catch (e) { console.error("[LandingPage] Place detail error:", e); }
    finally { setLoadingSuggestions(false); }
  };

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleStep1aSubmit = (e) => {
    e.preventDefault();
    setShowTimeModal(true);
  };

  const handleStep1bSubmit = () => {
    let hour = Number(birthHour);
    if (dontKnowTime) {
      hour = 12;
    } else {
      if (birthPeriod === "PM" && hour !== 12) hour += 12;
      if (birthPeriod === "AM" && hour === 12) hour = 0;
    }
    const params = new URLSearchParams({
      name: formData.name, month: formData.birthMonth, day: formData.birthDay,
      year: formData.birthYear, hour: String(hour),
      minute: dontKnowTime ? "0" : birthMinute,
      city: formData.birthCity, nation: formData.birthCountry,
      ...(formData.lat != null ? { lat: String(formData.lat) } : {}),
      ...(formData.lng != null ? { lng: String(formData.lng) } : {}),
    });
    navigate(`/generate?${params.toString()}`);
  };

  const scrollToForm = () => {
    document.getElementById("birth-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const fillTestData = () => {
    setFormData({ name: "Sarah", birthMonth: "6", birthDay: "15", birthYear: "1995", birthCity: "New York", birthCountry: "US", lat: null, lng: null });
    setCityQuery("New York");
    document.getElementById("birth-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-white/20 rounded-none px-0 py-3 text-lg text-left text-foreground placeholder:text-white/40 focus:border-primary focus:ring-0 transition outline-none";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* DEV: Auto-fill test button */}
      <button onClick={fillTestData} className="fixed bottom-4 right-4 z-50 bg-card text-foreground px-4 py-2 rounded-full text-body-sm shadow-lg hover:bg-card/80 transition opacity-70 hover:opacity-100 border border-border">
        🧪 Fill Test Data
      </button>

      {/* NAVIGATION */}
      <Header />

      {/* ═══════════════════ HERO ═══════════════════ */}
      {/* Mobile hero */}
      <section className="md:hidden relative min-h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroMobile} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col justify-end min-h-[80vh] pb-10 px-4">
          <h1 className="text-a1 text-foreground text-center mb-4">
            Turn Your Birth Into<br />
            Gallery-Worthy Art
          </h1>
          <p className="text-body text-muted-foreground text-center mb-6">
            Each piece is uniquely generated for your exact birth moment—no two are ever the same
          </p>
          <div className="text-center mb-6">
            <PrimaryButton onClick={scrollToForm}>
              Show me my artwork
            </PrimaryButton>
          </div>
          <div className="flex items-center justify-center gap-4 text-body-sm text-muted-foreground flex-wrap">
            <span>🔒 Secure Payment</span>
            <span className="text-border">|</span>
            <span>📦 Free Shipping</span>
            <span className="text-border">|</span>
            <span>↩️ 30-Day Guarantee</span>
          </div>
        </div>
      </section>

      {/* Desktop hero — gallery wall */}
      <section className="hidden md:block relative min-h-[700px] overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={heroDesktop} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        {/* Text overlay at bottom-left */}
        <div className="relative z-20 flex items-end min-h-[700px] pb-20 px-10">
          <div className="max-w-xl">
            <h1 className="text-a1 text-foreground mb-5 leading-[1.05]">
              Turn Your Birth<br />
              Into Gallery-Worthy Art
            </h1>
            <p className="text-body text-foreground/70 mb-7 max-w-md">
              Every element in your artwork corresponds to a specific<br className="hidden lg:block" />
              astrological placement.
            </p>
            <PrimaryButton onClick={scrollToForm}>
              Show me my artwork
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* Trust badges strip */}
      <div className="hidden md:flex items-center justify-center gap-6 py-3.5 text-body-sm" style={{ backgroundColor: '#F2F1EF', color: '#000000' }}>
        <span>🔒 Secure Payment</span>
        <span style={{ color: '#00000030' }}>|</span>
        <span>📦 Free Shipping</span>
        <span style={{ color: '#00000030' }}>|</span>
        <span>↩️ 30-Day Guarantee</span>
      </div>

      {/* ═══════════════════ SOCIAL PROOF STATS ═══════════════════ */}
      <section className="bg-surface text-surface-foreground px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 text-center py-[60px] md:py-[85px]" style={{ gap: '30px' }}>
            <div>
              <div className="text-a1 md:text-4xl lg:text-5xl text-surface-foreground mb-2">2,000+</div>
              <div className="text-body-sm text-surface-muted">Artworks Created</div>
            </div>
            <div>
              <div className="text-a1 md:text-4xl lg:text-5xl text-surface-foreground mb-2">4.9 <span className="inline-block align-middle text-[0.7em] opacity-60">☆</span></div>
              <div className="text-body-sm text-surface-muted">Average Rating</div>
            </div>
            <div>
              <div className="text-a1 md:text-4xl lg:text-5xl text-surface-foreground mb-2">98%</div>
              <div className="text-body-sm text-surface-muted">Display It Proudly</div>
            </div>
            <div>
              <div className="text-a1 md:text-4xl lg:text-5xl text-surface-foreground mb-2">23</div>
              <div className="text-body-sm text-surface-muted">Countries Shipped</div>
            </div>
          </div>

          {/* Gallery cards */}
          <div className="flex gap-[10px] overflow-x-auto px-6 lg:px-0 scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:justify-items-center lg:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[
              {
                img: taurusArtwork, name: "Sarah", signs: "Leo Sun, Pisces Moon",
                explanations: [
                  { icon: "☀️", title: "Taurus Sun · Grounded", description: "The large golden-orange circular sun represents his Taurus sun—material stability, sensual beauty, and grounded presence." },
                  { icon: "⬆️", title: "Sagittarius Rising · Abundance", description: "Notice how it's positioned solidly in the upper left, like an anchor, surrounded by lush botanical abundance." },
                ],
              },
              {
                img: capricornWall, name: "Simone", signs: "Capricorn Sun, Cancer Moon",
                explanations: [
                  { icon: "☀️", title: "Capricorn Sun · Ambition", description: "The angular geometric structures represent her Capricorn sun—discipline, structure, and the drive to build something lasting." },
                  { icon: "🌙", title: "Cancer Moon · Nurture", description: "Soft lunar tones weave through the composition, reflecting her deeply nurturing emotional core." },
                ],
              },
              {
                img: virgoArtwork, name: "Tyler", signs: "Virgo Sun, Pisces Moon",
                explanations: [
                  { icon: "☀️", title: "Virgo Sun · Precision", description: "Intricate linework and precise geometric patterns embody his Virgo sun—analytical, detail-oriented, and purposeful." },
                  { icon: "🌙", title: "Pisces Moon · Dreaming", description: "Ethereal washes of blue and violet flow beneath the structure, capturing his Pisces moon's boundless imagination." },
                ],
              },
              {
                img: libraWall, name: "Amanda", signs: "Libra Sun, Aquarius Moon",
                explanations: [
                  { icon: "☀️", title: "Libra Sun · Harmony", description: "Balanced, symmetrical composition with elegant curves reflects her Libra sun—beauty, partnership, and aesthetic refinement." },
                  { icon: "🌙", title: "Aquarius Moon · Vision", description: "Electric accents and unconventional color choices hint at her Aquarius moon's innovative, independent spirit." },
                ],
              },
            ].map((item) => (
              <GalleryTile
                key={item.name}
                image={item.img}
                name={item.name}
                signs={item.signs}
                explanations={item.explanations}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA BREAK ═══════════════════ */}
      <section className="py-12 px-4 bg-surface text-surface-foreground">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h2 className="text-a2 md:text-4xl text-surface-foreground leading-snug">
            Ready to turn your birth data into some awesome wall art?
          </h2>
          <button onClick={scrollToForm} className="bg-surface-foreground text-surface px-8 py-3.5 rounded-full text-a5 hover:opacity-90 transition-all shadow-lg">
            Show me my artwork →
          </button>
          <p className="text-body-sm text-surface-muted">Free preview. No credit card required.</p>
        </div>
      </section>

      {/* ═══════════════════ EVERY SYMBOL HAS MEANING (Interactive) ═══════════════════ */}
      <InteractiveHotspots onScrollToForm={scrollToForm} />

      {/* ═══════════════════ 4 SIMPLE STEPS ═══════════════════ */}
      <section className="py-[85px]" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="mx-auto px-4" style={{ maxWidth: 880 }}>
          <h2 className="text-a2 text-center text-surface-foreground mb-10 md:whitespace-nowrap">
            Your custom artwork in 4 simple steps
          </h2>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="overflow-x-auto md:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="relative flex gap-6 pl-6 pr-6 md:px-0 md:grid md:grid-cols-4 md:gap-10 w-max md:w-full md:mx-auto" style={{ maxWidth: 880 }}>
            {/* Connecting line through circles */}
            <div className="absolute top-6 md:top-7 h-px bg-surface-border" style={{ left: 100, right: 100 }} />
            <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-surface-border" />

            {[
              { n: "1", title: "Enter your birth data", desc: "Provide your birth date, time, and location. We calculate your complete natal chart." },
              { n: "2", title: "Choose your style", desc: "Pick from multiple artistic styles — each transforms your chart into a different visual experience." },
              { n: "3", title: "We create your artwork", desc: "Our system generates unique artwork incorporating your zodiac symbols and cosmic blueprint." },
              { n: "4", title: "Get it framed & shipped", desc: "Love it? Choose your canvas size. We'll print and ship museum-quality canvas to your door." },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center flex-shrink-0 w-[200px] md:w-auto relative z-10">
                <div className="w-12 h-12 md:w-14 md:h-14 border border-surface-border bg-white rounded-full flex items-center justify-center text-xl md:text-2xl text-surface-foreground flex-shrink-0 font-display font-medium">
                  {s.n}
                </div>
                <div className="mt-6">
                  <h3 className="text-a4 text-surface-foreground mb-[24px]">{s.title}</h3>
                  <p className="text-body-sm text-surface-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ GIFT + MATERIALS TILES ═══════════════════ */}
      <section className="py-[85px] bg-surface">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* The Perfect Gift */}
          <div>
            <img src={womanHolding} alt="Happy customer holding her framed birth chart artwork" className="w-full object-cover" style={{ height: 406, borderRadius: 2 }} />
            <div className="mt-4">
              <p className="text-subtitle text-surface-muted tracking-widest mb-2">THE PERFECT GIFT</p>
              <h3 className="text-a2 text-surface-foreground mb-4">Impossible to Duplicate. Impossible to Forget.</h3>
              <p className="text-body-sm text-surface-muted mb-6">
                Birthdays. Anniversaries. New homes. Give a gift that's impossible to buy anywhere else—because it's created from their exact birth moment. Every friend who sees it will ask.
              </p>
              <button onClick={scrollToForm} className="text-surface-foreground text-body-sm underline underline-offset-4 hover:opacity-70 transition-opacity">
                Create a gift
              </button>
            </div>
          </div>

          {/* Museum-Quality Materials */}
          <div>
            <img src={canvasDetail} alt="Close-up of museum-quality canvas print detail" className="w-full object-cover" style={{ height: 406, borderRadius: 2 }} />
            <div className="mt-4">
              <p className="text-subtitle text-surface-muted tracking-widest mb-2">MUSEUM-QUALITY MATERIALS</p>
              <h3 className="text-a2 text-surface-foreground mb-4">Materials So Good, Museums Use Them</h3>
              <p className="text-body-sm text-surface-muted mb-6">
                Your artwork arrives ready to hang—printed on museum-grade archival paper in a solid wood frame with anti-reflective glaze. It'll look exactly this good in 100 years.
              </p>
              <button onClick={scrollToForm} className="text-surface-foreground text-body-sm underline underline-offset-4 hover:opacity-70 transition-opacity">
                Generate my free artwork
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CUSTOMER GALLERY ═══════════════════ */}
      <section className="py-14 bg-surface text-surface-foreground">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-subtitle text-surface-muted text-center mb-2 tracking-widest">
            REAL HOMES. REAL CUSTOMERS. REAL REACTIONS.
          </p>
          <h2 className="text-a2 md:text-5xl text-center text-surface-foreground mb-8">
            See how customers display<br />their cosmic art
          </h2>

          {/* 4-col, 2-row grid matching Figma: 15px gap, ~169×200 tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[15px] max-w-[1140px] mx-auto">
            {galleryItems.map((item, i) => (
              <div key={i} className="overflow-hidden rounded-[2px]">
                <img
                  src={item.img}
                  alt={item.label || `Gallery image ${i + 1}`}
                  className="w-full object-cover"
                  style={{ aspectRatio: "169 / 200" }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ BIRTH DATA FORM (Step 1a) ═══════════════════ */}
      <section className="py-24 md:py-32 relative overflow-hidden" id="birth-form">
        {/* Galaxy background image */}
        <img src={galaxyBg} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 max-w-[566px] mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-a1 text-foreground">
              See your birth chart art<br />in 60 seconds
            </h2>
            <div className="flex justify-center mt-3">
              <div className="w-6 h-[3px] bg-primary rounded-full" />
            </div>
          </div>

          {/* Glass card — rgba(17,17,17,0.70) + blur(17px) */}
          <div
            className="flex flex-col items-stretch rounded-[2px]"
            style={{
              background: 'rgba(17, 17, 17, 0.70)',
              backdropFilter: 'blur(17px)',
              WebkitBackdropFilter: 'blur(17px)',
              padding: 48,
              gap: 30,
              minWidth: 320,
            }}
          >
            {!showTimeModal ? (
              <form onSubmit={handleStep1aSubmit} className="flex flex-col gap-[30px]">
                {/* Birth Date */}
                <div>
                  <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#6A6A6A' }}>BIRTH DATE</label>
                  <div className="grid grid-cols-3 gap-4">
                    <input type="number" required value={formData.birthMonth} onChange={(e) => set("birthMonth", e.target.value)} placeholder="Month" min="1" max="12" className={inputClass} />
                    <input type="number" required value={formData.birthDay} onChange={(e) => set("birthDay", e.target.value)} placeholder="Day" min="1" max="31" className={inputClass} />
                    <input type="number" required value={formData.birthYear} onChange={(e) => set("birthYear", e.target.value)} placeholder="Year" min="1900" max="2026" className={inputClass} />
                  </div>
                </div>

                {/* Birth Location */}
                <div ref={wrapperRef} className="relative">
                  <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#6A6A6A' }}>BIRTH LOCATION</label>
                  <div className="relative">
                    <input
                      type="text" required value={cityQuery}
                      onChange={(e) => { setCityQuery(e.target.value); setFormData((prev) => ({ ...prev, birthCity: "", lat: null, lng: null })); }}
                      placeholder="City"
                      className={inputClass} autoComplete="off"
                    />
                    {loadingSuggestions && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((s) => (
                        <li key={s.place_id} onClick={() => handleSelectCity(s)} className="px-4 py-3 text-body-sm text-foreground hover:bg-primary/10 cursor-pointer transition-colors">
                          {s.description}
                        </li>
                      ))}
                    </ul>
                  )}
                  {formData.lat && <p className="text-body-sm text-muted-foreground mt-2">📍 {formData.birthCity}, {formData.birthCountry}</p>}
                </div>

                {/* Submit */}
                <PrimaryButton type="submit" className="w-full mt-2">
                  Continue
                </PrimaryButton>
              </form>
            ) : (
              /* Step 1b — Birth Time (inline, replaces step 1) */
              <div className="flex flex-col gap-[30px]">
                <div>
                  <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#6A6A6A' }}>BIRTH TIME</label>
                  {!dontKnowTime && (
                    <div className="grid grid-cols-3 gap-4">
                      <input type="number" value={birthHour} onChange={(e) => setBirthHour(e.target.value)} placeholder="12" min="1" max="12" className={inputClass} />
                      <input type="number" value={birthMinute} onChange={(e) => setBirthMinute(e.target.value)} placeholder="00" min="0" max="59" className={inputClass} />
                      <div className="relative">
                        <select value={birthPeriod} onChange={(e) => setBirthPeriod(e.target.value)} className="w-full bg-transparent border-0 border-b border-white/20 rounded-none px-0 py-3 text-lg text-foreground outline-none focus:border-primary transition appearance-none">
                          <option value="AM" className="bg-card">AM</option>
                          <option value="PM" className="bg-card">PM</option>
                        </select>
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={dontKnowTime} onChange={(e) => setDontKnowTime(e.target.checked)} className="w-5 h-5 mt-0.5 accent-primary rounded" />
                  <div>
                    <span className="text-body-sm text-foreground">I don't know my birth time</span>
                    {dontKnowTime && (
                      <p className="text-body-sm mt-1" style={{ color: '#6A6A6A' }}>
                        No worries! Your artwork will still be deeply personal and beautifully accurate.
                      </p>
                    )}
                  </div>
                </label>

                <PrimaryButton onClick={handleStep1bSubmit} className="w-full mt-2">
                  Continue
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-a2 md:text-5xl text-center text-foreground mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="bg-card rounded-xl p-4 md:p-6 shadow-sm cursor-pointer group border border-border">
                <summary className="text-a4 text-foreground list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-primary group-open:rotate-180 transition text-sm">▼</span>
                </summary>
                <p className="text-body text-muted-foreground mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <Footer onScrollToForm={scrollToForm} />
    </div>
  );
}
