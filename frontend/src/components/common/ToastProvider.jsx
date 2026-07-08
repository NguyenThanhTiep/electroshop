import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import "./ToastProvider.css";

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

const TOAST_TITLES = {
  success: "Thành công",
  error: "Có lỗi xảy ra",
  warning: "Cảnh báo",
  info: "Thông báo",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  }, []);

  const pushToast = useCallback(
    ({ type = "info", title, message, duration = 3200 }) => {
      const id = `${Date.now()}-${Math.random()}`;

      const nextToast = {
        id,
        type,
        title: title || TOAST_TITLES[type] || "Thông báo",
        message,
      };

      setToasts((currentToasts) => [...currentToasts, nextToast]);

      if (duration > 0) {
        window.setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast],
  );

  const toast = useMemo(
    () => ({
      success: (message, title = "Thành công") =>
        pushToast({ type: "success", title, message }),

      error: (message, title = "Có lỗi xảy ra") =>
        pushToast({ type: "error", title, message, duration: 4500 }),

      warning: (message, title = "Cảnh báo") =>
        pushToast({ type: "warning", title, message, duration: 4200 }),

      info: (message, title = "Thông báo") =>
        pushToast({ type: "info", title, message }),

      show: pushToast,
      remove: removeToast,
    }),
    [pushToast, removeToast],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="app-toast-container" aria-live="polite">
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className={`app-toast app-toast-${toastItem.type}`}
          >
            <div className="app-toast-icon">
              {TOAST_ICONS[toastItem.type] || "ℹ️"}
            </div>

            <div className="app-toast-content">
              <strong>{toastItem.title}</strong>
              <p>{toastItem.message}</p>
            </div>

            <button
              type="button"
              className="app-toast-close"
              onClick={() => removeToast(toastItem.id)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);

  if (!toast) {
    throw new Error("useToast phải được dùng bên trong ToastProvider");
  }

  return toast;
}
