import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/gallery/example-1.jpg";
import gallery2 from "@/assets/gallery/example-2.jpg";
import gallery3 from "@/assets/gallery/example-3.jpg";
import gallery4 from "@/assets/gallery/example-4.jpg";
import gallery5 from "@/assets/gallery/example-5.jpg";
import gallery6 from "@/assets/gallery/example-6.jpg";
import lifestyleImg from "@/assets/gallery/lifestyle.jpg";

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
    initials: "SJ",
    name: "Sarah J.",
    signs: "Capricorn Sun, Pisces Moon",
    text: '"I was blown away by how accurate the symbolism was. The mountain representing my Capricorn sun is stunning!"',
  },
  {
    initials: "MR",
    name: "Michael R.",
    signs: "Leo Sun, Aquarius Moon",
    text: '"This is the most meaningful piece of art I own. Everyone asks about it when they visit!"',
  },
  {
    initials: "AL",
    name: "Amanda L.",
    signs: "Virgo Sun, Cancer Moon",
    text: '"Bought one for myself and immediately ordered two more as gifts. The quality is exceptional."',
  },
];

const faqs = [
  {
    q: "Is the preview really free?",
    a: "Yes! You can generate and preview your artwork completely free with no credit card required. You only pay if you decide to purchase the framed print.",
  },
  {
    q: "How is my artwork unique?",
    a: "Each artwork is generated based on YOUR specific birth data (date, time, location). The AI creates zodiac symbols and patterns unique to your chart. No two people have the exact same birth chart, so no two artworks are identical.",
  },
  {
    q: "What if I don't know my exact birth time?",
    a: "That's okay! Use 12:00 PM as a default. While the exact time affects your rising sign and house placements, your Sun and Moon signs (the most prominent elements) only require your birth date.",
  },
  {
    q: "How long until I receive my order?",
    a: "Production takes 2-3 business days, and shipping takes 5-7 business days. You'll receive tracking information via email once your order ships.",
  },
  {
    q: "What if I don't like it?",
    a: "We offer a 30-day money-back guarantee. If you're not completely satisfied with your artwork, contact us for a full refund.",
  },
  {
    q: "Can I customize the colors or design?",
    a: "The artwork is automatically generated based on your astrological placements. The colors and symbols are determined by your chart's element balance and zodiac signs. This ensures astronomical accuracy and symbolic meaning.",
  },
];

const inputClass =
  "w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg text-center focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition outline-none";

export default function LandingPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    birthMonth: "",
    birthDay: "",
    birthYear: "",
    birthHour: "12",
    birthMinute: "00",
    birthPeriod: "PM",
    birthCity: "",
    birthCountry: "US",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert 12h → 24h
    let hour = Number(formData.birthHour);
    if (formData.birthPeriod === "PM" && hour !== 12) hour += 12;
    if (formData.birthPeriod === "AM" && hour === 12) hour = 0;

    const params = new URLSearchParams({
      name: formData.name,
      month: formData.birthMonth,
      day: formData.birthDay,
      year: formData.birthYear,
      hour: String(hour),
      minute: formData.birthMinute,
      city: formData.birthCity,
      nation: formData.birthCountry,
    });
    navigate(`/generate?${params.toString()}`);
  };

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const scrollToForm = () => {
    document.getElementById("birth-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* NAVIGATION */}
      <nav className="py-6 px-4 md:px-8 flex items-center justify-between border-b border-gray-100">
        <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          CosmicArt
        </div>
        <button className="text-gray-600 hover:text-gray-900 transition">Login</button>
      </nav>

      {/* HERO SECTION */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Example Artwork */}
          <div className="max-w-md mx-auto mb-12 relative">
            <img src={heroImg} alt="Example birth chart artwork" className="w-full rounded-2xl shadow-2xl" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg">
              <span className="text-sm">
                <span className="font-semibold">Leo Sun</span> • Pisces Moon • Virgo Rising
              </span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 text-center mb-6 leading-tight">
            Transform Your Birth Chart
            <br />
            Into Personalized Artwork
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Each piece is uniquely generated for your exact birth moment—no two are ever the same
          </p>

          {/* BIRTH DATA FORM */}
          <div id="birth-form" className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-10 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Sarah"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition outline-none"
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date</label>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" required value={formData.birthMonth} onChange={(e) => set("birthMonth", e.target.value)} placeholder="MM" min="1" max="12" className={inputClass} />
                  <input type="number" required value={formData.birthDay} onChange={(e) => set("birthDay", e.target.value)} placeholder="DD" min="1" max="31" className={inputClass} />
                  <input type="number" required value={formData.birthYear} onChange={(e) => set("birthYear", e.target.value)} placeholder="YYYY" min="1900" max="2026" className={inputClass} />
                </div>
              </div>

              {/* Birth Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Birth Time</label>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" value={formData.birthHour} onChange={(e) => set("birthHour", e.target.value)} placeholder="HH" min="1" max="12" className={inputClass} />
                  <input type="number" value={formData.birthMinute} onChange={(e) => set("birthMinute", e.target.value)} placeholder="MM" min="0" max="59" className={inputClass} />
                  <select value={formData.birthPeriod} onChange={(e) => set("birthPeriod", e.target.value)} className={inputClass}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-2">💡 Don't know your exact time? Use 12:00 PM</p>
              </div>

              {/* Birth Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Birth Location</label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={formData.birthCity}
                    onChange={(e) => set("birthCity", e.target.value)}
                    placeholder="City"
                    className="col-span-2 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition outline-none"
                  />
                  <select value={formData.birthCountry} onChange={(e) => set("birthCountry", e.target.value)} className={inputClass}>
                    {["US", "GB", "CA", "AU", "DE", "FR", "ES", "IT", "JP", "BR", "MX", "IN"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Generate My Free Artwork →
              </button>
              <div className="space-y-2 text-center">
                <p className="text-sm text-gray-600">✨ Free preview • No credit card required</p>
                <p className="text-xs text-gray-400">🔒 Your data is secure and never shared</p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 mb-16 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">12,847</div>
              <div className="text-gray-600">Artworks Created</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">4.9★</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-gray-600">Satisfaction</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div key={r.initials} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-3 text-yellow-400">★★★★★</div>
                <p className="text-gray-700 mb-4">{r.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                    {r.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="text-sm text-gray-500">{r.signs}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            From your birth data to personalized artwork in 3 simple steps
          </p>
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {[
              { n: "1", title: "Enter Your Birth Data", desc: "Provide your birth date, time, and location. We calculate your complete natal chart." },
              { n: "2", title: "AI Creates Your Artwork", desc: "Our system generates unique artwork incorporating your zodiac symbols and cosmic blueprint." },
              { n: "3", title: "Get It Framed & Shipped", desc: "Love it? Choose your size and frame. We'll ship it professionally framed to your door." },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-4xl font-bold text-purple-600 mx-auto mb-6">
                  {s.n}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-600 text-lg">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button onClick={scrollToForm} className="bg-purple-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg">
              Generate My Free Preview →
            </button>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">Every Chart Tells a Different Story</h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            See how different astrological placements create unique artwork
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {galleryItems.map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="bg-white rounded-xl overflow-hidden shadow-lg transform group-hover:scale-105 transition">
                  <img src={item.img} alt={`Example artwork ${i + 1}`} className="w-full h-80 object-cover" />
                  <div className="p-4">
                    <div className="font-semibold text-gray-900 mb-1">{item.label}</div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-6">What will yours look like?</p>
            <button onClick={scrollToForm} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg">
              Generate My Artwork Now →
            </button>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">More Than Just Decoration</h2>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <img src={lifestyleImg} alt="Framed artwork lifestyle" className="rounded-2xl shadow-2xl" />
            </div>
            <div className="space-y-8">
              {[
                { icon: "✨", title: "Uniquely Yours", desc: "Generated specifically for your birth moment. No two artworks are ever identical—this is YOUR cosmic blueprint." },
                { icon: "🎨", title: "Museum-Quality Materials", desc: "Printed on archival paper with professional framing. Built to last 100+ years without fading." },
                { icon: "💫", title: "Deep Personal Meaning", desc: "Every symbol in your artwork corresponds to your astrological placements. It's a visual representation of who you are." },
                { icon: "🎁", title: "The Perfect Gift", desc: "Give someone their cosmic blueprint. Deeply personal, thoughtful, and beautiful—a gift they'll treasure forever." },
              ].map((v) => (
                <div key={v.title} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-3xl">{v.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">{v.title}</h3>
                    <p className="text-gray-600 text-lg">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="bg-white rounded-xl p-6 shadow-sm cursor-pointer group">
                <summary className="font-semibold text-gray-900 text-lg list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-purple-600 group-open:rotate-180 transition">▼</span>
                </summary>
                <p className="text-gray-600 mt-4 text-lg">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to See Your Cosmic Blueprint?</h2>
          <p className="text-2xl text-purple-100 mb-10">Generate your free preview in under 60 seconds</p>
          <button onClick={scrollToForm} className="bg-white text-purple-600 px-12 py-5 rounded-xl font-semibold text-xl hover:bg-gray-50 transition-all transform hover:scale-105 shadow-2xl">
            Generate My Free Artwork →
          </button>
          <p className="text-purple-100 mt-6 text-lg">✨ No credit card required • 🔒 Your data is secure</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-white text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                CosmicArt
              </div>
              <p className="text-sm">Transforming birth charts into personalized artwork since 2024.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#how" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#gallery" className="hover:text-white transition">Gallery</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/contact" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="/shipping" className="hover:text-white transition">Shipping Info</a></li>
                <li><a href="/returns" className="hover:text-white transition">Returns</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">© 2026 CosmicArt. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
