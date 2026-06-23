import "./ContactPage.css";

import Header from "../components/Header";
import Footer from "../components/Footer";

const STORE_NAME = "ElectroShop";

const STORE_ADDRESS =
  "1 Võ Văn Ngân, phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh";

const STORE_PHONE = "0909 999 999";

const STORE_EMAIL = "support@electroshop.vn";

export default function ContactPage() {
  const mapQuery = encodeURIComponent(`${STORE_NAME}, ${STORE_ADDRESS}`);

  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&z=16&output=embed`;

  const directionUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}&travelmode=driving`;

  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <>
      <Header />

      <main className="contact-page">
        <section className="contact-hero">
          <div className="contact-hero-overlay" />

          <div className="contact-hero-content">
            <div className="contact-hero-left">
              <span className="contact-badge">Trung tâm hỗ trợ khách hàng</span>

              <h1>
                Liên hệ với
                <span> ElectroShop</span>
              </h1>

              <p>
                Chúng tôi luôn sẵn sàng hỗ trợ bạn về sản phẩm, đơn hàng, bảo
                hành và tư vấn thiết bị công nghệ phù hợp.
              </p>

              <div className="contact-hero-actions">
                <a href={`tel:${STORE_PHONE}`} className="contact-main-btn">
                  Gọi ngay
                </a>

                <a
                  href={directionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-outline-btn"
                >
                  Chỉ đường
                </a>
              </div>
            </div>

            <div className="contact-hero-card">
              <div className="contact-store-icon">🏬</div>

              <h3>{STORE_NAME}</h3>

              <p>
                Laptop, PC Gaming, linh kiện và phụ kiện công nghệ chính hãng.
              </p>

              <div className="contact-status">
                <span />
                Đang mở cửa hôm nay
              </div>
            </div>
          </div>
        </section>

        <section className="contact-wrapper">
          <div className="contact-info-panel">
            <div className="contact-section-heading">
              <span>Thông tin cửa hàng</span>
              <h2>Ghé thăm ElectroShop</h2>
              <p>
                Bạn có thể liên hệ trực tiếp hoặc đến cửa hàng để được tư vấn.
              </p>
            </div>

            <div className="contact-info-grid">
              <div className="contact-info-box">
                <div className="contact-info-icon">📍</div>

                <div>
                  <span>Địa chỉ</span>
                  <strong>{STORE_ADDRESS}</strong>
                </div>
              </div>

              <div className="contact-info-box">
                <div className="contact-info-icon">☎️</div>

                <div>
                  <span>Hotline</span>
                  <a href={`tel:${STORE_PHONE}`}>{STORE_PHONE}</a>
                </div>
              </div>

              <div className="contact-info-box">
                <div className="contact-info-icon">✉️</div>

                <div>
                  <span>Email</span>
                  <a href={`mailto:${STORE_EMAIL}`}>{STORE_EMAIL}</a>
                </div>
              </div>

              <div className="contact-info-box">
                <div className="contact-info-icon">🕘</div>

                <div>
                  <span>Thời gian làm việc</span>
                  <strong>08:00 - 21:00, Thứ 2 - Chủ nhật</strong>
                </div>
              </div>
            </div>

            <div className="contact-note-card">
              <strong>Lưu ý</strong>

              <p>
                Vui lòng liên hệ trước khi đến cửa hàng nếu bạn muốn kiểm tra
                tình trạng hàng hoặc cần tư vấn cấu hình theo nhu cầu.
              </p>
            </div>
          </div>

          <div className="contact-map-panel">
            <div className="contact-map-top">
              <div>
                <span>Bản đồ cửa hàng</span>
                <h2>Vị trí ElectroShop</h2>
              </div>

              <a href={mapSearchUrl} target="_blank" rel="noreferrer">
                Mở Google Maps
              </a>
            </div>

            <div className="contact-map-frame">
              <iframe
                title="ElectroShop Google Map"
                src={mapEmbedUrl}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />

              <div className="contact-map-floating">
                <strong>{STORE_NAME}</strong>
                <span>{STORE_ADDRESS}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-service-row">
          <div className="contact-service-card">
            <span>🚚</span>
            <strong>Giao hàng toàn quốc</strong>
            <p>Hỗ trợ giao hàng nhanh chóng, an toàn.</p>
          </div>

          <div className="contact-service-card">
            <span>🛡️</span>
            <strong>Bảo hành chính hãng</strong>
            <p>Cam kết sản phẩm rõ nguồn gốc, chính sách minh bạch.</p>
          </div>

          <div className="contact-service-card">
            <span>💬</span>
            <strong>Tư vấn miễn phí</strong>
            <p>Hỗ trợ chọn laptop, PC và phụ kiện phù hợp nhu cầu.</p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
