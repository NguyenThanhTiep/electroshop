import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

import App from "./App";
import "./index.css";

/*
 * Gắn token cho toàn bộ request axios
 */
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/*
 * Gắn token cho toàn bộ request fetch
 * Vì project đang dùng lẫn axios và fetch.
 */
const originalFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  const token = localStorage.getItem("token");

  const headers = new Headers(init.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return originalFetch(input, {
    ...init,
    headers,
  });
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
