import { createRoot } from "react-dom/client";
import { Toaster } from "sileo";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <Toaster position="bottom-right" />
    <App />
  </>,
);
