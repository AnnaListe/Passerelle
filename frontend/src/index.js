// Neutraliser l'interception Emergent
if (window._emergentOriginalFetch) {
  window.fetch = window._emergentOriginalFetch;
}
import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
