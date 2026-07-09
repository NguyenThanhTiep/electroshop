import "./AdminOverview.css";

import { useMemo, useState } from "react";

const ORDER_STATUS_LABELS = {
  WAITING_PAYMENT: "Chờ thanh toán",
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị",
  SHIPPING: "Đang giao hàng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const TIME_RANGES = [
  {
    key: "TODAY",
    label: "Hôm nay",
    shortLabel: "Hôm nay",
  },
  {
    key: "7D",
    label: "7 ngày",
    shortLabel: "7 ngày gần đây",
  },
  {
    key: "30D",
    label: "30 ngày",
    shortLabel: "30 ngày gần đây",
  },
  {
    key: "MONTH",
    label: "Tháng này",
    shortLabel: "Tháng này",
  },
  {
    key: "ALL",
    label: "Tất cả",
    shortLabel: "Toàn bộ dữ liệu",
  },
];

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatCompactPrice = (value) => {
  const number = Number(value || 0);

  if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(1)} tỷ`;
  }

  if (number >= 1000000) {
    return `${Math.round(number / 1000000)}tr`;
  }

  if (number >= 1000) {
    return `${Math.round(number / 1000)}k`;
  }

  return `${number}`;
};

const startOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const endOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const getDateValue = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getOrderDate = (order) =>
  getDateValue(order.createdAt || order.orderDate || order.createdDate);

const getCampaignEndDate = (item) =>
  getDateValue(
    item.endDate ||
      item.endTime ||
      item.expiredAt ||
      item.expiryDate ||
      item.validTo,
  );

const getUserDate = (user) =>
  getDateValue(user.createdAt || user.createdDate || user.registeredAt);

const getProductPrice = (product) =>
  Number(product.price || product.salePrice || product.finalPrice || 0);

const getDiscountPercent = (item) =>
  Number(item.discountPercent || item.discountValue || item.percent || 0);

const getCampaignName = (item) =>
  item.title || item.name || item.code || item.couponCode || `#${item.id}`;

const getCampaignValueText = (item) => {
  if (item.discountType === "AMOUNT") {
    return formatPrice(item.discountValue);
  }

  const percent = getDiscountPercent(item);

  return percent > 0 ? `${percent}%` : "Đang bật";
};

const isRevenueOrder = (order) =>
  order.orderStatus === "COMPLETED" || order.paymentStatus === "PAID";

const isInRange = (date, range) => {
  if (!date) {
    return range.key === "ALL";
  }

  if (range.key === "ALL") {
    return true;
  }

  return date >= range.start && date <= range.end;
};

const getRangeWindow = (rangeKey, now = new Date()) => {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (rangeKey === "TODAY") {
    const previousStart = addDays(todayStart, -1);
    const previousEnd = endOfDay(previousStart);

    return {
      key: rangeKey,
      start: todayStart,
      end: todayEnd,
      previousStart,
      previousEnd,
      chartDays: 1,
    };
  }

  if (rangeKey === "7D") {
    const start = addDays(todayStart, -6);
    const previousStart = addDays(start, -7);
    const previousEnd = addDays(start, -1);

    return {
      key: rangeKey,
      start,
      end: todayEnd,
      previousStart,
      previousEnd: endOfDay(previousEnd),
      chartDays: 7,
    };
  }

  if (rangeKey === "30D") {
    const start = addDays(todayStart, -29);
    const previousStart = addDays(start, -30);
    const previousEnd = addDays(start, -1);

    return {
      key: rangeKey,
      start,
      end: todayEnd,
      previousStart,
      previousEnd: endOfDay(previousEnd),
      chartDays: 30,
    };
  }

  if (rangeKey === "MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousEnd = addDays(start, -1);

    return {
      key: rangeKey,
      start,
      end: todayEnd,
      previousStart,
      previousEnd: endOfDay(previousEnd),
      chartDays: Math.max(1, todayStart.getDate()),
    };
  }

  return {
    key: "ALL",
    start: null,
    end: todayEnd,
    previousStart: null,
    previousEnd: null,
    chartDays: 14,
  };
};

const getRangeLabel = (rangeKey) =>
  TIME_RANGES.find((range) => range.key === rangeKey)?.shortLabel ||
  "Toàn bộ dữ liệu";

const getTrend = (currentValue, previousValue) => {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (previous === 0 && current === 0) {
    return {
      className: "neutral",
      text: "Chưa có dữ liệu kỳ trước",
    };
  }

  if (previous === 0) {
    return {
      className: "positive",
      text: "Mới phát sinh",
    };
  }

  const percent = Math.round(((current - previous) / previous) * 100);

  if (percent === 0) {
    return {
      className: "neutral",
      text: "Không đổi so với kỳ trước",
    };
  }

  return {
    className: percent > 0 ? "positive" : "negative",
    text: `${percent > 0 ? "+" : ""}${percent}% so với kỳ trước`,
  };
};

const getCountDelta = (currentValue, previousValue, unit) => {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);
  const delta = current - previous;

  if (delta === 0) {
    return `Không đổi so với kỳ trước`;
  }

  return `${delta > 0 ? "+" : ""}${delta} ${unit} so với kỳ trước`;
};

const buildChartData = (orders, rangeWindow, now = new Date()) => {
  const chartDays = rangeWindow.key === "ALL" ? 14 : rangeWindow.chartDays;
  const chartStart =
    rangeWindow.key === "ALL"
      ? addDays(startOfDay(now), -(chartDays - 1))
      : rangeWindow.start;

  return Array.from({ length: chartDays }, (_, index) => {
    const dayStart = addDays(chartStart, index);
    const dayEnd = endOfDay(dayStart);
    const dayOrders = orders.filter((order) => {
      const orderDate = getOrderDate(order);

      return orderDate && orderDate >= dayStart && orderDate <= dayEnd;
    });
    const dayRevenue = dayOrders
      .filter(isRevenueOrder)
      .reduce(
        (sum, order) => sum + Number(order.totalAmount ?? order.totalPrice ?? 0),
        0,
      );

    return {
      key: dayStart.toISOString(),
      label: dayStart.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      revenue: dayRevenue,
      orders: dayOrders.length,
    };
  });
};

export default function AdminOverview({
  products = [],
  orders = [],
  users = [],
  promotions = [],
  coupons = [],
  flashSales = [],
  flashSaleItems = [],
  onOpenMenu,
  onOpenOrder,
  onRefresh,
}) {
  const [activeRange, setActiveRange] = useState("7D");

  const overviewData = useMemo(() => {
    const now = new Date();
    const rangeWindow = getRangeWindow(activeRange, now);
    const safeProducts = Array.isArray(products) ? products : [];
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safePromotions = Array.isArray(promotions) ? promotions : [];
    const safeCoupons = Array.isArray(coupons) ? coupons : [];
    const safeFlashSales = Array.isArray(flashSales) ? flashSales : [];
    const safeFlashSaleItems = Array.isArray(flashSaleItems)
      ? flashSaleItems
      : [];

    const managedUsers = safeUsers.filter(
      (user) => String(user.role || "").toLowerCase() !== "admin",
    );

    const rangedUsers = managedUsers.filter((user) =>
      isInRange(getUserDate(user), rangeWindow),
    );

    const previousUsers =
      rangeWindow.key === "ALL"
        ? []
        : managedUsers.filter((user) => {
            const userDate = getUserDate(user);

            return (
              userDate &&
              userDate >= rangeWindow.previousStart &&
              userDate <= rangeWindow.previousEnd
            );
          });

    const rangedOrders = safeOrders.filter((order) =>
      isInRange(getOrderDate(order), rangeWindow),
    );

    const previousOrders =
      rangeWindow.key === "ALL"
        ? []
        : safeOrders.filter((order) => {
            const orderDate = getOrderDate(order);

            return (
              orderDate &&
              orderDate >= rangeWindow.previousStart &&
              orderDate <= rangeWindow.previousEnd
            );
          });

    const revenueOrders = rangedOrders.filter(isRevenueOrder);
    const previousRevenueOrders = previousOrders.filter(isRevenueOrder);

    const totalRevenue = revenueOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount ?? order.totalPrice ?? 0),
      0,
    );

    const previousRevenue = previousRevenueOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount ?? order.totalPrice ?? 0),
      0,
    );

    const pendingOrders = rangedOrders.filter(
      (order) => order.orderStatus === "PENDING_CONFIRMATION",
    );

    const completedOrders = rangedOrders.filter(
      (order) => order.orderStatus === "COMPLETED",
    );

    const cancelledOrders = rangedOrders.filter(
      (order) => order.orderStatus === "CANCELLED",
    );

    const waitingPaymentOrders = rangedOrders.filter(
      (order) => order.orderStatus === "WAITING_PAYMENT",
    );

    const lowStockProducts = safeProducts
      .filter((item) => Number(item.stock || 0) > 0)
      .filter((item) => Number(item.stock || 0) <= 5)
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

    const lowStockPreviewProducts = lowStockProducts.slice(0, 6);

    const outOfStockProducts = safeProducts.filter(
      (item) => Number(item.stock || 0) <= 0,
    );

    const inventoryAlertProducts = [
      ...outOfStockProducts.map((item) => ({
        ...item,
        alertLabel: "Hết hàng",
        alertLevel: "danger",
      })),
      ...lowStockPreviewProducts.map((item) => ({
        ...item,
        alertLabel: `Còn ${Number(item.stock || 0)}`,
        alertLevel: "warning",
      })),
    ].slice(0, 6);

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

    const productMap = new Map(
      safeProducts.map((product) => [Number(product.id), product]),
    );

    const topSellingProducts = [...safeProducts]
      .map((product) => {
        const soldQuantity = Number(product.soldQuantity || 0);
        const stock = Number(product.stock || 0);
        const estimatedRevenue = soldQuantity * getProductPrice(product);

        return {
          ...product,
          soldQuantity,
          stock,
          estimatedRevenue,
        };
      })
      .filter((product) => product.soldQuantity > 0)
      .sort((a, b) => b.soldQuantity - a.soldQuantity)
      .slice(0, 5);

    const hotLowStockProducts = safeProducts
      .filter((item) => Number(item.stock || 0) > 0)
      .filter((item) => Number(item.stock || 0) <= 5)
      .filter((item) => Number(item.soldQuantity || 0) >= 5)
      .sort((a, b) => Number(b.soldQuantity || 0) - Number(a.soldQuantity || 0));

    const hotLowStockPreviewProducts = hotLowStockProducts.slice(0, 5);

    const slowHighStockProducts = safeProducts
      .filter((item) => Number(item.stock || 0) >= 50)
      .filter((item) => Number(item.soldQuantity || 0) <= 2)
      .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));

    const slowHighStockPreviewProducts = slowHighStockProducts.slice(0, 5);

    const inventoryGroups = [
      {
        key: "out",
        title: "Hết hàng",
        value: outOfStockProducts.length,
        description: "Sản phẩm cần nhập lại hoặc tạm ẩn",
        level: "danger",
      },
      {
        key: "low",
        title: "Sắp hết hàng",
        value: lowStockProducts.length,
        description: "Còn 1-5 sản phẩm trong kho",
        level: "warning",
      },
      {
        key: "hot-low",
        title: "Bán chạy nhưng tồn thấp",
        value: hotLowStockProducts.length,
        description: "Có soldQuantity tốt nhưng kho còn ít",
        level: "hot",
      },
      {
        key: "slow-high",
        title: "Tồn nhiều bán chậm",
        value: slowHighStockProducts.length,
        description: "Tồn >= 50 nhưng bán <= 2",
        level: "info",
      },
    ];

    const activeFlashSaleList = safeFlashSales
      .filter((item) => item.active)
      .sort((a, b) => {
        const aEnd = getCampaignEndDate(a)?.getTime() || Number.MAX_SAFE_INTEGER;
        const bEnd = getCampaignEndDate(b)?.getTime() || Number.MAX_SAFE_INTEGER;

        return aEnd - bEnd;
      })
      .slice(0, 4);

    const promotionDiscountProducts = safePromotions
      .filter((item) => item.active)
      .filter((item) => Number(item.productId || 0) > 0)
      .map((item) => {
        const product = productMap.get(Number(item.productId));

        return {
          id: `promotion-${item.id}`,
          name: product?.name || item.productName || getCampaignName(item),
          source: "Khuyến mãi",
          discountPercent: getDiscountPercent(item),
        };
      });

    const flashSaleDiscountProducts = safeFlashSaleItems
      .filter((item) => item.active !== false)
      .map((item) => {
        const product = productMap.get(Number(item.productId));

        return {
          id: `flash-${item.id}`,
          name: product?.name || item.productName || getCampaignName(item),
          source: "Flash Sale",
          discountPercent: getDiscountPercent(item),
        };
      });

    const topDiscountProducts = [
      ...promotionDiscountProducts,
      ...flashSaleDiscountProducts,
    ]
      .filter((item) => item.discountPercent > 0)
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 5);

    const nextSevenDays = endOfDay(addDays(now, 7));
    const endingSoonCampaigns = [
      ...safePromotions,
      ...safeCoupons,
      ...safeFlashSales,
    ].filter((item) => {
      if (!item.active) {
        return false;
      }

      const endDate = getCampaignEndDate(item);

      return endDate && endDate >= now && endDate <= nextSevenDays;
    });

    const averageOrderValue =
      revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

    const orderStatusOverview = [
      {
        key: "WAITING_PAYMENT",
        label: "Chờ thanh toán",
        value: waitingPaymentOrders.length,
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
        value: rangedOrders.filter((order) => order.orderStatus === "CONFIRMED")
          .length,
        className: "confirmed",
      },
      {
        key: "PREPARING",
        label: "Đang chuẩn bị",
        value: rangedOrders.filter((order) => order.orderStatus === "PREPARING")
          .length,
        className: "preparing",
      },
      {
        key: "SHIPPING",
        label: "Đang giao hàng",
        value: rangedOrders.filter((order) => order.orderStatus === "SHIPPING")
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
      .sort(
        (a, b) =>
          (getOrderDate(b)?.getTime() || 0) - (getOrderDate(a)?.getTime() || 0),
      )
      .slice(0, 5);

    const chartData = buildChartData(safeOrders, rangeWindow, now);
    const maxChartRevenue = Math.max(
      ...chartData.map((item) => item.revenue),
      1,
    );
    const maxChartOrders = Math.max(...chartData.map((item) => item.orders), 1);

    const attentionItems = [
      {
        key: "pending-orders",
        icon: "⏳",
        title: "Đơn chờ xác nhận",
        description: "Cần kiểm tra và xác nhận để chuyển sang xử lý.",
        value: pendingOrders.length,
        level: "warning",
        menu: "orders",
      },
      {
        key: "out-of-stock",
        icon: "🚫",
        title: "Sản phẩm hết hàng",
        description: "Nên cập nhật tồn kho hoặc ẩn sản phẩm khỏi luồng bán.",
        value: outOfStockProducts.length,
        level: "danger",
        menu: "products",
      },
      {
        key: "low-stock",
        icon: "📉",
        title: "Sản phẩm tồn thấp",
        description: "Các sản phẩm còn từ 1 đến 5 đơn vị trong kho.",
        value: lowStockProducts.length,
        level: "warning",
        menu: "products",
      },
      {
        key: "ending-campaigns",
        icon: "🔥",
        title: "Khuyến mãi sắp kết thúc",
        description: "Chiến dịch active sẽ hết hạn trong 7 ngày tới.",
        value: endingSoonCampaigns.length,
        level: "info",
        menu: "promotions",
      },
    ].filter((item) => Number(item.value || 0) > 0);

    const totalOrderStatusValue = Math.max(
      orderStatusOverview.reduce(
        (sum, item) => sum + Number(item.value || 0),
        0,
      ),
      1,
    );

    return {
      rangeLabel: getRangeLabel(activeRange),
      managedUsers,
      revenueOrders,
      totalRevenue,
      previousRevenue,
      totalOrders: rangedOrders.length,
      previousOrders: previousOrders.length,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      waitingPaymentOrders,
      lowStockProducts,
      inventoryAlertProducts,
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
      totalOrderStatusValue,
      products: safeProducts,
      rangedUsers,
      previousUsers,
      userTrend: {
        className:
          rangedUsers.length > previousUsers.length
            ? "positive"
            : rangedUsers.length < previousUsers.length
              ? "negative"
              : "neutral",
        text: getCountDelta(rangedUsers.length, previousUsers.length, "tài khoản"),
      },
      chartData,
      maxChartRevenue,
      maxChartOrders,
      attentionItems,
      urgentAttentionCount: attentionItems.reduce(
        (sum, item) => sum + Number(item.value || 0),
        0,
      ),
      revenueTrend: getTrend(totalRevenue, previousRevenue),
      orderTrend: getTrend(rangedOrders.length, previousOrders.length),
      topSellingProducts,
      inventoryGroups,
      hotLowStockProducts: hotLowStockPreviewProducts,
      slowHighStockProducts: slowHighStockPreviewProducts,
      endingSoonCampaigns,
      activeFlashSaleList,
      topDiscountProducts,
    };
  }, [
    activeRange,
    products,
    orders,
    users,
    promotions,
    coupons,
    flashSales,
    flashSaleItems,
  ]);

  const openMenu = (menu) => {
    if (typeof onOpenMenu === "function") {
      onOpenMenu(menu);
    }
  };

  const openOrder = (order) => {
    if (typeof onOpenOrder === "function") {
      onOpenOrder(order);
      return;
    }

    openMenu("orders");
  };

  const getChartBarHeight = (value, maxValue) => {
    if (!value) {
      return "5%";
    }

    return `${Math.max(12, (value / maxValue) * 100)}%`;
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

          <div className="overview-range-switch" aria-label="Lọc thời gian">
            {TIME_RANGES.map((range) => (
              <button
                type="button"
                key={range.key}
                className={
                  activeRange === range.key
                    ? "overview-range-btn active"
                    : "overview-range-btn"
                }
                onClick={() => setActiveRange(range.key)}
              >
                {range.label}
              </button>
            ))}
          </div>

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

          <p>{overviewData.rangeLabel}</p>

          <em className={overviewData.revenueTrend.className}>
            {overviewData.revenueTrend.text}
          </em>
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
            <em className={`overview-kpi-trend ${overviewData.revenueTrend.className}`}>
              {overviewData.revenueTrend.text}
            </em>
          </div>
        </div>

        <div className="overview-kpi-card orders">
          <span className="overview-kpi-icon">📦</span>

          <div>
            <p>Tổng đơn hàng</p>
            <h3>{overviewData.totalOrders}</h3>
            <small>{overviewData.pendingOrders.length} đơn chờ xác nhận</small>
            <em className={`overview-kpi-trend ${overviewData.orderTrend.className}`}>
              {overviewData.orderTrend.text}
            </em>
          </div>
        </div>

        <div className="overview-kpi-card pending">
          <span className="overview-kpi-icon">⏳</span>

          <div>
            <p>Cần xử lý</p>
            <h3>{overviewData.urgentAttentionCount}</h3>
            <small>Việc vận hành cần admin kiểm tra</small>
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
            <small>
              {overviewData.rangedUsers.length} tài khoản mới trong kỳ
            </small>
            <em className={`overview-kpi-trend ${overviewData.userTrend.className}`}>
              {overviewData.userTrend.text}
            </em>
          </div>
        </div>
      </section>

      <section className="overview-insight-grid">
        <div className="overview-panel overview-chart-panel">
          <div className="overview-panel-header">
            <div>
              <span>Performance</span>
              <h3>Doanh thu & đơn hàng</h3>
            </div>

            <div className="overview-chart-legend">
              <span className="revenue-dot">Doanh thu</span>
              <span className="orders-dot">Đơn hàng</span>
            </div>
          </div>

          <div className="overview-chart-summary">
            <div>
              <span>Doanh thu kỳ này</span>
              <strong>{formatPrice(overviewData.totalRevenue)}</strong>
            </div>

            <div>
              <span>Đơn hàng kỳ này</span>
              <strong>{overviewData.totalOrders} đơn</strong>
            </div>

            <div>
              <span>Giá trị TB</span>
              <strong>{formatCompactPrice(overviewData.averageOrderValue)}</strong>
            </div>
          </div>

          <div className="overview-chart">
            {overviewData.chartData.map((item) => (
              <div className="overview-chart-column" key={item.key}>
                <div className="overview-chart-bars">
                  <span
                    className="overview-chart-bar revenue"
                    style={{
                      height: getChartBarHeight(
                        item.revenue,
                        overviewData.maxChartRevenue,
                      ),
                    }}
                    title={`${item.label}: ${formatPrice(item.revenue)}`}
                  />

                  <span
                    className="overview-chart-bar orders"
                    style={{
                      height: getChartBarHeight(
                        item.orders,
                        overviewData.maxChartOrders,
                      ),
                    }}
                    title={`${item.label}: ${item.orders} đơn`}
                  />
                </div>

                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-panel overview-attention-panel">
          <div className="overview-panel-header">
            <div>
              <span>Action Center</span>
              <h3>Việc cần xử lý ngay</h3>
            </div>
          </div>

          <div className="overview-attention-list">
            {overviewData.urgentAttentionCount === 0 ? (
              <p className="overview-empty">Mọi thứ đang ổn định.</p>
            ) : (
              overviewData.attentionItems.map((item) => (
                <button
                  type="button"
                  className={`overview-attention-item ${item.level}`}
                  key={item.key}
                  onClick={() => openMenu(item.menu)}
                >
                  <span>{item.icon}</span>

                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </div>

                  <b>{item.value}</b>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="overview-ops-grid">
        <div className="overview-panel overview-top-products-panel">
          <div className="overview-panel-header">
            <div>
              <span>Best Sellers</span>
              <h3>Top sản phẩm bán chạy</h3>
            </div>

            <button type="button" onClick={() => openMenu("products")}>
              Xem sản phẩm
            </button>
          </div>

          <div className="overview-top-product-list">
            {overviewData.topSellingProducts.length === 0 ? (
              <p className="overview-empty">Chưa có dữ liệu bán chạy.</p>
            ) : (
              overviewData.topSellingProducts.map((product, index) => (
                <div className="overview-top-product" key={product.id}>
                  <span className="overview-rank">#{index + 1}</span>

                  <div>
                    <strong>{product.name}</strong>
                    <small>
                      Đã bán {product.soldQuantity} • Còn {product.stock}
                    </small>
                  </div>

                  <b>{formatPrice(product.estimatedRevenue)}</b>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overview-panel overview-smart-stock-panel">
          <div className="overview-panel-header">
            <div>
              <span>Inventory Intelligence</span>
              <h3>Cảnh báo tồn kho thông minh</h3>
            </div>

            <button type="button" onClick={() => openMenu("products")}>
              Kiểm tra kho
            </button>
          </div>

          <div className="overview-inventory-grid">
            {overviewData.inventoryGroups.map((group) => (
              <button
                type="button"
                className={`overview-inventory-card ${group.level}`}
                key={group.key}
                onClick={() => openMenu("products")}
              >
                <strong>{group.value}</strong>
                <span>{group.title}</span>
                <small>{group.description}</small>
              </button>
            ))}
          </div>

          <div className="overview-inventory-detail">
            <div>
              <strong>Bán chạy nhưng tồn thấp</strong>
              {overviewData.hotLowStockProducts.length === 0 ? (
                <small>Chưa có sản phẩm rủi ro cao.</small>
              ) : (
                overviewData.hotLowStockProducts.slice(0, 3).map((product) => (
                  <small key={product.id}>
                    {product.name} • còn {product.stock}
                  </small>
                ))
              )}
            </div>

            <div>
              <strong>Tồn nhiều bán chậm</strong>
              {overviewData.slowHighStockProducts.length === 0 ? (
                <small>Chưa có sản phẩm cần xả kho.</small>
              ) : (
                overviewData.slowHighStockProducts.slice(0, 3).map((product) => (
                  <small key={product.id}>
                    {product.name} • tồn {product.stock}
                  </small>
                ))
              )}
            </div>
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
                        (status.value / overviewData.totalOrderStatusValue) *
                        100
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

          <div className="overview-marketing-detail">
            <div>
              <strong>Mã / chiến dịch sắp hết hạn</strong>
              {overviewData.endingSoonCampaigns.length === 0 ? (
                <small>Chưa có chiến dịch sắp hết hạn.</small>
              ) : (
                overviewData.endingSoonCampaigns.slice(0, 3).map((item) => (
                  <small key={`${getCampaignName(item)}-${item.id}`}>
                    {getCampaignName(item)} • {getCampaignValueText(item)}
                  </small>
                ))
              )}
            </div>

            <div>
              <strong>Flash Sale đang active</strong>
              {overviewData.activeFlashSaleList.length === 0 ? (
                <small>Chưa có Flash Sale đang bật.</small>
              ) : (
                overviewData.activeFlashSaleList.slice(0, 3).map((item) => (
                  <small key={item.id}>{getCampaignName(item)}</small>
                ))
              )}
            </div>

            <div>
              <strong>Sản phẩm giảm sâu nhất</strong>
              {overviewData.topDiscountProducts.length === 0 ? (
                <small>Chưa có sản phẩm giảm giá.</small>
              ) : (
                overviewData.topDiscountProducts.slice(0, 3).map((item) => (
                  <small key={item.id}>
                    {item.name} • {item.discountPercent}% • {item.source}
                  </small>
                ))
              )}
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
                <button
                  type="button"
                  className="overview-order-card"
                  key={order.id}
                  onClick={() => openOrder(order)}
                >
                  <div>
                    <strong>{order.orderCode || `#${order.id}`}</strong>

                    <span>
                      {order.customerName || "Khách hàng"}
                    </span>
                  </div>

                  <span
                    className={`overview-order-badge ${
                      order.orderStatus || "UNKNOWN"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.orderStatus] ||
                      order.orderStatus ||
                      "Chưa cập nhật"}
                  </span>

                  <b>{formatPrice(order.totalAmount ?? order.totalPrice)}</b>
                </button>
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
            {overviewData.inventoryAlertProducts.length === 0 ? (
              <p className="overview-empty">Tồn kho hiện đang ổn định.</p>
            ) : (
              overviewData.inventoryAlertProducts.map((item) => (
                <div className="overview-stock-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>

                    <span>
                      {item.category || "Chưa có danh mục"} •{" "}
                      {item.brand || "Chưa có thương hiệu"}
                    </span>
                  </div>

                  <b className={item.alertLevel}>{item.alertLabel}</b>
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
