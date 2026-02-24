import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroMobile from "@/assets/hero-mobile.webp";
import heroDesktop from "@/assets/hero-desktop.webp";
import footerMobile from "@/assets/footer-mobile.webp";
import footerDesktop from "@/assets/footer-desktop.webp";
import capricornWall from "@/assets/gallery/capricorn-wall.jpg";
import taurusArtwork from "@/assets/gallery/taurus-artwork.jpg";
import womanHolding from "@/assets/gallery/woman-holding.jpg";
import saturnPlanet from "@/assets/gallery/saturn-planet.jpg";
import libraWall from "@/assets/gallery/libra-wall.jpg";
import virgoArtwork from "@/assets/gallery/virgo-artwork.jpg";
import gallery2 from "@/assets/gallery/example-2.jpg";
import gallery3 from "@/assets/gallery/example-3.jpg";
import ProgressBar from "@/components/ui/ProgressBar";
import InteractiveHotspots from "./InteractiveHotspots";
import PrimaryButton from "@/components/ui/PrimaryButton";

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
  { img: capricornWall, label: "☀️ Capricorn Sun • 🌙 Cancer Moon" },
  { img: gallery2, label: "☀️ Leo Sun • 🌙 Sagittarius Moon" },
  { img: virgoArtwork, label: "☀️ Virgo Sun • 🌙 Pisces Moon" },
  { img: libraWall, label: "☀️ Libra Sun • 🌙 Aquarius Moon" },
  { img: gallery3, label: "☀️ Pisces Sun • 🌙 Scorpio Moon" },
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

  const inputClass = "w-full border-2 border-border rounded-xl px-4 py-3 text-lg text-center bg-background text-foreground focus:border-primary focus:ring-4 focus:ring-primary/20 transition outline-none";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* DEV: Auto-fill test button */}
      <button onClick={fillTestData} className="fixed bottom-4 right-4 z-50 bg-card text-foreground px-4 py-2 rounded-full text-body-sm shadow-lg hover:bg-card/80 transition opacity-70 hover:opacity-100 border border-border">
        🧪 Fill Test Data
      </button>

      {/* NAVIGATION */}
      <nav className="absolute top-0 left-0 right-0 z-30 py-5 px-6 md:px-10 flex items-center justify-between">
        <div className="text-a4 text-foreground">
          Celestial Artworks
        </div>
        <button className="text-foreground/70 hover:text-foreground transition text-body-sm">Login</button>
      </nav>

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
            <h1 className="text-a1 md:text-5xl lg:text-6xl text-foreground mb-5 leading-[1.05]">
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
      <div className="hidden md:flex items-center justify-center gap-6 py-3.5 border-t border-b border-border text-body-sm text-foreground/60" style={{ backgroundColor: '#F2F1EF' }}>
        <span>🔒 Secure Payment</span>
        <span className="text-border">|</span>
        <span>📦 Free Shipping</span>
        <span className="text-border">|</span>
        <span>↩️ 30-Day Guarantee</span>
      </div>

      {/* ═══════════════════ SOCIAL PROOF STATS ═══════════════════ */}
      <section className="py-16 md:py-20 bg-surface text-surface-foreground">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 mb-14 text-center">
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

          {/* Gallery cards with hover review popups */}
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
            {[
              { img: taurusArtwork, label: "Sarah's chart", sub: "Taurus Sun · Scorpio Moon", review: '"The mountain representing my Capricorn sun is stunning!"', name: "Sarah J." },
              { img: capricornWall, label: "Simone's chart", sub: "Capricorn Sun · Cancer Moon", review: '"This is the most meaningful piece of art I own."', name: "Simone K." },
              { img: virgoArtwork, label: "Tyler's chart", sub: "Virgo Sun · Pisces Moon", review: '"Everyone asks about it when they visit!"', name: "Tyler M." },
              { img: libraWall, label: "Amanda's chart", sub: "Libra Sun · Aquarius Moon", review: '"Bought one for myself and immediately ordered two more as gifts."', name: "Amanda L." },
            ].map((item) => (
              <div key={item.label} className="min-w-[200px] md:min-w-0 snap-start flex-shrink-0 group relative">
                <div className="rounded-xl overflow-hidden shadow-md border border-surface-border">
                  <img src={item.img} alt={item.label} className="w-full h-48 md:h-56 object-cover" />
                </div>
                <p className="text-a5 text-surface-foreground mt-2">{item.label}</p>
                <p className="text-body-sm text-surface-muted">{item.sub}</p>

                {/* Hover review popup */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface-card border border-surface-border rounded-xl p-4 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-20 hidden md:block">
                  <div className="flex items-center gap-0.5 mb-2 text-primary text-sm">★★★★★</div>
                  <p className="text-body-sm text-surface-foreground/80 leading-relaxed mb-3">{item.review}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-surface-foreground">{item.name}</span>
                    <span className="text-subtitle text-primary">{/* no uppercase needed, text-subtitle handles it */}Verified Buyer</span>
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-card border-r border-b border-surface-border rotate-45 -mt-1.5" />
                </div>
              </div>
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
      <section className="py-14 px-4 bg-surface text-surface-foreground">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-a2 md:text-5xl text-center text-surface-foreground mb-2">
            Your custom artwork<br />in 4 simple steps
          </h2>
          <p className="text-body-sm text-surface-muted text-center mb-10">
            From your birth data to gallery-worthy art
          </p>

          <div className="space-y-8 md:grid md:grid-cols-4 md:gap-10 md:space-y-0">
            {[
              { n: "1", title: "Enter your birth data", desc: "Provide your birth date, time, and location. We calculate your complete natal chart." },
              { n: "2", title: "Choose your style", desc: "Pick from multiple artistic styles — each transforms your chart into a different visual experience." },
              { n: "3", title: "We create your artwork", desc: "We craft unique artwork incorporating your zodiac symbols and cosmic blueprint." },
              { n: "4", title: "Get it framed & shipped", desc: "Love it? Choose your canvas size. We'll print and ship museum-quality canvas to your door." },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-4 md:flex-col md:items-center md:text-center">
                <div className="w-12 h-12 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center text-xl md:text-4xl text-primary flex-shrink-0 font-display font-medium">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-a4 text-surface-foreground mb-1">{s.title}</h3>
                  <p className="text-body-sm text-surface-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ THE PERFECT GIFT ═══════════════════ */}
      <section className="py-14 bg-surface text-surface-foreground">
        <div className="max-w-6xl mx-auto px-4">
          <div className="md:grid md:grid-cols-2 md:gap-14 md:items-center">
            <div>
              <img src={womanHolding} alt="Happy customer holding her framed birth chart artwork" className="w-full rounded-2xl shadow-lg" />
            </div>
            <div className="mt-8 md:mt-0">
              <h2 className="text-a2 md:text-4xl text-surface-foreground leading-snug mb-3">
                Impossible to Duplicate.
                <span className="text-primary"> Impossible to Forget.</span>
              </h2>
              <p className="text-body-sm text-surface-muted mb-5">
                The perfect gift for birthdays, anniversaries, new homes, or anyone who deserves something truly one-of-a-kind.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  { icon: "🎁", text: "Deeply personal — based on their exact birth moment" },
                  { icon: "🎨", text: "Museum-quality canvas — built to last 100+ years" },
                  { icon: "💫", text: "Every symbol has meaning — a visual story of who they are" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-body-sm text-surface-foreground/80">{item.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={scrollToForm} className="bg-surface-foreground text-surface px-8 py-3 rounded-full text-a5 hover:opacity-90 transition-all">
                Create a gift →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ MUSEUM-QUALITY MATERIALS ═══════════════════ */}
      <section className="py-14 bg-surface text-surface-foreground">
        <div className="max-w-6xl mx-auto px-4">
          <div className="md:grid md:grid-cols-2 md:gap-14 md:items-center">
            <div>
              <img src={saturnPlanet} alt="Saturn — representing museum-quality craftsmanship" className="w-full rounded-2xl shadow-lg" />
            </div>
            <div className="mt-8 md:mt-0">
              <h2 className="text-a2 md:text-4xl text-surface-foreground mb-3">
                Materials to Grace<br />Museums like Them
              </h2>
              <p className="text-body-sm text-surface-muted mb-6">
                Every print is crafted to gallery standards
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "📜", title: "Archival Canvas", desc: "100+ years of vibrant color" },
                  { icon: "🖼️", title: "Solid Wood Frames", desc: "Handcrafted, ready to hang" },
                  { icon: "🎨", title: "12-Color Process", desc: "Giclée with unmatched depth" },
                  { icon: "✅", title: "Fine Art Certified", desc: "Fine Art Trade Guild certified" },
                ].map((item) => (
                  <div key={item.title} className="bg-surface-card border border-surface-border rounded-xl p-3 space-y-1">
                    <div className="text-xl">{item.icon}</div>
                    <h3 className="text-a5 text-surface-foreground">{item.title}</h3>
                    <p className="text-body-sm text-surface-muted">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <button onClick={scrollToForm} className="text-surface-foreground/70 hover:text-surface-foreground text-body-sm underline underline-offset-4 transition-colors">
                  Generate my free artwork →
                </button>
              </div>
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

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
            {galleryItems.map((item, i) => (
              <div key={i} className="min-w-[260px] md:min-w-0 snap-start flex-shrink-0 group">
                <div className="bg-surface-card rounded-xl overflow-hidden shadow-md border border-surface-border">
                  <img src={item.img} alt={`Customer artwork ${i + 1}`} className="w-full h-64 md:h-80 object-cover" />
                  <div className="p-3">
                    <div className="text-body-sm text-surface-foreground">{item.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ BIRTH DATA FORM (Step 1a) ═══════════════════ */}
      <section className="py-14 relative overflow-hidden" id="birth-form">
        {/* Starfield texture */}
        <div className="absolute inset-0 bg-cosmic" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(1px 1px at 10% 20%, hsl(0 0% 80% / 0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 60%, hsl(0 0% 70% / 0.3) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 50% 10%, hsl(45 80% 65% / 0.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 40%, hsl(0 0% 80% / 0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 70%, hsl(0 0% 75% / 0.25) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 20% 80%, hsl(260 40% 70% / 0.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 85%, hsl(0 0% 80% / 0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 15%, hsl(0 0% 70% / 0.25) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 40% 35%, hsl(45 60% 70% / 0.15) 0%, transparent 100%),
            radial-gradient(1px 1px at 15% 50%, hsl(0 0% 80% / 0.3) 0%, transparent 100%)`,
        }} />
        <div className="relative z-10 max-w-lg mx-auto px-4">
          <ProgressBar currentStep={1} />
          <div className="bg-card rounded-2xl shadow-2xl p-5 md:p-10 border border-border mt-4">
            <div className="text-center mb-6">
              <h2 className="text-a2 text-foreground mb-1">
                See your birth chart art<br />in 60 seconds
              </h2>
              <p className="text-body-sm text-muted-foreground">We'll use this to create your personalized artwork</p>
            </div>
            <form onSubmit={handleStep1aSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-subtitle text-muted-foreground mb-1">Your Name <span className="text-muted-foreground/50">(Optional)</span></label>
                <input type="text" value={formData.name} onChange={(e) => set("name", e.target.value)} placeholder="Sarah" className={inputClass} />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-subtitle text-muted-foreground mb-1">Birth Date</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" required value={formData.birthMonth} onChange={(e) => set("birthMonth", e.target.value)} placeholder="MM" min="1" max="12" className={inputClass} />
                  <input type="number" required value={formData.birthDay} onChange={(e) => set("birthDay", e.target.value)} placeholder="DD" min="1" max="31" className={inputClass} />
                  <input type="number" required value={formData.birthYear} onChange={(e) => set("birthYear", e.target.value)} placeholder="YYYY" min="1900" max="2026" className={inputClass} />
                </div>
              </div>

              {/* Birth Location */}
              <div ref={wrapperRef} className="relative">
                <label className="block text-subtitle text-muted-foreground mb-1">Birth Location</label>
                <div className="relative">
                  <input
                    type="text" required value={cityQuery}
                    onChange={(e) => { setCityQuery(e.target.value); setFormData((prev) => ({ ...prev, birthCity: "", lat: null, lng: null })); }}
                    placeholder="Start typing a city name..."
                    className={inputClass} autoComplete="off"
                  />
                  {loadingSuggestions && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
                {formData.lat && <p className="text-body-sm text-muted-foreground mt-1">📍 {formData.birthCity}, {formData.birthCountry}</p>}
              </div>

              {/* Submit */}
              <PrimaryButton type="submit" className="w-full">
                Continue
              </PrimaryButton>
              <div className="space-y-1 text-center">
                <p className="text-body-sm text-muted-foreground">✨ Free preview • No credit card required</p>
                <p className="text-body-sm text-muted-foreground/60">🔒 Your data is secure and never shared</p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════════════════ BIRTH TIME MODAL (Step 1b) ═══════════════════ */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[hsl(220,15%,12%)] /95 backdrop-blur-sm" onClick={() => setShowTimeModal(false)} />
          {/* Modal — dark card matching Figma */}
          <div className="relative w-full md:max-w-md bg-[hsl(220,15%,18%)] rounded-t-2xl md:rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-fade-in">
            <div>
              <p className="text-subtitle text-primary tracking-widest mb-3">BIRTH TIME</p>
            </div>

            {!dontKnowTime && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <select value={birthHour} onChange={(e) => setBirthHour(e.target.value)} className="w-full bg-transparent border-b border-muted-foreground/30 text-foreground text-2xl font-body py-2 text-center outline-none focus:border-primary transition-colors appearance-none">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h} className="bg-card">{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select value={birthMinute} onChange={(e) => setBirthMinute(e.target.value)} className="w-full bg-transparent border-b border-muted-foreground/30 text-foreground text-2xl font-body py-2 text-center outline-none focus:border-primary transition-colors appearance-none">
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                      <option key={m} value={String(m).padStart(2, '0')} className="bg-card">{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <select value={birthPeriod} onChange={(e) => setBirthPeriod(e.target.value)} className="w-full bg-transparent border-b border-muted-foreground/30 text-foreground text-2xl font-body py-2 text-center outline-none focus:border-primary transition-colors appearance-none pr-6">
                    <option value="AM" className="bg-card">AM</option>
                    <option value="PM" className="bg-card">PM</option>
                  </select>
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">▾</span>
                </div>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer py-2">
              <input type="checkbox" checked={dontKnowTime} onChange={(e) => setDontKnowTime(e.target.checked)} className="w-5 h-5 accent-primary rounded" />
              <div>
                <span className="text-body-sm text-foreground">I don't know my birth time</span>
                {dontKnowTime && (
                  <p className="text-body-sm text-muted-foreground/70 mt-1">
                    No worries! Your artwork will still be deeply personal and beautifully accurate.
                  </p>
                )}
              </div>
            </label>

            <PrimaryButton
              onClick={handleStep1bSubmit}
              className="w-full"
            >
              Continue
            </PrimaryButton>
          </div>
        </div>
      )}

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
      <footer className="relative bg-card border-t border-border overflow-hidden">
        {/* Earth background image — responsive */}
        <div className="absolute inset-0 pointer-events-none">
          <img src={footerMobile} alt="" className="md:hidden w-full h-full object-cover" />
          <img src={footerDesktop} alt="" className="hidden md:block w-full h-full object-cover" />
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
                  <li><button onClick={scrollToForm} className="hover:text-foreground transition">Create Artwork</button></li>
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
                  <a href="#" className="hover:text-foreground transition text-base">𝕏</a>
                  <a href="#" className="hover:text-foreground transition text-base">📷</a>
                  <a href="#" className="hover:text-foreground transition text-base">in</a>
                  <a href="#" className="hover:text-foreground transition text-base">▶️</a>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-6 text-body-sm text-center text-muted-foreground">© 2026 Celestial Artworks. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
