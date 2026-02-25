import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import FloatingBackButton from "@/components/ui/FloatingBackButton";

const sections = [
  {
    num: "01",
    title: "Information We Collect",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">We collect the following categories of information in connection with providing our Services:</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">A. Information You Provide Directly</h3>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5 mb-4">
          <li>Full name</li>
          <li>Email address</li>
          <li>Birth date, birth time (if provided), and birth location (city and country)</li>
          <li>Shipping address</li>
          <li>Account login credentials (if an account is created)</li>
          <li>Communications with us (including support inquiries)</li>
        </ul>

        <div className="bg-primary/10 border-l-[3px] border-primary rounded-r-[2px] px-6 py-5 my-6">
          <span className="text-a5 text-primary block mb-1.5">Note Regarding Birth Data</span>
          <p className="text-body text-surface-foreground">Your birth date, birth time, and birth location are collected solely for the purpose of calculating your natal chart and generating personalized artwork. Birth location is collected at the city and country level only and does not constitute precise geolocation data. This data is never used for identity verification, credit decisions, background checks, profiling, or shared with data brokers or advertisers.</p>
        </div>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">B. Automatically Collected Information</h3>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5 mb-4">
          <li>IP address</li>
          <li>Device type, browser type, and operating system</li>
          <li>Pages visited, referring URLs, and usage data</li>
          <li>Cookies and similar tracking technologies (see Section 9)</li>
        </ul>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">C. Payment Information</h3>
        <p className="text-body text-surface-muted mb-4">Payments are processed securely by Stripe, Inc. We do not store, access, or retain full credit card numbers, CVVs, or other sensitive payment credentials. Stripe collects and processes payment data in accordance with its own privacy policy.</p>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">D. Generated Data</h3>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5">
          <li>Natal chart calculations derived from your birth data</li>
          <li>Interpretive chart analysis</li>
          <li>Generated artwork files associated with your order</li>
          <li>Order history and transaction records</li>
        </ul>
      </>
    ),
  },
  {
    num: "02",
    title: "How We Use Your Information",
    content: (
      <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5">
        <li>Generating personalized artwork based on your birth data</li>
        <li>Processing, fulfilling, and shipping orders</li>
        <li>Creating and managing user accounts</li>
        <li>Delivering digital downloads and order confirmations</li>
        <li>Sending transactional emails (order confirmations, shipping updates)</li>
        <li>Sending marketing and promotional emails (including abandoned cart recovery emails), subject to applicable consent requirements</li>
        <li>Improving website functionality, user experience, and service quality</li>
        <li>Analyzing website traffic and usage patterns through analytics tools</li>
        <li>Preventing fraud, abuse, and unauthorized use</li>
        <li>Complying with applicable legal obligations</li>
      </ul>
    ),
  },
  {
    num: "03",
    title: "Artificial Intelligence and Automated Processing",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">We use artificial intelligence and machine learning systems to provide our Services, including:</p>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5 mb-4">
          <li>Calculating and interpreting natal chart data using algorithmic and AI-powered analysis</li>
          <li>Generating personalized artwork using AI image generation models</li>
          <li>Processing birth data to create visual art directions and narratives</li>
        </ul>
        <p className="text-body text-surface-muted mb-4">These AI systems process your birth data algorithmically to produce personalized visual outputs. No human individually reviews your birth data during the automated generation process unless you contact our support team.</p>

        <div className="bg-primary/10 border-l-[3px] border-primary rounded-r-[2px] px-6 py-5 my-6">
          <span className="text-a5 text-primary block mb-1.5">Data Transmitted to AI Providers</span>
          <p className="text-body text-surface-foreground">No raw birth data (name, date, time, or location) is transmitted directly to AI providers; only derived chart calculations and anonymized descriptive parameters are sent. These providers process data in accordance with our data processing agreements and do not retain your personal information beyond the duration of the generation session.</p>
        </div>
      </>
    ),
  },
  {
    num: "04",
    title: "Legal Bases for Processing (GDPR)",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">If you are located in the European Economic Area (EEA), United Kingdom, or a jurisdiction with similar data protection laws, we process your personal data under the following legal bases:</p>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5">
          <li><strong className="text-surface-foreground font-medium">Performance of a Contract:</strong> Processing necessary to generate your artwork, fulfill your order, and deliver purchased products.</li>
          <li><strong className="text-surface-foreground font-medium">Legitimate Interests:</strong> Processing for website improvement, analytics, fraud prevention, and business operations.</li>
          <li><strong className="text-surface-foreground font-medium">Consent:</strong> Processing based on your explicit opt-in consent, such as marketing emails for EEA/UK residents.</li>
          <li><strong className="text-surface-foreground font-medium">Legal Compliance:</strong> Processing necessary to comply with applicable laws, regulations, and legal processes.</li>
        </ul>
      </>
    ),
  },
  {
    num: "05",
    title: "Data Retention",
    content: (
      <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5">
        <li><strong className="text-surface-foreground font-medium">Order and transaction records:</strong> Seven (7) years from the date of transaction.</li>
        <li><strong className="text-surface-foreground font-medium">Account data:</strong> For as long as your account remains active, plus thirty (30) days following account deletion.</li>
        <li><strong className="text-surface-foreground font-medium">Marketing and email data:</strong> Until you unsubscribe, plus thirty (30) days to process the request.</li>
        <li><strong className="text-surface-foreground font-medium">Generated artwork and natal chart data:</strong> Retained for as long as your account remains active and for five (5) years following the date of last account activity.</li>
        <li><strong className="text-surface-foreground font-medium">Abandoned session data:</strong> Ninety (90) days from the date of the session.</li>
        <li><strong className="text-surface-foreground font-medium">Support communications:</strong> Three (3) years from the date of the last communication.</li>
      </ul>
    ),
  },
  {
    num: "06",
    title: "Data Sharing and Service Providers",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">We share personal data only with trusted third-party service providers necessary to operate our business:</p>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5 mb-4">
          <li>Stripe, Inc. — Payment processing</li>
          <li>Prodigi Group Ltd. / Printful, Inc. — Print-on-demand fulfillment and shipping</li>
          <li>Email service provider — Transactional and marketing email delivery</li>
          <li>Cloud hosting providers — U.S.-based infrastructure and data storage</li>
          <li>Natal chart API provider — Astrological chart calculation</li>
          <li>AI language model provider — Chart interpretation and visual narrative generation</li>
          <li>AI image generation provider — Artwork generation</li>
          <li>Analytics provider — Website traffic analysis and usage reporting</li>
        </ul>
        <div className="bg-primary/10 border-l-[3px] border-primary rounded-r-[2px] px-6 py-5 my-6">
          <span className="text-a5 text-primary block mb-1.5">No Sale of Personal Information</span>
          <p className="text-body text-surface-foreground">We do not sell your personal information as defined under the California Consumer Privacy Act (CCPA/CPRA) or any other applicable privacy law. We do not share your personal information with data brokers.</p>
        </div>
      </>
    ),
  },
  {
    num: "07",
    title: "International Data Transfers",
    content: (
      <p className="text-body text-surface-muted">Your personal data is stored and processed in the United States. For transfers from the EEA, UK, or Switzerland, we implement appropriate safeguards as required by applicable law, which may include Standard Contractual Clauses (SCCs) approved by the European Commission, reliance on the EU-U.S. Data Privacy Framework, or other lawful transfer mechanisms.</p>
    ),
  },
  {
    num: "08",
    title: "Financial Incentives (CCPA/CPRA)",
    content: (
      <p className="text-body text-surface-muted">We may offer promotional incentives, such as discount codes provided in exchange for email registration. Participation is entirely voluntary. You may opt out at any time by unsubscribing from our email list. The value of the incentive is reasonably related to the value of your email address to our business, estimated at approximately $5–$15 based on our average customer acquisition cost.</p>
    ),
  },
  {
    num: "09",
    title: "Cookies and Tracking Technologies",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">We use cookies and similar technologies for the following purposes:</p>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5 mb-4">
          <li><strong className="text-surface-foreground font-medium">Strictly Necessary Cookies:</strong> Required for core website functionality, including session management and shopping cart operation.</li>
          <li><strong className="text-surface-foreground font-medium">Analytics Cookies:</strong> Used to understand how visitors interact with our website.</li>
          <li><strong className="text-surface-foreground font-medium">Marketing Cookies:</strong> Used to support advertising, retargeting, and promotional campaigns.</li>
        </ul>
        <p className="text-body text-surface-muted mb-4">We provide a cookie consent mechanism that allows visitors to accept or reject non-essential cookies before they are placed on their device. For visitors from the EEA and UK, non-essential cookies are not placed until affirmative consent is obtained.</p>
        <p className="text-body text-surface-muted">We honor Global Privacy Control (GPC) browser signals as valid opt-out-of-sharing requests where required by applicable law.</p>
      </>
    ),
  },
  {
    num: "10",
    title: "Your Privacy Rights",
    content: (
      <>
        <h3 className="text-a5 text-surface-foreground mb-3">A. Rights for All Users</h3>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5 mb-4">
          <li>Request access to the personal data we hold about you</li>
          <li>Request correction of inaccurate personal data</li>
          <li>Request deletion of your personal data (subject to legal retention requirements)</li>
          <li>Unsubscribe from marketing emails at any time</li>
        </ul>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">B. Additional Rights for EEA, UK, and Similar Jurisdictions (GDPR)</h3>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5 mb-4">
          <li>Restrict processing of your personal data</li>
          <li>Object to processing based on legitimate interests</li>
          <li>Request data portability</li>
          <li>Withdraw consent at any time</li>
          <li>Lodge a complaint with your local data protection supervisory authority</li>
        </ul>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">C. Additional Rights for California Residents (CCPA/CPRA)</h3>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5 mb-4">
          <li>Request disclosure of the categories and specific pieces of personal information collected</li>
          <li>Request deletion or correction of your personal information</li>
          <li>Opt out of the sale or sharing of your personal information</li>
          <li>Limit the use and disclosure of sensitive personal information</li>
          <li>Not be discriminated against for exercising your privacy rights</li>
        </ul>

        <h3 className="text-a5 text-surface-foreground mb-3 mt-6">E. Exercising Your Rights</h3>
        <p className="text-body text-surface-muted">To exercise any of the rights described above, please contact us at <a href="mailto:hello@celestialartworks.com" className="text-primary hover:underline">hello@celestialartworks.com</a>. We will respond within the timeframes required by applicable law (GDPR: 30 days; CCPA/CPRA: 45 days).</p>
      </>
    ),
  },
  {
    num: "11",
    title: "Children's Privacy",
    content: (
      <p className="text-body text-surface-muted">Our Services are intended for individuals aged 13 and older. We do not knowingly collect personal information from children under the age of 13. If you believe a child has provided us with personal information, please contact us at <a href="mailto:hello@celestialartworks.com" className="text-primary hover:underline">hello@celestialartworks.com</a>.</p>
    ),
  },
  {
    num: "12",
    title: "Data Security",
    content: (
      <>
        <p className="text-body text-surface-muted mb-4">We implement reasonable administrative, technical, and physical safeguards including:</p>
        <ul className="list-disc pl-6 text-body text-surface-muted space-y-1.5 mb-4">
          <li>Encryption of data in transit using TLS/SSL</li>
          <li>Encryption of data at rest for sensitive data categories</li>
          <li>Secure hosting with reputable U.S.-based cloud providers</li>
          <li>Access controls limiting personnel who can view personal data</li>
          <li>One-way hashing of account passwords</li>
          <li>Regular review of security practices</li>
        </ul>
        <p className="text-body text-surface-muted">No method of internet transmission or electronic storage is completely secure. While we strive to protect your personal information, we cannot guarantee absolute security.</p>
      </>
    ),
  },
  {
    num: "13",
    title: "Data Breach Notification",
    content: (
      <p className="text-body text-surface-muted">In the event of a data breach that affects your personal information, we will notify you and the relevant regulatory authorities as required by applicable law. Under GDPR, we will notify the appropriate supervisory authority within 72 hours. Under U.S. state laws, we will comply with applicable breach notification requirements.</p>
    ),
  },
  {
    num: "14",
    title: "Third-Party Links and Services",
    content: (
      <p className="text-body text-surface-muted">Our website may contain links to third-party websites, services, or platforms. We are not responsible for the privacy practices, content, or security of any third-party services. We encourage you to review the privacy policies of any third-party services you access through our website.</p>
    ),
  },
  {
    num: "15",
    title: "Changes to This Privacy Policy",
    content: (
      <p className="text-body text-surface-muted">We may update this Privacy Policy from time to time. The updated version will be posted on our website with a revised "Last Updated" date. For material changes, we will make reasonable efforts to notify you at least thirty (30) days prior to the changes taking effect.</p>
    ),
  },
  {
    num: "16",
    title: "Governing Law",
    content: (
      <p className="text-body text-surface-muted">This Privacy Policy is governed by the laws of the State of Delaware, United States, without regard to conflict of law principles. This choice of governing law does not affect your statutory rights under the data protection laws of your jurisdiction of residence.</p>
    ),
  },
  {
    num: "17",
    title: "Contact Information",
    content: (
      <>
        <p className="text-body text-surface-muted mb-2">Celestial Artworks</p>
        <p className="text-body text-surface-muted mb-2">Operated by Human Brand Firm LLC</p>
        <p className="text-body text-surface-muted mb-2">924 N Magnolia Ave, Suite 202 Unit #5014</p>
        <p className="text-body text-surface-muted mb-2">Orlando, Florida 32803, United States</p>
        <p className="text-body text-surface-muted mb-4">Email: <a href="mailto:hello@celestialartworks.com" className="text-primary hover:underline">hello@celestialartworks.com</a></p>
        <p className="text-body text-surface-muted">For European privacy inquiries, use subject line "GDPR Privacy Inquiry." For California privacy rights requests, use subject line "California Privacy Rights Request."</p>
      </>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <Header />

      <main className="max-w-[780px] mx-auto px-6">
        <header className="text-center pt-24 pb-14 md:pt-28 md:pb-16">
          <div className="text-subtitle text-primary tracking-[4px] mb-6 opacity-80">Celestial Artworks</div>
          <h1 className="text-a1 text-surface-foreground mb-4" style={{ fontSize: "clamp(36px, 6vw, 56px)", lineHeight: 1.15, fontWeight: 300 }}>
            Privacy Policy
          </h1>
          <p className="text-body text-surface-muted max-w-[520px] mx-auto">
            Operated by Human Brand Firm LLC, a Delaware Limited Liability Company.
          </p>
          <p className="text-body text-surface-muted mt-3">Last Updated: February 28, 2026 · Version 2.0</p>
          <div className="mt-8 text-primary/60 text-sm tracking-[24px]">✦</div>
        </header>

        <p className="text-body text-surface-muted mb-12">
          Celestial Artworks ("Celestial Artworks," "we," "us," or "our") is operated by Human Brand Firm LLC, a Delaware limited liability company. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you visit our website at celestialartworks.com, generate artwork, make a purchase, or otherwise interact with our services. By using our Services, you agree to the practices described in this Privacy Policy.
        </p>

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
          <h2 className="text-a2 text-surface-foreground mb-3" style={{ fontSize: "clamp(24px, 4vw, 32px)" }}>Questions About Your Privacy?</h2>
          <p className="text-body text-surface-muted mb-7">We're here to help with any privacy questions or concerns.</p>
          <a
            href="mailto:hello@celestialartworks.com"
            className="inline-flex items-center gap-2.5 border border-primary text-primary text-subtitle tracking-[1.5px] px-9 py-3.5 rounded-[2px] hover:bg-primary hover:text-primary-foreground transition-all hover:-translate-y-0.5"
          >
            <span>✉</span> hello@celestialartworks.com
          </a>
        </section>
      </main>

      <Footer />
      <FloatingBackButton />
    </div>
  );
}
