import { lazy, Suspense, useEffect, ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { GeneratorProvider } from "./contexts/GeneratorContext";
import ErrorBoundary from "./components/ErrorBoundary";


// Auto-reload on stale chunk errors (happens after deploys when users have cached HTML)
function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((err) => {
      // Only reload once to avoid infinite loops
      const key = 'chunk_reload';
      const lastReload = sessionStorage.getItem(key);
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10_000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
      throw err;
    })
  );
}

// Lazy-loaded generator routes
const GenerateEntry = lazyWithRetry(() => import("./pages/GenerateEntry"));
const GenerateStyle = lazyWithRetry(() => import("./pages/GenerateStyle"));
const GenerateLoading = lazyWithRetry(() => import("./pages/GenerateLoading"));
const GeneratePreview = lazyWithRetry(() => import("./pages/GeneratePreview"));
const GenerateSize = lazyWithRetry(() => import("./pages/GenerateSize"));
const OrderConfirmationPage = lazyWithRetry(() => import("./pages/OrderConfirmation"));

// Policy pages — rarely visited, lazy-load to reduce initial bundle
const ShippingPolicy = lazyWithRetry(() => import("./pages/ShippingPolicy"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazyWithRetry(() => import("./pages/TermsConditions"));
const ReturnsPolicy = lazyWithRetry(() => import("./pages/ReturnsPolicy"));

const queryClient = new QueryClient();

// Capture affiliate tracking param before routing
(() => {
  const params = new URLSearchParams(window.location.search);
  const dtId = params.get('dt_id');
  if (dtId) sessionStorage.setItem('affiliate_dt_id', dtId);
})();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <ErrorBoundary>
          <GeneratorProvider>
            <Routes>
              <Route path="/" element={<Index />} />

              {/* Generator flow + policy pages — all lazy loaded */}
              <Route element={<Suspense fallback={<LazyFallback />}><Outlet /></Suspense>}>
                <Route path="/generate" element={<GenerateEntry />} />
                <Route path="/generate/style" element={<GenerateStyle />} />
                <Route path="/generate/loading" element={<GenerateLoading />} />
                <Route path="/generate/preview" element={<GeneratePreview />} />
                <Route path="/generate/size" element={<GenerateSize />} />
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                <Route path="/shipping" element={<ShippingPolicy />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/returns" element={<ReturnsPolicy />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
          </GeneratorProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;