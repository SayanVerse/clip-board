import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { cleanupServiceWorkers } from "./sw-cleanup";

cleanupServiceWorkers();

createRoot(document.getElementById("root")!).render(<App />);

