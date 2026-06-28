import "./CartPage.css";

import { useEffect, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";

import {
  getCart,
  removeFromCart,
  updateCartQuantity,
} from "../utils/cartUtils";

import { applyCoupon } from "../services/couponApi";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);

  const [couponCode, setCouponCode] = useState("");

  const [couponResult, setCouponResult] = useState(null);

  const [couponMessage, setCouponMessage] = useState("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    setCartItems(getCart());
  };

  const getItemKey = (item) => {
    return item.cartKey || item.id;
  };

  const convertPriceToNumber = (price) => {
    if (price === null || price === undefined || price === "") {
      return 0;
    }

    if (typeof price === "number") {
      return price;
    }

    return Number(String(price).replace(/\D/g, "")) || 0;
  };

  const formatPrice = (price) => {
    return convertPriceToNumber(price).toLocaleString("vi-VN") + "đ";
  };

  const getCartItemPrice = (item) => {
    if (item.isFlashSale && item.flashSalePrice) {
      return convertPriceToNumber(item.flashSalePrice);
    }

    return convertPriceToNumber(item.price);
  };

  const resetCouponAfterCartChange = () => {
    setCouponCode("");

    setCouponResult(null);

    setCouponMessage("Giỏ hàng đã thay đổi. Vui lòng áp dụng lại mã giảm giá.");

    sessionStorage.removeItem("checkoutCouponCode");
  };

  const handleRemove = (cartKeyOrId) => {
    removeFromCart(cartKeyOrId);

    loadCart();

    resetCouponAfterCartChange();
  };

  const updateQuantity = (item, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }

    const itemKey = getItemKey(item);

    const updatedCart = updateCartQuantity(itemKey, newQuantity);

    setCartItems(updatedCart);

    resetCouponAfterCartChange();
  };

  const totalQuantity = cartItems.reduce((total, item) => {
    return total + Number(item.quantity || 1);
  }, 0);

  const subTotal = cartItems.reduce((total, item) => {
    const price = getCartItemPrice(item);

    const quantity = Number(item.quantity) || 1;

    return total + price * quantity;
  }, 0);

  const FREE_SHIPPING_THRESHOLD = 20000000;

  const DEFAULT_SHIPPING_FEE = 30000;

  const shippingFee =
    subTotal <= 0
      ? 0
      : subTotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : DEFAULT_SHIPPING_FEE;

  const discountAmount = couponResult?.valid
    ? Number(couponResult.discountAmount || 0)
    : 0;

  const finalTotal = Math.max(0, subTotal + shippingFee - discountAmount);

  const handleApplyCoupon = async () => {
    const normalizedCode = couponCode.trim().toUpperCase();

    if (!normalizedCode) {
      setCouponMessage("Vui lòng nhập mã giảm giá");

      setCouponResult(null);

      sessionStorage.removeItem("checkoutCouponCode");

      return;
    }

    if (subTotal <= 0) {
      setCouponMessage("Giỏ hàng đang trống");

      setCouponResult(null);

      sessionStorage.removeItem("checkoutCouponCode");

      return;
    }

    try {
      const data = await applyCoupon({
        code: normalizedCode,
        orderTotal: subTotal,
      });

      setCouponResult(data);

      setCouponMessage(data.message || "Đã kiểm tra mã giảm giá");

      if (data.valid) {
        sessionStorage.setItem(
          "checkoutCouponCode",
          data.code || normalizedCode,
        );
      } else {
        sessionStorage.removeItem("checkoutCouponCode");
      }
    } catch (error) {
      console.error("Lỗi áp dụng coupon:", error);

      setCouponResult(null);

      setCouponMessage("Không thể áp dụng mã giảm giá");

      sessionStorage.removeItem("checkoutCouponCode");
    }
  };

  const handleClearCoupon = () => {
    setCouponCode("");

    setCouponResult(null);

    setCouponMessage("");

    sessionStorage.removeItem("checkoutCouponCode");
  };

  const handleGoToCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }

    sessionStorage.setItem("checkoutSource", "CART");
    sessionStorage.removeItem("buyNowItem");

    window.location.href = "/checkout";
  };

  return (
    <>
      <Header />

      <main className="cart-page">
        <div className="cart-container-pro">
          <div className="cart-heading">
            <div>
              <span className="cart-breadcrumb">Trang chủ / Giỏ hàng</span>

              <h1>Giỏ hàng của bạn</h1>

              <p>
                Kiểm tra cấu hình, số lượng và tổng tiền trước khi thanh toán.
              </p>
            </div>

            <div className="cart-status-card">
              <span>🛒</span>

              <div>
                <strong>{cartItems.length}</strong>

                <p>Sản phẩm trong giỏ</p>
              </div>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <section className="cart-empty-box">
              <div className="cart-empty-icon">🛒</div>

              <h2>Giỏ hàng đang trống</h2>

              <p>
                Bạn chưa thêm sản phẩm nào. Hãy khám phá các mẫu laptop gaming,
                PC và phụ kiện tại ElectroShop.
              </p>

              <button onClick={() => (window.location.href = "/")}>
                Tiếp tục mua sắm
              </button>
            </section>
          ) : (
            <div className="cart-content-grid">
              {/* LEFT */}

              <section className="cart-list-panel">
                <div className="cart-list-header">
                  <div>
                    <h2>Sản phẩm đã chọn</h2>

                    <p>Tổng {totalQuantity} sản phẩm</p>
                  </div>

                  <button type="button" className="cart-clear-note">
                    ElectroShop Secure Cart
                  </button>
                </div>

                <div className="cart-product-list">
                  {cartItems.map((item) => {
                    const itemKey = getItemKey(item);

                    const itemPrice = getCartItemPrice(item);

                    const itemQuantity = Number(item.quantity || 1);

                    const itemTotal = itemPrice * itemQuantity;

                    return (
                      <article className="cart-product-card" key={itemKey}>
                        <div className="cart-product-image-box">
                          <img src={item.image} alt={item.name} />
                        </div>

                        <div className="cart-product-info">
                          <div className="cart-product-title-row">
                            <div>
                              <h3>{item.name}</h3>

                              {item.isFlashSale && (
                                <span className="cart-flash-sale-tag">
                                  ⚡ Giá Flash Sale
                                </span>
                              )}

                              <span className="cart-product-brand">
                                {item.brand || "ElectroShop"}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="remove-product-btn"
                              onClick={() => handleRemove(itemKey)}
                            >
                              ✕
                            </button>
                          </div>

                          {item.selectedOptions &&
                            Object.keys(item.selectedOptions).length > 0 && (
                              <div className="cart-options-box">
                                {Object.entries(item.selectedOptions).map(
                                  ([groupName, option]) => (
                                    <div
                                      className="cart-option-pill"
                                      key={groupName}
                                    >
                                      <span>{groupName}</span>

                                      <strong>{option.name}</strong>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}

                          <div className="cart-product-footer">
                            <div className="cart-price-group">
                              <span>Đơn giá</span>

                              <strong>
                                {formatPrice(getCartItemPrice(item))}
                              </strong>
                              {item.isFlashSale && item.originalPrice && (
                                <p className="cart-old-price">
                                  {formatPrice(item.originalPrice)}
                                </p>
                              )}
                            </div>

                            <div className="quantity-stepper">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item, itemQuantity - 1)
                                }
                              >
                                −
                              </button>

                              <span>{itemQuantity}</span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item, itemQuantity + 1)
                                }
                              >
                                +
                              </button>
                            </div>

                            <div className="cart-total-group">
                              <span>Thành tiền</span>

                              <strong>{formatPrice(itemTotal)}</strong>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* RIGHT */}

              <aside className="cart-summary-panel">
                <div className="summary-card">
                  <h2>Tóm tắt đơn hàng</h2>

                  <div className="summary-row">
                    <span>Tạm tính</span>

                    <strong>{formatPrice(subTotal)}</strong>
                  </div>

                  <div className="summary-row">
                    <span>Phí vận chuyển</span>

                    <strong className={shippingFee === 0 ? "free-text" : ""}>
                      {shippingFee === 0
                        ? "Miễn phí"
                        : formatPrice(shippingFee)}
                    </strong>
                  </div>

                  <div className="cart-coupon-box">
                    <h3>Mã giảm giá</h3>

                    <div className="cart-coupon-input-row">
                      <input
                        type="text"
                        placeholder="Nhập mã, ví dụ SALE10"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                      />

                      <button type="button" onClick={handleApplyCoupon}>
                        Áp dụng
                      </button>
                    </div>

                    {couponMessage && (
                      <p
                        className={
                          couponResult?.valid
                            ? "cart-coupon-message success"
                            : "cart-coupon-message error"
                        }
                      >
                        {couponMessage}
                      </p>
                    )}

                    {couponResult?.valid && (
                      <button
                        type="button"
                        className="cart-coupon-clear"
                        onClick={handleClearCoupon}
                      >
                        Xóa mã
                      </button>
                    )}
                  </div>

                  {couponResult?.valid && (
                    <div className="summary-row">
                      <span>Mã giảm giá {couponResult.code}</span>

                      <strong className="discount-text">
                        -{formatPrice(discountAmount)}
                      </strong>
                    </div>
                  )}

                  <div className="summary-divider"></div>

                  <div className="summary-final-row">
                    <span>Tổng thanh toán</span>

                    <strong>{formatPrice(finalTotal)}</strong>
                  </div>

                  {couponResult?.valid ? (
                    <div className="coupon-success">
                      🎉 Đã áp dụng mã {couponResult.code}, bạn được giảm{" "}
                      {formatPrice(discountAmount)}.
                    </div>
                  ) : (
                    <div className="coupon-hint">
                      Nhập mã giảm giá nếu bạn có mã từ ElectroShop.
                    </div>
                  )}

                  <button
                    className="checkout-main-btn"
                    onClick={handleGoToCheckout}
                  >
                    Tiến hành thanh toán
                  </button>

                  <button
                    className="continue-shopping-btn"
                    onClick={() => (window.location.href = "/")}
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>

                <div className="trust-card">
                  <h3>Cam kết ElectroShop</h3>

                  <div className="trust-item">
                    <span>🚚</span>

                    <p>Miễn phí giao hàng cho đơn hàng đủ điều kiện</p>
                  </div>

                  <div className="trust-item">
                    <span>🛡️</span>

                    <p>Sản phẩm chính hãng, bảo hành rõ ràng</p>
                  </div>

                  <div className="trust-item">
                    <span>🔄</span>

                    <p>Hỗ trợ đổi trả nếu sản phẩm lỗi</p>
                  </div>

                  <div className="trust-item">
                    <span>💬</span>

                    <p>Tư vấn cấu hình trước và sau khi mua</p>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
