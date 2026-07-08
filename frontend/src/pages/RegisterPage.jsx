import "./RegisterPage.css";

import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { register } from "../services/authApi";

import Header from "../components/Header";

import Footer from "../components/Footer";

import { useToast } from "../components/common/ToastProvider";

export default function RegisterPage() {
  const toast = useToast();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});

  const [serverMessage, setServerMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const validateRegister = () => {
    const newErrors = {};

    if (!form.lastName.trim()) {
      newErrors.lastName = "Vui lòng nhập họ";
    }

    if (!form.firstName.trim()) {
      newErrors.firstName = "Vui lòng nhập tên";
    }

    if (!form.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    }

    if (!form.password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (form.password.length < 5) {
      newErrors.password = "Mật khẩu phải có ít nhất 5 ký tự";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setServerMessage("");

    if (!validateRegister()) {
      return;
    }

    try {
      setLoading(true);

      await register({
        lastName: form.lastName,
        firstName: form.firstName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      toast.success("Đăng ký thành công");

      navigate("/login");
    } catch (error) {
      console.log(error);

      setServerMessage(error.response?.data || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Header />

      <main className="register-main">
        <form className="register-form" onSubmit={handleRegister}>
          <h1>ĐĂNG KÝ</h1>

          <div className="register-title-line">
            <span></span>
          </div>

          <p className="register-login-text">
            Đã có tài khoản, <Link to="/login">đăng nhập tại đây</Link>
          </p>
          {serverMessage && (
            <div className="form-message error">{serverMessage}</div>
          )}

          <div className="register-name-row">
            <div className="register-field">
              <div
                className={
                  errors.lastName
                    ? "register-input-box input-error"
                    : "register-input-box"
                }
              >
                <span>👤</span>

                <input
                  type="text"
                  name="lastName"
                  placeholder="Họ"
                  value={form.lastName}
                  onChange={(e) => {
                    handleChange(e);

                    setErrors({
                      ...errors,
                      lastName: "",
                    });
                  }}
                />
              </div>

              {errors.lastName && (
                <p className="field-error">{errors.lastName}</p>
              )}
            </div>

            <div className="register-field">
              <div
                className={
                  errors.firstName
                    ? "register-input-box input-error"
                    : "register-input-box"
                }
              >
                <span>👤</span>

                <input
                  type="text"
                  name="firstName"
                  placeholder="Tên"
                  value={form.firstName}
                  onChange={(e) => {
                    handleChange(e);

                    setErrors({
                      ...errors,
                      firstName: "",
                    });
                  }}
                />
              </div>

              {errors.firstName && (
                <p className="field-error">{errors.firstName}</p>
              )}
            </div>
          </div>

          <div className="register-field">
            <div
              className={
                errors.email
                  ? "register-input-box input-error"
                  : "register-input-box"
              }
            >
              <span>✉️</span>

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => {
                  handleChange(e);

                  setErrors({
                    ...errors,
                    email: "",
                  });
                }}
              />
            </div>

            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="register-field">
            <div
              className={
                errors.phone
                  ? "register-input-box input-error"
                  : "register-input-box"
              }
            >
              <span>📞</span>

              <input
                type="text"
                name="phone"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => {
                  handleChange(e);

                  setErrors({
                    ...errors,
                    phone: "",
                  });
                }}
              />
            </div>

            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>

          <div className="register-field">
            <div
              className={
                errors.password
                  ? "register-input-box input-error"
                  : "register-input-box"
              }
            >
              <span>🔒</span>

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={(e) => {
                  handleChange(e);

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

          <button
            type="submit"
            className="register-submit-btn"
            disabled={loading}
          >
            {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
          </button>

          <p className="register-policy-text">
            Bằng việc đăng ký, bạn đã đồng ý với{" "}
            <a href="#">Điều khoản sử dụng</a> và{" "}
            <a href="#">Chính sách bảo mật</a>
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
}
