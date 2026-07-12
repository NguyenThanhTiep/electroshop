import "./CheckoutPage.css";

import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import {
  getCart,
  clearCart,
  getBuyNowItem,
  clearBuyNowItem,
  clearSelectedCartItems,
} from "../utils/cartUtils";

import { createCheckout } from "../services/checkoutApi";

import { applyCoupon } from "../services/couponApi";
import { getImageUrl } from "../utils/imageUtils";

const FALLBACK_PRODUCT_IMAGE =
  "https://placehold.co/160x160/eef2ff/1e293b?text=ElectroShop";

const convertPriceToNumber = (price) => {
  if (price === null || price === undefined || price === "") {
    return 0;
  }

  if (typeof price === "number") {
    return price;
  }

  return Number(String(price).replace(/\D/g, "")) || 0;
};

const roundPriceToNearestThousand = (price) => {
  const numberValue = convertPriceToNumber(price);

  if (numberValue <= 0) {
    return 0;
  }

  return Math.round(numberValue / 1000) * 1000;
};

const formatPrice = (price) => {
  return convertPriceToNumber(price).toLocaleString("vi-VN") + "đ";
};

const getCartItemPrice = (item) => {
  if (item.isFlashSale && item.flashSalePrice) {
    return roundPriceToNearestThousand(item.flashSalePrice);
  }

  return roundPriceToNearestThousand(item.price);
};

const getSelectedOptionsText = (selectedOptions) => {
  if (!selectedOptions || typeof selectedOptions !== "object") {
    return [];
  }

  return Object.entries(selectedOptions).map(([groupName, option]) => ({
    groupName,
    optionName: option?.name || String(option || ""),
  }));
};

const getCheckoutItemImageUrl = (item) => {
  const firstSubImage = item?.images?.[0];

  const rawImage =
    item?.image ||
    item?.productImage ||
    item?.imageUrl ||
    (typeof firstSubImage === "string"
      ? firstSubImage
      : firstSubImage?.imageUrl) ||
    "";

  return rawImage ? getImageUrl(rawImage) : FALLBACK_PRODUCT_IMAGE;
};

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);

  const [paymentMethod, setPaymentMethod] = useState("VNPAY");

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [couponCode] = useState(
    () => sessionStorage.getItem("checkoutCouponCode") || "",
  );

  const [checkoutCoupon, setCheckoutCoupon] = useState(null);

  const [couponLoading, setCouponLoading] = useState(false);

  const currentUser = useMemo(() => {
    try {
      const savedUser = localStorage.getItem("currentUser");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Không thể đọc thông tin người dùng:", error);

      return null;
    }
  }, []);

  const defaultFullName =
    currentUser?.fullName ||
    currentUser?.user?.fullName ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ");

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    shippingAddress: "",
    note: "",
  });

  useEffect(() => {
    const checkoutSource = sessionStorage.getItem("checkoutSource");

    if (checkoutSource === "BUY_NOW") {
      const buyNowItem = getBuyNowItem();

      if (buyNowItem) {
        setCartItems([buyNowItem]);
        return;
      }

      sessionStorage.removeItem("checkoutSource");
      sessionStorage.removeItem("buyNowItem");
    }

    const cart = getCart();

    const selectedCartKeys = JSON.parse(
      sessionStorage.getItem("selectedCheckoutCartKeys") || "[]",
    );

    if (Array.isArray(selectedCartKeys) && selectedCartKeys.length > 0) {
      const selectedCart = cart.filter((item) => {
        const productId = item.productId || item.id;
        const selectedOptionsText = JSON.stringify(item.selectedOptions || {});
        const itemKey = item.cartKey || `${productId}-${selectedOptionsText}`;

        return selectedCartKeys.includes(itemKey);
      });

      setCartItems(selectedCart);

      return;
    }

    setCartItems(Array.isArray(cart) ? cart : []);
  }, []);

  useEffect(() => {
    setFormData((currentForm) => ({
      ...currentForm,

      customerName: defaultFullName || currentForm.customerName,

      email:
        currentUser?.email || currentUser?.user?.email || currentForm.email,

      phone:
        currentUser?.phone || currentUser?.user?.phone || currentForm.phone,
    }));
  }, [currentUser, defaultFullName]);

  const totalQuantity = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 1),
    0,
  );

  const estimatedSubtotal = cartItems.reduce((total, item) => {
    const price = getCartItemPrice(item);

    const quantity = Number(item.quantity || 1);

    return total + price * quantity;
  }, 0);
  const FREE_SHIPPING_THRESHOLD = 20000000;

  const DEFAULT_SHIPPING_FEE = 30000;

  const estimatedShippingFee =
    estimatedSubtotal <= 0
      ? 0
      : estimatedSubtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : DEFAULT_SHIPPING_FEE;

  const estimatedDiscountAmount = checkoutCoupon?.valid
    ? Number(checkoutCoupon.discountAmount || 0)
    : 0;

  const estimatedTotalAmount = Math.max(
    0,
    estimatedSubtotal + estimatedShippingFee - estimatedDiscountAmount,
  );

  const deliveryAddress = formData.shippingAddress.trim();

  const canShowDeliveryMap = deliveryAddress.length >= 10;

  const deliveryMapQuery = encodeURIComponent(`${deliveryAddress}, Việt Nam`);

  const deliveryMapEmbedUrl = `https://maps.google.com/maps?q=${deliveryMapQuery}&z=16&output=embed`;

  const deliveryMapOpenUrl = `https://www.google.com/maps/search/?api=1&query=${deliveryMapQuery}`;

  useEffect(() => {
    let cancelled = false;

    const validateCheckoutCoupon = async () => {
      if (!couponCode || estimatedSubtotal <= 0) {
        setCheckoutCoupon(null);
        return;
      }

      try {
        setCouponLoading(true);

        const data = await applyCoupon({
          code: couponCode,
          orderTotal: estimatedSubtotal,
        });

        if (cancelled) {
          return;
        }

        setCheckoutCoupon(data);

        if (!data.valid) {
          sessionStorage.removeItem("checkoutCouponCode");
        }
      } catch (error) {
        console.error("Không thể kiểm tra coupon:", error);

        if (!cancelled) {
          setCheckoutCoupon(null);
        }
      } finally {
        if (!cancelled) {
          setCouponLoading(false);
        }
      }
    };

    validateCheckoutCoupon();

    return () => {
      cancelled = true;
    };
  }, [couponCode, estimatedSubtotal]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrorMessage("");
  };

  const validateForm = () => {
    if (cartItems.length === 0) {
      return "Giỏ hàng đang trống";
    }

    if (!formData.customerName.trim()) {
      return "Vui lòng nhập họ tên người nhận";
    }

    if (!formData.phone.trim()) {
      return "Vui lòng nhập số điện thoại";
    }

    if (!formData.shippingAddress.trim()) {
      return "Vui lòng nhập địa chỉ nhận hàng";
    }

    const invalidItem = cartItems.find((item) => {
      const productId = item.productId ?? item.id;

      return !productId;
    });

    if (invalidItem) {
      return "Có sản phẩm trong giỏ hàng không có ID";
    }

    return "";
  };

  const buildCheckoutItems = () => {
    return cartItems.map((item) => {
      const productId = item.productId ?? item.id;

      const selectedOptions =
        typeof item.selectedOptions === "string"
          ? item.selectedOptions
          : JSON.stringify(item.selectedOptions || {});

      return {
        productId: Number(productId),

        quantity: Number(item.quantity || 1),

        selectedOptions,
      };
    });
  };

  const savePendingTransaction = (paymentUrl) => {
    try {
      const url = new URL(paymentUrl);

      const txnRef = url.searchParams.get("vnp_TxnRef");

      if (txnRef) {
        sessionStorage.setItem("pendingVnpayTxnRef", txnRef);
      }
    } catch (error) {
      console.warn("Không đọc được mã giao dịch:", error);
    }
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    setErrorMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);

      return;
    }

    try {
      setLoading(true);

      const checkoutSource = sessionStorage.getItem("checkoutSource") || "CART";

      const checkoutData = {
        customerName: formData.customerName.trim(),

        email: formData.email.trim(),

        phone: formData.phone.trim(),

        shippingAddress: formData.shippingAddress.trim(),

        note: formData.note.trim(),

        paymentMethod,

        couponCode: checkoutCoupon?.valid ? couponCode : null,

        items: buildCheckoutItems(),
      };

      console.log("Dữ liệu checkout:", checkoutData);

      const result = await createCheckout(checkoutData);

      console.log("Kết quả checkout:", result);

      if (paymentMethod === "VNPAY") {
        if (!result.paymentUrl) {
          throw new Error("Backend không trả về URL thanh toán VNPAY");
        }

        savePendingTransaction(result.paymentUrl);

        sessionStorage.setItem("pendingOrderCode", result.orderCode || "");
        sessionStorage.setItem("pendingCheckoutSource", checkoutSource);

        sessionStorage.setItem(
          "pendingSelectedCartKeys",
          sessionStorage.getItem("selectedCheckoutCartKeys") || "[]",
        );

        /*
         * Không xóa giỏ hàng tại đây.
         * Chỉ xóa sau khi backend xác nhận PAID.
         */
        window.location.assign(result.paymentUrl);

        return;
      }

      /*
       * COD: backend đã tạo đơn thành công,
       * nên có thể xóa giỏ hàng.
       */
      if (checkoutSource === "BUY_NOW") {
        clearBuyNowItem();
      } else {
        const selectedCartKeys = JSON.parse(
          sessionStorage.getItem("selectedCheckoutCartKeys") || "[]",
        );

        if (Array.isArray(selectedCartKeys) && selectedCartKeys.length > 0) {
          clearSelectedCartItems(selectedCartKeys);
        } else {
          clearCart();
        }
      }

      navigate("/orders", {
        state: {
          orderCreated: true,
          orderCode: result.orderCode,
        },
      });
    } catch (error) {
      console.error("Lỗi checkout:", error);

      const backendMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data === "string" ? error.response.data : "");

      setErrorMessage(
        backendMessage || error.message || "Không thể tạo đơn hàng",
      );
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Header />

        <main className="checkout-page">
          <section className="checkout-empty">
            <div className="checkout-empty-icon">🛒</div>

            <h1>Giỏ hàng đang trống</h1>

            <p>Bạn cần thêm sản phẩm trước khi tiến hành thanh toán.</p>

            <button type="button" onClick={() => navigate("/")}>
              Tiếp tục mua sắm
            </button>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="checkout-page">
        <div className="checkout-heading">
          <span>Trang chủ / Giỏ hàng / Thanh toán</span>

          <h1>Thanh toán đơn hàng</h1>

          <p>
            Kiểm tra thông tin nhận hàng và lựa chọn phương thức thanh toán.
          </p>
        </div>

        <form className="checkout-container" onSubmit={handleCheckout}>
          <section className="checkout-form">
            <div className="checkout-section-title">
              <span>1</span>

              <div>
                <h2>Thông tin nhận hàng</h2>

                <p>Điền chính xác thông tin để ElectroShop giao hàng.</p>
              </div>
            </div>

            <div className="checkout-form-grid">
              <label className="checkout-field">
                <span>
                  Họ và tên
                  <strong>*</strong>
                </span>

                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  placeholder="Nhập họ và tên"
                  onChange={handleInputChange}
                />
              </label>

              <label className="checkout-field">
                <span>
                  Số điện thoại
                  <strong>*</strong>
                </span>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  placeholder="Nhập số điện thoại"
                  onChange={handleInputChange}
                />
              </label>

              <label className="checkout-field checkout-field-full">
                <span>Email</span>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  placeholder="Nhập email"
                  onChange={handleInputChange}
                />
              </label>

              <label className="checkout-field checkout-field-full">
                <span>
                  Địa chỉ nhận hàng
                  <strong>*</strong>
                </span>

                <textarea
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  rows={4}
                  onChange={handleInputChange}
                />
              </label>

              {canShowDeliveryMap && (
                <div className="checkout-delivery-map checkout-field-full">
                  <div className="checkout-delivery-map-header">
                    <div>
                      <strong>Xác nhận vị trí giao hàng</strong>

                      <p>Kiểm tra nhanh vị trí theo địa chỉ bạn vừa nhập.</p>
                    </div>

                    <a
                      href={deliveryMapOpenUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Mở Google Maps
                    </a>
                  </div>

                  <div className="checkout-delivery-map-frame">
                    <iframe
                      title="Bản đồ địa chỉ giao hàng"
                      src={deliveryMapEmbedUrl}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <p className="checkout-delivery-map-note">
                    Nếu bản đồ chưa đúng vị trí, hãy nhập địa chỉ chi tiết hơn:
                    số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố.
                  </p>
                </div>
              )}

              <label className="checkout-field checkout-field-full">
                <span>Ghi chú đơn hàng</span>

                <textarea
                  name="note"
                  value={formData.note}
                  placeholder="Ví dụ: Giao hàng trong giờ hành chính"
                  rows={3}
                  onChange={handleInputChange}
                />
              </label>
            </div>

            <div className="checkout-section-title checkout-payment-title">
              <span>2</span>

              <div>
                <h2>Phương thức thanh toán</h2>

                <p>Chọn hình thức thanh toán phù hợp.</p>
              </div>
            </div>

            <div className="checkout-payment-list">
              <label
                className={
                  paymentMethod === "VNPAY"
                    ? "checkout-payment-option active"
                    : "checkout-payment-option"
                }
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="VNPAY"
                  checked={paymentMethod === "VNPAY"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />

                <div className="checkout-payment-icon">VN</div>

                <div>
                  <strong>Thanh toán qua VNPAY</strong>

                  <p>Thanh toán trực tuyến trên môi trường VNPAY Sandbox.</p>
                </div>

                <span className="checkout-payment-check">✓</span>
              </label>

              <label
                className={
                  paymentMethod === "COD"
                    ? "checkout-payment-option active"
                    : "checkout-payment-option"
                }
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />

                <div className="checkout-payment-icon">💵</div>

                <div>
                  <strong>Thanh toán khi nhận hàng</strong>

                  <p>Thanh toán cho nhân viên giao hàng khi nhận sản phẩm.</p>
                </div>

                <span className="checkout-payment-check">✓</span>
              </label>
            </div>

            {errorMessage && (
              <div className="checkout-error">
                <strong>Không thể thanh toán</strong>

                <p>{errorMessage}</p>
              </div>
            )}
          </section>

          <aside className="checkout-summary">
            <div className="checkout-summary-header">
              <div>
                <h2>Đơn hàng của bạn</h2>

                <p>{totalQuantity} sản phẩm</p>
              </div>

              <button type="button" onClick={() => navigate("/cart")}>
                Chỉnh sửa
              </button>
            </div>

            <div className="checkout-product-list">
              {cartItems.map((item) => {
                const itemKey =
                  item.cartKey ||
                  `${item.id}-${JSON.stringify(item.selectedOptions || {})}`;

                const quantity = Number(item.quantity || 1);

                const itemPrice = getCartItemPrice(item);

                const selectedOptions = getSelectedOptionsText(
                  item.selectedOptions,
                );

                return (
                  <article className="checkout-product-item" key={itemKey}>
                    <div className="checkout-product-image">
                      <img
                        src={getCheckoutItemImageUrl(item)}
                        alt={item.name || "Sản phẩm"}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                        }}
                      />

                      <span>{quantity}</span>
                    </div>

                    <div className="checkout-product-info">
                      <h3>{item.name}</h3>

                      {selectedOptions.length > 0 && (
                        <div className="checkout-option-list">
                          {selectedOptions.map((option) => (
                            <span key={option.groupName}>
                              {option.groupName}:{" "}
                              <strong>{option.optionName}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      <p>{formatPrice(itemPrice)}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="checkout-summary-divider" />

            <div className="checkout-summary-row">
              <span>Tạm tính</span>

              <strong>{formatPrice(estimatedSubtotal)}</strong>
            </div>

            <div className="checkout-summary-row">
              <span>Phí vận chuyển</span>

              <strong
                className={estimatedShippingFee === 0 ? "checkout-free" : ""}
              >
                {estimatedShippingFee === 0
                  ? "Miễn phí"
                  : formatPrice(estimatedShippingFee)}
              </strong>
            </div>

            {couponCode && (
              <div className="checkout-summary-row">
                <span>Mã giảm giá {couponCode}</span>

                <strong className="checkout-discount">
                  {couponLoading
                    ? "Đang kiểm tra..."
                    : checkoutCoupon?.valid
                      ? `-${formatPrice(estimatedDiscountAmount)}`
                      : "Không hợp lệ"}
                </strong>
              </div>
            )}

            <div className="checkout-summary-divider" />

            <div className="checkout-total-row">
              <span>Tổng thanh toán dự kiến</span>

              <strong>{formatPrice(estimatedTotalAmount)}</strong>
            </div>

            <p className="checkout-price-note">
              Giá cuối cùng được backend kiểm tra lại từ cơ sở dữ liệu trước khi
              tạo giao dịch.
            </p>

            <button
              type="submit"
              className="checkout-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Đang xử lý..."
                : paymentMethod === "VNPAY"
                  ? "Thanh toán qua VNPAY"
                  : "Đặt hàng COD"}
            </button>

            <div className="checkout-security">
              <span>🔒</span>

              <p>Thông tin đơn hàng được xử lý an toàn bởi ElectroShop.</p>
            </div>
          </aside>
        </form>
      </main>

      <Footer />
    </>
  );
}
