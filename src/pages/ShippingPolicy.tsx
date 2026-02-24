import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const summaryCards = [
  { icon: "🌍", title: "Global Print Network", desc: "Orders are routed to the print facility nearest you for faster delivery" },
  { icon: "📦", title: "Ships in 2–4 Days", desc: "Most orders are printed and dispatched within 2–4 business days" },
  { icon: "🔒", title: "Secure Packaging", desc: "Every print is carefully packaged to arrive in perfect condition" },
];

const timelineSteps = [
  { icon: "🎨", label: "Print", desc: "Your artwork is produced at a museum-quality facility near you" },
  { icon: "🔍", label: "Quality Check", desc: "Every print is inspected before packaging" },
  { icon: "📦", label: "Dispatch", desc: "Securely packaged and handed to the carrier within 2–4 days" },
  { icon: "🏠", label: "Delivery", desc: "Arrives at your doorstep — times vary by location" },
];

const shippingData = [
  { region: "🇺🇸 United States", production: "2–4 days + 4–6 days", total: "6–10 business days" },
  { region: "🇬🇧 United Kingdom", production: "2–4 days + 2–3 days", total: "4–7 business days" },
  { region: "🇪🇺 Europe (EU)", production: "2–4 days + 5–7 days", total: "7–11 business days" },
  { region: "🇦🇺 Australia", production: "2–4 days + 2–5 days", total: "4–9 business days" },
  { region: "🇨🇦 Canada", production: "2–4 days + 10–15 days", total: "12–19 business days" },
  { region: "🇳🇿 New Zealand", production: "2–4 days + 7–10 days", total: "9–14 business days" },
  { region: "🌏 Rest of World", production: "2–4 days + 10–15 days", total: "12–19 business days" },
];

const trackingCards = [
  { icon: "🇺🇸", title: "US Orders", desc: "All US orders include tracking, regardless of shipping method selected." },
  { icon: "🌍", title: "International Orders", desc: "Standard shipping may or may not include tracking depending on destination. Express shipping always includes tracking." },
  { icon: "🖼️", title: "Framed Orders", desc: "All framed print orders ship with tracking enabled regardless of destination." },
  { icon: "📧", title: "Ship Notification", desc: "You'll receive an email with tracking details as soon as your order is dispatched." },
];

const sections = [
  {
    num: "01",
    title: "From Your Stars to Your Door",
    content: (
      <>
        <p className="text-body text-muted-foreground mb-4">Once you complete your order, here's what happens behind the scenes:</p>

        {/* Timeline */}
        <div className="flex flex-col sm:flex-row items-start sm:items-start gap-5 sm:gap-0 my-8 relative px-0 sm:px-2">
          {/* Connecting line */}
          <div className="hidden sm:block absolute top-7 left-8 right-8 h-[2px] bg-gradient-to-r from-primary via-accent to-primary/40 opacity-40" />
          <div className="sm:hidden absolute top-7 bottom-7 left-6 w-[2px] bg-gradient-to-b from-primary via-accent to-primary/40 opacity-40" />
          {timelineSteps.map((s) => (
            <div key={s.label} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-0 flex-1 relative z-10">
              <div className="w-14 h-14 sm:w-14 sm:h-14 rounded-full bg-card border-2 border-primary/25 flex items-center justify-center text-[22px] shrink-0 sm:mb-3.5 hover:border-primary hover:scale-105 transition-all">
                {s.icon}
              </div>
              <div>
                <div className="text-a5 text-foreground mb-1">{s.label}</div>
                <div className="text-[12px] text-muted-foreground leading-snug">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-body text-muted-foreground">Your order is routed to the print facility closest to your shipping address. We have fulfillment partners across the <strong className="text-foreground font-medium">United States, United Kingdom, Europe, and Australia</strong>, which means shorter shipping distances, lower environmental impact, and faster delivery.</p>
      </>
    ),
  },
  {
    num: "02",
    title: "Estimated Delivery Times",
    content: (
      <>
        <p className="text-body text-muted-foreground mb-4">Delivery estimates below include <strong className="text-foreground font-medium">2–4 business days for production</strong> plus shipping transit time. Business days exclude weekends and public holidays.</p>

        <div className="bg-card border border-border rounded-2xl overflow-hidden my-7">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-subtitle text-primary px-5 py-4 border-b border-border bg-primary/5">Destination</th>
                <th className="text-left text-subtitle text-primary px-5 py-4 border-b border-border bg-primary/5">Production + Shipping</th>
                <th className="text-left text-subtitle text-primary px-5 py-4 border-b border-border bg-primary/5">Total Estimate</th>
              </tr>
            </thead>
            <tbody>
              {shippingData.map((row) => (
                <tr key={row.region} className="hover:bg-card/80 transition-colors">
                  <td className="px-5 py-4 text-body-sm text-foreground border-b border-border/30">{row.region}</td>
                  <td className="px-5 py-4 text-body-sm text-muted-foreground border-b border-border/30">{row.production}</td>
                  <td className="px-5 py-4 text-body-sm text-foreground font-medium border-b border-border/30">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-body text-muted-foreground mb-4">These are estimates, not guarantees. Actual delivery times may vary depending on the shipping carrier, local postal service, customs processing, and seasonal demand. During peak holiday periods (November–December), please allow additional time.</p>

        <div className="bg-primary/10 border-l-[3px] border-primary rounded-r-xl px-6 py-5 my-6">
          <span className="text-a5 text-primary block mb-1.5">Planning a Gift?</span>
          <p className="text-body-sm text-foreground">We recommend ordering at least 3 weeks before your occasion to account for production, shipping, and any unexpected delays — especially for international orders.</p>
        </div>
      </>
    ),
  },
  {
    num: "03",
    title: "Shipping Costs",
    content: (
      <>
        <p className="text-body text-muted-foreground mb-4">Shipping costs are calculated based on the product size, destination, and shipping method. The exact shipping cost for your order is displayed at checkout before you complete your purchase — no surprises.</p>
        <p className="text-body text-muted-foreground">Shipping costs cover secure packaging, carrier fees, and delivery to your address. We do not profit from shipping fees.</p>
      </>
    ),
  },
  {
    num: "04",
    title: "Order Tracking",
    content: (
      <>
        <p className="text-body text-muted-foreground mb-4">Once your order ships, you'll receive an email with your tracking information. Tracking availability depends on your destination and shipping method:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6">
          {trackingCards.map((c) => (
            <div key={c.title} className="bg-card border border-border rounded-xl p-5 hover:border-primary/25 hover:bg-secondary/50 transition-all">
              <span className="text-xl block mb-2.5">{c.icon}</span>
              <div className="text-a5 text-foreground mb-1">{c.title}</div>
              <div className="text-body-sm text-muted-foreground leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>

        <p className="text-body text-muted-foreground">If your tracking information hasn't updated in several days, don't worry — this is common, especially when a package moves between countries or postal systems. Please allow the full estimated delivery window before contacting us.</p>
      </>
    ),
  },
  {
    num: "05",
    title: "Customs, Duties & Taxes",
    content: (
      <>
        <p className="text-body text-muted-foreground mb-4">For international orders, your package may be subject to <strong className="text-foreground font-medium">import duties, taxes, or customs fees</strong> imposed by your country's government. These charges are determined by your local customs authority and are the responsibility of the recipient.</p>
        <p className="text-body text-muted-foreground mb-4">We have no control over these charges and cannot predict their amount. They are not included in our product prices or shipping costs. We recommend checking with your local customs office if you're unsure about potential charges.</p>

        <div className="bg-primary/10 border-l-[3px] border-primary rounded-r-xl px-6 py-5 my-6">
          <span className="text-a5 text-primary block mb-1.5">Please Note</span>
          <p className="text-body-sm text-foreground">If a package is returned to us because delivery was refused due to unpaid customs charges, we are unable to issue a refund for the original order or the return shipping cost. We're happy to reship the order at your expense.</p>
        </div>
      </>
    ),
  },
  {
    num: "06",
    title: "Lost or Delayed Orders",
    content: (
      <>
        <p className="text-body text-muted-foreground mb-4">If your order hasn't arrived within <strong className="text-foreground font-medium">30 days of your order date</strong>, please contact us. We'll investigate with our fulfillment partner and the shipping carrier to locate your package.</p>
        <p className="text-body text-muted-foreground mb-4">If the order is confirmed lost in transit, we'll offer you a <strong className="text-foreground font-medium">full reprint at no cost</strong> or a <strong className="text-foreground font-medium">full refund</strong> — your choice.</p>
        <p className="text-body text-muted-foreground">Several factors can cause delivery delays including peak holiday volume, severe weather, carrier disruptions, and customs processing for international shipments. If there's a significant delay with your order, we'll usually reach out to you proactively.</p>
      </>
    ),
  },
  {
    num: "07",
    title: "Shipping Address",
    content: (
      <>
        <p className="text-body text-muted-foreground mb-4">Please double-check your shipping address at checkout. Once your order enters production, we are unable to change the shipping address. We cannot issue refunds or free replacements for orders delivered to an incorrect address provided by the customer.</p>
        <p className="text-body text-muted-foreground">If you notice an error immediately after placing your order, <strong className="text-foreground font-medium">contact us right away</strong> — if production hasn't started, we may be able to update it.</p>
      </>
    ),
  },
];

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-background bg-cosmic">
      <Header />

      <main className="max-w-[780px] mx-auto px-6">
        {/* Header */}
        <header className="text-center pt-24 pb-14 md:pt-28 md:pb-16">
          <div className="text-subtitle text-primary tracking-[4px] mb-6 opacity-80">Celestial Artworks</div>
          <h1 className="text-a1 text-foreground mb-4" style={{ fontSize: "clamp(36px, 6vw, 56px)", lineHeight: 1.15, fontWeight: 300 }}>
            Shipping Policy
          </h1>
          <p className="text-body text-muted-foreground max-w-[520px] mx-auto">
            Printed near you, delivered to your door. Here's everything you need to know about how your artwork gets to you.
          </p>
          <div className="mt-8 text-primary/60 text-sm tracking-[24px]">✦</div>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {summaryCards.map((c) => (
            <div key={c.title} className="bg-card border border-border rounded-2xl p-7 text-center hover:bg-secondary/50 hover:border-primary/25 transition-all hover:-translate-y-0.5">
              <span className="text-[28px] block mb-3">{c.icon}</span>
              <div className="text-a5 text-foreground mb-1.5">{c.title}</div>
              <div className="text-body-sm text-muted-foreground leading-snug">{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        {sections.map((s, i) => (
          <div key={s.num}>
            <section className="mb-12 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="text-subtitle text-primary/70 tracking-[3px] mb-2">{s.num}</div>
              <h2 className="text-a2 text-foreground mb-5" style={{ fontSize: "clamp(24px, 4vw, 32px)" }}>{s.title}</h2>
              <div>{s.content}</div>
            </section>
            {i < sections.length - 1 && (
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-12" />
            )}
          </div>
        ))}

        {/* EU/UK statutory notice */}
        <div className="bg-card border border-border rounded-2xl p-8 my-12">
          <span className="text-subtitle text-accent tracking-[3px] block mb-3">EU & UK Customers</span>
          <h3 className="text-a2 text-foreground mb-4" style={{ fontSize: 22 }}>Risk of Loss During Shipping</h3>
          <p className="text-body-sm text-muted-foreground leading-relaxed mb-3">For customers in the European Economic Area and United Kingdom, we bear the risk of loss or damage to your order during shipping. Risk transfers to you when you (or a person you've designated) physically takes possession of the goods, in accordance with Article 20 of the EU Consumer Rights Directive and Section 29 of the UK Consumer Rights Act 2015.</p>
          <p className="text-body-sm text-muted-foreground leading-relaxed">For customers in the United States, risk of loss passes to you when the carrier accepts the shipment for delivery, in accordance with common carrier law.</p>
        </div>

        {/* Contact CTA */}
        <section className="text-center py-16">
          <h2 className="text-a2 text-foreground mb-3" style={{ fontSize: "clamp(24px, 4vw, 32px)" }}>Questions About Your Order?</h2>
          <p className="text-body text-muted-foreground mb-7">We're here to help with any shipping questions or concerns.</p>
          <a
            href="mailto:hello@celestialartworks.com"
            className="inline-flex items-center gap-2.5 border border-primary text-primary text-subtitle tracking-[1.5px] px-9 py-3.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_hsl(45_80%_65%/0.2)]"
          >
            <span>✉</span> hello@celestialartworks.com
          </a>
        </section>

        {/* Footer meta */}
        <div className="border-t border-border py-8 text-center">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Celestial Artworks · Operated by Human Brand Firm LLC<br />
            924 N Magnolia Ave, Suite 202 Unit #5014, Orlando, FL 32803<br />
            <a href="/returns" className="text-primary/80 hover:text-primary transition">Returns Policy</a> · <a href="/terms" className="text-primary/80 hover:text-primary transition">Terms and Conditions</a> · <a href="/privacy" className="text-primary/80 hover:text-primary transition">Privacy Policy</a><br />
            Last updated February 28, 2026
          </p>
        </div>
      </main>
    </div>
  );
}
