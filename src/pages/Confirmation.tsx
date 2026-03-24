import { useEffect, useRef, useState, useCallback } from "react";
import { trackPurchase, trackEvent } from "@/lib/analytics";
import { trackMetaPurchase } from "@/lib/meta-pixel";
import confetti from "canvas-confetti";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import FAQSection from "@/components/ui/FAQSection";
import { invokeProjectFunction } from "@/lib/api/invokeProjectFunction";
import { Sparkles } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CANVAS_FAQS = [
  { q: "Need to make a change?", a: "Contact us within 24 hours at hello@celestialartworks.com." },
  { q: "When will it ship?", a: "Within 5-7 business days. Tracking sent automatically." },
  { q: "Can I see a preview before it ships?", a: "We'll email you a preview within 1-2 days." },
  { q: "What if it arrives damaged?", a: "30-day quality guarantee. Reprint or full refund." },
];

const DIGITAL_FAQS = [
  { q: "I haven't received my email yet?", a: "Check your spam/promotions folder. Contact us if nothing after 15 minutes at hello@celestialartworks.com." },
  { q: "How long is the download link valid?", a: "30 days from purchase." },
  { q: "Can I use the artwork commercially?", a: "Personal use only. See Terms & Conditions." },
  { q: "What resolution is the file?", a: "Standard or High Resolution depending on your purchase." },
];

const TIMELINE_STEPS = [
  { icon: "✓", title: "Order Confirmed", timing: "Now", desc: "Payment processed, order in our system.", active: true },
  { icon: "🎨", title: "Preparing Artwork", timing: "1-2 days", desc: "Quality and color review before production." },
  { icon: "🖨", title: "Professional Printing", timing: "2-3 days", desc: "12-color giclée on premium canvas." },
  { icon: "📦", title: "Shipped to You", timing: "5-7 days", desc: "Tracked shipping, arrives ready to display." },
];

const SHARE_LINKS = [
  {
    icon: "𝕏",
    label: "Share on X",
    href: "https://twitter.com/intent/tweet?text=Just%20ordered%20my%20personalized%20birth%20chart%20artwork!%20%F0%9F%8C%9F&url=https://celestialartworks.com",
  },
  {
    icon: "f",
    label: "Share on Facebook",
    href: "https://www.facebook.com/sharer/sharer.php?u=https://celestialartworks.com",
  },
  {
    icon: "📧",
    label: "Share via Email",
    href: "mailto:?subject=Check%20out%20my%20birth%20chart%20artwork!&body=I%20just%20ordered%20a%20personalized%20birth%20chart%20artwork%20from%20Celestial%20Artworks!%20https://celestialartworks.com",
  },
];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderData {
  artwork_url: string;
  sun_sign: string;
  moon_sign: string;
  rising_sign: string;
  canvas_size: string;
  fulfillment_type: string;
  email: string;
  order_number: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Confirmation = () => {
  const hasFired = useRef(false);
  const confettiFired = useRef(false);

  // URL params
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id") || "";
  const total = params.get("total") || "0";
  const emailParam = params.get("email") || "";

  // State
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const funnelType = sessionStorage.getItem("funnel_type") || "canvas";
  const isDigital = funnelType === "digital";

  // Confetti on mount
  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;
    const end = Date.now() + 1500;
    const colors = ["#FFBF00", "#FF6B8A", "#A855F7", "#38BDF8", "#34D399"];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  // GA4 + Meta Pixel tracking (deduplicated)
  useEffect(() => {
    if (hasFired.current || !orderId) return;
    const guardKey = `purchase_tracked_${orderId}`;
    if (sessionStorage.getItem(guardKey)) return;
    hasFired.current = true;

    const value = parseFloat(total) || 0;
    const items = [{ item_name: "Birth Chart Artwork", price: value, quantity: 1 }];

    if (isDigital) {
      trackEvent("purchase", {
        transaction_id: orderId,
        value,
        currency: "USD",
        items,
        funnel_type: "digital",
      });
    } else {
      trackPurchase(orderId, value, items);
    }
    trackMetaPurchase(value, "USD", orderId);
    sessionStorage.setItem(guardKey, "true");
  }, [orderId, total, isDigital]);

  // Fetch order data from Supabase
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const celestialOrderId = sessionStorage.getItem("celestial_order_id") || "";

        if (!celestialOrderId && !orderId) {
          setLoading(false);
          return;
        }

        const body: Record<string, string> = {};
        if (celestialOrderId) body.celestial_order_id = celestialOrderId;
        else if (orderId) body.wc_order_id = orderId;

        const data = await invokeProjectFunction("get-order-confirmation", body);
        if (data && !data.error) {
          setOrderData(data);
          // Update funnel type from server if available
          if (data.fulfillment_type === "digital" || data.fulfillment_type === "canvas") {
            sessionStorage.setItem("funnel_type", data.fulfillment_type);
          }
        }
      } catch (err) {
        console.warn("Confirmation: order fetch failed (showing fallback):", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const displayEmail = orderData?.email || emailParam;
  const sunSign = orderData?.sun_sign || "";
  const moonSign = orderData?.moon_sign || "";
  const risingSign = orderData?.rising_sign || "";
  const artworkUrl = orderData?.artwork_url || "";
  const canvasSize = orderData?.canvas_size || "";
  const displayOrderNumber = orderData?.order_number || orderId;
  const resolvedIsDigital = orderData?.fulfillment_type === "digital" || isDigital;

  // Delivery range (canvas only)
  const deliveryStart = new Date();
  deliveryStart.setDate(deliveryStart.getDate() + 10);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 14);
  const deliveryRange = `${deliveryStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })} — ${deliveryEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  const firstName = sessionStorage.getItem("celestial_captured_first_name") || "";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div style={{ backgroundColor: "#121212" }}>
        <Header />
        <div className="pt-14" />
      </div>

      {/* Success Header */}
      <section className="text-center px-4 pt-10 pb-8">
        <h1 className="text-a1" style={{ color: "#333" }}>
          Order Confirmed!
        </h1>
        <p className="text-body mt-2" style={{ color: "#666" }}>
          Thank you{firstName ? `, ${firstName}` : ""}!
        </p>
        <p className="text-body" style={{ color: "#888" }}>
          {resolvedIsDigital
            ? "Your cosmic blueprint is ready."
            : "Your cosmic blueprint is coming to life."}
        </p>
        {displayOrderNumber && (
          <div className="mt-3 space-y-0.5">
            <p className="text-body-sm" style={{ color: "#888" }}>
              Order #{displayOrderNumber}
            </p>
            <p className="text-body-sm" style={{ color: "#888" }}>
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        )}
      </section>

      {/* Artwork Preview */}
      <section className="flex justify-center px-4 pb-6">
        {loading ? (
          <div
            className={`${resolvedIsDigital ? "w-48 h-60" : "w-28 h-36"} rounded-sm animate-pulse`}
            style={{ backgroundColor: "#F0F0F0" }}
          />
        ) : artworkUrl ? (
          <img
            src={artworkUrl}
            alt="Your cosmic artwork"
            className={`${resolvedIsDigital ? "w-48" : "w-28"} h-auto rounded-sm`}
          />
        ) : (
          <div
            className={`${resolvedIsDigital ? "w-48 h-60" : "w-28 h-36"} rounded-sm flex items-center justify-center`}
            style={{ backgroundColor: "#F0F0F0" }}
          >
            <Sparkles className="w-8 h-8" style={{ color: "#CCC" }} />
          </div>
        )}
      </section>

      {/* Placements + Order Summary */}
      <section className="text-center px-4 pb-8 space-y-1">
        {(sunSign || moonSign || risingSign) && (
          <p className="text-body-sm" style={{ color: "#555" }}>
            {sunSign && `${sunSign} Sun`}
            {moonSign && ` · ${moonSign} Moon`}
            {risingSign && ` · ${risingSign} Rising`}
          </p>
        )}
        {!resolvedIsDigital && canvasSize && (
          <p className="text-body-sm" style={{ color: "#555" }}>
            {canvasSize} Canvas Print
          </p>
        )}
        {resolvedIsDigital && (
          <p className="text-body-sm" style={{ color: "#555" }}>
            Digital Download
          </p>
        )}
        {parseFloat(total) > 0 && (
          <p className="text-body-sm" style={{ color: "#555" }}>
            Total Paid: ${parseFloat(total).toFixed(2)}
          </p>
        )}
        {displayEmail && (
          <p className="text-body-sm mt-2" style={{ color: "#888" }}>
            A confirmation email has been sent to your email.
          </p>
        )}
      </section>

      {/* What Happens Next — Canvas */}
      {!resolvedIsDigital && (
        <section className="px-4 pb-10 max-w-2xl mx-auto w-full">
          <div className="rounded-sm p-6" style={{ backgroundColor: "#F5F5F0" }}>
            <h2 className="text-a2 mb-1" style={{ color: "#333" }}>What Happens Next</h2>
            <p className="text-body-sm mb-5" style={{ color: "#888" }}>
              Your artwork journey from creation to your door.
            </p>
            <div className="space-y-5">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{step.icon}</span>
                  <div>
                    <p className="text-a4" style={{ color: "#333" }}>{step.title}</p>
                    <p className="text-body-sm" style={{ color: "#888" }}>{step.timing}</p>
                    <p className="text-body mt-0.5" style={{ color: "#888" }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-sm p-4 text-center" style={{ backgroundColor: "#EAEAE5" }}>
              <p className="text-subtitle tracking-wider" style={{ color: "#888" }}>Expected Delivery</p>
              <p className="text-a4 mt-1" style={{ color: "#333" }}>{deliveryRange}</p>
              <p className="text-body-sm mt-1" style={{ color: "#888" }}>
                You'll receive tracking information via email
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Digital Delivery Notice */}
      {resolvedIsDigital && (
        <section className="px-4 pb-10 max-w-2xl mx-auto w-full">
          <div className="rounded-sm p-6 text-center" style={{ backgroundColor: "#F5F5F0" }}>
            <h2 className="text-a2 mb-2" style={{ color: "#333" }}>
              Your Download Link Is on the Way
            </h2>
            <p className="text-body" style={{ color: "#888" }}>
              Check your email inbox — your download link will arrive within a few minutes.
              The link is valid for 30 days.
            </p>
          </div>
        </section>
      )}

      {/* Social Sharing */}
      <section className="px-4 pb-10 text-center">
        <h2 className="text-a2 mb-2" style={{ color: "#333" }}>Share the excitement!</h2>
        <p className="text-body-sm mb-4" style={{ color: "#888" }}>
          Show your friends your one-of-a-kind cosmic blueprint
        </p>
        <div className="flex justify-center gap-5">
          {SHARE_LINKS.map((item, i) => (
            <a
              key={i}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              style={{ color: "#333", fontSize: "18px" }}
            >
              {item.icon}
            </a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <FAQSection
        items={resolvedIsDigital ? DIGITAL_FAQS : CANVAS_FAQS}
        title="Common Questions"
      />

      {/* Return Home */}
      <section className="px-4 pb-12 text-center">
        <a
          href="https://celestialartworks.com"
          className="inline-block px-8 py-3 rounded-full text-a5 transition-colors"
          style={{ backgroundColor: "#333", color: "#fff" }}
        >
          Return to Home
        </a>
      </section>

      <Footer />
    </div>
  );
};

export default Confirmation;
