import { Navigate, useLocation } from "react-router-dom";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");

const readStoredUserRole = () => {
  try {
    const savedUser = localStorage.getItem("currentUser");

    return savedUser ? JSON.parse(savedUser)?.role || "" : "";
  } catch {
    return "";
  }
};

export default function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation();

  const token = localStorage.getItem("token");

  const role = localStorage.getItem("role") || readStoredUserRole();

  /*
   * Chưa đăng nhập.
   */
  if (!token) {
    const redirectPath = `${location.pathname}${location.search}${location.hash}`;

    if (redirectPath && location.pathname !== "/login") {
      sessionStorage.setItem("redirectAfterLogin", redirectPath);
    }

    return <Navigate to="/login" replace />;
  }

  /*
   * Đã đăng nhập nhưng không đúng quyền.
   *
   * Ví dụ:
   * user thường truy cập /admin
   * → chuyển về trang chủ.
   */
  if (allowedRole && normalizeRole(role) !== normalizeRole(allowedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
