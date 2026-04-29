import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

if (!(window as any).storage) {
  (window as any).storage = {
    get: async (key: string) => {
      try {
        const value = localStorage.getItem(key);
        return value === null ? null : { value };
      } catch {
        return null;
      }
    },
    set: async (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {}
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
