import "./Footer.css";

import { Link } from "react-router-dom";

import { CreditCard, Headphones, ShieldCheck, Truck, Zap } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    {
      label: "Laptop Gaming",
      to: "/search?category=Laptop",
    },
    {
      label: "Gaming PC",
      to: "/search?category=Gaming%20PC",
    },
    {
      label: "Gaming Gear",
      to: "/search?category=Gaming%20Gear",
    },
    {
      label: "Flash Sale",
      to: "/?section=flash-sale",
    },
  ];

  const supportLinks = [
    {
      label: "Liên hệ",
      to: "/contact",
    },
    {
      label: "Tra cứu đơn hàng",
      to: "/orders",
    },
    {
      label: "Giỏ hàng",
      to: "/cart",
    },
  ];

  return (
    <footer className="vip-footer">
      <div className="vip-footer__glow vip-footer__glow--left"></div>
      <div className="vip-footer__glow vip-footer__glow--right"></div>

      <div className="vip-footer__container">
        <section className="vip-footer__benefits">
          <div className="vip-footer__benefit">
            <div className="vip-footer__benefit-icon">
              <Truck size={22} strokeWidth={2.5} />
            </div>

            <div>
              <h4>Giao hàng nhanh</h4>
              <p>Nhận máy nhanh, đóng gói an toàn</p>
            </div>
          </div>

          <div className="vip-footer__benefit">
            <div className="vip-footer__benefit-icon">
              <ShieldCheck size={22} strokeWidth={2.5} />
            </div>

            <div>
              <h4>Bảo hành chính hãng</h4>
              <p>Cam kết sản phẩm rõ nguồn gốc</p>
            </div>
          </div>

          <div className="vip-footer__benefit">
            <div className="vip-footer__benefit-icon">
              <CreditCard size={22} strokeWidth={2.5} />
            </div>

            <div>
              <h4>Thanh toán linh hoạt</h4>
              <p>COD, VNPay, chuyển khoản</p>
            </div>
          </div>

          <div className="vip-footer__benefit">
            <div className="vip-footer__benefit-icon">
              <Headphones size={22} strokeWidth={2.5} />
            </div>

            <div>
              <h4>Hỗ trợ tận tâm</h4>
              <p>Tư vấn laptop, PC và gaming gear</p>
            </div>
          </div>
        </section>

        <section className="vip-footer__main">
          <div className="vip-footer__brand">
            <Link to="/" className="vip-footer__logo">
              <span className="vip-footer__logo-icon">
                <Zap size={27} fill="currentColor" strokeWidth={2.4} />
              </span>

              <span>
                Electro<span>Shop</span>
              </span>
            </Link>

            <p className="vip-footer__desc">
              Website công nghệ gaming chuyên laptop, PC, gaming gear và phụ
              kiện hiệu năng cao. Đồng hành cùng bạn xây dựng góc setup mạnh,
              đẹp và tối ưu chi phí.
            </p>

            <div className="vip-footer__hotline">
              <p>Hotline hỗ trợ</p>
              <strong>1900 8888</strong>
              <span>8:00 - 22:00 mỗi ngày</span>
            </div>
          </div>

          <div className="vip-footer__column">
            <h3>Sản phẩm</h3>

            {productLinks.map((item) => (
              <Link key={item.label} to={item.to}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="vip-footer__column">
            <h3>Hỗ trợ</h3>

            {supportLinks.map((item) => (
              <Link key={item.label} to={item.to}>
                {item.label}
              </Link>
            ))}

            <a href="#warranty">Chính sách bảo hành</a>
            <a href="#return">Chính sách đổi trả</a>
          </div>

          <div className="vip-footer__column">
            <h3>Mạng xã hội</h3>

            <a href="#facebook">Facebook</a>
            <a href="#instagram">Instagram</a>
            <a href="#tiktok">TikTok</a>
            <a href="#youtube">YouTube</a>

            <div className="vip-footer__socials">
              <a href="#facebook" aria-label="Facebook">
                f
              </a>

              <a href="#instagram" aria-label="Instagram">
                ◎
              </a>

              <a href="#tiktok" aria-label="TikTok">
                ♪
              </a>

              <a href="#youtube" aria-label="YouTube">
                ▶
              </a>
            </div>
          </div>

          <div className="vip-footer__newsletter">
            <h3>Nhận ưu đãi VIP</h3>

            <p>
              Đăng ký để nhận mã giảm giá, thông báo flash sale và tin công nghệ
              mới nhất từ ElectroShop.
            </p>

            <div className="vip-footer__email-box">
              <input type="email" placeholder="Nhập email của bạn" />
              <button type="button">Đăng ký</button>
            </div>

            <div className="vip-footer__payment">
              <span>Thanh toán hỗ trợ</span>

              <div>
                <b>COD</b>
                <b>VNPay</b>
                <b>Banking</b>
              </div>
            </div>
          </div>
        </section>

        <section className="vip-footer__bottom">
          <p>© {currentYear} ElectroShop. All rights reserved.</p>

          <div>
            <span>Made for gamers</span>
            <span>•</span>
            <span>Secure checkout</span>
          </div>
        </section>
      </div>
    </footer>
  );
}
