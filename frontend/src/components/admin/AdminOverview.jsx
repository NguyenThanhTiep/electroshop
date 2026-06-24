import "./AdminOverview.css";

import { useMemo } from "react";

const ORDER_STATUS_LABELS = {
  WAITING_PAYMENT: "Chờ thanh toán",
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị",
  SHIPPING: "Đang giao hàng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

export default function AdminOverview({
  products = [],
  orders = [],
  users = [],
  promotions = [],
  coupons = [],
  flashSales = [],
  onOpenMenu,
  onRefresh,
}) {
  const overviewData = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safePromotions = Array.isArray(promotions) ? promotions : [];
    const safeCoupons = Array.isArray(coupons) ? coupons : [];
    const safeFlashSales = Array.isArray(flashSales) ? flashSales : [];

    const managedUsers = safeUsers.filter(
      (user) => String(user.role || "").toLowerCase() !== "admin",
    );

    const revenueOrders = safeOrders.filter(
      (order) =>
        order.orderStatus === "COMPLETED" || order.paymentStatus === "PAID",
    );

    const totalRevenue = revenueOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount ?? order.totalPrice ?? 0),
      0,
    );

    const pendingOrders = safeOrders.filter(
      (order) => order.orderStatus === "PENDING_CONFIRMATION",
    );

    const completedOrders = safeOrders.filter(
      (order) => order.orderStatus === "COMPLETED",
    );

    const cancelledOrders = safeOrders.filter(
      (order) => order.orderStatus === "CANCELLED",
    );

    const lowStockProducts = safeProducts
      .filter((item) => Number(item.stock || 0) > 0)
      .filter((item) => Number(item.stock || 0) <= 5)
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
      .slice(0, 6);

    const outOfStockProducts = safeProducts.filter(
      (item) => Number(item.stock || 0) <= 0,
    );

    const totalSoldQuantity = safeProducts.reduce(
      (sum, item) => sum + Number(item.soldQuantity || 0),
      0,
    );

    const activePromotionCount = safePromotions.filter(
      (item) => item.active,
    ).length;

    const activeCouponCount = safeCoupons.filter((item) => item.active).length;

    const activeFlashSaleCount = safeFlashSales.filter(
      (item) => item.active,
    ).length;

    const averageOrderValue =
      revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

    const orderStatusOverview = [
      {
        key: "WAITING_PAYMENT",
        label: "Chờ thanh toán",
        value: safeOrders.filter(
          (order) => order.orderStatus === "WAITING_PAYMENT",
        ).length,
        className: "waiting",
      },
      {
        key: "PENDING_CONFIRMATION",
        label: "Chờ xác nhận",
        value: pendingOrders.length,
        className: "pending",
      },
      {
        key: "CONFIRMED",
        label: "Đã xác nhận",
        value: safeOrders.filter((order) => order.orderStatus === "CONFIRMED")
          .length,
        className: "confirmed",
      },
      {
        key: "PREPARING",
        label: "Đang chuẩn bị",
        value: safeOrders.filter((order) => order.orderStatus === "PREPARING")
          .length,
        className: "preparing",
      },
      {
        key: "SHIPPING",
        label: "Đang giao hàng",
        value: safeOrders.filter((order) => order.orderStatus === "SHIPPING")
          .length,
        className: "shipping",
      },
      {
        key: "COMPLETED",
        label: "Hoàn thành",
        value: completedOrders.length,
        className: "completed",
      },
      {
        key: "CANCELLED",
        label: "Đã hủy",
        value: cancelledOrders.length,
        className: "cancelled",
      },
    ];

    const recentOrders = [...safeOrders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    const maxOrderStatusValue = Math.max(
      ...orderStatusOverview.map((item) => item.value),
      1,
    );

    return {
      managedUsers,
      revenueOrders,
      totalRevenue,
      totalOrders: safeOrders.length,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      lowStockProducts,
      outOfStockProducts,
      totalSoldQuantity,
      activePromotionCount,
      activeCouponCount,
      activeFlashSaleCount,
      activeMarketingCount:
        activePromotionCount + activeCouponCount + activeFlashSaleCount,
      averageOrderValue,
      orderStatusOverview,
      recentOrders,
      maxOrderStatusValue,
      products: safeProducts,
    };
  }, [products, orders, users, promotions, coupons, flashSales]);

  const openMenu = (menu) => {
    if (typeof onOpenMenu === "function") {
      onOpenMenu(menu);
    }
  };

  return (
    <div className="overview-page">
      <section className="overview-hero">
        <div className="overview-hero-content">
          <span className="overview-badge">Admin Control Center</span>

          <h2>Tổng quan vận hành ElectroShop</h2>

          <p>
            Theo dõi nhanh doanh thu, đơn hàng, tồn kho, người dùng và các
            chương trình khuyến mãi đang hoạt động.
          </p>

          <div className="overview-hero-actions">
            <button type="button" onClick={onRefresh}>
              Làm mới dữ liệu
            </button>

            <button
              type="button"
              className="overview-outline-btn"
              onClick={() => openMenu("orders")}
            >
              Xử lý đơn hàng
            </button>
          </div>
        </div>

        <div className="overview-hero-card">
          <span>Doanh thu ghi nhận</span>

          <strong>{formatPrice(overviewData.totalRevenue)}</strong>

          <p>Từ các đơn đã thanh toán hoặc đã hoàn thành.</p>
        </div>
      </section>

      <section className="overview-kpi-grid">
        <div className="overview-kpi-card revenue">
          <span className="overview-kpi-icon">💰</span>

          <div>
            <p>Tổng doanh thu</p>
            <h3>{formatPrice(overviewData.totalRevenue)}</h3>
            <small>
              Trung bình: {formatPrice(overviewData.averageOrderValue)}
            </small>
          </div>
        </div>

        <div className="overview-kpi-card orders">
          <span className="overview-kpi-icon">📦</span>

          <div>
            <p>Tổng đơn hàng</p>
            <h3>{overviewData.totalOrders}</h3>
            <small>{overviewData.pendingOrders.length} đơn chờ xác nhận</small>
          </div>
        </div>

        <div className="overview-kpi-card pending">
          <span className="overview-kpi-icon">⏳</span>

          <div>
            <p>Cần xử lý</p>
            <h3>{overviewData.pendingOrders.length}</h3>
            <small>Đơn mới cần admin xác nhận</small>
          </div>
        </div>

        <div className="overview-kpi-card stock">
          <span className="overview-kpi-icon">⚠️</span>

          <div>
            <p>Tồn kho thấp</p>
            <h3>{overviewData.lowStockProducts.length}</h3>
            <small>
              {overviewData.outOfStockProducts.length} sản phẩm hết hàng
            </small>
          </div>
        </div>

        <div className="overview-kpi-card products">
          <span className="overview-kpi-icon">🛒</span>

          <div>
            <p>Sản phẩm</p>
            <h3>{overviewData.products.length}</h3>
            <small>Đã bán {overviewData.totalSoldQuantity} sản phẩm</small>
          </div>
        </div>

        <div className="overview-kpi-card users">
          <span className="overview-kpi-icon">👥</span>

          <div>
            <p>Người dùng</p>
            <h3>{overviewData.managedUsers.length}</h3>
            <small>Tài khoản khách hàng đang quản lý</small>
          </div>
        </div>
      </section>

      <section className="overview-content-grid">
        <div className="overview-panel overview-status-panel">
          <div className="overview-panel-header">
            <div>
              <span>Order Flow</span>
              <h3>Trạng thái đơn hàng</h3>
            </div>

            <button type="button" onClick={() => openMenu("orders")}>
              Xem đơn
            </button>
          </div>

          <div className="overview-status-list">
            {overviewData.orderStatusOverview.map((status) => (
              <div className="overview-status-item" key={status.key}>
                <div className="overview-status-info">
                  <span>{status.label}</span>
                  <strong>{status.value} đơn</strong>
                </div>

                <div className="overview-progress">
                  <div
                    className={`overview-progress-bar ${status.className}`}
                    style={{
                      width: `${
                        (status.value / overviewData.maxOrderStatusValue) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-panel overview-marketing-panel">
          <div className="overview-panel-header">
            <div>
              <span>Marketing</span>
              <h3>Khuyến mãi đang chạy</h3>
            </div>

            <button type="button" onClick={() => openMenu("promotions")}>
              Quản lý
            </button>
          </div>

          <div className="overview-marketing-score">
            <strong>{overviewData.activeMarketingCount}</strong>

            <span>chiến dịch đang hoạt động</span>
          </div>

          <div className="overview-mini-list">
            <div>
              <span>Giảm giá sản phẩm</span>
              <strong>{overviewData.activePromotionCount}</strong>
            </div>

            <div>
              <span>Mã giảm giá</span>
              <strong>{overviewData.activeCouponCount}</strong>
            </div>

            <div>
              <span>Flash Sale</span>
              <strong>{overviewData.activeFlashSaleCount}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="overview-bottom-grid">
        <div className="overview-panel">
          <div className="overview-panel-header">
            <div>
              <span>Recent Orders</span>
              <h3>Đơn hàng gần đây</h3>
            </div>
          </div>

          <div className="overview-order-list">
            {overviewData.recentOrders.length === 0 ? (
              <p className="overview-empty">Chưa có đơn hàng nào.</p>
            ) : (
              overviewData.recentOrders.map((order) => (
                <div className="overview-order-card" key={order.id}>
                  <div>
                    <strong>{order.orderCode || `#${order.id}`}</strong>

                    <span>
                      {order.customerName || "Khách hàng"} •{" "}
                      {ORDER_STATUS_LABELS[order.orderStatus] ||
                        order.orderStatus ||
                        "Chưa cập nhật"}
                    </span>
                  </div>

                  <b>{formatPrice(order.totalAmount ?? order.totalPrice)}</b>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overview-panel">
          <div className="overview-panel-header">
            <div>
              <span>Inventory Alert</span>
              <h3>Cảnh báo tồn kho</h3>
            </div>

            <button type="button" onClick={() => openMenu("products")}>
              Xem kho
            </button>
          </div>

          <div className="overview-stock-list">
            {overviewData.lowStockProducts.length === 0 ? (
              <p className="overview-empty">Tồn kho hiện đang ổn định.</p>
            ) : (
              overviewData.lowStockProducts.map((item) => (
                <div className="overview-stock-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>

                    <span>
                      {item.category || "Chưa có danh mục"} •{" "}
                      {item.brand || "Chưa có thương hiệu"}
                    </span>
                  </div>

                  <b>Còn {item.stock}</b>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="overview-quick-grid">
        <button type="button" onClick={() => openMenu("products")}>
          <span>🛒</span>
          <strong>Quản lý sản phẩm</strong>
          <small>Thêm, sửa và kiểm tra tồn kho</small>
        </button>

        <button type="button" onClick={() => openMenu("orders")}>
          <span>📦</span>
          <strong>Quản lý đơn hàng</strong>
          <small>Xác nhận và cập nhật trạng thái</small>
        </button>

        <button type="button" onClick={() => openMenu("promotions")}>
          <span>🔥</span>
          <strong>Khuyến mãi</strong>
          <small>Coupon, giảm giá, Flash Sale</small>
        </button>

        <button type="button" onClick={() => openMenu("users")}>
          <span>👥</span>
          <strong>Người dùng</strong>
          <small>Tìm kiếm, khóa hoặc xóa tài khoản</small>
        </button>
      </section>
    </div>
  );
}
