import "./NotFoundPage.css";

import { Link, useNavigate } from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  return (
    <>
      <Header />

      <main className="not-found-page">
        <section className="not-found-panel">
          <span>404</span>
          <h1>Không tìm thấy trang</h1>
          <p>
            Đường dẫn này không tồn tại hoặc đã được thay đổi. Bạn có thể quay
            lại trang trước hoặc tiếp tục mua sắm tại ElectroShop.
          </p>

          <div className="not-found-actions">
            <Link to="/">Về trang chủ</Link>
            <button type="button" onClick={handleGoBack}>
              Quay lại
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
