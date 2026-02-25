import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import FloatingBackButton from "@/components/ui/FloatingBackButton";

const sections = [
  {
    num: "01",
    title: "Custom-Made Products",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">Every artwork sold by Celestial Artworks is custom-created from your unique birth data — your birth date, time, and location. Each piece is a bespoke, personalised product made to your individual specifications. No order would exist unless a personalised commission was provided.</p>
        <p className="text-body text-surface-muted mb-4">Because our products are tailor-made and bespoke, they are exempt from the standard right of cancellation once production has commenced. This exemption applies under the UK Consumer Contracts Regulations 2013 (Regulation 28(1)(b)), the EU Consumer Rights Directive (Article 16(c)), and equivalent consumer protection laws in other jurisdictions.</p>
        <p className="text-body text-surface-muted">You will see a full digital preview of your artwork before purchasing. By confirming your order, you acknowledge the custom nature of the product and agree that the order is non-refundable once production has begun.</p>
      </>
    ),
  },
  {
    num: "02",
    title: "Cancellations Before Production",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">You may cancel your order and receive a full refund at any time before it enters production. To cancel, email us immediately at <a href="mailto:hello@celestialartworks.com" className="text-primary hover:underline">hello@celestialartworks.com</a> with your order number.</p>
        <p className="text-body text-surface-muted">Once your order moves to "In Production" status, it cannot be cancelled. Our print partners begin creating your custom piece immediately upon production start, and the process cannot be reversed. If you need to cancel, contact us as soon as possible — the sooner you reach out, the more likely we can catch it before production begins.</p>
      </>
    ),
  },
  {
    num: "03",
    title: "Damaged or Defective Products",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">We partner with museum-quality print facilities and stand behind every piece. However, transit damage can occasionally occur. If your print arrives damaged, defective, or substantially different from what you ordered, we want to know about it and we will make it right at our expense.</p>
        <p className="text-body text-surface-muted mb-4">You have <strong className="text-surface-foreground font-medium">30 days from delivery</strong> to report any issue. Here's how:</p>
        <ol className="list-decimal pl-6 text-body text-surface-muted space-y-2 mb-6">
          <li>Email us at <a href="mailto:hello@celestialartworks.com" className="text-primary hover:underline">hello@celestialartworks.com</a> with your order number.</li>
          <li>Describe the issue and include clear photographs of the damage or defect (and packaging, if possible).</li>
          <li>We will review your claim and respond within 2 business days.</li>
        </ol>
        <p className="text-body text-surface-muted mb-4">Once we verify the issue, you choose your preferred remedy:</p>
        <div className="bg-surface-card border border-surface-border rounded-[2px] overflow-hidden my-7">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-subtitle text-primary px-5 py-4 border-b border-surface-border bg-primary/5">Remedy</th>
                <th className="text-left text-subtitle text-primary px-5 py-4 border-b border-surface-border bg-primary/5">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-surface/80 transition-colors">
                <td className="px-5 py-4 text-body text-surface-foreground font-medium border-b border-surface-border/30">Reprint & Reship</td>
                <td className="px-5 py-4 text-body text-surface-muted border-b border-surface-border/30">We produce a new print and ship it to you at no extra cost.</td>
              </tr>
              <tr className="hover:bg-surface/80 transition-colors">
                <td className="px-5 py-4 text-body text-surface-foreground font-medium border-b border-surface-border/30">Full Refund</td>
                <td className="px-5 py-4 text-body text-surface-muted border-b border-surface-border/30">We refund the full amount to your original payment method within 10 business days.</td>
              </tr>
              <tr className="hover:bg-surface/80 transition-colors">
                <td className="px-5 py-4 text-body text-surface-foreground font-medium">Store Credit</td>
                <td className="px-5 py-4 text-body text-surface-muted">Receive credit for the full amount to use on a future order.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-body text-surface-muted">If we need the defective item returned for investigation, we will reimburse your return shipping costs upon receipt of supporting postage receipts. You are responsible for the safekeeping and reasonable care of the product until it is returned to us.</p>
      </>
    ),
  },
  {
    num: "04",
    title: "Lost in Transit",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">If your order has not arrived within <strong className="text-surface-foreground font-medium">30 days of your order date</strong>, contact us and we will investigate with our fulfillment partner and the shipping carrier. If the order is confirmed lost in transit, we will send a free replacement or issue a full refund — your choice.</p>
        <p className="text-body text-surface-muted">Please note that we cannot offer free replacements for orders not received due to an incorrect shipping address provided by the customer.</p>
      </>
    ),
  },
  {
    num: "05",
    title: "What We Cannot Refund",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">Because each piece is custom-created, we are unable to offer refunds or accept returns for:</p>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-2">
          <li>Change of mind after purchase</li>
          <li>Minor colour variations between your screen and the printed product — slight differences are inherent to any printing process and are not considered defects</li>
          <li>Customs duties or import taxes charged by your country upon delivery</li>
          <li>Incorrect shipping address provided by the customer</li>
          <li>Refusal of delivery due to unpaid customs charges</li>
          <li>Products damaged by the customer after delivery</li>
        </ul>
      </>
    ),
  },
  {
    num: "06",
    title: "Incorrect Shipping Address",
    content: (
      <p className="text-body text-surface-muted">If the shipping address provided at checkout is incorrect, you are responsible for the order. The delivery carrier will typically return the package to the return address. If you contact us promptly, we may be able to reship the order to the correct address at your expense. We cannot issue refunds for orders returned due to an incorrect address.</p>
    ),
  },
  {
    num: "07",
    title: "Refund Processing",
    content: (
      <p className="text-body text-surface-muted">Approved refunds are credited to your original payment method. Please allow up to <strong className="text-surface-foreground font-medium">10 business days</strong> for the refund to appear in your account. Processing times may vary depending on your bank or payment provider.</p>
    ),
  },
  {
    num: "08",
    title: "EU & UK Statutory Rights",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">If you are located in the European Economic Area or United Kingdom, nothing in this policy limits your statutory rights under applicable consumer protection law.</p>
        <p className="text-body text-surface-muted mb-4">Your artwork is custom-made to your individual specifications and is exempt from the standard 14-day right of withdrawal under Article 16(c) of the EU Consumer Rights Directive and Regulation 28(1)(b) of the UK Consumer Contracts Regulations 2013.</p>
        <p className="text-body text-surface-muted">However, if you receive a defective or non-conforming product, you retain your full statutory rights to repair, replacement, or refund under the EU Consumer Sales Directive and the UK Consumer Rights Act 2015, including the 30-day short-term right to reject. We bear the risk of loss or damage during shipping until you physically take possession of the goods.</p>
      </>
    ),
  },
];

const summaryCards = [
  { icon: "🎨", title: "Custom-Made", desc: "Every artwork is bespoke — created from your unique birth data" },
  { icon: "🛡️", title: "30-Day Protection", desc: "Report any damage or defects within 30 days of delivery" },
  { icon: "✅", title: "Your Choice", desc: "Reprint, full refund, or store credit for verified issues" },
];

export default function ReturnsPolicy() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <Header />

      <main className="max-w-[780px] mx-auto px-6">
        {/* Header */}
        <header className="text-center pt-24 pb-14 md:pt-28 md:pb-16">
          <div className="text-subtitle text-primary tracking-[4px] mb-6 opacity-80">Celestial Artworks</div>
          <h1 className="text-a1 text-surface-foreground mb-4" style={{ fontSize: "clamp(36px, 6vw, 56px)", lineHeight: 1.15, fontWeight: 300 }}>
            Returns & Refund Policy
          </h1>
          <p className="text-body text-surface-muted max-w-[520px] mx-auto">
            Every piece is made just for you. Here's how we handle returns, refunds, and everything in between.
          </p>
          <div className="mt-8 text-primary/60 text-sm tracking-[24px]">✦</div>
          <p className="text-body text-surface-muted/60 mt-4">Last updated: February 28, 2026</p>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {summaryCards.map((c) => (
            <div key={c.title} className="bg-surface-card border border-surface-border rounded-[2px] p-7 text-center hover:border-primary/25 transition-all hover:-translate-y-0.5">
              <span className="text-[28px] block mb-3">{c.icon}</span>
              <div className="text-a5 text-surface-foreground mb-1.5">{c.title}</div>
              <div className="text-body text-surface-muted leading-snug">{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        {sections.map((s, i) => (
          <div key={s.num}>
            <section className="mb-12 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="text-subtitle text-primary/70 tracking-[3px] mb-2">{s.num}</div>
              <h2 className="text-a2 text-surface-foreground mb-5" style={{ fontSize: "clamp(24px, 4vw, 32px)" }}>{s.title}</h2>
              <div>{s.content}</div>
            </section>
            {i < sections.length - 1 && (
              <div className="h-px bg-gradient-to-r from-transparent via-surface-border to-transparent my-12" />
            )}
          </div>
        ))}

        {/* Contact CTA */}
        <section className="text-center py-16">
          <h2 className="text-a2 text-surface-foreground mb-3" style={{ fontSize: "clamp(24px, 4vw, 32px)" }}>Need Help With a Return?</h2>
          <p className="text-body text-surface-muted mb-7">We aim to respond to all enquiries within 2 business days.</p>
          <a
            href="mailto:hello@celestialartworks.com"
            className="inline-flex items-center gap-2.5 border border-primary text-primary text-subtitle tracking-[1.5px] px-9 py-3.5 rounded-[2px] hover:bg-primary hover:text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_hsl(45_80%_65%/0.2)]"
          >
            <span>✉</span> hello@celestialartworks.com
          </a>
          <p className="text-body text-surface-muted/60 mt-8">
            Celestial Artworks · Operated by Human Brand Firm LLC · 924 N Magnolia Ave, Suite 202 Unit #5014, Orlando, FL 32803
          </p>
        </section>
      </main>

      <Footer />
      <FloatingBackButton />
    </div>
  );
}