import { ToastProvider } from "./components/common/ToastProvider";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

import App from "./App";
import "./index.css";

let handlingUnauthorized = false;

const isAuthEndpoint = (url = "") => {
  return String(url).includes("/api/auth/");
};

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("currentUser");
};

const redirectToLoginAfterUnauthorized = () => {
  if (handlingUnauthorized) {
    return;
  }

  handlingUnauthorized = true;

  const currentPath =
    window.location.pathname + window.location.search + window.location.hash;

  if (window.location.pathname !== "/login" && currentPath) {
    sessionStorage.setItem("redirectAfterLogin", currentPath);
  }

  clearAuthStorage();

  window.dispatchEvent(new Event("authChanged"));
  window.dispatchEvent(new Event("cartUpdated"));

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

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

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error.response?.status;
    const requestUrl = error.config?.url || "";
    const hadToken = Boolean(localStorage.getItem("token"));

    if (statusCode === 401 && hadToken && !isAuthEndpoint(requestUrl)) {
      redirectToLoginAfterUnauthorized();
    }

    return Promise.reject(error);
  },
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
