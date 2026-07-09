import "./OrderHistoryPage.css";

import { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { cancelOrder, getOrdersByUser } from "../services/orderApi";
import { getProductById } from "../services/productApi";
import { addToCart } from "../utils/cartUtils";
import { getImageUrl } from "../utils/imageUtils";

const ORDER_STATUS_CACHE_KEY = "electroshop_order_status_map";
const ORDERS_PER_PAGE = 8;

const ORDER_FILTERS = [
  {
    value: "ALL",
    label: "Tất cả",
    matcher: () => true,
  },
  {
    value: "PENDING",
    label: "Chờ xác nhận",
    matcher: (order) =>
      ["WAITING_PAYMENT", "PENDING_CONFIRMATION"].includes(order.orderStatus),
  },
  {
    value: "PROCESSING",
    label: "Đang xử lý",
    matcher: (order) => ["CONFIRMED", "PREPARING"].includes(order.orderStatus),
  },
  {
    value: "SHIPPING",
    label: "Đang giao",
    matcher: (order) => order.orderStatus === "SHIPPING",
  },
  {
    value: "DONE",
    label: "Hoàn tất",
    matcher: (order) => ["DELIVERED", "COMPLETED"].includes(order.orderStatus),
  },
  {
    value: "PAID",
    label: "Đã thanh toán",
    matcher: (order) => order.paymentStatus === "PAID",
  },
  {
    value: "CANCELLED",
    label: "Đã hủy",
    matcher: (order) => order.orderStatus === "CANCELLED",
  },
];

const ORDER_TIMELINE = [
  {
    key: "PLACED",
    label: "Đặt hàng",
    statuses: [
      "WAITING_PAYMENT",
      "PENDING_CONFIRMATION",
      "CONFIRMED",
      "PREPARING",
      "SHIPPING",
      "DELIVERED",
      "COMPLETED",
    ],
  },
  {
    key: "CONFIRMED",
    label: "Xác nhận",
    statuses: ["CONFIRMED", "PREPARING", "SHIPPING", "DELIVERED", "COMPLETED"],
  },
  {
    key: "SHIPPING",
    label: "Đang giao",
    statuses: ["SHIPPING", "DELIVERED", "COMPLETED"],
  },
  {
    key: "COMPLETED",
    label: "Hoàn tất",
    statuses: ["DELIVERED", "COMPLETED"],
  },
];

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

const getOrderIdentity = (order) => String(order?.id || order?.orderCode || "");

const readCachedOrderStatuses = (userId) => {
  try {
    const data = JSON.parse(
      localStorage.getItem(`${ORDER_STATUS_CACHE_KEY}_${userId}`) || "{}",
    );

    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
};

const writeCachedOrderStatuses = (userId, orders) => {
  const statusMap = orders.reduce((result, order) => {
    const key = getOrderIdentity(order);

    if (key) {
      result[key] = order.orderStatus || "";
    }

    return result;
  }, {});

  localStorage.setItem(
    `${ORDER_STATUS_CACHE_KEY}_${userId}`,
    JSON.stringify(statusMap),
  );
};

const getChangedOrderStatus = (previousMap, orders) => {
  return orders.find((order) => {
    const key = getOrderIdentity(order);

    return key && previousMap[key] && previousMap[key] !== order.orderStatus;
  });
};

const parseSelectedOptions = (selectedOptions) => {
  if (!selectedOptions || typeof selectedOptions !== "string") {
    return selectedOptions || {};
  }

  try {
    return JSON.parse(selectedOptions);
  } catch {
    return {};
  }
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

  const [activeFilter, setActiveFilter] = useState("ALL");

  const [orderSearchKeyword, setOrderSearchKeyword] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const [errorTitle, setErrorTitle] = useState("Thông báo đơn hàng");

  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const [reorderingOrderId, setReorderingOrderId] = useState(null);

  const [statusNotification, setStatusNotification] = useState(null);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, orderSearchKeyword]);

  const handleReorder = async (order) => {
    const orderItems = Array.isArray(order?.items) ? order.items : [];

    if (!["COMPLETED", "CANCELLED"].includes(order?.orderStatus)) {
      setErrorTitle("Chưa thể mua lại");
      setErrorMessage("Chỉ có thể mua lại đơn đã hoàn tất hoặc đã hủy.");
      return;
    }

    if (orderItems.length === 0) {
      setErrorTitle("Chưa thể mua lại");
      setErrorMessage("Đơn hàng chưa có dữ liệu sản phẩm để thêm lại.");
      return;
    }

    try {
      setReorderingOrderId(order.id);
      setErrorMessage("");

      let addedCount = 0;
      let skippedCount = 0;

      for (const item of orderItems) {
        if (!item.productId) {
          skippedCount += 1;
          continue;
        }

        try {
          const productData = await getProductById(item.productId);
          const availableStock = Number(productData?.stock || 0);

          if (!productData?.id || availableStock <= 0) {
            skippedCount += 1;
            continue;
          }

          const quantity = Math.min(Number(item.quantity || 1), availableStock);

          addToCart(
            {
              ...productData,
              productId: productData.id,
              quantity,
              selectedOptions: parseSelectedOptions(item.selectedOptions),
            },
            quantity,
          );

          addedCount += 1;
        } catch {
          skippedCount += 1;
        }
      }

      if (addedCount > 0) {
        setSuccessInfo({
          message: "Đã thêm lại sản phẩm vào giỏ hàng!",
          orderCode: order.orderCode || "",
        });

        if (skippedCount > 0) {
          setErrorTitle("Một số sản phẩm chưa được thêm");
          setErrorMessage(
            `${skippedCount} sản phẩm đã hết hàng hoặc không còn tồn tại.`,
          );
        }
      } else {
        setErrorTitle("Chưa thể mua lại");
        setErrorMessage("Các sản phẩm trong đơn hiện đã hết hàng.");
      }
    } finally {
      setReorderingOrderId(null);
    }
  };

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

  const fetchOrders = async ({ silent = false } = {}) => {
    if (!userId) {
      setOrders([]);
      setErrorTitle("Không thể tải đơn hàng");
      setErrorMessage("Không tìm thấy tài khoản đăng nhập.");
      if (!silent) {
        setLoading(false);
      }
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
        setErrorTitle("Thông báo đơn hàng");
        setErrorMessage("");
      }

      const data = await getOrdersByUser(userId);
      const nextOrders = Array.isArray(data) ? data : [];
      const previousStatusMap = readCachedOrderStatuses(userId);
      const changedOrder = silent
        ? getChangedOrderStatus(previousStatusMap, nextOrders)
        : null;

      setOrders(nextOrders);
      writeCachedOrderStatuses(userId, nextOrders);

      if (changedOrder) {
        setStatusNotification({
          orderCode: changedOrder.orderCode || `#${changedOrder.id}`,
          status: changedOrder.orderStatus,
        });
      }
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);

      if (!silent) {
        setErrorTitle("Không thể tải đơn hàng");
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.",
          ),
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const activeFilterConfig =
    ORDER_FILTERS.find((filter) => filter.value === activeFilter) ||
    ORDER_FILTERS[0];

  useEffect(() => {
    if (!userId) {
      return;
    }

    const timer = window.setInterval(() => {
      fetchOrders({ silent: true });
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [userId]);

  useEffect(() => {
    if (!statusNotification) {
      return;
    }

    const timer = window.setTimeout(() => {
      setStatusNotification(null);
    }, 7000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [statusNotification]);

  const searchKeyword = orderSearchKeyword.trim().toLowerCase();

  const filteredOrders = orders.filter((order) => {
    const itemNames = Array.isArray(order.items)
      ? order.items.map((item) => item.productName || "").join(" ")
      : "";
    const searchableText = [
      order.orderCode,
      order.id,
      order.customerName,
      order.phone,
      itemNames,
    ]
      .join(" ")
      .toLowerCase();

    return (
      activeFilterConfig.matcher(order) &&
      (!searchKeyword || searchableText.includes(searchKeyword))
    );
  });

  const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const safeCurrentPage =
    totalOrderPages > 0 ? Math.min(currentPage, totalOrderPages) : 1;
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * ORDERS_PER_PAGE,
    safeCurrentPage * ORDERS_PER_PAGE,
  );
  const paginationStart =
    filteredOrders.length === 0
      ? 0
      : (safeCurrentPage - 1) * ORDERS_PER_PAGE + 1;
  const paginationEnd = Math.min(
    safeCurrentPage * ORDERS_PER_PAGE,
    filteredOrders.length,
  );

  return (
    <>
      <Header />

      <main className="history-page">
        <div className="history-container">
          <div className="history-heading">
            <div>
              <nav className="history-breadcrumb" aria-label="breadcrumb">
                <Link to="/">Trang chủ</Link>
                <span>/</span>
                <strong>Đơn hàng</strong>
              </nav>

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

          {statusNotification && (
            <div className="history-status-notification">
              <span>🔔</span>
              <div>
                <strong>Đơn {statusNotification.orderCode} vừa cập nhật</strong>
                <p>
                  Trạng thái mới:{" "}
                  <b>{getOrderStatusLabel(statusNotification.status)}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusNotification(null)}
                aria-label="Đóng thông báo trạng thái"
              >
                ×
              </button>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <>
              <div className="history-search-box">
                <span>🔎</span>
                <input
                  type="search"
                  placeholder="Tìm theo mã đơn, tên sản phẩm, số điện thoại..."
                  value={orderSearchKeyword}
                  onChange={(event) =>
                    setOrderSearchKeyword(event.target.value)
                  }
                />
                {orderSearchKeyword && (
                  <button
                    type="button"
                    onClick={() => setOrderSearchKeyword("")}
                  >
                    Xóa
                  </button>
                )}
              </div>

              <div className="history-filter-bar" role="tablist">
                {ORDER_FILTERS.map((filter) => {
                  const count = orders.filter((order) =>
                    filter.matcher(order),
                  ).length;
                  const isActive = activeFilter === filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      className={isActive ? "active" : ""}
                      onClick={() => setActiveFilter(filter.value)}
                    >
                      {filter.label}
                      <span>{count}</span>
                    </button>
                  );
                })}
              </div>
            </>
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
          ) : filteredOrders.length === 0 ? (
            <section className="history-empty compact">
              <div className="history-empty-icon">📦</div>

              <h2>Không có đơn hàng phù hợp</h2>

              <p>Hãy chọn trạng thái khác để xem các đơn hàng còn lại.</p>
            </section>
          ) : (
            <>
              <div className="history-grid">
                {paginatedOrders.map((order) => {
                  const paymentClass = getStatusClass(order.paymentStatus);

                  const orderClass = getStatusClass(order.orderStatus);

                  const timelineActiveIndex = getTimelineActiveIndex(
                    order.orderStatus,
                  );

                  const isCancelledOrder = order.orderStatus === "CANCELLED";

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

                      <div
                        className={
                          isCancelledOrder
                            ? "history-order-timeline cancelled"
                            : "history-order-timeline"
                        }
                      >
                        {ORDER_TIMELINE.map((step, stepIndex) => {
                          const isDone =
                            !isCancelledOrder &&
                            stepIndex < timelineActiveIndex;
                          const isActive =
                            !isCancelledOrder &&
                            stepIndex === timelineActiveIndex;

                          return (
                            <div
                              key={step.key}
                              className={[
                                "history-timeline-step",
                                isDone ? "done" : "",
                                isActive ? "active" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <span />
                              <small>{step.label}</small>
                            </div>
                          );
                        })}
                      </div>

                      {/* DANH SÁCH SẢN PHẨM TRONG ĐƠN */}

                      {Array.isArray(order.items) && order.items.length > 0 && (
                        <div className="history-order-items">
                          <span className="history-items-title">
                            Sản phẩm trong đơn
                          </span>

                          {order.items.map((item) => {
                            const itemImage = getOrderItemImage(item);

                            return (
                              <Link
                                key={item.id}
                                className="history-order-item history-order-item-link"
                                to={`/product/${item.productId}?tab=reviews`}
                              >
                                <div className="history-order-item-media">
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

                                <div className="history-order-item-info">
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
                            );
                          })}
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

                      <div className="history-footer-actions">
                        <Link
                          className="order-detail-link"
                          to={`/orders/${order.id}`}
                        >
                          Xem chi tiết
                        </Link>

                        {["COMPLETED", "CANCELLED"].includes(
                          order.orderStatus,
                        ) && (
                          <button
                            type="button"
                            className="order-reorder-btn"
                            disabled={reorderingOrderId === order.id}
                            onClick={() => handleReorder(order)}
                          >
                            {reorderingOrderId === order.id
                              ? "Đang thêm..."
                              : "Mua lại"}
                          </button>
                        )}

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
                    </div>
                    </article>
                  );
                })}
              </div>

              {totalOrderPages > 1 && (
                <div className="history-pagination" aria-label="Phân trang đơn hàng">
                  <span>
                    Hiển thị {paginationStart}-{paginationEnd} /{" "}
                    {filteredOrders.length} đơn
                  </span>

                  <div className="history-pagination-buttons">
                    <button
                      type="button"
                      disabled={safeCurrentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                    >
                      Trước
                    </button>

                    {Array.from({ length: totalOrderPages }, (_, index) => {
                      const pageNumber = index + 1;

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          className={
                            pageNumber === safeCurrentPage ? "active" : ""
                          }
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={safeCurrentPage === totalOrderPages}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalOrderPages, page + 1),
                        )
                      }
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
