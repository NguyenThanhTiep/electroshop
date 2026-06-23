import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");

  const role = localStorage.getItem("role");

  /*
   * Chưa đăng nhập.
   */
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  /*
   * Đã đăng nhập nhưng không đúng quyền.
   *
   * Ví dụ:
   * user thường truy cập /admin
   * → chuyển về trang chủ.
   */
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
