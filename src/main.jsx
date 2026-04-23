import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AdminSessionProvider } from "./context/AdminSessionContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AdminSessionProvider>
      <App />
    </AdminSessionProvider>
  </StrictMode>
);
