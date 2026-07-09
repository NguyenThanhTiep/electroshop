import "./OrderDetailPage.css";

import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { getOrderById, getOrderByUser } from "../services/orderApi";
import { getImageUrl } from "../utils/imageUtils";

const ORDER_TIMELINE = [
  {
    key: "PLACED",
    label: "Đặt hàng",
    description: "ElectroShop đã tiếp nhận đơn",
  },
  {
    key: "CONFIRMED",
    label: "Xác nhận",
    description: "Cửa hàng kiểm tra và xác nhận",
  },
  {
    key: "SHIPPING",
    label: "Đang giao",
    description: "Đơn hàng đang trên đường giao",
  },
  {
    key: "COMPLETED",
    label: "Hoàn tất",
    description: "Giao hàng thành công",
  },
];

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatDateTime = (value) => {
  if (!value) {
    return "Chưa cập nhật";
  }

  return new Date(value).toLocaleString("vi-VN");
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

const getTimelineActiveIndex = (status) => {
  if (status === "CANCELLED") {
    return -1;
  }

  if (["DELIVERED", "COMPLETED"].includes(status)) {
    return 3;
  }

  if (status === "SHIPPING") {
    return 2;
  }

  if (["CONFIRMED", "PREPARING"].includes(status)) {
    return 1;
  }

  return 0;
};

const getOrderItemImage = (item) => {
  return (
    item?.productImage ||
    item?.image ||
    item?.imageUrl ||
    item?.thumbnail ||
    item?.product?.image ||
    ""
  );
};

const readCurrentUser = () => {
  try {
    const savedUser = localStorage.getItem("currentUser");

    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
};

const getCurrentUserId = (currentUser) => {
  const userId = currentUser?.id ?? currentUser?.userId ?? currentUser?.user?.id;

  return Number(userId || 0);
};

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");

const isAdminRole = (role) => normalizeRole(role) === "ADMIN";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const currentUser = readCurrentUser();
        const currentUserId = getCurrentUserId(currentUser);
        const currentRole =
          localStorage.getItem("role") ||
          currentUser?.role ||
          currentUser?.user?.role ||
          "";

        if (!isAdminRole(currentRole) && !currentUserId) {
          throw new Error("Không tìm thấy tài khoản đăng nhập.");
        }

        const data = isAdminRole(currentRole)
          ? await getOrderById(id)
          : await getOrderByUser(currentUserId, id);

        setOrder(data || null);
      } catch (error) {
        console.error("Không thể tải chi tiết đơn hàng:", error);

        const statusCode = error.response?.status;

        if (statusCode === 401) {
          setErrorMessage("Vui lòng đăng nhập để xem đơn hàng.");
        } else if (statusCode === 403) {
          setErrorMessage("Bạn không có quyền xem đơn hàng này.");
        } else if (statusCode === 404) {
          setErrorMessage("Đơn hàng không tồn tại hoặc không thuộc tài khoản này.");
        } else {
          setErrorMessage(
            error.message ||
              "Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const timelineActiveIndex = getTimelineActiveIndex(order?.orderStatus);
  const isCancelledOrder = order?.orderStatus === "CANCELLED";
  const orderStatusClass = getStatusClass(order?.orderStatus);
  const paymentStatusClass = getStatusClass(order?.paymentStatus);
  const orderItems = Array.isArray(order?.items) ? order.items : [];

  return (
    <>
      <Header />

      <main className="order-detail-page">
        <div className="order-detail-container">
          <button
            type="button"
            className="order-detail-back"
            onClick={() => navigate("/orders")}
          >
            ← Quay lại lịch sử đơn hàng
          </button>

          {loading ? (
            <section className="order-detail-state">
              <div className="order-detail-spinner" />
              <p>Đang tải chi tiết đơn hàng...</p>
            </section>
          ) : errorMessage || !order ? (
            <section className="order-detail-state error">
              <h1>Không tìm thấy đơn hàng</h1>
              <p>{errorMessage || "Đơn hàng không tồn tại hoặc đã bị xóa."}</p>
              <button type="button" onClick={() => navigate("/orders")}>
                Về lịch sử đơn hàng
              </button>
            </section>
          ) : (
            <>
              <section className="order-detail-hero">
                <div>
                  <nav
                    className="order-detail-breadcrumb"
                    aria-label="breadcrumb"
                  >
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <Link to="/orders">Đơn hàng</Link>
                    <span>/</span>
                    <strong>Chi tiết</strong>
                  </nav>
                  <h1>{order.orderCode || `Đơn hàng #${order.id}`}</h1>
                  <p>Đặt lúc {formatDateTime(order.createdAt)}</p>
                </div>

                <div className="order-detail-status-group">
                  <span className={`order-detail-badge ${orderStatusClass}`}>
                    {getOrderStatusLabel(order.orderStatus)}
                  </span>
                  <span
                    className={`order-detail-badge payment ${paymentStatusClass}`}
                  >
                    {getPaymentStatusLabel(order.paymentStatus)}
                  </span>
                </div>
              </section>

              <section
                className={
                  isCancelledOrder
                    ? "order-detail-timeline cancelled"
                    : "order-detail-timeline"
                }
              >
                {ORDER_TIMELINE.map((step, index) => {
                  const isDone = !isCancelledOrder && index < timelineActiveIndex;
                  const isActive =
                    !isCancelledOrder && index === timelineActiveIndex;

                  return (
                    <div
                      key={step.key}
                      className={[
                        "order-detail-timeline-step",
                        isDone ? "done" : "",
                        isActive ? "active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span />
                      <strong>{step.label}</strong>
                      <small>{step.description}</small>
                    </div>
                  );
                })}
              </section>

              <section className="order-detail-summary-grid">
                <div className="order-detail-card order-detail-summary-card">
                  <h2>Thông tin giao hàng</h2>

                  <div className="order-detail-info-list">
                    <div>
                      <span>Người nhận</span>
                      <strong>{order.customerName || "Chưa cập nhật"}</strong>
                    </div>

                    <div>
                      <span>Số điện thoại</span>
                      <strong>{order.phone || "Chưa cập nhật"}</strong>
                    </div>

                    <div>
                      <span>Địa chỉ</span>
                      <strong>
                        {order.shippingAddress ||
                          order.address ||
                          "Chưa cập nhật"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="order-detail-card order-detail-summary-card">
                  <h2>Thanh toán</h2>

                  <div className="order-detail-info-list">
                    <div>
                      <span>Phương thức</span>
                      <strong>{getPaymentMethodLabel(order.paymentMethod)}</strong>
                    </div>

                    <div>
                      <span>Trạng thái</span>
                      <strong>{getPaymentStatusLabel(order.paymentStatus)}</strong>
                    </div>

                    <div className="order-detail-total-row">
                      <span>Tổng thanh toán</span>
                      <strong>
                        {formatPrice(order.totalAmount ?? order.totalPrice)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="order-detail-support">
                  <strong>Cần hỗ trợ đơn hàng?</strong>
                  <p>
                    Nếu đơn đã thanh toán qua VNPAY hoặc cần đổi thông tin, hãy
                    liên hệ cửa hàng để được hỗ trợ nhanh hơn.
                  </p>
                  <Link to="/contact">Liên hệ hỗ trợ</Link>
                </div>
              </section>

              <div className="order-detail-layout">
                <section className="order-detail-card order-detail-products">
                  <div className="order-detail-card-head">
                    <div>
                      <h2>Sản phẩm trong đơn</h2>
                      <p>{orderItems.length} sản phẩm</p>
                    </div>
                  </div>

                  {orderItems.length > 0 ? (
                    <div className="order-detail-items">
                      {orderItems.map((item, index) => {
                        const itemImage = getOrderItemImage(item);

                        return (
                          <Link
                            key={item.id || `${item.productId}-${index}`}
                            className="order-detail-item"
                            to={`/product/${item.productId}`}
                          >
                            <div className="order-detail-item-image">
                              {itemImage ? (
                                <img
                                  src={getImageUrl(itemImage)}
                                  alt={item.productName || "Sản phẩm"}
                                  loading="lazy"
                                />
                              ) : (
                                <span>ES</span>
                              )}
                            </div>

                            <div className="order-detail-item-info">
                              <strong>{item.productName || "Sản phẩm"}</strong>
                              <span>Số lượng: {item.quantity || 1}</span>
                            </div>

                            <b>{formatPrice(item.lineTotal)}</b>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="order-detail-empty-text">
                      Đơn hàng chưa có dữ liệu sản phẩm.
                    </p>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
