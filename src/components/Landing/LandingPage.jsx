import { useState } from "react";
import { useGenerator } from '@/contexts/GeneratorContext';
import FAQSection from "@/components/ui/FAQSection";
import BirthDataFormCard from "./BirthDataFormCard";
import { ShineBorder } from "@/components/ui/shine-border";
import heroMobile from "@/assets/hero-mobile.webp";
import heroDesktop from "@/assets/hero-desktop.webp";
import emmaChart from "@/assets/gallery/emma-chart.webp";
import danielChart from "@/assets/gallery/daniel-chart.webp";
import capricornWall from "@/assets/gallery/capricorn-wall.jpg";
import mariaChart from "@/assets/gallery/maria-chart.webp";
import taurusArtwork from "@/assets/gallery/taurus-artwork.jpg";
import womanHolding from "@/assets/gallery/woman-holding.webp";
import galaxyBg from "@/assets/galaxy-bg.jpg";
import saturnPlanet from "@/assets/gallery/saturn-planet.jpg";
import canvasDetail from "@/assets/gallery/canvas-detail.jpg";
import libraWall from "@/assets/gallery/libra-wall.jpg";
import virgoArtwork from "@/assets/gallery/virgo-artwork.jpg";
import jamesChart from "@/assets/gallery/james-chart.webp";
import gallery2 from "@/assets/gallery/example-2.jpg";
import gallery3 from "@/assets/gallery/example-3.jpg";
import moonSurface from "@/assets/gallery/moon-surface.jpg";
import earthSpace from "@/assets/gallery/earth-space.jpg";
import capricornGallery from "@/assets/gallery/capricorn-gallery.jpg";
import taurusExample from "@/assets/gallery/taurus-example.jpg";
import customerDisplay1 from "@/assets/gallery/customer-display-1.webp";
import customerDisplay2 from "@/assets/gallery/customer-display-2.webp";
import customerDisplay3 from "@/assets/gallery/customer-display-3.webp";
import customerDisplay4 from "@/assets/gallery/customer-display-4.webp";
import customerDisplay5 from "@/assets/gallery/customer-display-5.webp";
import customerDisplay6 from "@/assets/gallery/customer-display-6.webp";
import customerDisplay7 from "@/assets/gallery/customer-display-7.webp";
import customerDisplay8 from "@/assets/gallery/customer-display-8.webp";
import customerDisplay9 from "@/assets/gallery/customer-display-9.webp";
import customerDisplay10 from "@/assets/gallery/customer-display-10.webp";
import heroCustomer1 from "@/assets/hero/customer-1.webp";
import heroCustomer2 from "@/assets/hero/customer-2.webp";
import heroCustomer3 from "@/assets/hero/customer-3.webp";
import heroCustomer4 from "@/assets/hero/customer-4.webp";
import heroCustomer5 from "@/assets/hero/customer-5.webp";
import heroCustomer6 from "@/assets/hero/customer-6.webp";

import ProgressBar from "@/components/ui/ProgressBar";
import InteractiveHotspots from "./InteractiveHotspots";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import GalleryTile from "./GalleryTile";
import CustomerReactionsCarousel from "./CustomerReactionsCarousel";
import CustomerReactionsCarouselMobile from "./CustomerReactionsCarouselMobile";
import { ThreeDPhotoCarousel } from "@/components/ui/3d-carousel";
import { ImageMarquee } from "@/components/ui/image-marquee";

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
  { q: "What sizes are available?", a: "We offer three canvas sizes: 12\"×18\" ($79), 16\"×24\" ($119 — most popular), and 20\"×30\" ($179). All prints are museum-quality stretched canvas, ready to hang." },
  { q: "Do you ship internationally?", a: "Yes! We offer free shipping to the US, UK, Canada, and Australia." },
  { q: "What's your refund policy?", a: "We stand behind every print. If your artwork arrives damaged or defective, contact us within 30 days — we'll reprint it for free or issue a full refund, your choice." },
];

const galleryItems = [
  { img: customerDisplay1, label: "Colorful face artwork in loft" },
  { img: customerDisplay2, label: "Mountain island artwork on wall" },
  { img: customerDisplay3, label: "Botanical moth woodcut artwork" },
  { img: customerDisplay4, label: "Vibrant face artwork with brick wall" },
  { img: customerDisplay5, label: "Astronaut artwork in cozy room" },
  { img: customerDisplay6, label: "Mountain meditation artwork" },
  { img: customerDisplay7, label: "Piano player cosmic artwork" },
  { img: customerDisplay8, label: "Colorful fish artwork" },
  { img: customerDisplay9, label: "Face with sunglasses artwork" },
  { img: customerDisplay10, label: "Mountain sunset mixed media artwork" },
];

const heroMarqueeImages = [
  { src: heroCustomer1, tags: [{ emoji: "☀️", label: "Virgo" }, { emoji: "🌙", label: "Gemini" }, { emoji: "⬆️", label: "Libra" }] },
  { src: heroCustomer2, tags: [{ emoji: "☀️", label: "Taurus" }, { emoji: "🌙", label: "Pisces" }, { emoji: "⬆️", label: "Sagittarius" }] },
  { src: heroCustomer3, tags: [{ emoji: "☀️", label: "Aquarius" }, { emoji: "🌙", label: "Cancer" }, { emoji: "⬆️", label: "Leo" }] },
  { src: heroCustomer4, tags: [{ emoji: "☀️", label: "Libra" }, { emoji: "🌙", label: "Taurus" }, { emoji: "⬆️", label: "Pisces" }] },
  { src: heroCustomer5, tags: [{ emoji: "☀️", label: "Aries" }, { emoji: "🌙", label: "Scorpio" }, { emoji: "⬆️", label: "Capricorn" }] },
  { src: heroCustomer6, tags: [{ emoji: "☀️", label: "Scorpio" }, { emoji: "🌙", label: "Leo" }, { emoji: "⬆️", label: "Gemini" }] },
  { src: heroCustomer1, tags: [{ emoji: "☀️", label: "Capricorn" }, { emoji: "🌙", label: "Aries" }, { emoji: "⬆️", label: "Virgo" }] },
];

/* ─── Component ─── */

export default function LandingPage() {
  const { handleFormSubmit, isCalculatingChart, error } = useGenerator();

  // Shared form state — passed to all BirthDataFormCard instances
  const [formData, setFormData] = useState({
    name: "", birthMonth: "", birthDay: "", birthYear: "",
    birthCity: "", birthCountry: "US", lat: null, lng: null,
  });

  const [mobileHeroStep, setMobileHeroStep] = useState('date');

  const handleFormComplete = (params) => {
    handleFormSubmit(params);
  };

  const scrollToForm = () => {
    document.getElementById("birth-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const fillTestData = () => {
    setFormData({ name: "Sarah", birthMonth: "6", birthDay: "15", birthYear: "1995", birthCity: "New York", birthCountry: "US", lat: null, lng: null });
    document.getElementById("birth-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {import.meta.env.DEV && (
        <button onClick={fillTestData} className="fixed bottom-4 right-4 z-50 bg-card text-foreground px-4 py-2 rounded-full text-body shadow-lg hover:bg-card/80 transition opacity-70 hover:opacity-100 border border-border">
          🧪 Fill Test Data
        </button>
      )}

      {/* NAVIGATION */}
      <Header />

      {/* ═══════════════════ HERO ═══════════════════ */}
      {/* Mobile hero */}
      <section className="lg:hidden relative overflow-hidden min-h-[700px]">
        <div className="absolute inset-0">
          <div className="flex items-start justify-center h-full pt-[72px]">
            <ImageMarquee images={heroMarqueeImages} duration={25} />
          </div>
        </div>
        <div className="relative z-10 flex flex-col justify-end min-h-[700px] px-4 py-[15px]" style={{ marginTop: '-40px' }}>

          <div className="w-full md:max-w-[500px] mx-auto min-w-0">
            <div
              className="flex flex-col items-stretch w-full rounded-[2px]"
              style={{
                background: 'rgba(17, 17, 17, 0.70)',
                backdropFilter: 'blur(17px)',
                WebkitBackdropFilter: 'blur(17px)',
                padding: '24px 16px 32px 16px',
              }}
            >
              {mobileHeroStep !== 'photo' && (
                <div className="flex flex-col gap-3 lg:gap-3 text-center mb-6" style={{ gap: '12px' }}>
                  <h2 className="text-a2 lg:text-a1 text-foreground">
                    Turn Your Birth<br />
                    Into Gallery-Worthy Art
                  </h2>
                  <p className="text-body mx-auto" style={{ color: '#ffffff', maxWidth: '344px' }}>
                    Every element in your artwork corresponds to a specific astrological placement.
                  </p>
                </div>
              )}
              <BirthDataFormCard formData={formData} setFormData={setFormData} onSubmit={handleFormComplete} submitLabel="Show me my artwork" gap={9} onStepChange={setMobileHeroStep} isSubmitting={isCalculatingChart} submitError={error} />
            </div>
          </div>
        </div>
      </section>

      {/* Desktop hero — gallery wall */}
      <section className="hidden lg:block relative min-h-[740px] overflow-hidden">
        <div className="absolute inset-0">
          <div className="flex items-start justify-center h-full pt-[60px]">
            <ImageMarquee images={heroMarqueeImages} duration={35} />
          </div>
        </div>
        <div className="relative z-20 flex flex-col justify-end min-h-[740px] pb-0 px-6">
          {/* Bottom row: text left + form bar right */}
          <div className="flex items-end gap-10 pb-10 max-w-5xl mx-auto w-full">
            {/* Left: text */}
            <div className="flex-shrink-0">
              <h1 className="text-a1 text-foreground mb-4 leading-[1.05]" style={{ fontSize: '38px', lineHeight: '42px' }}>
                Turn Your Birth<br />
                Into Gallery-Worthy Art
              </h1>
              <p className="text-body max-w-md" style={{ color: '#ffffff' }}>
                Every element in your artwork corresponds to a specific<br className="hidden lg:block" />
                astrological placement.
              </p>
            </div>
            {/* Right: inline form bar */}
            <div
              className="flex-1 min-w-0 rounded-[2px]"
              style={{
                background: 'rgba(17, 17, 17, 0.70)',
                backdropFilter: 'blur(17px)',
                WebkitBackdropFilter: 'blur(17px)',
                padding: '28px 32px',
              }}
            >
              <BirthDataFormCard formData={formData} setFormData={setFormData} onSubmit={handleFormComplete} submitLabel="Show me my artwork" inline isSubmitting={isCalculatingChart} submitError={error} />
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges strip */}
      <div className="hidden md:flex items-center justify-center gap-6 py-3.5 text-body" style={{ backgroundColor: '#F2F1EF', color: '#000000' }}>
        <span>🔒 Secure Payment</span>
        <span style={{ color: '#00000030' }}>|</span>
        <span>📦 Free Shipping</span>
        <span style={{ color: '#00000030' }}>|</span>
        <span>↩️ 30-Day Quality Guarantee</span>
      </div>

      {/* ═══════════════════ SOCIAL PROOF STATS ═══════════════════ */}
      <section className="bg-white text-surface-foreground px-6 overflow-x-clip lg:overflow-visible">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 text-center py-[60px] md:py-[85px]" style={{ gap: '30px' }}>
            <div>
              <div className="text-a1 text-surface-foreground mb-2">2,000+</div>
              <div className="text-body text-surface-muted">Artworks Created</div>
            </div>
            <div>
              <div className="text-a1 text-surface-foreground mb-2">4.9 <span className="inline-block align-middle text-[0.7em] opacity-60">☆</span></div>
              <div className="text-body text-surface-muted">Average Rating</div>
            </div>
            <div>
              <div className="text-a1 text-surface-foreground mb-2">98%</div>
              <div className="text-body text-surface-muted">Display It Proudly</div>
            </div>
            <div>
              <div className="text-a1 text-surface-foreground mb-2">23</div>
              <div className="text-body text-surface-muted">Countries Shipped</div>
            </div>
          </div>

          {/* Gallery cards */}
          <div className="flex gap-[10px] overflow-x-auto -ml-6 -mr-6 lg:ml-0 lg:mr-0 scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:justify-items-center lg:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div aria-hidden="true" className="w-6 min-w-6 flex-shrink-0 snap-center lg:hidden" />
            {[
              {
                img: emmaChart, name: "Emma", signs: "Sagittarius Sun, Pisces Moon",
                explanations: [
                  { icon: "☀️", title: "Sagittarius Sun · Expansion", description: "The explosive burst of color erupting upward captures her Sagittarius sun—boundless curiosity, a hunger for meaning, and energy that refuses to be contained." },
                  { icon: "🌙", title: "Pisces Moon · Depth", description: "The rippling water and floating island speak to her Pisces moon's dreamy inner world—emotionally vast, intuitive, and rooted in something deeper than what's seen on the surface." },
                  { icon: "⬆️", title: "Leo Rising · Presence", description: "The crowned figure standing tall at the peak radiates her Leo ascendant—a natural magnetism and quiet command that draws every eye in the room." },
                  { icon: "🔴", title: "Mars in Aries · Fire", description: "Those bold red and orange splashes erupting outward reflect her Mars in Aries—raw drive, fearless initiative, and an instinct to lead rather than follow." },
                  { icon: "💙", title: "Neptune in Aquarius · Vision", description: "The scattered cosmic particles and deep teal tones dissolving into space mirror her Neptune placement—an imagination that doesn't just dream but reimagines what's possible." },
                  { icon: "🌲", title: "Saturn in Capricorn · Foundation", description: "The ancient stone base and steadfast trees grounding the floating island reveal her Saturn in Capricorn—no matter how high she soars, she's built on discipline and quiet endurance." },
                  { icon: "✨", title: "Jupiter in Sagittarius · Abundance", description: "Jupiter at home in Sagittarius amplifies everything—the sheer scale of the color explosion, the sense that her world is always expanding beyond its own edges." },
                ],
              },
              {
                img: danielChart, name: "Daniel", signs: "Capricorn Sun, Scorpio Moon",
                explanations: [
                  { icon: "☀️", title: "Capricorn Sun · Endurance", description: "The monumental stone face carved from angular, weathered rock embodies his Capricorn sun—built to last, shaped by time, and carrying a quiet authority that doesn't need to announce itself." },
                  { icon: "🌙", title: "Scorpio Moon · Intensity", description: "The piercing blue eye gazing out from beneath layers of stone reveals his Scorpio moon—still waters that run dangerously deep, with an emotional intensity he lets few people see." },
                  { icon: "⬆️", title: "Aquarius Rising · Fracture", description: "The geometric, fragmented construction of the face reflects his Aquarius ascendant—he presents to the world as someone who thinks differently, unconventional in structure, impossible to categorize." },
                  { icon: "🔴", title: "Mars in Leo · Color", description: "The vivid reds and golds exploding across the right side channel his Mars in Leo—when he acts, it's bold, dramatic, and impossible to ignore." },
                  { icon: "💧", title: "Venus in Pisces · Flow", description: "The rushing stream at the base softens all that stone, mirroring his Venus in Pisces—beneath the composed exterior lives a romantic tenderness that moves like water, finding its way through every crack." },
                  { icon: "🌲", title: "Saturn in Virgo · Detail", description: "Every precise fold and facet of the sculpted face speaks to his Saturn in Virgo—a perfectionist's discipline, the patience to refine something until every angle is exactly right." },
                  { icon: "🔺", title: "Pluto in Sagittarius · Transformation", description: "The triangle framing the entire composition points upward like an arrow, echoing his Pluto in Sagittarius—a life defined by profound transformation through seeking truth and pushing past known horizons." },
                  { icon: "✨", title: "Mercury in Capricorn · Structure", description: "The trees rooted at the very crown of his mind reflect Mercury in Capricorn—thoughts that grow slowly, deliberately, always reaching higher from a foundation of logic and lived experience." },
                ],
              },
              {
                img: mariaChart, name: "Maria", signs: "Cancer Sun, Taurus Moon",
                explanations: [
                  { icon: "☀️", title: "Cancer Sun · Legacy", description: "The vintage sewing machine at the heart of the piece channels her Cancer sun—a soul woven from family memory, ancestral warmth, and the quiet power of keeping loved ones stitched together." },
                  { icon: "🌙", title: "Taurus Moon · Craft", description: "The wooden spools and tangible threads grounding the composition reflect her Taurus moon—she finds emotional safety in what she can touch, build, and shape with her own hands." },
                  { icon: "⬆️", title: "Pisces Rising · Dissolve", description: "The figure emerging from flowing cosmic color on the right reveals her Pisces ascendant—the way she appears to others is fluid, ethereal, as though she's always half in this world and half somewhere beyond it." },
                  { icon: "🔴", title: "Mars in Scorpio · Thread", description: "The needles and pins bristling outward from the globe mirror her Mars in Scorpio—a fierce protectiveness that's always working beneath the surface, precise, deliberate, and not to be underestimated." },
                  { icon: "🌍", title: "North Node in Sagittarius · World", description: "The Earth wrapped in thread at the center speaks to her North Node in Sagittarius—a life path pulling her to expand beyond the familiar, to stitch her personal story into something universal." },
                  { icon: "💛", title: "Venus in Leo · Color", description: "The golden and rose streams pouring through the machine capture her Venus in Leo—she loves boldly, generously, and transforms everything she touches into something more vivid than it was before." },
                  { icon: "💙", title: "Neptune in Aquarius · Vision", description: "The starfield dissolving into the silhouette's profile echoes her Neptune in Aquarius—an imagination that doesn't just dream of beauty but envisions entirely new ways of creating it." },
                  { icon: "🪐", title: "Saturn in Cancer · Roots", description: "The ornate gold detailing on the machine itself reflects Saturn in Cancer—tradition carried forward with reverence, the understanding that the most enduring things are made with patience and love passed down through generations." },
                ],
              },
              {
                img: jamesChart, name: "James", signs: "Aries Sun, Cancer Moon",
                explanations: [
                  { icon: "☀️", title: "Aries Sun · Fire", description: "The blazing red sun crowning the mountain peak is pure Aries energy—a born leader who charges forward, plants his flag at the summit, and dares the world to keep up." },
                  { icon: "🌙", title: "Cancer Moon · Cauldron", description: "The swirling teal pool at the base holds everything together, reflecting his Cancer moon—beneath the warrior exterior is an emotional depth that nurtures, protects, and carries the memories of everyone he loves." },
                  { icon: "⬆️", title: "Scorpio Rising · Third Eye", description: "The all-seeing eye at the center of the forehead channels his Scorpio ascendant—others feel seen in his presence, sometimes uncomfortably so. He reads what's unspoken before a word is said." },
                  { icon: "🌿", title: "Venus in Taurus · Growth", description: "The lush branches, flowers, and botanical life exploding outward in every direction mirror his Venus in Taurus—he loves through abundance, through making things grow, through surrounding the people he cares about with beauty." },
                  { icon: "🔴", title: "Mars in Aries · Summit", description: "The snow-capped mountain rising from the crown of the head doubles down on his Mars at home in Aries—relentless ambition, a need to conquer, and the stamina to climb no matter how steep the path." },
                  { icon: "🌊", title: "Neptune in Pisces · Spiral", description: "The hypnotic spiral in the pool below speaks to his Neptune in Pisces—a spiritual undertow pulling him toward meaning, mysticism, and questions most people are afraid to sit with." },
                  { icon: "🪐", title: "Jupiter in Sagittarius · Abundance", description: "The sheer maximalism of the composition—every corner overflowing with life, color, and detail—reflects Jupiter in Sagittarius at its fullest. His world is never small, never quiet, never enough." },
                  { icon: "🦌", title: "North Node in Capricorn · Antlers", description: "The antler-like branches extending from the temples echo his North Node in Capricorn—a life path growing toward wisdom, authority, and the kind of ancient strength that only comes from enduring seasons." },
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
            <div aria-hidden="true" className="w-6 min-w-6 flex-shrink-0 lg:hidden" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA BREAK ═══════════════════ */}
      <section className="py-[60px] px-4 bg-white text-surface-foreground">
        <div className="max-w-lg mx-auto text-center flex flex-col items-center gap-5">
          <h2 className="text-a2 text-surface-foreground leading-snug">
            Ready to turn your birth data into some awesome wall art?
          </h2>
          <button onClick={scrollToForm} className="bg-surface-foreground text-surface px-8 h-12 w-full md:w-auto rounded-full text-a4 hover:opacity-90 transition-all shadow-lg">
            Generate your free preview
          </button>
          <p className="text-body text-surface-muted">Free preview in 60 seconds.</p>
        </div>
      </section>

      {/* ═══════════════════ EVERY SYMBOL HAS MEANING (Interactive) ═══════════════════ */}
      <InteractiveHotspots onScrollToForm={scrollToForm} />

      {/* ═══════════════════ 4 SIMPLE STEPS ═══════════════════ */}
      <section className="py-[85px] overflow-x-clip" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="mx-auto px-4" style={{ maxWidth: 880 }}>
          <h2 className="text-a2 text-center text-surface-foreground mb-10 md:whitespace-nowrap">
            Your custom artwork in 4 simple steps
          </h2>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="overflow-x-auto md:overflow-visible -mx-4 md:mx-0 snap-x snap-mandatory md:snap-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="relative flex gap-6 md:px-0 md:grid md:grid-cols-4 md:gap-10 w-max md:w-full md:mx-auto" style={{ maxWidth: 880 }}>
            {/* Connecting line through circles — mobile: from center of 1st to center of 4th circle */}
            {/* Connecting line: center of 1st circle (124px) to center of 4th circle (796px) = 672px wide */}
            <div className="md:hidden absolute top-6 h-px bg-surface-border" style={{ left: 124, width: 672 }} />
            <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-surface-border" />

            <div aria-hidden="true" className="w-6 min-w-6 flex-shrink-0 snap-center md:hidden" />
            {[
              { n: "1", title: "Enter your birth data", desc: "Provide your birth date, time, and location. We calculate your complete natal chart." },
              { n: "2", title: "Choose your style", desc: "Pick from multiple artistic styles — each transforms your chart into a different visual experience." },
              { n: "3", title: "We create your artwork", desc: "Your unique artwork is crafted from your zodiac symbols and cosmic blueprint." },
              { n: "4", title: "Get it printed & shipped", desc: "Love it? Choose your canvas size. We'll print and ship your museum-quality canvas to your door." },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center flex-shrink-0 snap-center w-[200px] md:w-auto relative z-10">
                <div className="w-12 h-12 md:w-14 md:h-14 border border-surface-border bg-white rounded-full flex items-center justify-center text-xl md:text-2xl text-surface-foreground flex-shrink-0 font-display font-medium">
                  {s.n}
                </div>
                <div className="mt-6">
                  <h3 className="text-a4 text-surface-foreground mb-[24px]">{s.title}</h3>
                  <p className="text-body text-surface-muted">{s.desc}</p>
                </div>
              </div>
            ))}
            <div aria-hidden="true" className="w-6 min-w-6 flex-shrink-0 md:hidden" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ GIFT + MATERIALS TILES ═══════════════════ */}
      <section className="py-[85px] bg-surface">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* The Perfect Gift */}
          <div>
            <div className="overflow-hidden rounded-[2px]" style={{ aspectRatio: '40/29' }}>
              <img src={womanHolding} alt="Happy customer holding her birth chart canvas artwork" className="w-full h-full object-cover md:h-[406px]" loading="lazy" />
            </div>
            <div className="mt-4">
              <p className="text-subtitle text-surface-muted tracking-widest mb-2">THE PERFECT GIFT</p>
              <h3 className="text-a2 text-surface-foreground mb-4">Impossible to Duplicate. Impossible to Forget.</h3>
              <p className="text-body text-surface-muted mb-6">
                Birthdays. Anniversaries. New homes. Give a gift that's impossible to buy anywhere else—because it's created from their exact birth moment. Every friend who sees it will ask.
              </p>
              <button onClick={scrollToForm} className="link-a5 font-body text-surface-foreground">
                Create a gift
              </button>
            </div>
          </div>

          {/* Museum-Quality Materials */}
          <div>
            <div className="overflow-hidden rounded-[2px]" style={{ aspectRatio: '40/29' }}>
              <img src={canvasDetail} alt="Close-up of museum-quality canvas print detail" className="w-full h-full object-cover md:h-[406px]" loading="lazy" />
            </div>
            <div className="mt-4">
              <p className="text-subtitle text-surface-muted tracking-widest mb-2">MUSEUM-QUALITY MATERIALS</p>
              <h3 className="text-a2 text-surface-foreground mb-4">Materials So Good, Museums Use Them</h3>
              <p className="text-body text-surface-muted mb-6">
                Your artwork arrives ready to hang—printed on premium stretched canvas using a 12-color giclée process for stunning color depth and museum-grade archival quality. Built to last a lifetime.
              </p>
              <button onClick={scrollToForm} className="link-a5 font-body text-surface-foreground">
                Generate my free artwork
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CUSTOMER GALLERY ═══════════════════ */}
      <section className="bg-white text-surface-foreground overflow-hidden py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-4">
          <p className="text-subtitle text-surface-muted text-center mb-2 tracking-widest">
            REAL HOMES. REAL CUSTOMERS. REAL REACTIONS.
          </p>
          <h2 className="text-a2 text-center text-surface-foreground mb-2 md:mb-8">
            See how customers display<br />their cosmic art
          </h2>

          <ThreeDPhotoCarousel
            cards={galleryItems.map((item) => item.img)}
          />
        </div>
      </section>

      {/* ═══════════════════ BIRTH DATA FORM + TESTIMONIALS ═══════════════════ */}
      <section className="py-24 md:py-32 pb-12 md:pb-16 relative overflow-hidden" id="birth-form">
        {/* Galaxy background image */}
        <img src={galaxyBg} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" loading="lazy" />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 max-w-[566px] mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-a2 text-foreground">
              See your birth chart art<br />in 60 seconds
            </h2>
          </div>

          <div className="min-w-0 mx-auto w-full max-w-[500px]">
            <div
              className="flex flex-col items-stretch rounded-[2px]"
              style={{
                background: 'rgba(17, 17, 17, 0.70)',
                backdropFilter: 'blur(17px)',
                WebkitBackdropFilter: 'blur(17px)',
                padding: '24px 48px 48px 48px',
                minWidth: 320,
              }}
            >
              <BirthDataFormCard formData={formData} setFormData={setFormData} onSubmit={handleFormComplete} gap={30} />
            </div>
          </div>
        </div>

        {/* Testimonials — same section, shares galaxy background */}
        <div className="relative z-10 hidden md:block mt-8 max-w-[566px] mx-auto px-4">
          <CustomerReactionsCarousel />
        </div>
        <div className="relative z-10 md:hidden mt-12 px-4">
          <CustomerReactionsCarouselMobile />
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <FAQSection items={faqs} />

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <Footer onScrollToForm={scrollToForm} />
    </div>
  );
}
