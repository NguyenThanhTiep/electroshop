import { ToastProvider } from "./components/common/ToastProvider";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

import App from "./App";
import "./index.css";

/*
 * Gắn token cho toàn bộ request axios.
 * Các file như productApi.js, categoryApi.js, orderApi.js...
 * đang dùng axios nên sẽ tự có Authorization header.
 */
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/*
 * Gắn token cho fetch.
 * Project của bạn có vài service dùng fetch, nên thêm luôn cho chắc.
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
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
