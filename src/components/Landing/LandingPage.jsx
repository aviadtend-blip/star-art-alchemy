import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/gallery/example-1.jpg";
import gallery2 from "@/assets/gallery/example-2.jpg";
import gallery3 from "@/assets/gallery/example-3.jpg";
import gallery4 from "@/assets/gallery/example-4.jpg";
import gallery5 from "@/assets/gallery/example-5.jpg";
import gallery6 from "@/assets/gallery/example-6.jpg";
import lifestyleImg from "@/assets/gallery/lifestyle.jpg";

/* ─── Static data ─── */

const galleryItems = [
  { img: heroImg, label: "☀️ Gemini Sun • 🌙 Cancer Moon", desc: "Ethereal pink watercolor with celestial harmony" },
  { img: gallery2, label: "☀️ Leo Sun • 🌙 Sagittarius Moon", desc: "Bold golden warmth with fiery confidence" },
  { img: gallery3, label: "☀️ Pisces Sun • 🌙 Scorpio Moon", desc: "Deep ocean blues with mystical intuition" },
  { img: gallery4, label: "☀️ Capricorn Sun • 🌙 Taurus Moon", desc: "Earthy strength with grounded determination" },
  { img: gallery5, label: "☀️ Aries Sun • 🌙 Leo Moon", desc: "Fiery reds with bold cosmic energy" },
  { img: gallery6, label: "☀️ Libra Sun • 🌙 Aquarius Moon", desc: "Balanced lavender with airy elegance" },
];

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

/* ─── Component ─── */

export default function LandingPage() {
  const navigate = useNavigate();

  // Step 1a form state (date + location only)
  const [formData, setFormData] = useState({
    name: "",
    birthMonth: "",
    birthDay: "",
    birthYear: "",
    birthCity: "",
    birthCountry: "US",
    lat: null,
    lng: null,
  });

  // Step 1b modal state (birth time)
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

  // Step 1a submit → show birth time modal
  const handleStep1aSubmit = (e) => {
    e.preventDefault();
    setShowTimeModal(true);
  };

  // Step 1b submit → navigate to generator
  const handleStep1bSubmit = () => {
    let hour = Number(birthHour);
    if (dontKnowTime) {
      hour = 12; // default noon
    } else {
      if (birthPeriod === "PM" && hour !== 12) hour += 12;
      if (birthPeriod === "AM" && hour === 12) hour = 0;
    }

    const params = new URLSearchParams({
      name: formData.name,
      month: formData.birthMonth,
      day: formData.birthDay,
      year: formData.birthYear,
      hour: String(hour),
      minute: dontKnowTime ? "0" : birthMinute,
      city: formData.birthCity,
      nation: formData.birthCountry,
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
      <button onClick={fillTestData} className="fixed bottom-4 right-4 z-50 bg-card text-foreground px-4 py-2 rounded-full text-sm shadow-lg hover:bg-card/80 transition opacity-70 hover:opacity-100 border border-border">
        🧪 Fill Test Data
      </button>

      {/* NAVIGATION */}
      <nav className="py-6 px-4 md:px-8 flex items-center justify-between border-b border-border">
        <div className="text-2xl md:text-3xl font-display font-bold text-primary text-glow">
          Celestial Artworks
        </div>
        <button className="text-muted-foreground hover:text-foreground transition font-body text-sm">Login</button>
      </nav>

      {/* HERO SECTION */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Example artwork */}
          <div className="max-w-md mx-auto mb-12 relative">
            <img src={heroImg} alt="Example birth chart artwork" className="w-full rounded-2xl shadow-2xl" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-card px-6 py-3 rounded-full shadow-lg border border-border">
              <span className="text-sm font-body text-foreground">
                <span className="font-semibold">Leo Sun</span> • Pisces Moon • Virgo Rising
              </span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground text-center mb-6 leading-tight">
            Turn Your Birth Into
            <br />
            <span className="text-primary text-glow">Gallery-Worthy Art</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground text-center mb-8 max-w-3xl mx-auto font-body">
            Each piece is uniquely generated for your exact birth moment—no two are ever the same
          </p>

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-6 mb-12 text-sm text-muted-foreground font-body flex-wrap">
            <span>🔒 Secure Payment</span>
            <span className="text-border">|</span>
            <span>📦 Free Shipping</span>
            <span className="text-border">|</span>
            <span>↩️ 30-Day Guarantee</span>
          </div>

          <div className="text-center">
            <button onClick={scrollToForm} className="bg-primary text-primary-foreground px-10 py-4 rounded-xl font-display font-semibold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg border-glow">
              Show me my artwork →
            </button>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STATS */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">2,000+</div>
              <div className="text-muted-foreground font-body text-sm">Artworks Created</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">4.9★</div>
              <div className="text-muted-foreground font-body text-sm">Average Rating</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">98%</div>
              <div className="text-muted-foreground font-body text-sm">Display It Proudly</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">23</div>
              <div className="text-muted-foreground font-body text-sm">Countries Shipped</div>
            </div>
          </div>

          {/* Reviews */}
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div key={r.initials} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <div className="flex items-center gap-1 mb-3 text-primary">★★★★★</div>
                <p className="text-foreground/80 mb-4 font-body text-sm">{r.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold font-body">
                    {r.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground font-body text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground font-body">{r.signs}</div>
                    <div className="text-xs text-primary font-body">{r.badge}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 SIMPLE STEPS */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-4">4 Simple Steps</h2>
          <p className="text-xl text-muted-foreground text-center mb-16 max-w-2xl mx-auto font-body">
            From your birth data to gallery-worthy art
          </p>
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {[
              { n: "1", title: "Enter Your Birth Data", desc: "Provide your birth date, time, and location. We calculate your complete natal chart." },
              { n: "2", title: "Choose Your Style", desc: "Pick from multiple artistic styles—each transforms your chart into a different visual experience." },
              { n: "3", title: "We Create Your Artwork", desc: "Our system generates unique artwork incorporating your zodiac symbols and cosmic blueprint." },
              { n: "4", title: "Get It Printed & Shipped", desc: "Love it? Choose your canvas size. We'll print and ship museum-quality canvas to your door." },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-4xl font-bold text-primary mx-auto mb-6 font-display">
                  {s.n}
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">{s.title}</h3>
                <p className="text-muted-foreground font-body">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button onClick={scrollToForm} className="bg-primary text-primary-foreground px-10 py-4 rounded-xl font-display font-semibold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg border-glow">
              Generate My Free Preview →
            </button>
          </div>
        </div>
      </section>

      {/* THE PERFECT GIFT */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <img src={lifestyleImg} alt="Framed artwork in a home" className="rounded-2xl shadow-2xl" />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                Impossible to Duplicate.
                <br />
                <span className="text-primary text-glow">Impossible to Forget.</span>
              </h2>
              <p className="text-lg text-muted-foreground font-body">
                The perfect gift for birthdays, anniversaries, new homes, or anyone who deserves something truly one-of-a-kind.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "🎁", text: "Deeply personal — based on their exact birth moment" },
                  { icon: "🎨", text: "Museum-quality canvas — built to last 100+ years" },
                  { icon: "💫", text: "Every symbol has meaning — a visual story of who they are" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-foreground/80 font-body">{item.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={scrollToForm} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-display font-semibold hover:bg-primary/90 transition-all border-glow">
                Create a gift →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MUSEUM-QUALITY MATERIALS */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">Museum-Quality Materials</h2>
          <p className="text-xl text-muted-foreground font-body mb-16 max-w-2xl mx-auto">
            Every print is crafted to gallery standards
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: "📜", title: "Archival Canvas", desc: "Premium cotton-poly blend canvas rated for 100+ years of vibrant color" },
              { icon: "🖼️", title: "Solid Wood Frames", desc: "Handcrafted solid wood stretcher bars, ready to hang" },
              { icon: "🎨", title: "12-Color Process", desc: "Giclée printing with 12-color ink system for unmatched depth" },
              { icon: "✅", title: "Fine Art Certified", desc: "Fine Art Trade Guild certified for museum-quality standards" },
            ].map((item) => (
              <div key={item.title} className="bg-card border border-border rounded-xl p-6 space-y-3">
                <div className="text-4xl">{item.icon}</div>
                <h3 className="font-display text-lg text-foreground font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <button onClick={scrollToForm} className="bg-primary text-primary-foreground px-10 py-4 rounded-xl font-display font-semibold text-lg hover:bg-primary/90 transition-all border-glow">
              Generate my free artwork →
            </button>
          </div>
        </div>
      </section>

      {/* CUSTOMER GALLERY */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-4">Real Homes. Real Customers. Real Reactions.</h2>
          <p className="text-xl text-muted-foreground text-center mb-16 max-w-2xl mx-auto font-body">
            See how different astrological placements create unique artwork
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {galleryItems.map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border transform group-hover:scale-105 transition">
                  <img src={item.img} alt={`Example artwork ${i + 1}`} className="w-full h-80 object-cover" />
                  <div className="p-4">
                    <div className="font-semibold text-foreground mb-1 font-body text-sm">{item.label}</div>
                    <div className="text-sm text-muted-foreground font-body">{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-xl text-muted-foreground mb-6 font-body">What will yours look like?</p>
            <button onClick={scrollToForm} className="bg-primary text-primary-foreground px-10 py-4 rounded-xl font-display font-semibold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg border-glow">
              Generate My Artwork Now →
            </button>
          </div>
        </div>
      </section>

      {/* BIRTH DATA FORM (Step 1a) */}
      <section className="py-20" id="birth-form">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-2xl p-6 md:p-10 border border-border">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl text-foreground mb-2">Enter Your Birth Information</h2>
              <p className="text-muted-foreground font-body text-sm">We'll use this to create your personalized artwork</p>
            </div>
            <form onSubmit={handleStep1aSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 font-body">Your Name <span className="text-muted-foreground/50">(Optional)</span></label>
                <input type="text" value={formData.name} onChange={(e) => set("name", e.target.value)} placeholder="Sarah" className={inputClass} />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 font-body">Birth Date</label>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" required value={formData.birthMonth} onChange={(e) => set("birthMonth", e.target.value)} placeholder="MM" min="1" max="12" className={inputClass} />
                  <input type="number" required value={formData.birthDay} onChange={(e) => set("birthDay", e.target.value)} placeholder="DD" min="1" max="31" className={inputClass} />
                  <input type="number" required value={formData.birthYear} onChange={(e) => set("birthYear", e.target.value)} placeholder="YYYY" min="1900" max="2026" className={inputClass} />
                </div>
              </div>

              {/* Birth Location */}
              <div ref={wrapperRef} className="relative">
                <label className="block text-sm font-medium text-muted-foreground mb-2 font-body">Birth Location</label>
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
                      <li key={s.place_id} onClick={() => handleSelectCity(s)} className="px-4 py-3 text-sm text-foreground hover:bg-primary/10 cursor-pointer transition-colors font-body">
                        {s.description}
                      </li>
                    ))}
                  </ul>
                )}
                {formData.lat && <p className="text-xs text-muted-foreground mt-1 font-body">📍 {formData.birthCity}, {formData.birthCountry}</p>}
              </div>

              {/* Submit */}
              <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-display font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg border-glow">
                Continue →
              </button>
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground font-body">✨ Free preview • No credit card required</p>
                <p className="text-xs text-muted-foreground/60 font-body">🔒 Your data is secure and never shared</p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* BIRTH TIME MODAL (Step 1b) */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="font-display text-2xl text-foreground mb-2">What time were you born?</h3>
              <p className="text-muted-foreground font-body text-sm">This helps us calculate your rising sign and house placements</p>
            </div>

            {!dontKnowTime && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-body text-center">Hour</label>
                  <select value={birthHour} onChange={(e) => setBirthHour(e.target.value)} className={inputClass}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-body text-center">Minute</label>
                  <select value={birthMinute} onChange={(e) => setBirthMinute(e.target.value)} className={inputClass}>
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                      <option key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-body text-center">AM/PM</label>
                  <select value={birthPeriod} onChange={(e) => setBirthPeriod(e.target.value)} className={inputClass}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <input type="checkbox" checked={dontKnowTime} onChange={(e) => setDontKnowTime(e.target.checked)} className="w-5 h-5 accent-primary" />
              <div>
                <span className="text-foreground font-body text-sm font-medium">I don't know my birth time</span>
                {dontKnowTime && (
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    No worries! Your artwork will still be deeply personal and beautifully accurate.
                  </p>
                )}
              </div>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setShowTimeModal(false)} className="flex-1 border border-border text-muted-foreground py-3 rounded-xl font-body hover:text-foreground transition-colors">
                Back
              </button>
              <button onClick={handleStep1bSubmit} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-display font-semibold hover:bg-primary/90 transition-all border-glow">
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="bg-card rounded-xl p-6 shadow-sm cursor-pointer group border border-border">
                <summary className="font-semibold text-foreground text-lg list-none flex items-center justify-between font-display">
                  <span>{faq.q}</span>
                  <span className="text-primary group-open:rotate-180 transition">▼</span>
                </summary>
                <p className="text-muted-foreground mt-4 text-base font-body">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-cosmic">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">Ready to See Your Cosmic Blueprint?</h2>
          <p className="text-2xl text-muted-foreground mb-10 font-body">Generate your free preview in under 60 seconds</p>
          <button onClick={scrollToForm} className="bg-primary text-primary-foreground px-12 py-5 rounded-xl font-display font-semibold text-xl hover:bg-primary/90 transition-all transform hover:scale-105 shadow-2xl border-glow">
            Show me my artwork →
          </button>
          <p className="text-muted-foreground mt-6 text-lg font-body">✨ No credit card required • 🔒 Your data is secure</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-display font-bold text-primary text-glow mb-4">
                Celestial Artworks
              </div>
              <p className="text-sm text-muted-foreground font-body mb-3">Transforming birth charts into personalized artwork.</p>
              <p className="text-sm text-muted-foreground font-body">📧 hello@celestialartworks.com</p>
              <p className="text-sm text-muted-foreground font-body">📞 (555) 123-4567</p>
              <p className="text-xs text-muted-foreground/60 font-body mt-1">Mon-Fri 9am-6pm EST</p>
            </div>
            <div>
              <h3 className="text-foreground font-display font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground font-body">
                <li><button onClick={scrollToForm} className="hover:text-foreground transition">Create Artwork</button></li>
                <li><a href="#gallery" className="hover:text-foreground transition">Gallery</a></li>
                <li><a href="#faq" className="hover:text-foreground transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-foreground font-display font-semibold mb-4">Policies</h3>
              <ul className="space-y-2 text-sm text-muted-foreground font-body">
                <li><a href="/privacy" className="hover:text-foreground transition">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-foreground transition">Terms and Conditions</a></li>
                <li><a href="/returns" className="hover:text-foreground transition">Returns Policy</a></li>
                <li><a href="/shipping" className="hover:text-foreground transition">Shipping Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-foreground font-display font-semibold mb-4">Connect</h3>
              <div className="flex gap-4 text-muted-foreground">
                <a href="#" className="hover:text-foreground transition text-lg">𝕏</a>
                <a href="#" className="hover:text-foreground transition text-lg">📷</a>
                <a href="#" className="hover:text-foreground transition text-lg">in</a>
                <a href="#" className="hover:text-foreground transition text-lg">▶️</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-sm text-center text-muted-foreground font-body">© 2026 Celestial Artworks. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
