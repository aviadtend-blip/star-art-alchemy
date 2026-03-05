import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initKlaviyo } from "./lib/klaviyo.js";

initKlaviyo();

createRoot(document.getElementById("root")!).render(<App />);
