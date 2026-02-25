import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrderConfirmationPage from "./pages/OrderConfirmation";
import ShippingPolicy from "./pages/ShippingPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import { GeneratorProvider } from "./contexts/GeneratorContext";
import ErrorBoundary from "./components/ErrorBoundary";
import GenerateEntry from "./pages/GenerateEntry";
import GenerateStyle from "./pages/GenerateStyle";
import GenerateLoading from "./pages/GenerateLoading";
import GeneratePreview from "./pages/GeneratePreview";
import GenerateSize from "./pages/GenerateSize";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Generator flow — wrapped in shared context + error boundary */}
          <Route element={<ErrorBoundary><GeneratorProvider><Outlet /></GeneratorProvider></ErrorBoundary>}>
            <Route path="/generate" element={<GenerateEntry />} />
            <Route path="/generate/style" element={<GenerateStyle />} />
            <Route path="/generate/loading" element={<GenerateLoading />} />
            <Route path="/generate/preview" element={<GeneratePreview />} />
            <Route path="/generate/size" element={<GenerateSize />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          </Route>
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/returns" element={<ReturnsPolicy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
