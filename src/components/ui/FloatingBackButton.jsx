import { useNavigate } from "react-router-dom";

/**
 * Floating "Back" button for policy pages.
 * Fixed to the bottom of the viewport with a frosted-glass background.
 * Navigates to the landing page form section.
 */
export default function FloatingBackButton() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/#birth-form");
    // Small delay to let navigation complete, then scroll to form
    setTimeout(() => {
      const el = document.getElementById("birth-form");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
      <button
        onClick={handleBack}
        className="pointer-events-auto h-12 w-full md:w-auto px-10 rounded-full text-a4 text-surface-foreground border border-surface-border hover:opacity-80 transition-all"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        ← Back
      </button>
    </div>
  );
}
