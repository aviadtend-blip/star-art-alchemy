import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroMobile from "@/assets/hero-mobile.webp";
import heroDesktop from "@/assets/hero-desktop.webp";
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
      <Footer onScrollToForm={scrollToForm} />
    </div>
  );
}
