import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const sections = [
  {
    num: "01",
    title: "Definitions",
    content: (
      <ul className="list-disc pl-6 text-body-sm text-surface-muted space-y-1.5">
        <li><strong className="text-surface-foreground font-medium">"Services"</strong> means the website at celestialartworks.com, all features, tools, artwork generation capabilities, and related services.</li>
        <li><strong className="text-surface-foreground font-medium">"Artwork"</strong> means any personalized visual art generated through our Services based on your Birth Data and selected preferences.</li>
        <li><strong className="text-surface-foreground font-medium">"Products"</strong> means any physical products (including framed prints, unframed prints, and other tangible goods) offered for sale.</li>
        <li><strong className="text-surface-foreground font-medium">"Birth Data"</strong> means the birth date, birth time, and birth location information you provide to generate your personalized Artwork.</li>
        <li><strong className="text-surface-foreground font-medium">"You" or "Customer"</strong> means the individual accessing or using our Services or placing an order.</li>
      </ul>
    ),
  },
  {
    num: "02",
    title: "Eligibility",
    content: (
      <p className="text-body text-surface-muted">You must be at least 13 years of age to use our Services. If you are between 13 and 18 years of age, you may use our Services only with the involvement and consent of a parent or legal guardian. By placing an order, you represent that you are at least 18 years of age, or that a parent or legal guardian has authorized the purchase.</p>
    ),
  },
  {
    num: "03",
    title: "Account Registration",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">Certain features may require you to create an account. When creating an account, you agree to:</p>
        <ul className="list-disc pl-6 text-body-sm text-surface-muted space-y-1.5">
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and promptly update your account information</li>
          <li>Maintain the security and confidentiality of your login credentials</li>
          <li>Accept responsibility for all activities that occur under your account</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
        </ul>
      </>
    ),
  },
  {
    num: "04",
    title: "Description of Services",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">Celestial Artworks provides a personalized artwork generation service. The process includes:</p>
        <ul className="list-disc pl-6 text-body-sm text-surface-muted space-y-1.5 mb-4">
          <li>You provide your Birth Data through our website</li>
          <li>Our systems calculate your natal chart using astrological algorithms and third-party chart calculation services</li>
          <li>We use artificial intelligence and machine learning systems to interpret your chart data and generate a unique piece of visual artwork</li>
          <li>The resulting Artwork is presented to you as a digital preview</li>
          <li>If you choose to purchase, the Artwork is printed on museum-quality materials and shipped directly to you</li>
        </ul>
        <div className="bg-primary/10 border-l-[3px] border-primary rounded-r-[2px] px-6 py-5 my-6">
          <span className="text-a5 text-primary block mb-1.5">Astrological Interpretation Disclaimer</span>
          <p className="text-body-sm text-surface-foreground">Natal chart interpretations and astrological data used in our Services are provided for artistic and entertainment purposes only. We make no claims regarding the scientific validity, accuracy, or predictive value of astrology. Our Services do not constitute psychological, medical, financial, or professional advice of any kind.</p>
        </div>
      </>
    ),
  },
  {
    num: "05",
    title: "Orders and Pricing",
    content: (
      <>
        <h3 className="text-a5 text-surface-foreground mb-3">5.1 Placing an Order</h3>
        <p className="text-body text-surface-muted mb-4">By placing an order, you make an offer to purchase the Products described in your order. All orders are subject to our acceptance. We reserve the right to refuse or cancel any order.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">5.2 Pricing and Total Price Transparency</h3>
        <p className="text-body text-surface-muted mb-4">All prices are displayed in U.S. Dollars (USD) unless otherwise indicated. The total price of your order, including Product price, any selected optional add-ons, and shipping charges, will be displayed on the checkout page before you submit payment.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">5.3 Payment</h3>
        <p className="text-body text-surface-muted mb-4">Payment is processed through Stripe, Inc. at the time of order placement. All payments must be received in full before your order is submitted for production.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">5.4 Taxes</h3>
        <p className="text-body text-surface-muted mb-4">You are responsible for any applicable sales tax, VAT, GST, customs duties, import fees, and any other taxes or governmental charges associated with your purchase.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">5.5 Payment Disputes</h3>
        <p className="text-body text-surface-muted">If you have a concern about a charge, please contact us at <a href="mailto:hello@celestialartworks.com" className="text-primary hover:underline">hello@celestialartworks.com</a> before initiating a dispute with your bank or card issuer.</p>
      </>
    ),
  },
  {
    num: "06",
    title: "Custom and Personalized Products",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">All Products sold through Celestial Artworks are custom-made, personalized, and produced on demand based on your individual Birth Data and style selections. By placing an order, you acknowledge that:</p>
        <ul className="list-disc pl-6 text-body-sm text-surface-muted space-y-1.5 mb-4">
          <li>Your Product is custom-made and cannot be resold by us to another customer</li>
          <li>Minor variations in color between your screen preview and the physical print are inherent to the printing process</li>
          <li>AI-generated artwork is unique to each generation; regenerated artwork may differ from previous versions</li>
        </ul>
        <div className="bg-primary/10 border-l-[3px] border-primary rounded-r-[2px] px-6 py-5 my-6">
          <span className="text-a5 text-primary block mb-1.5">Right of Withdrawal Exemption</span>
          <p className="text-body-sm text-surface-foreground">Under applicable consumer protection laws, bespoke and personalized goods are exempt from the standard 14-day right of withdrawal. By confirming your purchase after reviewing the digital preview, you expressly request that production begins immediately and acknowledge that you lose your right of withdrawal once production has commenced.</p>
        </div>
      </>
    ),
  },
  {
    num: "07",
    title: "Shipping and Delivery",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">Products are produced on demand by our third-party fulfillment partners and shipped directly to the address you provide at checkout. Estimated production times are typically 3–7 business days, and shipping times vary by destination.</p>
        <p className="text-body text-surface-muted mb-4">We aim to deliver all orders within thirty (30) days of order confirmation. Delivery estimates are approximate only and do not constitute guaranteed delivery dates.</p>
        <p className="text-body text-surface-muted mb-4">You are responsible for providing an accurate and complete shipping address. International customers are solely responsible for all customs duties, import taxes, brokerage fees, and any other charges imposed by their country.</p>
        <p className="text-body text-surface-muted"><strong className="text-surface-foreground font-medium">EU/UK Consumers:</strong> Risk of loss passes to you when you physically take possession of the goods, in accordance with Article 20 of the EU Consumer Rights Directive and Section 29 of the UK Consumer Rights Act 2015.</p>
      </>
    ),
  },
  {
    num: "08",
    title: "Cancellations, Returns, and Refunds",
    content: (
      <>
        <h3 className="text-a5 text-surface-foreground mb-3">8.1 Cancellations</h3>
        <p className="text-body text-surface-muted mb-4">Because all Products are custom-made, you may cancel your order only before it has been submitted to production. Once an order is in production, it cannot be cancelled.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">8.2 Returns and Refunds for Defective or Damaged Products</h3>
        <p className="text-body text-surface-muted mb-4">If you receive a Product that is materially defective, damaged during shipping, or substantially different from what you ordered, notify us within thirty (30) days of delivery with your order number, a description of the issue, and photographs. We will offer you a reprint, full or partial refund, or store credit.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">8.3 No Refunds for Change of Mind</h3>
        <p className="text-body text-surface-muted mb-4">We do not offer refunds or returns for change of mind, buyer's remorse, or dissatisfaction with the artistic style. You acknowledge that you reviewed the digital preview before purchase.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">8.4 Refund Processing</h3>
        <p className="text-body text-surface-muted">Approved refunds will be processed within ten (10) business days and credited to the original payment method.</p>
      </>
    ),
  },
  {
    num: "09",
    title: "Intellectual Property",
    content: (
      <>
        <h3 className="text-a5 text-surface-foreground mb-3">9.1 Our Intellectual Property</h3>
        <p className="text-body text-surface-muted mb-4">All content on our website, including text, graphics, logos, icons, the Celestial Artworks brand name, website design, user interface, underlying software, AI models, and prompt architectures, is the property of Human Brand Firm LLC or its licensors.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">9.2 Your License to Use the Artwork</h3>
        <p className="text-body text-surface-muted mb-4">Upon purchase, we grant you a perpetual, worldwide, non-exclusive license to use, display, and enjoy your purchased Artwork for personal, non-commercial purposes. This includes displaying the physical print, sharing images on personal social media, and gifting the physical print.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">9.3 Restrictions</h3>
        <p className="text-body text-surface-muted">You may not reproduce the Artwork for commercial sale, use it in commercial advertising, create derivative works for commercial distribution, sublicense or sell the digital files, or use the Artwork in any manner that competes with our Services.</p>
      </>
    ),
  },
  {
    num: "10",
    title: "Prohibited Uses",
    content: (
      <ul className="list-disc pl-6 text-body-sm text-surface-muted space-y-1.5">
        <li>Violate any applicable law, regulation, or these Terms</li>
        <li>Infringe upon the intellectual property or other rights of any third party</li>
        <li>Submit false, misleading, or fraudulent information</li>
        <li>Attempt to reverse-engineer our Services, AI models, or prompt architectures</li>
        <li>Use automated means (bots, scrapers) to access our Services</li>
        <li>Interfere with or disrupt the integrity or performance of our Services</li>
        <li>Reproduce, resell, or commercially exploit any portion of our Services</li>
        <li>Use our Services for any purpose that is competitive with Celestial Artworks</li>
      </ul>
    ),
  },
  {
    num: "11",
    title: "Disclaimers",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4 uppercase text-[13px]">To the maximum extent permitted by applicable law, our Services, website, and all content and Products are provided "as is" and "as available" without warranties of any kind, whether express, implied, statutory, or otherwise.</p>
        <p className="text-body text-surface-muted"><strong className="text-surface-foreground font-medium">EU/UK Consumers:</strong> The above disclaimer does not affect your statutory rights regarding product conformity, fitness for purpose, and satisfactory quality under applicable consumer protection law.</p>
      </>
    ),
  },
  {
    num: "12",
    title: "Limitation of Liability",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">To the maximum extent permitted by applicable law, the total aggregate liability of Celestial Artworks for all claims arising out of these Terms shall not exceed the greater of: (i) the amount you actually paid to us for the specific product or service giving rise to the claim during the twelve (12) months preceding the event, or (ii) one hundred U.S. dollars ($100.00).</p>
        <p className="text-body text-surface-muted"><strong className="text-surface-foreground font-medium">EU/UK Consumers:</strong> Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud or fraudulent misrepresentation, or any liability that cannot be excluded or limited under applicable mandatory consumer protection laws.</p>
      </>
    ),
  },
  {
    num: "13",
    title: "Indemnification",
    content: (
      <p className="text-body text-surface-muted">You agree to indemnify, defend, and hold harmless Celestial Artworks from and against any and all claims, damages, losses, liabilities, costs, and expenses arising out of your violation of these Terms, any applicable law, or the rights of any third party. This obligation survives termination of these Terms.</p>
    ),
  },
  {
    num: "14",
    title: "Force Majeure",
    content: (
      <p className="text-body text-surface-muted">We shall not be liable for any failure or delay in performance resulting from circumstances beyond our reasonable control, including acts of God, natural disasters, pandemics, war, government restrictions, supply chain disruptions, carrier delays, or failures of third-party service providers. If a force majeure event continues for more than sixty (60) days, either party may terminate the affected order and we will issue a refund for any Products not yet delivered.</p>
    ),
  },
  {
    num: "15",
    title: "Termination",
    content: (
      <p className="text-body text-surface-muted">We may suspend or terminate your access to our Services, without prior notice, for any reason, including if you breach these Terms. You may terminate your relationship with us at any time by ceasing to use our Services and, if applicable, requesting deletion of your account.</p>
    ),
  },
  {
    num: "16",
    title: "Governing Law",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">These Terms are governed by the laws of the State of Delaware, United States, without regard to its conflict of law provisions.</p>
        <p className="text-body text-surface-muted"><strong className="text-surface-foreground font-medium">EU/UK Consumers:</strong> This choice of law does not deprive you of the protection afforded by provisions that cannot be derogated from under the consumer protection laws of your country of habitual residence.</p>
      </>
    ),
  },
  {
    num: "17",
    title: "Dispute Resolution and Binding Arbitration",
    content: (
      <>
        <div className="bg-primary/10 border-l-[3px] border-primary rounded-r-[2px] px-6 py-5 my-6">
          <span className="text-a5 text-primary block mb-1.5">Important Notice</span>
          <p className="text-body-sm text-surface-foreground">This section contains a binding arbitration clause and class action waiver. Please read it carefully, as it affects your legal rights.</p>
        </div>

        <h3 className="text-a5 text-surface-foreground mb-3">17.1 Informal Resolution</h3>
        <p className="text-body text-surface-muted mb-4">Before initiating any formal dispute resolution, you agree to first contact us and attempt to resolve the dispute informally for at least thirty (30) days.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">17.2 Binding Arbitration</h3>
        <p className="text-body text-surface-muted mb-4">Any dispute will be resolved through binding individual arbitration administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">17.3 Class Action Waiver</h3>
        <p className="text-body text-surface-muted mb-4 uppercase text-[13px]">You and Celestial Artworks agree that each party may bring disputes against the other only in an individual capacity, and not as a plaintiff or class member in any purported class, consolidated, or representative action.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">17.4 Opt-Out Right</h3>
        <p className="text-body text-surface-muted mb-4">You have the right to opt out of the arbitration clause within thirty (30) days of first accepting these Terms by sending written notice to <a href="mailto:hello@celestialartworks.com" className="text-primary hover:underline">hello@celestialartworks.com</a> with the subject line "Arbitration Opt-Out."</p>

        <p className="text-body text-surface-muted"><strong className="text-surface-foreground font-medium">EU/UK Consumers:</strong> The arbitration and class action waiver provisions do not apply to the extent they are inconsistent with mandatory consumer protection laws in your jurisdiction. EU consumers may also use the European Commission's Online Dispute Resolution platform.</p>
      </>
    ),
  },
  {
    num: "18",
    title: "General Provisions",
    content: (
      <ul className="list-disc pl-6 text-body-sm text-surface-muted space-y-1.5">
        <li><strong className="text-surface-foreground font-medium">Entire Agreement:</strong> These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Celestial Artworks.</li>
        <li><strong className="text-surface-foreground font-medium">Severability:</strong> If any provision is found to be invalid, the remaining provisions continue in full force.</li>
        <li><strong className="text-surface-foreground font-medium">Waiver:</strong> Our failure to enforce any right shall not constitute a waiver.</li>
        <li><strong className="text-surface-foreground font-medium">Assignment:</strong> You may not assign your rights without our prior written consent.</li>
        <li><strong className="text-surface-foreground font-medium">Notices:</strong> Electronic communications satisfy any legal requirement that communications be in writing.</li>
      </ul>
    ),
  },
  {
    num: "19",
    title: "Modifications to These Terms",
    content: (
      <p className="text-body text-surface-muted">We reserve the right to modify these Terms at any time. When we make material changes, we will update the "Last Updated" date and, where practicable, notify you at least thirty (30) days before the changes take effect. Your continued use of the Services constitutes acceptance of the modified Terms.</p>
    ),
  },
  {
    num: "20",
    title: "Contact Information",
    content: (
      <>
        <p className="text-body text-surface-muted mb-2">Celestial Artworks</p>
        <p className="text-body text-surface-muted mb-2">Operated by Human Brand Firm LLC</p>
        <p className="text-body text-surface-muted mb-2">924 N Magnolia Ave, Suite 202 Unit #5014</p>
        <p className="text-body text-surface-muted mb-2">Orlando, Florida 32803, United States</p>
        <p className="text-body text-surface-muted mb-4">Email: <a href="mailto:hello@celestialartworks.com" className="text-primary hover:underline">hello@celestialartworks.com</a></p>
        <p className="text-body-sm text-surface-muted">Delaware LLC File Number: 7129998</p>
      </>
    ),
  },
];

export default function TermsConditions() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <Header />

      <main className="max-w-[780px] mx-auto px-6">
        <header className="text-center pt-24 pb-14 md:pt-28 md:pb-16">
          <div className="text-subtitle text-primary tracking-[4px] mb-6 opacity-80">Celestial Artworks</div>
          <h1 className="text-a1 text-surface-foreground mb-4" style={{ fontSize: "clamp(36px, 6vw, 56px)", lineHeight: 1.15, fontWeight: 300 }}>
            Terms and Conditions
          </h1>
          <p className="text-body text-surface-muted max-w-[520px] mx-auto">
            Operated by Human Brand Firm LLC, a Delaware Limited Liability Company.
          </p>
          <p className="text-body-sm text-surface-muted mt-3">Effective Date: February 28, 2026 · Last Updated: February 28, 2026 · Version 2.0</p>
          <div className="mt-8 text-primary/60 text-sm tracking-[24px]">✦</div>
        </header>

        <div className="bg-primary/10 border-l-[3px] border-primary rounded-r-[2px] px-6 py-5 mb-12">
          <span className="text-a5 text-primary block mb-1.5">Please Read Carefully</span>
          <p className="text-body-sm text-surface-foreground">By accessing our website, placing an order, generating artwork, creating an account, or otherwise using our Services, you agree to be bound by these Terms, our Privacy Policy, and our Cookie Policy. These Terms contain a binding arbitration clause and a class action waiver in Section 17.</p>
        </div>

        {sections.map((s, i) => (
          <div key={s.num}>
            <section className="mb-12 animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="text-subtitle text-primary/70 tracking-[3px] mb-2">{s.num}</div>
              <h2 className="text-a2 text-surface-foreground mb-5" style={{ fontSize: "clamp(22px, 3.5vw, 28px)" }}>{s.title}</h2>
              <div>{s.content}</div>
            </section>
            {i < sections.length - 1 && (
              <div className="h-px bg-gradient-to-r from-transparent via-surface-border to-transparent my-12" />
            )}
          </div>
        ))}

        {/* Contact CTA */}
        <section className="text-center py-16">
          <h2 className="text-a2 text-surface-foreground mb-3" style={{ fontSize: "clamp(24px, 4vw, 32px)" }}>Questions About These Terms?</h2>
          <p className="text-body text-surface-muted mb-7">For legal notices, disputes, or formal communications.</p>
          <a
            href="mailto:hello@celestialartworks.com"
            className="inline-flex items-center gap-2.5 border border-primary text-primary text-subtitle tracking-[1.5px] px-9 py-3.5 rounded-[2px] hover:bg-primary hover:text-primary-foreground transition-all hover:-translate-y-0.5"
          >
            <span>✉</span> hello@celestialartworks.com
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
