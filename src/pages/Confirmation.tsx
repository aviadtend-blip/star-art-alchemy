import { useEffect, useRef } from "react";
import { trackPurchase, trackEvent } from "@/lib/analytics";
import { trackMetaPurchase } from "@/lib/meta-pixel";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const Confirmation = () => {
  const hasFired = useRef(false);

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id") || "";
  const total = params.get("total") || "0";
  const email = params.get("email") || "";
  const orderKey = params.get("key") || "";

  const funnelType = sessionStorage.getItem("funnel_type") || "canvas";
  const isDigital = funnelType === "digital";

  useEffect(() => {
    if (hasFired.current || !orderId) return;

    const guardKey = `purchase_tracked_${orderId}`;
    if (sessionStorage.getItem(guardKey)) return;

    hasFired.current = true;

    const value = parseFloat(total) || 0;
    const items = [{ item_name: "Birth Chart Artwork", price: value, quantity: 1 }];

    if (isDigital) {
      // Override funnel_type since /confirmation doesn't start with /d/
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Dark hero section */}
      <section className="bg-foreground text-background py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">
            Thank You for Your Order
          </h1>
          {orderId && (
            <p className="text-muted-foreground text-lg">
              Order #{orderId}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Email notice */}
          {email && (
            <div className="bg-muted rounded-2xl p-6 text-center">
              <p className="text-foreground text-lg">
                Your cosmic artwork is on its way. Check your email at{" "}
                <span className="font-semibold">{email}</span> for delivery
                details.
              </p>
            </div>
          )}

          {/* Timeline */}
          {isDigital ? (
            <div className="bg-muted rounded-2xl p-6 text-center">
              <p className="text-foreground text-lg">
                📩 Your download link will arrive in your inbox within a few
                minutes.
              </p>
            </div>
          ) : (
            <div className="bg-muted rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground text-center mb-4">
                What Happens Next
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "✅", label: "Order Confirmed", time: "Now" },
                  { icon: "🎨", label: "Artwork Created", time: "1–2 days" },
                  { icon: "🖼", label: "Professional Printing", time: "2–3 days" },
                  { icon: "📦", label: "Shipped to You", time: "5–7 days" },
                ].map((step) => (
                  <div
                    key={step.label}
                    className="flex items-start gap-3 bg-background rounded-xl p-4"
                  >
                    <span className="text-2xl">{step.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground">{step.label}</p>
                      <p className="text-sm text-muted-foreground">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <a
              href="https://celestialartworks.com"
              className="inline-block bg-primary text-primary-foreground font-semibold rounded-full px-8 py-3 hover:opacity-90 transition-opacity"
            >
              Return to Home
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Confirmation;
