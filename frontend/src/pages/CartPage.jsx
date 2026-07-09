import "./CartPage.css";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { useToast } from "../components/common/ToastProvider";

import {
  getCart,
  removeFromCart,
  updateCartQuantity,
} from "../utils/cartUtils";

import { applyCoupon } from "../services/couponApi";
import { getImageUrl } from "../utils/imageUtils";

export default function CartPage() {
  const toast = useToast();

  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);

  const [selectedCartKeys, setSelectedCartKeys] = useState([]);

  const [imageFallbackIndexes, setImageFallbackIndexes] = useState({});

  const [couponCode, setCouponCode] = useState("");

  const [couponResult, setCouponResult] = useState(null);

  const [couponMessage, setCouponMessage] = useState("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cart = getCart();

    setCartItems(cart);

    setSelectedCartKeys((currentSelectedKeys) => {
      const allKeys = cart.map((item) => getItemKey(item));

      if (currentSelectedKeys.length === 0) {
        return allKeys;
      }

      return currentSelectedKeys.filter((key) => allKeys.includes(key));
    });
  };

  const getItemKey = (item) => {
    const productId = item.productId || item.id;
    const selectedOptionsText = JSON.stringify(item.selectedOptions || {});

    return item.cartKey || `${productId}-${selectedOptionsText}`;
  };

  const getCartItemImages = (item) => {
    const candidates = [
      item.image,
      item.imageUrl,
      item.thumbnail,
      item.thumbnailUrl,
      item.productImage,
      item.productImageUrl,
      ...(Array.isArray(item.images)
        ? item.images.flatMap((image) => [
            image?.imageUrl,
            image?.url,
            image?.image,
          ])
        : []),
    ]
      .map((image) => (image ? String(image).trim() : ""))
      .filter(Boolean);

    return [...new Set(candidates)];
  };

  const handleCartImageError = (itemKey, imageCount) => {
    setImageFallbackIndexes((currentIndexes) => {
      const currentIndex = Number(currentIndexes[itemKey] || 0);

      if (currentIndex + 1 >= imageCount) {
        return {
          ...currentIndexes,
          [itemKey]: imageCount,
        };
      }

      return {
        ...currentIndexes,
        [itemKey]: currentIndex + 1,
      };
    });
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

  const selectedCartItems = cartItems.filter((item) =>
    selectedCartKeys.includes(getItemKey(item)),
  );

  const cartTotalQuantity = cartItems.reduce((total, item) => {
    return total + Number(item.quantity || 1);
  }, 0);

  const isAllSelected =
    cartItems.length > 0 && selectedCartKeys.length === cartItems.length;

  const totalQuantity = selectedCartItems.reduce((total, item) => {
    return total + Number(item.quantity || 1);
  }, 0);

  const subTotal = selectedCartItems.reduce((total, item) => {
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

  const handleToggleSelectItem = (itemKey) => {
    setSelectedCartKeys((currentKeys) => {
      const nextKeys = currentKeys.includes(itemKey)
        ? currentKeys.filter((key) => key !== itemKey)
        : [...currentKeys, itemKey];

      setCouponCode("");
      setCouponResult(null);
      setCouponMessage(
        "Danh sách sản phẩm thanh toán đã thay đổi. Vui lòng áp dụng lại mã giảm giá.",
      );
      sessionStorage.removeItem("checkoutCouponCode");

      return nextKeys;
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCartKeys([]);
    } else {
      setSelectedCartKeys(cartItems.map((item) => getItemKey(item)));
    }

    setCouponCode("");
    setCouponResult(null);
    setCouponMessage(
      "Danh sách sản phẩm thanh toán đã thay đổi. Vui lòng áp dụng lại mã giảm giá.",
    );
    sessionStorage.removeItem("checkoutCouponCode");
  };

  const handleOpenProductDetail = (item) => {
    const productId = item.productId || item.id;

    if (!productId) {
      return;
    }

    navigate(`/product/${productId}`);
  };

  const handleGoToCheckout = () => {
    if (selectedCartKeys.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán");
      return;
    }

    sessionStorage.setItem("checkoutSource", "CART");
    sessionStorage.setItem(
      "selectedCheckoutCartKeys",
      JSON.stringify(selectedCartKeys),
    );
    sessionStorage.removeItem("buyNowItem");

    navigate("/checkout");
  };

  return (
    <>
      <Header />

      <main className="cart-page">
        <div className="cart-container-pro">
          <div className="cart-heading">
            <div>
              <div className="cart-breadcrumb">
                <Link to="/">Trang chủ</Link>
                <span className="cart-breadcrumb-separator">/</span>
                <span aria-current="page">Giỏ hàng</span>
              </div>

              <h1>Giỏ hàng của bạn</h1>

              <p>
                Kiểm tra cấu hình, số lượng và tổng tiền trước khi thanh toán.
              </p>
            </div>

            <div className="cart-status-card">
              <span>🛒</span>

              <div>
                <strong>{cartTotalQuantity}</strong>

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

                    <p>
                      Đã chọn {totalQuantity} sản phẩm / Tổng{" "}
                      {cartTotalQuantity} sản phẩm
                    </p>

                    <label className="cart-select-all-row">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                      />

                      <span className="cart-select-all-box"></span>

                      <span>Chọn tất cả sản phẩm</span>
                    </label>
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
                    const itemImages = getCartItemImages(item);
                    const itemImageIndex = Number(
                      imageFallbackIndexes[itemKey] || 0,
                    );
                    const itemImage = itemImages[itemImageIndex] || "";

                    return (
                      <article
                        className={
                          selectedCartKeys.includes(itemKey)
                            ? "cart-product-card selected"
                            : "cart-product-card"
                        }
                        key={itemKey}
                        onClick={() => handleOpenProductDetail(item)}
                      >
                        <div className="cart-product-image-box">
                          {itemImage ? (
                            <img
                              src={getImageUrl(itemImage)}
                              alt={item.name || "Sản phẩm"}
                              onError={() =>
                                handleCartImageError(itemKey, itemImages.length)
                              }
                            />
                          ) : (
                            <div className="cart-product-image-placeholder">
                              ES
                            </div>
                          )}
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

                            <div
                              className="cart-card-actions"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="remove-product-btn"
                                onClick={() => handleRemove(itemKey)}
                              >
                                ✕
                              </button>

                              <label
                                className="cart-item-checkbox"
                                aria-label="Chọn sản phẩm"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCartKeys.includes(itemKey)}
                                  onChange={() =>
                                    handleToggleSelectItem(itemKey)
                                  }
                                />

                                <span className="cart-checkbox-ui"></span>
                              </label>
                            </div>
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
                                onClick={(event) => {
                                  event.stopPropagation();
                                  updateQuantity(item, itemQuantity - 1);
                                }}
                              >
                                −
                              </button>

                              <span>{itemQuantity}</span>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  updateQuantity(item, itemQuantity + 1);
                                }}
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
                    type="button"
                    className="checkout-main-btn"
                    onClick={handleGoToCheckout}
                    disabled={selectedCartKeys.length === 0}
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
