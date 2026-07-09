import "./LoginPage.css";

import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { login } from "../services/authApi";

import { mergeGuestCartToCurrentUser } from "../utils/cartUtils";

import Header from "../components/Header";

import Footer from "../components/Footer";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const [serverMessage, setServerMessage] = useState("");

  const validateLogin = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email hoặc số điện thoại";
    }

    if (!password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setServerMessage("");

    if (!validateLogin()) {
      return;
    }

    try {
      setLoading(true);

      const response = await login({
        email,
        password,
      });

      localStorage.setItem("token", response.token);

      localStorage.setItem("role", response.role);

      localStorage.setItem("currentUser", JSON.stringify(response));

      mergeGuestCartToCurrentUser();
      window.dispatchEvent(new Event("authChanged"));
      window.dispatchEvent(new Event("cartUpdated"));

      if (normalizeRole(response.role) === "ADMIN") {
        navigate("/admin");
      } else {
        const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");

        if (redirectAfterLogin) {
          sessionStorage.removeItem("redirectAfterLogin");

          navigate(redirectAfterLogin);
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      console.log(error);

      setServerMessage(error.response?.data || "Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header />

      <main className="login-main">
        <form className="login-form" onSubmit={handleLogin}>
          <h1>ĐĂNG NHẬP</h1>

          <div className="login-title-line">
            <span></span>
          </div>

          <p className="login-register-text">
            Chưa có tài khoản? <Link to="/register">đăng ký tại đây</Link>
          </p>

          {serverMessage && (
            <div className="form-message error">{serverMessage}</div>
          )}

          <div className="login-field">
            <div
              className={
                errors.email ? "login-input-box input-error" : "login-input-box"
              }
            >
              <span>✉️</span>

              <input
                type="text"
                placeholder="Email hoặc số điện thoại"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);

                  setErrors({
                    ...errors,
                    email: "",
                  });
                }}
              />
            </div>

            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="login-field">
            <div
              className={
                errors.password
                  ? "login-input-box input-error"
                  : "login-input-box"
              }
            >
              <span>🔒</span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  setErrors({
                    ...errors,
                    password: "",
                  });
                }}
              />

              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {errors.password && (
              <p className="field-error">{errors.password}</p>
            )}
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
