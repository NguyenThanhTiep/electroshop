import "./OrderHistoryPage.css";

import { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { cancelOrder, getOrdersByUser } from "../services/orderApi";

const formatPrice = (value) => {
  return Number(value || 0).toLocaleString("vi-VN");
};

const getPaymentStatusLabel = (status) => {
  const labels = {
    UNPAID: "Chưa thanh toán",
    PAID: "Đã thanh toán",
    FAILED: "Thanh toán thất bại",
    REFUNDED: "Đã hoàn tiền",
    PROCESSING: "Đang xử lý",
  };

  return labels[status] || status || "Chưa cập nhật";
};

const getOrderStatusLabel = (status) => {
  const labels = {
    WAITING_PAYMENT: "Đang chờ thanh toán",

    PENDING_CONFIRMATION: "Chờ cửa hàng xác nhận",

    CONFIRMED: "Đã xác nhận",

    PREPARING: "Đang chuẩn bị hàng",

    SHIPPING: "Đang giao hàng",

    DELIVERED: "Đã giao hàng",

    COMPLETED: "Hoàn thành",

    CANCELLED: "Đã hủy",
  };

  return labels[status] || status || "Chưa cập nhật";
};

const getPaymentMethodLabel = (method) => {
  const labels = {
    COD: "Thanh toán khi nhận hàng",
    VNPAY: "Thanh toán qua VNPAY",
  };

  return labels[method] || method || "Chưa cập nhật";
};

const getStatusClass = (status) => {
  return String(status || "")
    .toLowerCase()
    .replaceAll("_", "-");
};

const getCancelRejectReason = (order) => {
  const status = order?.orderStatus;
  const paymentMethod = order?.paymentMethod;
  const paymentStatus = order?.paymentStatus;

  if (status === "CANCELLED") {
    return "Đơn hàng này đã được hủy trước đó.";
  }

  if (status === "COMPLETED") {
    return "Đơn hàng đã hoàn thành nên không thể hủy.";
  }

  if (status === "DELIVERED") {
    return "Đơn hàng đã được giao nên không thể hủy.";
  }

  if (paymentMethod === "VNPAY") {
    if (paymentStatus === "PAID") {
      return "Đơn hàng đã thanh toán qua VNPAY nên không thể hủy trực tiếp. Vui lòng liên hệ cửa hàng để được hỗ trợ hoàn tiền.";
    }

    return "Đơn hàng thanh toán qua VNPAY không thể hủy trực tiếp trên website. Vui lòng liên hệ cửa hàng để được hỗ trợ hủy đơn.";
  }

  if (status === "CONFIRMED") {
    return "Đơn hàng đã được cửa hàng xác nhận nên bạn không thể tự hủy.";
  }

  if (status === "PREPARING") {
    return "Đơn hàng đang được chuẩn bị nên bạn không thể tự hủy.";
  }

  if (status === "SHIPPING") {
    return "Đơn hàng đang được giao nên bạn không thể tự hủy.";
  }

  const cancelableStatuses = ["WAITING_PAYMENT", "PENDING_CONFIRMATION"];

  if (!cancelableStatuses.includes(status)) {
    return "Chỉ có thể hủy đơn trước khi cửa hàng xác nhận.";
  }

  return "";
};

const canUserCancelOrder = (order) => {
  return getCancelRejectReason(order) === "";
};
const getApiErrorMessage = (error, fallbackMessage) => {
  const data = error.response?.data;

  let message =
    data?.detail ||
    data?.message ||
    data?.error ||
    (typeof data === "string" ? data : "") ||
    fallbackMessage;

  return String(message || fallbackMessage)
    .replace(/^409\s*CONFLICT\s*"?/i, "")
    .replace(/^CONFLICT\s*"?/i, "")
    .replace(/^"|"$/g, "")
    .trim();
};
export default function OrderHistoryPage() {
  const location = useLocation();

  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const [errorTitle, setErrorTitle] = useState("Thông báo đơn hàng");

  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const [currentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("currentUser");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Không thể đọc currentUser:", error);

      return null;
    }
  });

  const userId = Number(
    currentUser?.id ?? currentUser?.userId ?? currentUser?.user?.id ?? 0,
  );

  /*
   * Lưu thông báo vào state riêng.
   * Nhờ vậy khi xóa location.state,
   * thông báo vẫn còn hiển thị.
   */
  const [successInfo, setSuccessInfo] = useState(() => {
    if (location.state?.orderCreated) {
      return {
        message: "Đặt hàng thành công!",

        orderCode: location.state?.orderCode || "",
      };
    }

    return null;
  });

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const handleCancelOrder = async (order) => {
    if (!userId) {
      setErrorTitle("Không thể hủy đơn hàng");
      setErrorMessage("Không tìm thấy tài khoản đăng nhập.");
      return;
    }

    const cancelRejectReason = getCancelRejectReason(order);

    if (cancelRejectReason) {
      setErrorTitle("Không thể hủy đơn hàng");
      setErrorMessage(cancelRejectReason);

      await fetchOrders();
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy đơn ${order.orderCode || `#${order.id}`} không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingOrderId(order.id);
      setErrorTitle("Thông báo đơn hàng");
      setErrorMessage("");

      await cancelOrder(order.id);

      setSuccessInfo({
        message: "Hủy đơn hàng thành công!",
        orderCode: order.orderCode || "",
      });

      await fetchOrders();
    } catch (error) {
      console.error("Lỗi hủy đơn hàng:", error);

      const statusCode = error.response?.status;

      if (statusCode === 409) {
        setErrorTitle("Không thể hủy đơn hàng");
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Đơn hàng đã được xử lý nên không thể hủy. Vui lòng liên hệ cửa hàng để được hỗ trợ.",
          ),
        );

        await fetchOrders();
        return;
      }

      setErrorTitle("Không thể hủy đơn hàng");
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Không thể hủy đơn hàng. Vui lòng thử lại hoặc liên hệ cửa hàng.",
        ),
      );
    } finally {
      setCancellingOrderId(null);
    }
  };
  /*
   * Xóa state khỏi lịch sử trình duyệt.
   * Khi người dùng F5, thông báo sẽ
   * không hiện lại.
   */
  useEffect(() => {
    if (location.state?.orderCreated) {
      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.state, navigate]);

  /*
   * Tự ẩn thông báo sau 6 giây.
   */
  useEffect(() => {
    if (!successInfo) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccessInfo(null);
    }, 6000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successInfo]);

  const fetchOrders = async () => {
    if (!userId) {
      setOrders([]);
      setErrorTitle("Không thể tải đơn hàng");
      setErrorMessage("Không tìm thấy tài khoản đăng nhập.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorTitle("Thông báo đơn hàng");
      setErrorMessage("");

      const data = await getOrdersByUser(userId);

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);

      setErrorTitle("Không thể tải đơn hàng");
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Header />

      <main className="history-page">
        <div className="history-container">
          <div className="history-heading">
            <div>
              <span className="history-breadcrumb">Trang chủ / Đơn hàng</span>

              <h1>Lịch sử đơn hàng</h1>

              <p>
                Theo dõi trạng thái thanh toán và quá trình xử lý đơn hàng của
                bạn.
              </p>
            </div>

            <button
              type="button"
              className="history-refresh-btn"
              onClick={fetchOrders}
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>

          {successInfo && (
            <div className="order-success-message">
              <div className="order-success-icon">✓</div>

              <div>
                <strong>{successInfo.message}</strong>

                <p>
                  Mã đơn hàng của bạn:{" "}
                  <b>{successInfo.orderCode || "Đang cập nhật"}</b>
                </p>

                <span>
                  ElectroShop đã tiếp nhận đơn hàng và sẽ sớm xác nhận.
                </span>
              </div>

              <button
                type="button"
                className="order-success-close"
                onClick={() => setSuccessInfo(null)}
                aria-label="Đóng thông báo"
              >
                ×
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="history-error-message">
              <strong>{errorTitle}</strong>

              <p>{errorMessage}</p>

              <button type="button" onClick={fetchOrders}>
                Làm mới đơn hàng
              </button>
            </div>
          )}

          {loading ? (
            <section className="history-loading">
              <div className="history-spinner" />

              <p>Đang tải lịch sử đơn hàng...</p>
            </section>
          ) : orders.length === 0 ? (
            <section className="history-empty">
              <div className="history-empty-icon">📦</div>

              <h2>Bạn chưa có đơn hàng nào</h2>

              <p>
                Hãy lựa chọn sản phẩm phù hợp và bắt đầu mua sắm tại
                ElectroShop.
              </p>

              <button type="button" onClick={() => navigate("/")}>
                Tiếp tục mua sắm
              </button>
            </section>
          ) : (
            <div className="history-grid">
              {orders.map((order) => {
                const paymentClass = getStatusClass(order.paymentStatus);

                const orderClass = getStatusClass(order.orderStatus);

                return (
                  <article key={order.id} className="history-card">
                    <div className="history-card-header">
                      <div>
                        <span>Mã đơn hàng</span>

                        <h2>{order.orderCode || `Đơn hàng #${order.id}`}</h2>
                        <small className="history-order-date">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("vi-VN")
                            : "Chưa cập nhật thời gian"}
                        </small>
                      </div>

                      <span className={`order-status-badge ${orderClass}`}>
                        {getOrderStatusLabel(order.orderStatus)}
                      </span>
                    </div>

                    <div className="history-card-body">
                      <div className="history-info-row">
                        <span>Người nhận</span>

                        <strong>{order.customerName || "Chưa cập nhật"}</strong>
                      </div>

                      <div className="history-info-row">
                        <span>Số điện thoại</span>

                        <strong>{order.phone || "Chưa cập nhật"}</strong>
                      </div>

                      <div className="history-info-row">
                        <span>Địa chỉ</span>

                        <strong>
                          {order.shippingAddress ||
                            order.address ||
                            "Chưa cập nhật"}
                        </strong>
                      </div>

                      <div className="history-info-row">
                        <span>Phương thức</span>

                        <strong>
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </strong>
                      </div>

                      <div className="history-info-row">
                        <span>Thanh toán</span>

                        <span
                          className={`payment-status-badge ${paymentClass}`}
                        >
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </span>
                      </div>

                      {/* DANH SÁCH SẢN PHẨM TRONG ĐƠN */}

                      {Array.isArray(order.items) && order.items.length > 0 && (
                        <div className="history-order-items">
                          <span className="history-items-title">
                            Sản phẩm trong đơn
                          </span>

                          {order.items.map((item) => (
                            <Link
                              key={item.id}
                              className="history-order-item history-order-item-link"
                              to={`/product/${item.productId}?tab=reviews`}
                            >
                              <div>
                                <strong>
                                  {item.productName || "Sản phẩm"}
                                </strong>

                                <small>Số lượng: {item.quantity || 1}</small>

                                {order.orderStatus === "COMPLETED" && (
                                  <span className="history-review-hint">
                                    ⭐ Nhấn để đánh giá sản phẩm
                                  </span>
                                )}
                              </div>

                              <b>{formatPrice(item.lineTotal)}đ</b>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="history-card-footer">
                      <div className="history-total-box">
                        <span>Tổng thanh toán</span>

                        <strong>
                          {formatPrice(order.totalAmount ?? order.totalPrice)}đ
                        </strong>
                      </div>

                      {canUserCancelOrder(order) ? (
                        <button
                          type="button"
                          className="order-cancel-btn"
                          disabled={cancellingOrderId === order.id}
                          onClick={() => handleCancelOrder(order)}
                        >
                          {cancellingOrderId === order.id
                            ? "Đang hủy..."
                            : "Hủy đơn"}
                        </button>
                      ) : (
                        order.orderStatus !== "CANCELLED" && (
                          <div className="order-cancel-note">
                            <span>ℹ️</span>
                            <p>{getCancelRejectReason(order)}</p>
                          </div>
                        )
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
