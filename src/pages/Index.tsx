import LandingPage from "@/components/Landing/LandingPage";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { LANDING_IMAGES, GENERATE_ENTRY_IMAGES } from "@/data/imageManifest";

const Index = () => {
  // Preload all landing page images immediately, by priority
  useImagePreloader(LANDING_IMAGES);
  // Prefetch the /generate entry page assets after landing images are underway
  useImagePreloader(GENERATE_ENTRY_IMAGES, { defer: 2000 });

  return <LandingPage />;
};

export default Index;
