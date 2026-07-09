import { useToast } from "../components/common/ToastProvider";
import "./AdminDashboard.css";
import AdminOverview from "../components/admin/AdminOverview";
import {
  getBanners,
  createBanner,
  updateBanner,
  getBannerDetail,
  setBannerProducts,
  deleteBanner,
} from "../services/bannerApi";

import {
  getAdminUsers,
  updateAdminUserLock,
  deleteAdminUser,
} from "../services/userApi";

import {
  getHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
} from "../services/homeSectionApi";

import {
  getSectionBanners,
  createSectionBanner,
  updateSectionBanner,
  deleteSectionBanner,
  setSectionBannerProducts,
  getSectionBannerDetail,
} from "../services/homeSectionBannerApi";

import { useEffect, useRef, useState } from "react";

import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../services/brandApi";

import { useNavigate, useSearchParams } from "react-router-dom";

import { uploadImage } from "../services/uploadApi";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categoryApi";

import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
} from "../services/productApi";

import {
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../services/orderApi";

import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "../services/promotionApi";

import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../services/couponApi";

import {
  getFlashSales,
  getFlashSaleItems,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  addFlashSaleItem,
  updateFlashSaleItem,
  deleteFlashSaleItem,
} from "../services/flashSaleApi";

const ORDER_STATUS_LABELS = {
  WAITING_PAYMENT: "Chờ thanh toán",

  PENDING_CONFIRMATION: "Chờ xác nhận",

  CONFIRMED: "Đã xác nhận",

  PREPARING: "Đang chuẩn bị",

  SHIPPING: "Đang giao hàng",

  COMPLETED: "Hoàn thành",

  CANCELLED: "Đã hủy",
};

const PAYMENT_STATUS_LABELS = {
  UNPAID: "Chưa thanh toán",

  PROCESSING: "Đang xử lý",

  PAID: "Đã thanh toán",

  FAILED: "Thất bại",

  REFUNDED: "Đã hoàn tiền",
};

const PAYMENT_METHOD_LABELS = {
  COD: "Thanh toán khi nhận hàng",

  VNPAY: "VNPAY",
};

const ADMIN_MENU_INFO = {
  overview: {
    icon: "📊",
    label: "Tổng quan",
    title: "Trang quản trị",
    description:
      "Theo dõi nhanh sản phẩm, đơn hàng, khuyến mãi và người dùng trong hệ thống.",
  },
  products: {
    icon: "📦",
    label: "Sản phẩm",
    title: "Quản lý sản phẩm",
    description:
      "Thêm, cập nhật, tìm kiếm và quản lý toàn bộ sản phẩm của ElectroShop.",
  },
  promotions: {
    icon: "🔥",
    label: "Khuyến mãi",
    title: "Quản lý khuyến mãi",
    description: "Điều chỉnh chương trình giảm giá, mã coupon và Flash Sale.",
  },
  homepage: {
    icon: "🖼",
    label: "Trang chủ",
    title: "Quản lý trang chủ",
    description:
      "Cấu hình banner, khối hiển thị và nội dung nổi bật ngoài website.",
  },
  categories: {
    icon: "🗂",
    label: "Danh mục",
    title: "Quản lý danh mục",
    description:
      "Quản lý danh mục sản phẩm và thương hiệu theo từng nhóm hàng.",
  },
  orders: {
    icon: "🧾",
    label: "Đơn hàng",
    title: "Quản lý đơn hàng",
    description:
      "Xác nhận, cập nhật trạng thái và xem chi tiết đơn hàng của khách.",
  },
  users: {
    icon: "👥",
    label: "Người dùng",
    title: "Quản lý người dùng",
    description:
      "Theo dõi tài khoản, khóa, mở khóa hoặc xóa người dùng trong hệ thống.",
  },
};

const ADMIN_MENU_KEYS = Object.keys(ADMIN_MENU_INFO);

const getValidAdminMenu = (menu) => {
  return ADMIN_MENU_KEYS.includes(menu) ? menu : "overview";
};

/*
 * Các trạng thái mà Admin
 * được phép chuyển tiếp.
 */
const getAvailableOrderStatuses = (currentStatus) => {
  const transitions = {
    WAITING_PAYMENT: ["CANCELLED"],

    PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],

    CONFIRMED: ["PREPARING", "SHIPPING"],

    PREPARING: ["SHIPPING"],

    SHIPPING: ["COMPLETED"],

    COMPLETED: [],

    CANCELLED: [],
  };

  return transitions[currentStatus] || [];
};

const formatOrderPrice = (value) => {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
};

const formatOrderDate = (value) => {
  if (!value) {
    return "Chưa cập nhật";
  }

  return new Date(value).toLocaleString("vi-VN");
};

const getOrderItemOptions = (selectedOptions) => {
  if (!selectedOptions) {
    return [];
  }

  try {
    const parsedOptions =
      typeof selectedOptions === "string"
        ? JSON.parse(selectedOptions)
        : selectedOptions;

    return Object.entries(parsedOptions || {}).map(([groupName, option]) => ({
      groupName,
      optionName:
        typeof option === "object" && option !== null
          ? option.name || option.value || ""
          : String(option || ""),
    }));
  } catch (error) {
    return [];
  }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const productImageUploadRef = useRef(null);

  const [banners, setBanners] = useState([]);

  const [editingBannerId, setEditingBannerId] = useState(null);

  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    linkUrl: "",
    position: "HOME_TOP",
    active: true,
    sortOrder: 1,
    showTitle: false,
    showSubtitle: false,
    targetType: "COLLECTION",
    targetUrl: "",
    targetProductId: "",
  });

  const [selectedBannerProductIds, setSelectedBannerProductIds] = useState([]);

  const [homeBannerSearchKeyword, setHomeBannerSearchKeyword] = useState("");
  const [homeBannerStatusFilter, setHomeBannerStatusFilter] = useState("ALL");
  const [homeBannerTargetFilter, setHomeBannerTargetFilter] = useState("ALL");
  const [homeBannerSortMode, setHomeBannerSortMode] = useState("NEWEST");
  const [homeBannerPage, setHomeBannerPage] = useState(1);

  const [homeBannerProductKeyword, setHomeBannerProductKeyword] = useState("");
  const [homeBannerProductCategory, setHomeBannerProductCategory] =
    useState("ALL");
  const [homeBannerProductBrand, setHomeBannerProductBrand] = useState("ALL");

  const [homeSections, setHomeSections] = useState([]);

  const [homeSectionSearchKeyword, setHomeSectionSearchKeyword] = useState("");
  const [homeSectionTypeFilter, setHomeSectionTypeFilter] = useState("ALL");
  const [homeSectionStatusFilter, setHomeSectionStatusFilter] = useState("ALL");
  const [homeSectionSortMode, setHomeSectionSortMode] = useState("SORT_ASC");
  const [homeSectionPage, setHomeSectionPage] = useState(1);

  const [selectedBannerSectionId, setSelectedBannerSectionId] = useState("");

  const [sectionBanners, setSectionBanners] = useState([]);

  const [sectionBannerSearchKeyword, setSectionBannerSearchKeyword] =
    useState("");
  const [sectionBannerTargetFilter, setSectionBannerTargetFilter] =
    useState("ALL");
  const [sectionBannerStatusFilter, setSectionBannerStatusFilter] =
    useState("ALL");
  const [sectionBannerSortMode, setSectionBannerSortMode] =
    useState("SORT_ASC");
  const [sectionBannerPage, setSectionBannerPage] = useState(1);

  const [sectionBannerProductKeyword, setSectionBannerProductKeyword] =
    useState("");
  const [sectionBannerProductCategory, setSectionBannerProductCategory] =
    useState("ALL");
  const [sectionBannerProductBrand, setSectionBannerProductBrand] =
    useState("ALL");

  const [editingSectionBannerId, setEditingSectionBannerId] = useState(null);

  const [sectionBannerProductIds, setSectionBannerProductIds] = useState([]);

  const [sectionBannerForm, setSectionBannerForm] = useState({
    imageUrl: "",
    title: "",
    subtitle: "",
    targetType: "COLLECTION",
    targetUrl: "",
    targetProductId: "",
    slideGroup: 1,
    position: "",
    sortOrder: 1,
    active: true,
  });

  const [editingSectionId, setEditingSectionId] = useState(null);

  const [sectionForm, setSectionForm] = useState({
    title: "",
    sectionType: "PRODUCT_SECTION",
    category: "",
    brand: "",
    productId: "",
    badgeText: "",
    shortDescription: "",
    bannerImage: "",
    bannerLink: "",

    leftBannerImage: "",
    leftBannerLink: "",
    productRows: "1",

    limitProduct: 8,
    sortOrder: 1,
    groupCode: "",
    tabTitle: "",
    tabOrder: 1,
    dealEndTime: "",
    dealSubtitle: "",
    dealTheme: "RED",

    autoSlide: true,
    slideInterval: 4000,
  });

  const [activeMenu, setActiveMenu] = useState(() =>
    getValidAdminMenu(searchParams.get("tab")),
  );

  useEffect(() => {
    const menuFromUrl = getValidAdminMenu(searchParams.get("tab"));

    if (menuFromUrl !== activeMenu) {
      setActiveMenu(menuFromUrl);
    }
  }, [activeMenu, searchParams]);

  const handleOpenAdminMenu = (menu, options = {}) => {
    const nextMenu = getValidAdminMenu(menu);
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set("tab", nextMenu);
    setActiveMenu(nextMenu);
    setSearchParams(nextSearchParams, {
      replace: Boolean(options.replace),
    });
  };

  const [brands, setBrands] = useState([]);

  const [brandName, setBrandName] = useState("");
  const [brandCategory, setBrandCategory] = useState("");

  const [editingBrandId, setEditingBrandId] = useState(null);

  const [categoryName, setCategoryName] = useState("");

  const [categoryIcon, setCategoryIcon] = useState("💻");

  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [categoryManageTab, setCategoryManageTab] = useState("categories");

  const [categorySearchKeyword, setCategorySearchKeyword] = useState("");
  const [categoryStatusFilter, setCategoryStatusFilter] = useState("ALL");
  const [categorySortMode, setCategorySortMode] = useState("ID_DESC");
  const [categoryPage, setCategoryPage] = useState(1);

  const [brandSearchKeyword, setBrandSearchKeyword] = useState("");
  const [brandCategoryFilter, setBrandCategoryFilter] = useState("ALL");
  const [brandStatusFilter, setBrandStatusFilter] = useState("ALL");
  const [brandSortMode, setBrandSortMode] = useState("ID_DESC");
  const [brandPage, setBrandPage] = useState(1);

  const [editingId, setEditingId] = useState(null);

  const [products, setProducts] = useState([]);

  const [productSearchKeyword, setProductSearchKeyword] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productBrandFilter, setProductBrandFilter] = useState("");
  const [productStockFilter, setProductStockFilter] = useState("ALL");
  const [productSortMode, setProductSortMode] = useState("ID_DESC");
  const [productPage, setProductPage] = useState(1);
  const [productFormRefreshing, setProductFormRefreshing] = useState(false);

  const [categories, setCategories] = useState([]);

  const [orders, setOrders] = useState([]);
  const [orderSearchKeyword, setOrderSearchKeyword] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [orderPage, setOrderPage] = useState(1);
  const [orderRefreshing, setOrderRefreshing] = useState(false);
  const [selectedAdminOrder, setSelectedAdminOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [userSearchKeyword, setUserSearchKeyword] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [userPage, setUserPage] = useState(1);

  const [promotionSubTab, setPromotionSubTab] = useState("product-discount");

  const [promotionSearchKeyword, setPromotionSearchKeyword] = useState("");
  const [promotionStatusFilter, setPromotionStatusFilter] = useState("ALL");
  const [promotionProductFilter, setPromotionProductFilter] = useState("ALL");
  const [promotionSortMode, setPromotionSortMode] = useState("NEWEST");
  const [promotionPage, setPromotionPage] = useState(1);
  const [promotionProductKeyword, setPromotionProductKeyword] = useState("");
  const [promotionProductCategory, setPromotionProductCategory] =
    useState("ALL");
  const [promotionProductBrand, setPromotionProductBrand] = useState("ALL");
  const [selectedPromotionProductIds, setSelectedPromotionProductIds] =
    useState([]);

  const [couponSearchKeyword, setCouponSearchKeyword] = useState("");
  const [couponStatusFilter, setCouponStatusFilter] = useState("ALL");
  const [couponTypeFilter, setCouponTypeFilter] = useState("ALL");
  const [couponSortMode, setCouponSortMode] = useState("NEWEST");
  const [couponPage, setCouponPage] = useState(1);

  const [flashSaleSearchKeyword, setFlashSaleSearchKeyword] = useState("");
  const [flashSaleStatusFilter, setFlashSaleStatusFilter] = useState("ALL");
  const [flashSaleSortMode, setFlashSaleSortMode] = useState("NEWEST");
  const [flashSalePage, setFlashSalePage] = useState(1);

  const [flashSaleItemSearchKeyword, setFlashSaleItemSearchKeyword] =
    useState("");
  const [flashSaleItemStatusFilter, setFlashSaleItemStatusFilter] =
    useState("ALL");
  const [flashSaleItemPage, setFlashSaleItemPage] = useState(1);

  const [flashSaleProductKeyword, setFlashSaleProductKeyword] = useState("");
  const [flashSaleProductCategory, setFlashSaleProductCategory] =
    useState("ALL");
  const [flashSaleProductBrand, setFlashSaleProductBrand] = useState("ALL");
  const [selectedFlashSaleProductIds, setSelectedFlashSaleProductIds] =
    useState([]);

  const [discountPromotions, setDiscountPromotions] = useState([]);

  const [editingPromotionId, setEditingPromotionId] = useState(null);

  const [promotionForm, setPromotionForm] = useState({
    title: "",
    productId: "",
    discountPercent: "",
    startDate: "",
    endDate: "",
    active: true,
  });

  const [coupons, setCoupons] = useState([]);

  const [editingCouponId, setEditingCouponId] = useState(null);

  const [couponForm, setCouponForm] = useState({
    code: "",
    name: "",
    discountType: "PERCENT",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    active: true,
  });

  const [flashSales, setFlashSales] = useState([]);

  const [selectedFlashSaleId, setSelectedFlashSaleId] = useState("");

  const [flashSaleItems, setFlashSaleItems] = useState([]);

  const [editingFlashSaleId, setEditingFlashSaleId] = useState(null);

  const [editingFlashSaleItemId, setEditingFlashSaleItemId] = useState(null);

  const [flashSaleForm, setFlashSaleForm] = useState({
    title: "",
    subtitle: "",
    bannerImage: "/images/golden-hour-header.png",
    startTime: "",
    endTime: "",
    active: true,
    sortOrder: 1,
  });

  const [flashSaleItemForm, setFlashSaleItemForm] = useState({
    productId: "",
    salePrice: "",
    discountPercent: "",
    saleQuantity: 100,
    soldQuantity: 0,
    limitPerUser: 1,
    active: true,
  });

  const [product, setProduct] = useState(() => {
    const savedDraft = localStorage.getItem("adminProductDraft");

    return savedDraft
      ? JSON.parse(savedDraft)
      : {
          name: "",
          category: "",
          brand: "",
          price: "",
          image: "",
          images: [],
          description: "",
          stock: "",
        };
  });
  const [specifications, setSpecifications] = useState(() => {
    const saved = localStorage.getItem("adminSpecificationsDraft");

    return saved
      ? JSON.parse(saved)
      : [
          {
            key: "",
            value: "",
          },
        ];
  });

  const [highlights, setHighlights] = useState(() => {
    const saved = localStorage.getItem("adminHighlightsDraft");

    return saved
      ? JSON.parse(saved)
      : [
          {
            icon: "🖥",
            title: "",
            description: "",
          },
        ];
  });

  const [promotions, setPromotions] = useState(() => {
    const saved = localStorage.getItem("adminPromotionsDraft");

    return saved
      ? JSON.parse(saved)
      : [
          {
            icon: "🎁",
            title: "",
            description: "",
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem("adminProductDraft", JSON.stringify(product));
  }, [product]);

  useEffect(() => {
    localStorage.setItem(
      "adminSpecificationsDraft",
      JSON.stringify(specifications),
    );
  }, [specifications]);

  useEffect(() => {
    localStorage.setItem("adminHighlightsDraft", JSON.stringify(highlights));
  }, [highlights]);

  useEffect(() => {
    localStorage.setItem("adminPromotionsDraft", JSON.stringify(promotions));
  }, [promotions]);

  const [productOptions, setProductOptions] = useState([
    {
      groupName: "",
      values: [
        {
          name: "",
          price: "",
        },
      ],
    },
  ]);

  const highlightIcons = ["🖥", "⚡", "🎮", "❄️", "🔋", "💾", "🚀", "⭐"];

  const categoryIcons = [
    "💻", // Laptop
    "🖥️", // Máy tính bàn / màn hình
    "🖨️", // Máy in
    "📱", // Điện thoại
    "📲", // Thiết bị di động
    "⌚", // Đồng hồ thông minh
    "🎧", // Tai nghe
    "🎮", // Gaming
    "🕹️", // Tay cầm / game gear
    "⌨️", // Bàn phím
    "🖱️", // Chuột
    "📷", // Camera
    "🎥", // Webcam / quay phim
    "🎤", // Micro
    "🔊", // Loa
    "📺", // Tivi / màn hình
    "📡", // Thiết bị mạng
    "🔌", // Sạc / cáp
    "🔋", // Pin / sạc dự phòng
    "💾", // Lưu trữ
    "💿", // Ổ đĩa / phần mềm
    "🧩", // Linh kiện
    "🧰", // Phụ kiện
    "🛠️", // Công cụ sửa chữa
    "🛡️", // Bảo hành / bảo vệ
    "⚡", // Hiệu năng / điện
    "🔥", // Hot / bán chạy
    "✨", // Hàng mới
    "🏷️", // Khuyến mãi
    "🎁", // Combo / quà tặng
    "🛒", // Sản phẩm khác
  ];

  const promotionIcons = ["🎁", "🎒", "🛠", "💳", "🚚", "🔥", "🏷", "🎧"];

  useEffect(() => {
    fetchProducts();

    fetchCategories();

    fetchBrands();

    fetchOrders();

    fetchUsers();

    fetchBanners();

    fetchHomeSections();

    fetchPromotions();

    fetchCoupons();

    fetchFlashSales();
  }, []);

  useEffect(() => {
    setProductPage(1);
  }, [
    productSearchKeyword,
    productCategoryFilter,
    productBrandFilter,
    productStockFilter,
    productSortMode,
  ]);

  useEffect(() => {
    setCategoryPage(1);
  }, [categorySearchKeyword, categoryStatusFilter, categorySortMode]);

  useEffect(() => {
    setBrandPage(1);
  }, [
    brandSearchKeyword,
    brandCategoryFilter,
    brandStatusFilter,
    brandSortMode,
  ]);

  useEffect(() => {
    setHomeBannerPage(1);
  }, [
    homeBannerSearchKeyword,
    homeBannerStatusFilter,
    homeBannerTargetFilter,
    homeBannerSortMode,
  ]);

  useEffect(() => {
    setHomeSectionPage(1);
  }, [
    homeSectionSearchKeyword,
    homeSectionTypeFilter,
    homeSectionStatusFilter,
    homeSectionSortMode,
  ]);

  useEffect(() => {
    setSectionBannerPage(1);
  }, [
    sectionBannerSearchKeyword,
    sectionBannerTargetFilter,
    sectionBannerStatusFilter,
    sectionBannerSortMode,
    selectedBannerSectionId,
  ]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderSearchKeyword, orderStatusFilter, paymentStatusFilter]);

  useEffect(() => {
    setUserPage(1);
  }, [userSearchKeyword, userStatusFilter]);

  useEffect(() => {
    setPromotionPage(1);
  }, [
    promotionSearchKeyword,
    promotionStatusFilter,
    promotionProductFilter,
    promotionSortMode,
  ]);

  useEffect(() => {
    setCouponPage(1);
  }, [
    couponSearchKeyword,
    couponStatusFilter,
    couponTypeFilter,
    couponSortMode,
  ]);

  useEffect(() => {
    setFlashSalePage(1);
  }, [flashSaleSearchKeyword, flashSaleStatusFilter, flashSaleSortMode]);

  useEffect(() => {
    setFlashSaleItemPage(1);
  }, [
    flashSaleItemSearchKeyword,
    flashSaleItemStatusFilter,
    selectedFlashSaleId,
  ]);

  const fetchBrands = async () => {
    try {
      const data = await getBrands();

      setBrands(data);
    } catch (error) {
      console.log(error);
    }
  };
  const fetchProducts = async () => {
    try {
      const data = await getProducts();

      setProducts(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleMultipleUpload = async (e) => {
    const files = Array.from(e.target.files);

    let uploadedImages = [];

    for (const file of files) {
      const imageUrl = await uploadImage(file);

      uploadedImages.push({
        imageUrl,
      });
    }

    setProduct({
      ...product,

      images: uploadedImages,
    });
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();

      setCategories(data);
    } catch (error) {
      console.log(error);
    }
  };
  const handleSaveCategory = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      toast.warning("Vui lòng nhập tên danh mục");

      return;
    }

    const isDuplicatedCategory = categories.some(
      (category) =>
        normalizeText(category.name) === normalizeText(categoryName.trim()) &&
        Number(category.id) !== Number(editingCategoryId),
    );

    if (isDuplicatedCategory) {
      toast.warning("Tên danh mục đã tồn tại");

      return;
    }

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, {
          name: categoryName.trim(),
          icon: categoryIcon,
        });

        toast.success("Cập nhật danh mục thành công");
      } else {
        await createCategory({
          name: categoryName.trim(),
          icon: categoryIcon,
        });

        toast.success("Thêm danh mục thành công");
      }

      setCategoryName("");

      setEditingCategoryId(null);

      fetchCategories();
    } catch (error) {
      console.log(error);

      toast.error("Lỗi khi lưu danh mục");
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);

    setCategoryName(category.name);

    setCategoryIcon(category.icon || "💻");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();

    if (!brandCategory) {
      toast.warning("Vui lòng chọn danh mục cho thương hiệu");

      return;
    }

    if (!brandName.trim()) {
      toast.warning("Vui lòng nhập tên thương hiệu");

      return;
    }

    const isDuplicatedBrand = brands.some(
      (brand) =>
        normalizeText(brand.name) === normalizeText(brandName.trim()) &&
        normalizeText(brand.category) === normalizeText(brandCategory) &&
        Number(brand.id) !== Number(editingBrandId),
    );

    if (isDuplicatedBrand) {
      toast.warning("Thương hiệu này đã tồn tại trong danh mục đã chọn");

      return;
    }

    try {
      if (editingBrandId) {
        await updateBrand(editingBrandId, {
          name: brandName,
          category: brandCategory,
        });

        toast.success("Cập nhật thương hiệu thành công");
      } else {
        await createBrand({
          name: brandName,
          category: brandCategory,
        });

        toast.success("Thêm thương hiệu thành công");
      }

      setBrandName("");

      setBrandCategory("");

      setEditingBrandId(null);

      fetchBrands();
    } catch (error) {
      console.log(error);

      toast.error("Lỗi khi lưu thương hiệu");
    }
  };

  const handleEditBrand = (brand) => {
    setEditingBrandId(brand.id);

    setBrandName(brand.name);

    setBrandCategory(brand.category || "");
  };

  const handleDeleteBrand = async (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa thương hiệu này?",
    );

    if (!confirmDelete) return;

    try {
      await deleteBrand(id);

      fetchBrands();

      toast.success("Xóa thương hiệu thành công");
    } catch (error) {
      console.log(error);

      toast.error("Không thể xóa thương hiệu này");
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa danh mục này?");

    if (!confirmDelete) return;

    try {
      await deleteCategory(id);

      fetchCategories();

      toast.success("Xóa danh mục thành công");
    } catch (error) {
      console.log(error);

      toast.error("Không thể xóa danh mục này");
    }
  };
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    console.log("File được chọn:", file);

    try {
      const imageUrl = await uploadImage(file);

      console.log("URL ảnh backend trả về:", imageUrl);

      setProduct((prevProduct) => ({
        ...prevProduct,
        image: imageUrl,
      }));
    } catch (error) {
      console.error("Mã lỗi:", error.response?.status);

      console.error("Backend trả về:", error.response?.data);

      console.error("Chi tiết lỗi:", error);

      toast.error(getApiErrorMessage(error, "Không thể upload ảnh"));
    }
  };

  const getProductImageUrl = (img) => {
    if (!img) return "";
    return typeof img === "string" ? img : img.imageUrl || "";
  };

  const handleRemoveMainImage = () => {
    setProduct((prevProduct) => ({
      ...prevProduct,
      image: "",
    }));
  };

  const handleRemoveSubImage = (removeIndex) => {
    setProduct((prevProduct) => ({
      ...prevProduct,
      images: (prevProduct.images || []).filter(
        (_, index) => index !== removeIndex,
      ),
    }));
  };

  const handleUploadToForm = async (event, setForm, fieldName) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const imageUrl = await uploadImage(file);

      setForm((prevForm) => ({
        ...prevForm,
        [fieldName]: imageUrl,
      }));

      event.target.value = "";
    } catch (error) {
      console.error(error);

      toast.error(getApiErrorMessage(error, "Không thể upload ảnh"));
    }
  };

  const fetchOrders = async () => {
    setOrderRefreshing(true);

    try {
      const data = await getOrders();

      setOrders(Array.isArray(data) ? data : []);

      return true;
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Không thể tải lại danh sách đơn hàng",
      );

      return false;
    } finally {
      setOrderRefreshing(false);
    }
  };

  const handleRefreshOrders = async () => {
    setOrderSearchKeyword("");
    setOrderStatusFilter("ALL");
    setPaymentStatusFilter("ALL");
    setOrderPage(1);

    await fetchOrders();
  };

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);

      toast.error("Không thể tải danh sách người dùng");
    }
  };

  const handleToggleUserLock = async (user) => {
    const nextLocked = !Boolean(user.locked);

    const confirmed = window.confirm(
      nextLocked
        ? "Bạn có chắc muốn khóa tài khoản này?"
        : "Bạn có chắc muốn mở khóa tài khoản này?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await updateAdminUserLock(user.id, nextLocked);

      await fetchUsers();

      toast.success(nextLocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Thao tác thất bại",
      );
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa người dùng "${user.fullName || user.email}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAdminUser(user.id);

      await fetchUsers();

      toast.success("Xóa người dùng thành công");
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Xóa người dùng thất bại",
      );
    }
  };

  const fetchPromotions = async () => {
    try {
      const data = await getPromotions();

      setDiscountPromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const data = await getCoupons();

      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchFlashSales = async () => {
    try {
      const data = await getFlashSales();

      setFlashSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchFlashSaleItems = async (flashSaleId) => {
    if (!flashSaleId) {
      setFlashSaleItems([]);
      return;
    }

    try {
      const data = await getFlashSaleItems(flashSaleId);

      setFlashSaleItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const handleRefreshProductForm = async () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn làm mới form sản phẩm? Dữ liệu đang nhập sẽ bị xóa.",
    );

    if (!confirmed) {
      return;
    }

    setProductFormRefreshing(true);

    try {
      localStorage.removeItem("adminProductDraft");
      localStorage.removeItem("adminSpecificationsDraft");
      localStorage.removeItem("adminHighlightsDraft");
      localStorage.removeItem("adminPromotionsDraft");

      setEditingId(null);

      setProduct({
        name: "",
        category: "",
        brand: "",
        price: "",
        image: "",
        images: [],
        description: "",
        stock: "",
      });

      setSpecifications([
        {
          key: "",
          value: "",
        },
      ]);

      setHighlights([
        {
          icon: "🖥",
          title: "",
          description: "",
        },
      ]);

      setPromotions([
        {
          icon: "🎁",
          title: "",
          description: "",
        },
      ]);

      setProductOptions([
        {
          groupName: "",
          values: [
            {
              name: "",
              price: "",
            },
          ],
        },
      ]);

      await fetchProducts();
      await fetchCategories();
      await fetchBrands();

      toast.success("Đã làm mới form sản phẩm");
    } catch (error) {
      console.log(error);

      toast.error("Không thể làm mới form sản phẩm");
    } finally {
      setProductFormRefreshing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setProduct({
        ...product,

        category: value,

        brand: "",
      });

      return;
    }

    setProduct({
      ...product,

      [name]: value,
    });
  };

  const validateProductForm = () => {
    if (!product.name.trim()) {
      toast.warning("Vui lòng nhập tên sản phẩm");
      return false;
    }

    if (!product.category) {
      toast.warning("Vui lòng chọn danh mục");
      return false;
    }

    if (!product.brand.trim()) {
      toast.warning("Vui lòng nhập thương hiệu");
      return false;
    }

    if (!product.stock) {
      toast.warning("Vui lòng nhập số lượng");
      return false;
    }

    if (Number(product.stock) < 0) {
      toast.warning("Số lượng không được nhỏ hơn 0");
      return false;
    }

    if (!product.price) {
      toast.warning("Vui lòng nhập giá sản phẩm");
      return false;
    }

    if (Number(product.price) <= 0) {
      toast.warning("Giá sản phẩm phải lớn hơn 0");
      return false;
    }

    if (!editingId && !product.image) {
      toast.warning("Vui lòng chọn ảnh chính sản phẩm");
      return false;
    }

    if (!product.description.trim()) {
      toast.warning("Vui lòng nhập mô tả sản phẩm");
      return false;
    }

    const hasValidSpec = specifications.some(
      (spec) => spec.key.trim() && spec.value.trim(),
    );

    if (!hasValidSpec) {
      toast.warning("Vui lòng nhập ít nhất 1 thông số kỹ thuật");
      return false;
    }

    const hasValidHighlight = highlights.some(
      (item) => item.title.trim() || item.description.trim(),
    );

    if (!hasValidHighlight) {
      toast.warning("Vui lòng nhập ít nhất 1 điểm nổi bật");
      return false;
    }

    const hasValidPromotion = promotions.some(
      (item) => item.title.trim() || item.description.trim(),
    );

    if (!hasValidPromotion) {
      toast.warning("Vui lòng nhập ít nhất 1 ưu đãi mua hàng");
      return false;
    }

    return true;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!validateProductForm()) {
      return;
    }

    try {
      await createProduct({
        ...product,

        images:
          product.images?.map((img) => ({
            imageUrl: img.imageUrl,
          })) || [],

        specifications: JSON.stringify(specifications),

        highlights: JSON.stringify(highlights),

        promotions: JSON.stringify(promotions),

        options: JSON.stringify(productOptions),
      });

      localStorage.removeItem("adminProductDraft");

      localStorage.removeItem("adminSpecificationsDraft");

      localStorage.removeItem("adminHighlightsDraft");

      localStorage.removeItem("adminPromotionsDraft");

      fetchProducts();

      setProduct({
        name: "",

        category: "",

        brand: "",

        price: "",

        image: "",

        images: [],

        description: "",

        stock: "",
      });

      setSpecifications([
        {
          key: "",
          value: "",
        },
      ]);

      setHighlights([
        {
          icon: "🖥",
          title: "",
          description: "",
        },
      ]);

      setPromotions([
        {
          icon: "🎁",
          title: "",
          description: "",
        },
      ]);
      setProductOptions([
        {
          groupName: "",
          values: [
            {
              name: "",
              price: "",
            },
          ],
        },
      ]);
      toast.success("Thêm sản phẩm thành công");
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditProduct = (item) => {
    setEditingId(item.id);

    setProduct({
      name: item.name || "",

      category: item.category || "",

      brand: item.brand || "",

      price: item.price || "",

      image: item.image || "",

      images: item.images || [],

      description: item.description || "",

      stock: item.stock || "",
    });

    setSpecifications(
      item.specifications
        ? JSON.parse(item.specifications)
        : [
            {
              key: "",
              value: "",
            },
          ],
    );

    setHighlights(
      item.highlights
        ? JSON.parse(item.highlights)
        : [
            {
              icon: "🖥",
              title: "",
              description: "",
            },
          ],
    );

    setPromotions(
      item.promotions
        ? JSON.parse(item.promotions)
        : [
            {
              icon: "🎁",
              title: "",
              description: "",
            },
          ],
    );

    setProductOptions(
      item.options
        ? JSON.parse(item.options)
        : [
            {
              groupName: "",
              values: [
                {
                  name: "",
                  price: "",
                },
              ],
            },
          ],
    );

    setTimeout(() => {
      productImageUploadRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (!validateProductForm()) {
      return;
    }

    try {
      await updateProduct(editingId, {
        ...product,

        images:
          product.images?.map((img) => ({
            imageUrl: img.imageUrl,
          })) || [],

        specifications: JSON.stringify(specifications),

        highlights: JSON.stringify(highlights),

        promotions: JSON.stringify(promotions),

        options: JSON.stringify(productOptions),
      });

      localStorage.removeItem("adminProductDraft");

      localStorage.removeItem("adminSpecificationsDraft");

      localStorage.removeItem("adminHighlightsDraft");

      localStorage.removeItem("adminPromotionsDraft");

      fetchProducts();

      setEditingId(null);

      setProduct({
        name: "",

        category: "",

        brand: "",

        price: "",

        image: "",

        images: [],

        description: "",

        stock: "",
      });

      setSpecifications([
        {
          key: "",
          value: "",
        },
      ]);

      setHighlights([
        {
          icon: "🖥",
          title: "",
          description: "",
        },
      ]);

      setPromotions([
        {
          icon: "🎁",
          title: "",
          description: "",
        },
      ]);
      setProductOptions([
        {
          groupName: "",
          values: [
            {
              name: "",
              price: "",
            },
          ],
        },
      ]);
      toast.success("Cập nhật sản phẩm thành công");
    } catch (error) {
      console.log(error);
    }
  };

  const getApiErrorMessage = (error, fallbackMessage) => {
    const data = error?.response?.data;

    if (typeof data === "string") {
      return data;
    }

    return data?.message || data?.error || error?.message || fallbackMessage;
  };

  const validatePromotionForm = () => {
    const title = promotionForm.title.trim();
    const discountPercent = Number(promotionForm.discountPercent);

    if (!title) {
      toast.warning("Vui lòng nhập tên khuyến mãi");
      return false;
    }

    if (selectedPromotionProductIds.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 sản phẩm áp dụng khuyến mãi");
      return false;
    }

    if (editingPromotionId && selectedPromotionProductIds.length !== 1) {
      toast.warning("Khi sửa khuyến mãi, vui lòng chỉ chọn 1 sản phẩm");
      return false;
    }

    const invalidProduct = selectedPromotionProductIds.some(
      (productId) =>
        !products.some((product) => Number(product.id) === Number(productId)),
    );

    if (invalidProduct) {
      toast.warning("Có sản phẩm không tồn tại trong danh sách");
      return false;
    }

    if (!discountPercent) {
      toast.warning("Vui lòng nhập phần trăm giảm");
      return false;
    }

    if (discountPercent <= 0 || discountPercent > 100) {
      toast.warning("Phần trăm giảm giá phải từ 1 đến 100");
      return false;
    }

    if (
      promotionForm.startDate &&
      promotionForm.endDate &&
      promotionForm.startDate > promotionForm.endDate
    ) {
      toast.warning("Ngày bắt đầu không được sau ngày kết thúc");
      return false;
    }

    return true;
  };

  const handlePromotionChange = (e) => {
    const { name, value, type, checked } = e.target;

    setPromotionForm({
      ...promotionForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetPromotionForm = () => {
    setPromotionForm({
      title: "",
      productId: "",
      discountPercent: "",
      startDate: "",
      endDate: "",
      active: true,
    });

    setEditingPromotionId(null);
    setSelectedPromotionProductIds([]);
    setPromotionProductKeyword("");
    setPromotionProductCategory("ALL");
    setPromotionProductBrand("ALL");
  };

  const handleSavePromotion = async (e) => {
    e.preventDefault();

    if (!validatePromotionForm()) {
      return;
    }

    const payloadBase = {
      title: promotionForm.title.trim(),
      discountPercent: Number(promotionForm.discountPercent),
      startDate: promotionForm.startDate || null,
      endDate: promotionForm.endDate || null,
      active: promotionForm.active,
    };

    try {
      if (editingPromotionId) {
        await updatePromotion(editingPromotionId, {
          ...payloadBase,
          productId: Number(selectedPromotionProductIds[0]),
        });

        toast.success("Cập nhật khuyến mãi thành công");
      } else {
        await Promise.all(
          selectedPromotionProductIds.map((productId) =>
            createPromotion({
              ...payloadBase,
              productId: Number(productId),
            }),
          ),
        );

        toast.success(
          `Thêm khuyến mãi cho ${selectedPromotionProductIds.length} sản phẩm thành công`,
        );
      }

      await fetchPromotions();
      resetPromotionForm();
    } catch (error) {
      console.log(error);

      toast.error(
        getApiErrorMessage(
          error,
          editingPromotionId
            ? "Cập nhật khuyến mãi thất bại"
            : "Thêm khuyến mãi thất bại",
        ),
      );
    }
  };

  const handleEditPromotion = (promotion) => {
    setEditingPromotionId(promotion.id);

    setPromotionForm({
      title: promotion.title || "",
      productId: promotion.productId ? String(promotion.productId) : "",
      discountPercent:
        promotion.discountPercent !== null &&
        promotion.discountPercent !== undefined
          ? String(promotion.discountPercent)
          : "",
      startDate: promotion.startDate || "",
      endDate: promotion.endDate || "",
      active: promotion.active ?? true,
    });
    setSelectedPromotionProductIds(
      promotion.productId ? [Number(promotion.productId)] : [],
    );

    setPromotionSubTab("product-discount");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeletePromotion = async (id) => {
    const promotion = discountPromotions.find(
      (item) => Number(item.id) === Number(id),
    );

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khuyến mãi này không?\n\n` +
        `${promotion?.title ? `Tên: ${promotion.title}\n` : ""}` +
        `${promotion?.productId ? `ID sản phẩm: ${promotion.productId}\n` : ""}`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deletePromotion(id);
      await fetchPromotions();

      toast.success("Xóa khuyến mãi thành công");
    } catch (error) {
      console.log(error);

      toast.error(getApiErrorMessage(error, "Xóa khuyến mãi thất bại"));
    }
  };

  const validateCouponForm = () => {
    const code = couponForm.code.trim();
    const name = couponForm.name.trim();
    const discountValue = Number(couponForm.discountValue);
    const minOrderValue = Number(couponForm.minOrderValue || 0);
    const maxDiscount = Number(couponForm.maxDiscount || 0);
    const usageLimit = Number(couponForm.usageLimit || 0);

    if (!code) {
      toast.warning("Vui lòng nhập mã giảm giá");
      return false;
    }

    if (code.length < 3 || code.length > 30) {
      toast.warning("Mã giảm giá phải từ 3 đến 30 ký tự");
      return false;
    }

    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
      toast.warning(
        "Mã giảm giá chỉ được gồm chữ, số, dấu gạch ngang hoặc gạch dưới",
      );
      return false;
    }

    if (!name) {
      toast.warning("Vui lòng nhập tên mã giảm giá");
      return false;
    }

    if (!couponForm.discountType) {
      toast.warning("Vui lòng chọn loại giảm giá");
      return false;
    }

    if (!discountValue || discountValue <= 0) {
      toast.warning("Giá trị giảm phải lớn hơn 0");
      return false;
    }

    if (couponForm.discountType === "PERCENT" && discountValue > 100) {
      toast.warning("Giá trị giảm theo phần trăm không được vượt quá 100");
      return false;
    }

    if (minOrderValue < 0) {
      toast.warning("Giá trị đơn hàng tối thiểu không được nhỏ hơn 0");
      return false;
    }

    if (maxDiscount < 0) {
      toast.warning("Mức giảm tối đa không được nhỏ hơn 0");
      return false;
    }

    if (usageLimit < 0) {
      toast.warning("Giới hạn lượt dùng không được nhỏ hơn 0");
      return false;
    }

    if (
      couponForm.startDate &&
      couponForm.endDate &&
      couponForm.startDate > couponForm.endDate
    ) {
      toast.warning("Ngày bắt đầu không được sau ngày kết thúc");
      return false;
    }

    return true;
  };

  const handleCouponChange = (e) => {
    const { name, value, type, checked } = e.target;

    setCouponForm({
      ...couponForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: "",
      name: "",
      discountType: "PERCENT",
      discountValue: "",
      minOrderValue: "",
      maxDiscount: "",
      startDate: "",
      endDate: "",
      usageLimit: "",
      active: true,
    });

    setEditingCouponId(null);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();

    if (!validateCouponForm()) {
      return;
    }

    const payload = {
      code: couponForm.code.trim().toUpperCase(),
      name: couponForm.name.trim(),
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
      minOrderValue: Number(couponForm.minOrderValue || 0),
      maxDiscount: Number(couponForm.maxDiscount || 0),
      startDate: couponForm.startDate || null,
      endDate: couponForm.endDate || null,
      usageLimit: Number(couponForm.usageLimit || 0),
      active: couponForm.active,
    };

    try {
      if (editingCouponId) {
        await updateCoupon(editingCouponId, payload);
        toast.success("Cập nhật mã giảm giá thành công");
      } else {
        await createCoupon(payload);
        toast.success("Thêm mã giảm giá thành công");
      }

      await fetchCoupons();
      resetCouponForm();
    } catch (error) {
      console.error(error);

      toast.error(
        getApiErrorMessage(
          error,
          editingCouponId
            ? "Cập nhật mã giảm giá thất bại"
            : "Thêm mã giảm giá thất bại",
        ),
      );
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCouponId(coupon.id);

    setCouponForm({
      code: coupon.code || "",

      name: coupon.name || "",

      discountType: coupon.discountType || "PERCENT",

      discountValue: coupon.discountValue || "",

      minOrderValue: coupon.minOrderValue || "",

      maxDiscount: coupon.maxDiscount || "",

      startDate: coupon.startDate || "",

      endDate: coupon.endDate || "",

      usageLimit: coupon.usageLimit || "",

      active: coupon.active ?? true,
    });

    setPromotionSubTab("coupon");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteCoupon = async (id) => {
    const coupon = coupons.find((item) => Number(item.id) === Number(id));

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa mã giảm giá này không?\n\n` +
        `${coupon?.code ? `Mã: ${coupon.code}\n` : ""}` +
        `${coupon?.name ? `Tên: ${coupon.name}\n` : ""}` +
        `\nLưu ý: Nếu mã giảm giá đã được dùng trong đơn hàng, hệ thống sẽ không cho xóa. Bạn nên tắt trạng thái hoạt động thay vì xóa.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCoupon(id);
      await fetchCoupons();

      toast.success("Xóa mã giảm giá thành công");
    } catch (error) {
      console.error(error);

      toast.error(getApiErrorMessage(error, "Xóa mã giảm giá thất bại"));
    }
  };

  const handleOpenProductDetail = (productId) => {
    if (!productId) {
      return;
    }

    navigate(`/product/${productId}`);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa?");
    if (!confirmDelete) return;

    try {
      await deleteProduct(id);
      await fetchProducts();
      toast.success("Xóa sản phẩm thành công");
    } catch (error) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        "Xóa sản phẩm thất bại";

      toast.error(message);
    }
  };

  const handleOpenOrderDetail = async (order) => {
    if (!order?.id) {
      return;
    }

    setSelectedAdminOrder(order);
    setOrderDetailLoading(true);

    try {
      const data = await getOrderById(order.id);

      setSelectedAdminOrder(data || order);
    } catch (error) {
      console.error("Lỗi tải chi tiết đơn hàng:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Không thể tải chi tiết đơn hàng",
      );
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleCloseOrderDetail = () => {
    setSelectedAdminOrder(null);
    setOrderDetailLoading(false);
  };

  const handleUpdateStatus = async (id, status) => {
    if (!status) {
      return;
    }

    /*
     * Hủy đơn sẽ hoàn tồn kho,
     * nên cần xác nhận lại.
     */
    if (status === "CANCELLED") {
      const confirmed = window.confirm(
        "Bạn có chắc muốn hủy đơn này không? Tồn kho sẽ được hoàn lại.",
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      await updateOrderStatus(id, status);

      await fetchOrders();

      toast.success("Cập nhật trạng thái đơn hàng thành công");
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);

      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Không thể cập nhật trạng thái đơn";

      toast.error(message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("role");

    localStorage.removeItem("currentUser");

    sessionStorage.removeItem("checkoutCouponCode");

    navigate("/login");
  };

  const fetchBanners = async () => {
    try {
      const data = await getBanners();

      setBanners(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleBannerChange = (e) => {
    const { name, value, type, checked } = e.target;

    setBannerForm({
      ...bannerForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const getProductIdsFromBannerUrl = (url) => {
    const value = String(url || "");

    const match = value.match(/[?&]productIds=([^&]+)/);

    if (!match) {
      return [];
    }

    return match[1]
      .split(",")
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
  };

  const handleToggleBannerProduct = (productId) => {
    const numericProductId = Number(productId);

    setSelectedBannerProductIds((currentIds) => {
      if (currentIds.includes(numericProductId)) {
        return currentIds.filter((id) => id !== numericProductId);
      }

      return [...currentIds, numericProductId];
    });
  };

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setSelectedBannerProductIds([]);

    setBannerForm({
      title: "",
      subtitle: "",
      imageUrl: "",
      linkUrl: "",
      position: "HOME_TOP",
      active: true,
      sortOrder: 1,
      showTitle: false,
      showSubtitle: false,
      targetType: "COLLECTION",
      targetUrl: "",
      targetProductId: "",
    });
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();

    if (!bannerForm.imageUrl) {
      toast.warning("Vui lòng upload ảnh banner");
      return;
    }

    if (bannerForm.showTitle && !bannerForm.title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề banner hoặc tắt hiển thị tiêu đề");
      return;
    }

    if (bannerForm.showSubtitle && !bannerForm.subtitle.trim()) {
      toast.warning("Vui lòng nhập mô tả ngắn hoặc tắt hiển thị mô tả");
      return;
    }

    if (bannerForm.targetType === "PRODUCT" && !bannerForm.targetProductId) {
      toast.warning("Vui lòng chọn sản phẩm đích");
      return;
    }

    if (
      bannerForm.targetType === "CUSTOM_LINK" &&
      !bannerForm.targetUrl.trim()
    ) {
      toast.warning("Vui lòng nhập link tùy chỉnh");
      return;
    }

    let resolvedTargetUrl = "/search";
    let resolvedLinkUrl = "/search";

    if (bannerForm.targetType === "COLLECTION") {
      if (selectedBannerProductIds.length === 0) {
        toast.warning(
          "Vui lòng chọn ít nhất 1 sản phẩm cho danh sách sản phẩm",
        );
        return;
      }

      resolvedTargetUrl = editingBannerId
        ? `/search?homeBannerId=${editingBannerId}`
        : "/search";
      resolvedLinkUrl = resolvedTargetUrl;
    }

    if (bannerForm.targetType === "PRODUCT") {
      resolvedTargetUrl = `/product/${bannerForm.targetProductId}`;
      resolvedLinkUrl = resolvedTargetUrl;
    }

    if (bannerForm.targetType === "CUSTOM_LINK") {
      resolvedTargetUrl = bannerForm.targetUrl.trim();
      resolvedLinkUrl = resolvedTargetUrl;
    }

    const payload = {
      ...bannerForm,
      position: "HOME_TOP",
      sortOrder: Number(bannerForm.sortOrder) || 1,
      targetProductId: bannerForm.targetProductId
        ? Number(bannerForm.targetProductId)
        : null,
      title: bannerForm.title.trim(),
      subtitle: bannerForm.subtitle.trim(),
      targetUrl: resolvedTargetUrl,
      linkUrl: resolvedLinkUrl,
    };

    try {
      let savedBanner = null;

      if (editingBannerId) {
        savedBanner = await updateBanner(editingBannerId, payload);
        toast.success("Cập nhật banner thành công");
      } else {
        savedBanner = await createBanner(payload);
        toast.success("Thêm banner thành công");
      }

      if (bannerForm.targetType === "COLLECTION" && savedBanner?.id) {
        await setBannerProducts(savedBanner.id, selectedBannerProductIds);
      }

      resetBannerForm();
      fetchBanners();
    } catch (error) {
      console.log(error);
      toast.error("Lỗi khi lưu banner");
    }
  };

  const handleEditBanner = async (banner) => {
    setEditingBannerId(banner.id);

    setSelectedBannerProductIds(
      getProductIdsFromBannerUrl(banner.targetUrl || banner.linkUrl),
    );

    setBannerForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      linkUrl: banner.linkUrl || "",
      position: "HOME_TOP",
      active: banner.active === undefined ? true : banner.active,
      sortOrder: banner.sortOrder || 1,
      showTitle: Boolean(banner.showTitle),
      showSubtitle: Boolean(banner.showSubtitle),
      targetType: banner.targetType || "COLLECTION",
      targetUrl: banner.targetUrl || banner.linkUrl || "",
      targetProductId: banner.targetProductId || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    try {
      const detail = await getBannerDetail(banner.id);

      const productIds = Array.isArray(detail?.products)
        ? detail.products.map((product) => Number(product.id))
        : [];

      if (productIds.length > 0) {
        setSelectedBannerProductIds(productIds);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteBanner = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa banner này?");

    if (!confirmDelete) return;

    try {
      await deleteBanner(id);

      fetchBanners();
    } catch (error) {
      console.log(error);

      toast.error("Lỗi khi xóa banner");
    }
  };

  const fetchHomeSections = async () => {
    try {
      const data = await getHomeSections();

      setHomeSections(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSectionChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "category") {
      setSectionForm({
        ...sectionForm,
        category: value,
        brand: "",
      });

      return;
    }

    setSectionForm({
      ...sectionForm,

      [name]: type === "checkbox" ? checked : value,
    });
  };

  const isBannerSectionType = (sectionType) => {
    return [
      "DEAL_CARD",
      "BANNER_SLIDER_LARGE",
      "DOUBLE_BANNER_SLIDER",
      "PRODUCT_BANNER_SLIDER",
    ].includes(sectionType);
  };

  const resetSectionForm = () => {
    setEditingSectionId(null);

    setSectionForm({
      title: "",
      sectionType: "DEAL_CARD",
      category: "",
      brand: "",
      productId: "",
      badgeText: "",
      shortDescription: "",
      bannerImage: "",
      bannerLink: "",

      leftBannerImage: "",
      leftBannerLink: "",
      productRows: "1",

      limitProduct: 10,
      sortOrder: 1,
      groupCode: "",
      tabTitle: "",
      tabOrder: 1,
      active: true,

      dealEndTime: "",
      dealSubtitle: "",
      dealTheme: "RED",

      autoSlide: true,
      slideInterval: 4000,
    });
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();

    if (!sectionForm.title.trim()) {
      toast.warning("Vui lòng nhập tên khối");
      return;
    }

    let payload = {
      ...sectionForm,

      productId: sectionForm.productId ? Number(sectionForm.productId) : null,

      limitProduct: Number(sectionForm.limitProduct) || 8,

      sortOrder: Number(sectionForm.sortOrder) || 1,

      tabOrder: Number(sectionForm.tabOrder) || 1,

      productRows: Number(sectionForm.productRows) || 1,

      slideInterval: Number(sectionForm.slideInterval) || 4000,
    };

    if (payload.sectionType === "GOLDEN_HOUR_DEAL") {
      payload = {
        ...payload,

        productId: null,
        badgeText: "",
        shortDescription: "",

        groupCode: "",
        tabTitle: "",
        tabOrder: 1,
      };
    }

    if (payload.sectionType === "TABBED_SECTION") {
      payload = {
        ...payload,

        productId: null,
        badgeText: "",
        shortDescription: "",
      };
    }

    if (isBannerSectionType(payload.sectionType)) {
      payload = {
        ...payload,
        productId: null,
        category: "",
        brand: "",
        badgeText: "",
        shortDescription: "",
        bannerImage: "",
        bannerLink: "",
        leftBannerImage: "",
        leftBannerLink: "",
        productRows: 1,
        limitProduct: 0,
        groupCode: "",
        tabTitle: "",
        tabOrder: 1,
      };
    }

    if (
      payload.sectionType !== "DEAL_CARD" &&
      payload.sectionType !== "TABBED_SECTION" &&
      payload.sectionType !== "GOLDEN_HOUR_DEAL" &&
      !isBannerSectionType(payload.sectionType)
    ) {
      payload = {
        ...payload,

        productId: null,
        badgeText: "",
        shortDescription: "",

        groupCode: "",
        tabTitle: "",
        tabOrder: 1,
      };
    }

    try {
      if (editingSectionId) {
        await updateHomeSection(editingSectionId, payload);

        toast.success("Cập nhật khối trang chủ thành công");
      } else {
        await createHomeSection(payload);

        toast.success("Thêm khối trang chủ thành công");
      }

      resetSectionForm();

      fetchHomeSections();
    } catch (error) {
      console.log(error);

      toast.error("Lỗi khi lưu khối trang chủ");
    }
  };

  const handleEditSection = (section) => {
    setEditingSectionId(section.id);

    setSectionForm({
      title: section.title || "",
      sectionType: section.sectionType || "PRODUCT_SECTION",
      category: section.category || "",
      brand: section.brand || "",
      productId: section.productId || "",
      badgeText: section.badgeText || "",
      shortDescription: section.shortDescription || "",
      bannerImage: section.bannerImage || "",
      bannerLink: section.bannerLink || "",

      leftBannerImage: section.leftBannerImage || "",
      leftBannerLink: section.leftBannerLink || "",
      productRows: String(section.productRows || 1),

      limitProduct: section.limitProduct || 8,
      sortOrder: section.sortOrder || 1,

      groupCode: section.groupCode || "",
      tabTitle: section.tabTitle || "",
      tabOrder: section.tabOrder || 1,

      active: section.active === undefined ? true : section.active,

      dealEndTime: section.dealEndTime || "",
      dealSubtitle: section.dealSubtitle || "",
      dealTheme: section.dealTheme || "RED",

      autoSlide: section.autoSlide === undefined ? true : section.autoSlide,

      slideInterval: section.slideInterval || 4000,
    });
  };

  const handleDeleteSection = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa khối này?");

    if (!confirmDelete) return;

    try {
      await deleteHomeSection(id);

      fetchHomeSections();
    } catch (error) {
      console.log(error);

      toast.error("Lỗi khi xóa khối trang chủ");
    }
  };

  const fetchSectionBanners = async (sectionId) => {
    if (!sectionId) {
      setSectionBanners([]);
      return;
    }

    try {
      const data = await getSectionBanners(sectionId);

      setSectionBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      toast.error("Không thể tải danh sách banner của khối");
    }
  };

  const resetSectionBannerForm = () => {
    setEditingSectionBannerId(null);

    setSectionBannerProductIds([]);

    setSectionBannerForm({
      imageUrl: "",
      title: "",
      subtitle: "",
      targetType: "COLLECTION",
      targetUrl: "",
      targetProductId: "",
      slideGroup: 1,
      position: "",
      sortOrder: 1,
      active: true,
    });
  };

  const handleSelectBannerSection = async (sectionId) => {
    setSelectedBannerSectionId(sectionId);
    resetSectionBannerForm();
    await fetchSectionBanners(sectionId);
  };

  const handleSectionBannerChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSectionBannerForm({
      ...sectionBannerForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleToggleSectionBannerProduct = (productId) => {
    const idNumber = Number(productId);

    setSectionBannerProductIds((prev) => {
      if (prev.includes(idNumber)) {
        return prev.filter((id) => id !== idNumber);
      }

      return [...prev, idNumber];
    });
  };

  const toggleAllSectionBannerVisibleProducts = () => {
    const visibleIds = sectionBannerPickerProducts.map((product) =>
      Number(product.id),
    );

    const isAllSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => sectionBannerProductIds.includes(id));

    if (isAllSelected) {
      setSectionBannerProductIds((currentIds) =>
        currentIds.filter((id) => !visibleIds.includes(id)),
      );

      return;
    }

    setSectionBannerProductIds((currentIds) =>
      Array.from(new Set([...currentIds, ...visibleIds])),
    );
  };

  const handleSaveSectionBanner = async (e) => {
    e.preventDefault();

    if (!selectedBannerSectionId) {
      toast.warning("Vui lòng chọn khối cần quản lý banner");
      return;
    }

    if (!sectionBannerForm.imageUrl) {
      toast.warning("Vui lòng chọn ảnh banner");
      return;
    }

    if (!sectionBannerForm.title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề banner");
      return;
    }

    if (
      sectionBannerForm.targetType === "PRODUCT" &&
      !sectionBannerForm.targetProductId
    ) {
      toast.warning("Vui lòng chọn sản phẩm đích");
      return;
    }

    const payload = {
      ...sectionBannerForm,

      targetProductId: sectionBannerForm.targetProductId
        ? Number(sectionBannerForm.targetProductId)
        : null,

      slideGroup: Number(sectionBannerForm.slideGroup) || 1,

      sortOrder: Number(sectionBannerForm.sortOrder) || 1,
    };

    try {
      let savedBanner;

      if (editingSectionBannerId) {
        savedBanner = await updateSectionBanner(
          editingSectionBannerId,
          payload,
        );
      } else {
        savedBanner = await createSectionBanner(
          selectedBannerSectionId,
          payload,
        );
      }

      if (payload.targetType === "COLLECTION") {
        await setSectionBannerProducts(savedBanner.id, sectionBannerProductIds);
      }

      toast.success(
        editingSectionBannerId
          ? "Cập nhật banner thành công"
          : "Thêm banner thành công",
      );

      resetSectionBannerForm();

      await fetchSectionBanners(selectedBannerSectionId);
    } catch (error) {
      console.log(error);
      toast.error("Lỗi khi lưu banner của khối");
    }
  };

  const handleEditSectionBanner = async (banner) => {
    setEditingSectionBannerId(banner.id);

    setSectionBannerForm({
      imageUrl: banner.imageUrl || "",
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      targetType: banner.targetType || "COLLECTION",
      targetUrl: banner.targetUrl || "",
      targetProductId: banner.targetProductId || "",
      slideGroup: banner.slideGroup || 1,
      position: banner.position || "",
      sortOrder: banner.sortOrder || 1,
      active: banner.active === undefined ? true : banner.active,
    });

    try {
      const detail = await getSectionBannerDetail(banner.id);

      const ids = Array.isArray(detail.products)
        ? detail.products.map((product) => Number(product.id))
        : [];

      setSectionBannerProductIds(ids);
    } catch (error) {
      console.log(error);
      setSectionBannerProductIds([]);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteSectionBanner = async (bannerId) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa banner này?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteSectionBanner(bannerId);

      await fetchSectionBanners(selectedBannerSectionId);

      toast.success("Xóa banner thành công");
    } catch (error) {
      console.log(error);
      toast.error("Lỗi khi xóa banner");
    }
  };

  const selectedBannerSection = homeSections.find(
    (section) => Number(section.id) === Number(selectedBannerSectionId),
  );

  const toDateTimeLocalValue = (value) => {
    if (!value) {
      return "";
    }

    return String(value).slice(0, 16);
  };

  const validateFlashSaleForm = () => {
    const title = flashSaleForm.title.trim();
    const bannerImage = flashSaleForm.bannerImage.trim();
    const sortOrder = Number(flashSaleForm.sortOrder);

    if (!title) {
      toast.warning("Vui lòng nhập tên chiến dịch Flash Sale");
      return false;
    }

    if (!bannerImage) {
      toast.warning("Vui lòng chọn ảnh banner Flash Sale");
      return false;
    }

    if (!flashSaleForm.startTime) {
      toast.warning("Vui lòng chọn thời gian bắt đầu");
      return false;
    }

    if (!flashSaleForm.endTime) {
      toast.warning("Vui lòng chọn thời gian kết thúc");
      return false;
    }

    if (flashSaleForm.startTime >= flashSaleForm.endTime) {
      toast.warning("Thời gian bắt đầu phải trước thời gian kết thúc");
      return false;
    }

    if (!sortOrder || sortOrder <= 0) {
      toast.warning("Thứ tự hiển thị phải lớn hơn 0");
      return false;
    }

    return true;
  };

  const validateFlashSaleItemForm = () => {
    if (!selectedFlashSaleId) {
      toast.warning("Vui lòng chọn chiến dịch Flash Sale trước");
      return false;
    }

    const selectedIds = editingFlashSaleItemId
      ? [Number(flashSaleItemForm.productId || selectedFlashSaleProductIds[0])]
      : selectedFlashSaleProductIds;

    if (selectedIds.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 sản phẩm Flash Sale");
      return false;
    }

    const discountPercent = Number(flashSaleItemForm.discountPercent);
    const saleQuantity = Number(flashSaleItemForm.saleQuantity);
    const soldQuantity = Number(flashSaleItemForm.soldQuantity || 0);
    const limitPerUser = Number(flashSaleItemForm.limitPerUser || 1);

    if (!discountPercent || discountPercent <= 0) {
      toast.warning("Phần trăm giảm giá phải lớn hơn 0");
      return false;
    }

    if (discountPercent > 100) {
      toast.warning("Phần trăm giảm giá không được vượt quá 100");
      return false;
    }

    if (!saleQuantity || saleQuantity <= 0) {
      toast.warning("Số lượng Flash Sale phải lớn hơn 0");
      return false;
    }

    if (soldQuantity < 0) {
      toast.warning("Số lượng đã bán không được nhỏ hơn 0");
      return false;
    }

    if (soldQuantity > saleQuantity) {
      toast.warning("Số lượng đã bán không được lớn hơn số lượng Flash Sale");
      return false;
    }

    if (!limitPerUser || limitPerUser <= 0) {
      toast.warning("Giới hạn mua mỗi khách phải lớn hơn 0");
      return false;
    }

    if (limitPerUser > saleQuantity) {
      toast.warning(
        "Giới hạn mua mỗi khách không được lớn hơn số lượng Flash Sale",
      );
      return false;
    }

    for (const productId of selectedIds) {
      const selectedProduct = products.find(
        (item) => Number(item.id) === Number(productId),
      );

      if (!selectedProduct) {
        toast.warning("Có sản phẩm Flash Sale không tồn tại trong danh sách");
        return false;
      }

      const originalPrice = Number(selectedProduct.price || 0);

      if (!originalPrice || originalPrice <= 0) {
        toast.warning(
          `Giá gốc của sản phẩm "${selectedProduct.name}" không hợp lệ`,
        );
        return false;
      }
    }

    if (!editingFlashSaleItemId) {
      const duplicatedItem = flashSaleItems.some((item) =>
        selectedIds.includes(Number(item.productId)),
      );

      if (duplicatedItem) {
        toast.warning("Một số sản phẩm đã có trong chiến dịch Flash Sale");
        return false;
      }
    }

    return true;
  };

  const handleFlashSaleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFlashSaleForm({
      ...flashSaleForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetFlashSaleForm = () => {
    setFlashSaleForm({
      title: "",
      subtitle: "",
      bannerImage: "/images/golden-hour-header.png",
      startTime: "",
      endTime: "",
      active: true,
      sortOrder: 1,
    });

    setEditingFlashSaleId(null);
  };

  const handleSaveFlashSale = async (e) => {
    e.preventDefault();

    if (!validateFlashSaleForm()) {
      return;
    }

    const payload = {
      title: flashSaleForm.title.trim(),
      subtitle: flashSaleForm.subtitle.trim(),
      bannerImage: flashSaleForm.bannerImage.trim(),
      startTime: flashSaleForm.startTime,
      endTime: flashSaleForm.endTime,
      active: flashSaleForm.active,
      sortOrder: Number(flashSaleForm.sortOrder) || 1,
    };

    try {
      if (editingFlashSaleId) {
        await updateFlashSale(editingFlashSaleId, payload);
        toast.success("Cập nhật chiến dịch Flash Sale thành công");
      } else {
        await createFlashSale(payload);
        toast.success("Tạo chiến dịch Flash Sale thành công");
      }

      await fetchFlashSales();
      resetFlashSaleForm();
    } catch (error) {
      console.log(error);

      toast.error(
        getApiErrorMessage(
          error,
          editingFlashSaleId
            ? "Cập nhật chiến dịch Flash Sale thất bại"
            : "Tạo chiến dịch Flash Sale thất bại",
        ),
      );
    }
  };

  const handleEditFlashSale = (flashSale) => {
    setEditingFlashSaleId(flashSale.id);

    setFlashSaleForm({
      title: flashSale.title || "",
      subtitle: flashSale.subtitle || "",
      bannerImage: flashSale.bannerImage || "/images/golden-hour-header.png",
      startTime: toDateTimeLocalValue(flashSale.startTime),
      endTime: toDateTimeLocalValue(flashSale.endTime),
      active: flashSale.active ?? true,
      sortOrder: flashSale.sortOrder || 1,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteFlashSale = async (id) => {
    const flashSale = flashSales.find((item) => Number(item.id) === Number(id));

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa chiến dịch Flash Sale này không?\n\n` +
        `${flashSale?.title ? `Tên: ${flashSale.title}\n` : ""}` +
        `\nLưu ý: Nếu chiến dịch đã phát sinh lượt bán, hệ thống sẽ không cho xóa. Bạn nên tắt chiến dịch thay vì xóa.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteFlashSale(id);

      if (Number(selectedFlashSaleId) === Number(id)) {
        setSelectedFlashSaleId("");
        setFlashSaleItems([]);
      }

      await fetchFlashSales();

      toast.success("Xóa chiến dịch Flash Sale thành công");
    } catch (error) {
      console.log(error);

      toast.error(
        getApiErrorMessage(error, "Xóa chiến dịch Flash Sale thất bại"),
      );
    }
  };

  const handleSelectFlashSale = async (id) => {
    setSelectedFlashSaleId(id);

    await fetchFlashSaleItems(id);
  };

  const handleFlashSaleItemChange = (e) => {
    const { name, value, type, checked } = e.target;

    const nextForm = {
      ...flashSaleItemForm,
      [name]: type === "checkbox" ? checked : value,
    };

    if (name === "salePrice" || name === "productId") {
      const productId = name === "productId" ? value : nextForm.productId;

      const selectedProduct = products.find(
        (item) => Number(item.id) === Number(productId),
      );

      const originalPrice = Number(selectedProduct?.price || 0);
      const salePrice = Number(nextForm.salePrice || 0);

      if (originalPrice > 0 && salePrice > 0 && salePrice < originalPrice) {
        nextForm.discountPercent = Math.round(
          ((originalPrice - salePrice) * 100) / originalPrice,
        );
      }
    }

    setFlashSaleItemForm(nextForm);
  };

  const resetFlashSaleItemForm = () => {
    setFlashSaleItemForm({
      productId: "",
      salePrice: "",
      discountPercent: "",
      saleQuantity: 100,
      soldQuantity: 0,
      limitPerUser: 1,
      active: true,
    });

    setEditingFlashSaleItemId(null);
    setSelectedFlashSaleProductIds([]);
    setFlashSaleProductKeyword("");
    setFlashSaleProductCategory("ALL");
    setFlashSaleProductBrand("ALL");
  };

  const handleProductForFlashSaleChange = (e) => {
    const productId = e.target.value;

    const selectedProduct = products.find(
      (item) => Number(item.id) === Number(productId),
    );

    let discountPercent = "";
    let salePrice = "";

    if (selectedProduct?.price) {
      salePrice = Math.round(Number(selectedProduct.price) * 0.9);
      discountPercent = 10;
    }

    setFlashSaleItemForm({
      ...flashSaleItemForm,
      productId,
      salePrice,
      discountPercent,
    });
  };

  const handleSaveFlashSaleItem = async (e) => {
    e.preventDefault();

    if (!validateFlashSaleItemForm()) {
      return;
    }

    const discountPercent = Number(flashSaleItemForm.discountPercent) || 0;

    const payloadBase = {
      discountPercent,
      saleQuantity: Number(flashSaleItemForm.saleQuantity),
      soldQuantity: Number(flashSaleItemForm.soldQuantity || 0),
      limitPerUser: Number(flashSaleItemForm.limitPerUser || 1),
      active: flashSaleItemForm.active,
    };

    try {
      if (editingFlashSaleItemId) {
        const productId = Number(
          flashSaleItemForm.productId || selectedFlashSaleProductIds[0],
        );

        const selectedProduct = products.find(
          (item) => Number(item.id) === Number(productId),
        );

        const originalPrice = Number(selectedProduct?.price || 0);

        const salePrice =
          Number(flashSaleItemForm.salePrice) ||
          Math.round((originalPrice * (100 - discountPercent)) / 100);

        await updateFlashSaleItem(editingFlashSaleItemId, {
          ...payloadBase,
          productId,
          salePrice,
        });

        toast.success("Cập nhật sản phẩm Flash Sale thành công");
      } else {
        await Promise.all(
          selectedFlashSaleProductIds.map((productId) => {
            const selectedProduct = products.find(
              (item) => Number(item.id) === Number(productId),
            );

            const originalPrice = Number(selectedProduct?.price || 0);

            const salePrice = Math.round(
              (originalPrice * (100 - discountPercent)) / 100,
            );

            return addFlashSaleItem(selectedFlashSaleId, {
              ...payloadBase,
              productId: Number(productId),
              salePrice,
            });
          }),
        );

        toast.success(
          `Đã thêm ${selectedFlashSaleProductIds.length} sản phẩm vào Flash Sale`,
        );
      }

      await fetchFlashSaleItems(selectedFlashSaleId);
      resetFlashSaleItemForm();
    } catch (error) {
      console.log(error);

      toast.error(
        getApiErrorMessage(
          error,
          editingFlashSaleItemId
            ? "Cập nhật sản phẩm Flash Sale thất bại"
            : "Thêm sản phẩm vào Flash Sale thất bại",
        ),
      );
    }
  };

  const handleEditFlashSaleItem = (item) => {
    setEditingFlashSaleItemId(item.id);

    setFlashSaleItemForm({
      productId: item.productId ? String(item.productId) : "",
      salePrice:
        item.salePrice !== null && item.salePrice !== undefined
          ? String(item.salePrice)
          : "",
      discountPercent:
        item.discountPercent !== null && item.discountPercent !== undefined
          ? String(item.discountPercent)
          : "",
      saleQuantity:
        item.saleQuantity !== null && item.saleQuantity !== undefined
          ? String(item.saleQuantity)
          : "100",
      soldQuantity:
        item.soldQuantity !== null && item.soldQuantity !== undefined
          ? String(item.soldQuantity)
          : "0",
      limitPerUser:
        item.limitPerUser !== null && item.limitPerUser !== undefined
          ? String(item.limitPerUser)
          : "1",
      active: item.active ?? true,
    });

    setSelectedFlashSaleProductIds(
      item.productId ? [Number(item.productId)] : [],
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteFlashSaleItem = async (itemId) => {
    const item = flashSaleItems.find(
      (flashSaleItem) => Number(flashSaleItem.id) === Number(itemId),
    );

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa sản phẩm này khỏi Flash Sale không?\n\n` +
        `${item?.productId ? `ID sản phẩm: ${item.productId}\n` : ""}` +
        `${item?.salePrice ? `Giá sale: ${formatAdminPrice(item.salePrice)}\n` : ""}` +
        `\nLưu ý: Nếu sản phẩm đã phát sinh lượt bán trong Flash Sale, hệ thống sẽ không cho xóa. Bạn nên tắt sản phẩm này thay vì xóa.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteFlashSaleItem(itemId);
      await fetchFlashSaleItems(selectedFlashSaleId);

      toast.success("Xóa sản phẩm Flash Sale thành công");
    } catch (error) {
      console.log(error);

      toast.error(
        getApiErrorMessage(error, "Xóa sản phẩm Flash Sale thất bại"),
      );
    }
  };

  const getProductNameById = (productId) => {
    const product = products.find(
      (item) => Number(item.id) === Number(productId),
    );

    return product ? product.name : "-";
  };

  const getProductPriceById = (productId) => {
    const product = products.find(
      (item) => Number(item.id) === Number(productId),
    );

    return product?.price || 0;
  };

  const formatAdminPrice = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
  };

  const ADMIN_PAGE_SIZE = 10;

  const normalizeText = (value) => {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const paginateItems = (items, page) => {
    const safePage = Number(page) || 1;
    const startIndex = (safePage - 1) * ADMIN_PAGE_SIZE;

    return items.slice(startIndex, startIndex + ADMIN_PAGE_SIZE);
  };

  const getTotalPages = (items) => {
    return Math.max(1, Math.ceil(items.length / ADMIN_PAGE_SIZE));
  };

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) {
      return null;
    }

    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return (
      <div className="admin-pagination">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Trước
        </button>

        {pages.map((page) => (
          <button
            type="button"
            key={page}
            className={page === currentPage ? "active" : ""}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau
        </button>
      </div>
    );
  };

  const getDateTimeValue = (value) => {
    if (!value) {
      return 0;
    }

    const timestamp = Date.parse(value);

    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const getPromotionProductName = (promotion) => {
    const product = products.find(
      (item) => Number(item.id) === Number(promotion.productId),
    );

    return product?.name || "";
  };

  const filteredDiscountPromotions = discountPromotions
    .filter((promotion) => {
      const keyword = normalizeText(promotionSearchKeyword);
      const productName = getPromotionProductName(promotion);

      const matchesKeyword =
        !keyword ||
        normalizeText(promotion.id).includes(keyword) ||
        normalizeText(promotion.title).includes(keyword) ||
        normalizeText(promotion.productId).includes(keyword) ||
        normalizeText(productName).includes(keyword) ||
        normalizeText(promotion.discountPercent).includes(keyword);

      const matchesStatus =
        promotionStatusFilter === "ALL" ||
        (promotionStatusFilter === "ACTIVE" && Boolean(promotion.active)) ||
        (promotionStatusFilter === "INACTIVE" && !Boolean(promotion.active));

      const matchesProduct =
        promotionProductFilter === "ALL" ||
        Number(promotion.productId) === Number(promotionProductFilter);

      return matchesKeyword && matchesStatus && matchesProduct;
    })
    .sort((a, b) => {
      if (promotionSortMode === "DISCOUNT_DESC") {
        return Number(b.discountPercent || 0) - Number(a.discountPercent || 0);
      }

      if (promotionSortMode === "DISCOUNT_ASC") {
        return Number(a.discountPercent || 0) - Number(b.discountPercent || 0);
      }

      if (promotionSortMode === "TITLE_ASC") {
        return normalizeText(a.title).localeCompare(normalizeText(b.title));
      }

      if (promotionSortMode === "START_ASC") {
        return getDateTimeValue(a.startDate) - getDateTimeValue(b.startDate);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const promotionTotalPages = getTotalPages(filteredDiscountPromotions);
  const paginatedDiscountPromotions = paginateItems(
    filteredDiscountPromotions,
    promotionPage,
  );

  const filteredCoupons = coupons
    .filter((coupon) => {
      const keyword = normalizeText(couponSearchKeyword);

      const matchesKeyword =
        !keyword ||
        normalizeText(coupon.id).includes(keyword) ||
        normalizeText(coupon.code).includes(keyword) ||
        normalizeText(coupon.name).includes(keyword) ||
        normalizeText(coupon.discountValue).includes(keyword);

      const matchesStatus =
        couponStatusFilter === "ALL" ||
        (couponStatusFilter === "ACTIVE" && Boolean(coupon.active)) ||
        (couponStatusFilter === "INACTIVE" && !Boolean(coupon.active));

      const matchesType =
        couponTypeFilter === "ALL" || coupon.discountType === couponTypeFilter;

      return matchesKeyword && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (couponSortMode === "CODE_ASC") {
        return normalizeText(a.code).localeCompare(normalizeText(b.code));
      }

      if (couponSortMode === "VALUE_DESC") {
        return Number(b.discountValue || 0) - Number(a.discountValue || 0);
      }

      if (couponSortMode === "VALUE_ASC") {
        return Number(a.discountValue || 0) - Number(b.discountValue || 0);
      }

      if (couponSortMode === "USED_DESC") {
        return Number(b.usedCount || 0) - Number(a.usedCount || 0);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const couponTotalPages = getTotalPages(filteredCoupons);
  const paginatedCoupons = paginateItems(filteredCoupons, couponPage);

  const filteredFlashSales = flashSales
    .filter((flashSale) => {
      const keyword = normalizeText(flashSaleSearchKeyword);

      const matchesKeyword =
        !keyword ||
        normalizeText(flashSale.id).includes(keyword) ||
        normalizeText(flashSale.title).includes(keyword) ||
        normalizeText(flashSale.subtitle).includes(keyword);

      const matchesStatus =
        flashSaleStatusFilter === "ALL" ||
        (flashSaleStatusFilter === "ACTIVE" && Boolean(flashSale.active)) ||
        (flashSaleStatusFilter === "INACTIVE" && !Boolean(flashSale.active));

      return matchesKeyword && matchesStatus;
    })
    .sort((a, b) => {
      if (flashSaleSortMode === "SORT_ASC") {
        return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
      }

      if (flashSaleSortMode === "START_ASC") {
        return getDateTimeValue(a.startTime) - getDateTimeValue(b.startTime);
      }

      if (flashSaleSortMode === "END_ASC") {
        return getDateTimeValue(a.endTime) - getDateTimeValue(b.endTime);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const flashSaleTotalPages = getTotalPages(filteredFlashSales);
  const paginatedFlashSales = paginateItems(filteredFlashSales, flashSalePage);

  const filteredFlashSaleItems = flashSaleItems.filter((item) => {
    const keyword = normalizeText(flashSaleItemSearchKeyword);
    const productName = getProductNameById(item.productId);

    const matchesKeyword =
      !keyword ||
      normalizeText(item.id).includes(keyword) ||
      normalizeText(item.productId).includes(keyword) ||
      normalizeText(productName).includes(keyword) ||
      normalizeText(item.salePrice).includes(keyword);

    const matchesStatus =
      flashSaleItemStatusFilter === "ALL" ||
      (flashSaleItemStatusFilter === "ACTIVE" && Boolean(item.active)) ||
      (flashSaleItemStatusFilter === "INACTIVE" && !Boolean(item.active));

    return matchesKeyword && matchesStatus;
  });

  const flashSaleItemTotalPages = getTotalPages(filteredFlashSaleItems);
  const paginatedFlashSaleItems = paginateItems(
    filteredFlashSaleItems,
    flashSaleItemPage,
  );

  const getBrandCategoryName = (brand) => {
    return brand.category?.name || brand.category || "";
  };

  const getPickerBrandsByCategory = (categoryName) => {
    if (!categoryName || categoryName === "ALL") {
      return brands;
    }

    return brands.filter(
      (brand) =>
        normalizeText(getBrandCategoryName(brand)) ===
        normalizeText(categoryName),
    );
  };

  const getFilteredPickerProducts = (keyword, category, brand) => {
    const text = normalizeText(keyword);
    const categoryText = category === "ALL" ? "" : normalizeText(category);
    const brandText = brand === "ALL" ? "" : normalizeText(brand);

    return products.filter((product) => {
      const name = normalizeText(product.name);
      const productCategory = normalizeText(product.category);
      const productBrand = normalizeText(product.brand);
      const productId = normalizeText(product.id);

      const matchesKeyword =
        !text ||
        name.includes(text) ||
        productCategory.includes(text) ||
        productBrand.includes(text) ||
        productId.includes(text);

      const matchesCategory = !categoryText || productCategory === categoryText;

      const matchesBrand = !brandText || productBrand === brandText;

      return matchesKeyword && matchesCategory && matchesBrand;
    });
  };

  const promotionPickerProducts = getFilteredPickerProducts(
    promotionProductKeyword,
    promotionProductCategory,
    promotionProductBrand,
  );

  const flashSalePickerProducts = getFilteredPickerProducts(
    flashSaleProductKeyword,
    flashSaleProductCategory,
    flashSaleProductBrand,
  );

  const homeBannerPickerProducts = getFilteredPickerProducts(
    homeBannerProductKeyword,
    homeBannerProductCategory,
    homeBannerProductBrand,
  );

  const sectionBannerPickerProducts = getFilteredPickerProducts(
    sectionBannerProductKeyword,
    sectionBannerProductCategory,
    sectionBannerProductBrand,
  );

  const toggleHomeBannerProduct = (productId) => {
    const idNumber = Number(productId);

    setSelectedBannerProductIds((currentIds) => {
      if (currentIds.includes(idNumber)) {
        return currentIds.filter((id) => id !== idNumber);
      }

      return [...currentIds, idNumber];
    });
  };

  const toggleAllHomeBannerVisibleProducts = () => {
    const visibleIds = homeBannerPickerProducts.map((product) =>
      Number(product.id),
    );

    const isAllSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedBannerProductIds.includes(id));

    if (isAllSelected) {
      setSelectedBannerProductIds((currentIds) =>
        currentIds.filter((id) => !visibleIds.includes(id)),
      );

      return;
    }

    setSelectedBannerProductIds((currentIds) =>
      Array.from(new Set([...currentIds, ...visibleIds])),
    );
  };

  const togglePromotionProduct = (productId) => {
    const idNumber = Number(productId);

    setSelectedPromotionProductIds((currentIds) => {
      if (currentIds.includes(idNumber)) {
        return currentIds.filter((id) => id !== idNumber);
      }

      return [...currentIds, idNumber];
    });
  };

  const toggleFlashSaleProduct = (productId) => {
    const idNumber = Number(productId);

    setSelectedFlashSaleProductIds((currentIds) => {
      if (currentIds.includes(idNumber)) {
        return currentIds.filter((id) => id !== idNumber);
      }

      return [...currentIds, idNumber];
    });
  };

  const toggleAllPromotionVisibleProducts = () => {
    const visibleIds = promotionPickerProducts.map((product) =>
      Number(product.id),
    );

    const isAllSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedPromotionProductIds.includes(id));

    if (isAllSelected) {
      setSelectedPromotionProductIds((currentIds) =>
        currentIds.filter((id) => !visibleIds.includes(id)),
      );

      return;
    }

    setSelectedPromotionProductIds((currentIds) =>
      Array.from(new Set([...currentIds, ...visibleIds])),
    );
  };

  const toggleAllFlashSaleVisibleProducts = () => {
    const visibleIds = flashSalePickerProducts.map((product) =>
      Number(product.id),
    );

    const isAllSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedFlashSaleProductIds.includes(id));

    if (isAllSelected) {
      setSelectedFlashSaleProductIds((currentIds) =>
        currentIds.filter((id) => !visibleIds.includes(id)),
      );

      return;
    }

    setSelectedFlashSaleProductIds((currentIds) =>
      Array.from(new Set([...currentIds, ...visibleIds])),
    );
  };

  const getHomeTargetLabel = (targetType) => {
    const labels = {
      COLLECTION: "Bộ sưu tập",
      PRODUCT: "Sản phẩm",
      CUSTOM_LINK: "Link tùy chỉnh",
    };

    return labels[targetType] || targetType || "Chưa cập nhật";
  };

  const getHomeSectionTypeLabel = (sectionType) => {
    const labels = {
      DEAL_CARD: "Card deal dưới banner",
      PRODUCT_SECTION: "Khối sản phẩm",
      TABBED_SECTION: "Khối dạng tab",
      GOLDEN_HOUR_DEAL: "Giờ vàng deal sốc",
      FLASH_SALE: "Deal sốc mỗi ngày",
      HOT_TREND: "Sản phẩm hot trend",
      NEW_ARRIVAL: "Hàng mới về",
      CATEGORY_GRID: "Lưới danh mục",
      BANNER_SLIDER_LARGE: "Banner lớn tự chạy",
      DOUBLE_BANNER_SLIDER: "Banner đôi tự chạy",
      PRODUCT_BANNER_SLIDER: "Banner sản phẩm tự chạy",
    };

    return labels[sectionType] || sectionType || "Chưa cập nhật";
  };

  const filteredHomeBanners = banners
    .filter((banner) => {
      const keyword = normalizeText(homeBannerSearchKeyword);

      const matchesKeyword =
        !keyword ||
        normalizeText(banner.id).includes(keyword) ||
        normalizeText(banner.title).includes(keyword) ||
        normalizeText(banner.subtitle).includes(keyword) ||
        normalizeText(banner.imageUrl).includes(keyword) ||
        normalizeText(banner.targetUrl).includes(keyword) ||
        normalizeText(banner.linkUrl).includes(keyword);

      const matchesStatus =
        homeBannerStatusFilter === "ALL" ||
        (homeBannerStatusFilter === "ACTIVE" && Boolean(banner.active)) ||
        (homeBannerStatusFilter === "INACTIVE" && !Boolean(banner.active));

      const matchesTarget =
        homeBannerTargetFilter === "ALL" ||
        banner.targetType === homeBannerTargetFilter;

      return matchesKeyword && matchesStatus && matchesTarget;
    })
    .sort((a, b) => {
      if (homeBannerSortMode === "SORT_ASC") {
        return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
      }

      if (homeBannerSortMode === "SORT_DESC") {
        return Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const homeBannerTotalPages = getTotalPages(filteredHomeBanners);
  const paginatedHomeBanners = paginateItems(
    filteredHomeBanners,
    homeBannerPage,
  );

  const filteredHomeSections = homeSections
    .filter((section) => {
      const keyword = normalizeText(homeSectionSearchKeyword);

      const matchesKeyword =
        !keyword ||
        normalizeText(section.id).includes(keyword) ||
        normalizeText(section.title).includes(keyword) ||
        normalizeText(section.sectionType).includes(keyword) ||
        normalizeText(section.category).includes(keyword) ||
        normalizeText(section.brand).includes(keyword);

      const matchesType =
        homeSectionTypeFilter === "ALL" ||
        section.sectionType === homeSectionTypeFilter;

      const matchesStatus =
        homeSectionStatusFilter === "ALL" ||
        (homeSectionStatusFilter === "ACTIVE" && Boolean(section.active)) ||
        (homeSectionStatusFilter === "INACTIVE" && !Boolean(section.active));

      return matchesKeyword && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (homeSectionSortMode === "SORT_ASC") {
        return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
      }

      if (homeSectionSortMode === "SORT_DESC") {
        return Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const homeSectionTotalPages = getTotalPages(filteredHomeSections);
  const paginatedHomeSections = paginateItems(
    filteredHomeSections,
    homeSectionPage,
  );

  const filteredSectionBanners = sectionBanners
    .filter((banner) => {
      const keyword = normalizeText(sectionBannerSearchKeyword);

      const matchesKeyword =
        !keyword ||
        normalizeText(banner.id).includes(keyword) ||
        normalizeText(banner.title).includes(keyword) ||
        normalizeText(banner.subtitle).includes(keyword) ||
        normalizeText(banner.imageUrl).includes(keyword) ||
        normalizeText(banner.targetUrl).includes(keyword);

      const matchesTarget =
        sectionBannerTargetFilter === "ALL" ||
        banner.targetType === sectionBannerTargetFilter;

      const matchesStatus =
        sectionBannerStatusFilter === "ALL" ||
        (sectionBannerStatusFilter === "ACTIVE" && Boolean(banner.active)) ||
        (sectionBannerStatusFilter === "INACTIVE" && !Boolean(banner.active));

      return matchesKeyword && matchesTarget && matchesStatus;
    })
    .sort((a, b) => {
      if (sectionBannerSortMode === "GROUP_ASC") {
        return Number(a.slideGroup || 0) - Number(b.slideGroup || 0);
      }

      if (sectionBannerSortMode === "SORT_ASC") {
        return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
      }

      if (sectionBannerSortMode === "SORT_DESC") {
        return Number(b.sortOrder || 0) - Number(a.sortOrder || 0);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const sectionBannerTotalPages = getTotalPages(filteredSectionBanners);
  const paginatedSectionBanners = paginateItems(
    filteredSectionBanners,
    sectionBannerPage,
  );

  const getCategoryBrandCount = (categoryNameValue) => {
    return brands.filter(
      (brand) =>
        normalizeText(brand.category) === normalizeText(categoryNameValue),
    ).length;
  };

  const getCategoryProductCount = (categoryNameValue) => {
    return products.filter(
      (product) =>
        normalizeText(product.category) === normalizeText(categoryNameValue),
    ).length;
  };

  const getBrandProductCount = (brandNameValue, categoryNameValue) => {
    return products.filter((product) => {
      const matchesBrand =
        normalizeText(product.brand) === normalizeText(brandNameValue);

      const matchesCategory =
        !categoryNameValue ||
        normalizeText(product.category) === normalizeText(categoryNameValue);

      return matchesBrand && matchesCategory;
    }).length;
  };

  const categoriesWithoutBrands = categories.filter(
    (category) => getCategoryBrandCount(category.name) === 0,
  );

  const categoriesWithoutProducts = categories.filter(
    (category) => getCategoryProductCount(category.name) === 0,
  );

  const mostBrandCategory = categories.reduce(
    (bestCategory, currentCategory) => {
      if (!bestCategory) {
        return currentCategory;
      }

      return getCategoryBrandCount(currentCategory.name) >
        getCategoryBrandCount(bestCategory.name)
        ? currentCategory
        : bestCategory;
    },
    null,
  );

  const filteredCategories = categories
    .filter((category) => {
      const keyword = normalizeText(categorySearchKeyword);

      const brandCount = getCategoryBrandCount(category.name);
      const productCount = getCategoryProductCount(category.name);

      const matchesKeyword =
        !keyword ||
        normalizeText(category.id).includes(keyword) ||
        normalizeText(category.name).includes(keyword) ||
        normalizeText(category.icon).includes(keyword);

      const matchesStatus =
        categoryStatusFilter === "ALL" ||
        (categoryStatusFilter === "HAS_BRAND" && brandCount > 0) ||
        (categoryStatusFilter === "NO_BRAND" && brandCount === 0) ||
        (categoryStatusFilter === "HAS_PRODUCT" && productCount > 0) ||
        (categoryStatusFilter === "NO_PRODUCT" && productCount === 0);

      return matchesKeyword && matchesStatus;
    })
    .sort((a, b) => {
      const nameA = String(a.name || "").localeCompare(
        String(b.name || ""),
        "vi",
      );
      const nameB = String(b.name || "").localeCompare(
        String(a.name || ""),
        "vi",
      );

      if (categorySortMode === "ID_ASC") {
        return Number(a.id || 0) - Number(b.id || 0);
      }

      if (categorySortMode === "NAME_ASC") {
        return nameA;
      }

      if (categorySortMode === "NAME_DESC") {
        return nameB;
      }

      if (categorySortMode === "BRAND_DESC") {
        return getCategoryBrandCount(b.name) - getCategoryBrandCount(a.name);
      }

      if (categorySortMode === "PRODUCT_DESC") {
        return (
          getCategoryProductCount(b.name) - getCategoryProductCount(a.name)
        );
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const categoryTotalPages = getTotalPages(filteredCategories);

  const paginatedCategories = paginateItems(filteredCategories, categoryPage);

  const filteredBrands = brands
    .filter((brand) => {
      const keyword = normalizeText(brandSearchKeyword);
      const productCount = getBrandProductCount(brand.name, brand.category);

      const matchesKeyword =
        !keyword ||
        normalizeText(brand.id).includes(keyword) ||
        normalizeText(brand.name).includes(keyword) ||
        normalizeText(brand.category).includes(keyword);

      const matchesCategory =
        brandCategoryFilter === "ALL" ||
        normalizeText(brand.category) === normalizeText(brandCategoryFilter);

      const matchesStatus =
        brandStatusFilter === "ALL" ||
        (brandStatusFilter === "HAS_PRODUCT" && productCount > 0) ||
        (brandStatusFilter === "NO_PRODUCT" && productCount === 0);

      return matchesKeyword && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      const nameA = String(a.name || "").localeCompare(
        String(b.name || ""),
        "vi",
      );
      const nameB = String(b.name || "").localeCompare(
        String(a.name || ""),
        "vi",
      );

      if (brandSortMode === "ID_ASC") {
        return Number(a.id || 0) - Number(b.id || 0);
      }

      if (brandSortMode === "NAME_ASC") {
        return nameA;
      }

      if (brandSortMode === "NAME_DESC") {
        return nameB;
      }

      if (brandSortMode === "PRODUCT_DESC") {
        return (
          getBrandProductCount(b.name, b.category) -
          getBrandProductCount(a.name, a.category)
        );
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const brandTotalPages = getTotalPages(filteredBrands);

  const paginatedBrands = paginateItems(filteredBrands, brandPage);

  const filteredProducts = products
    .filter((item) => {
      const keyword = normalizeText(productSearchKeyword);

      const matchesKeyword =
        !keyword ||
        normalizeText(item.id).includes(keyword) ||
        normalizeText(item.name).includes(keyword) ||
        normalizeText(item.category).includes(keyword) ||
        normalizeText(item.brand).includes(keyword);

      const matchesCategory =
        !productCategoryFilter || item.category === productCategoryFilter;

      const matchesBrand =
        !productBrandFilter || item.brand === productBrandFilter;

      const stock = Number(item.stock || 0);

      const matchesStock =
        productStockFilter === "ALL" ||
        (productStockFilter === "IN_STOCK" && stock > 5) ||
        (productStockFilter === "LOW_STOCK" && stock > 0 && stock <= 5) ||
        (productStockFilter === "OUT_OF_STOCK" && stock <= 0);

      return matchesKeyword && matchesCategory && matchesBrand && matchesStock;
    })
    .sort((a, b) => {
      if (productSortMode === "ID_ASC") {
        return Number(a.id || 0) - Number(b.id || 0);
      }

      if (productSortMode === "NAME_ASC") {
        return normalizeText(a.name).localeCompare(normalizeText(b.name));
      }

      if (productSortMode === "PRICE_ASC") {
        return Number(a.price || 0) - Number(b.price || 0);
      }

      if (productSortMode === "PRICE_DESC") {
        return Number(b.price || 0) - Number(a.price || 0);
      }

      if (productSortMode === "STOCK_ASC") {
        return Number(a.stock || 0) - Number(b.stock || 0);
      }

      if (productSortMode === "STOCK_DESC") {
        return Number(b.stock || 0) - Number(a.stock || 0);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });

  const productTotalPages = getTotalPages(filteredProducts);
  const paginatedProducts = paginateItems(filteredProducts, productPage);

  const getOrderTimeValue = (order) => {
    const timeValue =
      order.createdAt ||
      order.updatedAt ||
      order.orderDate ||
      order.createdDate ||
      "";

    const timestamp = Date.parse(timeValue);

    return Number.isNaN(timestamp) ? Number(order.id || 0) : timestamp;
  };

  const filteredOrders = orders
    .filter((order) => {
      const keyword = normalizeText(orderSearchKeyword);

      const matchesKeyword =
        !keyword ||
        normalizeText(order.orderCode).includes(keyword) ||
        normalizeText(order.customerName).includes(keyword) ||
        normalizeText(order.phone).includes(keyword) ||
        normalizeText(order.email).includes(keyword) ||
        normalizeText(order.id).includes(keyword);

      const matchesOrderStatus =
        orderStatusFilter === "ALL" || order.orderStatus === orderStatusFilter;

      const matchesPaymentStatus =
        paymentStatusFilter === "ALL" ||
        order.paymentStatus === paymentStatusFilter;

      return matchesKeyword && matchesOrderStatus && matchesPaymentStatus;
    })
    .sort((a, b) => getOrderTimeValue(b) - getOrderTimeValue(a));

  const orderTotalPages = getTotalPages(filteredOrders);
  const paginatedOrders = paginateItems(filteredOrders, orderPage);

  const managedUsers = users.filter(
    (user) => String(user.role || "").toLowerCase() !== "admin",
  );

  const filteredUsers = managedUsers.filter((user) => {
    const keyword = normalizeText(userSearchKeyword);

    const matchesKeyword =
      !keyword ||
      normalizeText(user.fullName).includes(keyword) ||
      normalizeText(user.email).includes(keyword) ||
      normalizeText(user.phone).includes(keyword) ||
      normalizeText(user.role).includes(keyword);

    const matchesStatus =
      userStatusFilter === "ALL" ||
      (userStatusFilter === "LOCKED" && Boolean(user.locked)) ||
      (userStatusFilter === "ACTIVE" && !Boolean(user.locked));

    return matchesKeyword && matchesStatus;
  });

  const userTotalPages = getTotalPages(filteredUsers);
  const paginatedUsers = paginateItems(filteredUsers, userPage);

  const currentAdminMenuInfo =
    ADMIN_MENU_INFO[activeMenu] || ADMIN_MENU_INFO.overview;

  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}

      <div className="sidebar">
        {/* LOGO */}

        <button
          type="button"
          className="sidebar-logo sidebar-logo-button"
          onClick={() => navigate("/")}
        >
          <span className="sidebar-logo-text">
            <strong className="sidebar-brand-logo">
              <span className="sidebar-brand-electro">Electro</span>
              <span className="sidebar-brand-shop">Shop</span>
              <span className="sidebar-brand-bolt">⚡</span>
            </strong>

            <small>Admin Center</small>
          </span>
        </button>

        {/* MENU */}

        <div className="sidebar-menu">
          <div
            className={
              activeMenu === "overview" ? "sidebar-item active" : "sidebar-item"
            }
            onClick={() => handleOpenAdminMenu("overview")}
          >
            <span>📊</span>

            <span>Tổng quan</span>
          </div>

          <div
            className={
              activeMenu === "products" ? "sidebar-item active" : "sidebar-item"
            }
            onClick={() => handleOpenAdminMenu("products")}
          >
            <span>📦</span>

            <span>Sản phẩm</span>
          </div>

          <div
            className={
              activeMenu === "promotions"
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() => handleOpenAdminMenu("promotions")}
          >
            <span>🔥</span>

            <span>Khuyến mãi</span>
          </div>

          <div
            className={
              activeMenu === "homepage" ? "sidebar-item active" : "sidebar-item"
            }
            onClick={() => handleOpenAdminMenu("homepage")}
          >
            <span>🖼</span>

            <span>Trang chủ</span>
          </div>

          <div
            className={
              activeMenu === "categories"
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() => handleOpenAdminMenu("categories")}
          >
            <span>🗂</span>

            <span>Danh mục</span>
          </div>

          <div
            className={
              activeMenu === "orders" ? "sidebar-item active" : "sidebar-item"
            }
            onClick={() => {
              handleOpenAdminMenu("orders");
              fetchOrders();
            }}
          >
            <span>🧾</span>

            <span>Đơn hàng</span>
          </div>

          <button
            type="button"
            className={
              activeMenu === "users" ? "sidebar-item active" : "sidebar-item"
            }
            onClick={() => {
              handleOpenAdminMenu("users");
              fetchUsers();
            }}
          >
            <span>👥</span>

            <span>Người dùng</span>
          </button>
        </div>

        <div className="sidebar-footer-pro">
          <button
            type="button"
            className="sidebar-home-btn"
            onClick={() => navigate("/")}
          >
            <span>🏠</span>

            <div>
              <strong>Về trang chủ</strong>
              <small>Xem website bán hàng</small>
            </div>
          </button>
        </div>
      </div>

      {/* MAIN */}

      <div className="main-content">
        {/* HEADER */}

        <div className="dashboard-header admin-dashboard-header-pro">
          <div className="admin-page-title-block">
            <span className="admin-page-eyebrow">
              <span>{currentAdminMenuInfo.icon}</span>
              {currentAdminMenuInfo.label}
            </span>

            <h1>{currentAdminMenuInfo.title}</h1>

            <p>{currentAdminMenuInfo.description}</p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-homepage-btn"
              onClick={() => navigate("/")}
            >
              <span>🏠</span>
              <span>Về trang chủ</span>
            </button>

            <button
              type="button"
              className="logout-btn admin-logout-btn"
              onClick={handleLogout}
            >
              <span>🚪</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {activeMenu === "overview" && (
          <AdminOverview
            products={products}
            orders={orders}
            users={users}
            promotions={discountPromotions}
            coupons={coupons}
            flashSales={flashSales}
            flashSaleItems={flashSaleItems}
            onOpenMenu={handleOpenAdminMenu}
            onOpenOrder={(order) => {
              handleOpenAdminMenu("orders");
              handleOpenOrderDetail(order);
            }}
            onRefresh={() => {
              fetchProducts();
              fetchOrders();
              fetchUsers();
              fetchPromotions();
              fetchCoupons();
              fetchFlashSales();
            }}
          />
        )}

        {activeMenu === "users" && (
          <div className="admin-users-page">
            <div className="admin-section-header">
              <div>
                <h2>Quản lý người dùng</h2>

                <p>
                  Xem danh sách, tìm kiếm, khóa tài khoản hoặc xóa người dùng.
                </p>
              </div>
            </div>

            <div className="admin-user-list-card">
              <div className="admin-user-list-header">
                <div>
                  <h3>Danh sách người dùng</h3>

                  <span>
                    Tổng cộng {managedUsers.length} tài khoản người dùng
                  </span>
                </div>

                <input
                  type="text"
                  value={userSearchKeyword}
                  placeholder="Tìm theo tên, email, số điện thoại."
                  onChange={(event) => setUserSearchKeyword(event.target.value)}
                />

                <select
                  value={userStatusFilter}
                  onChange={(event) => setUserStatusFilter(event.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="LOCKED">Đã khóa</option>
                </select>
              </div>

              <p className="admin-result-count">
                Hiển thị {paginatedUsers.length} / {filteredUsers.length} người
                dùng
              </p>

              <div className="admin-user-table-wrap">
                <table className="admin-user-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Số điện thoại</th>
                      <th>Quyền</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="admin-empty-cell">
                          Không có người dùng nào
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>

                          <td>
                            <strong>{user.fullName || "Chưa cập nhật"}</strong>
                          </td>

                          <td>{user.email}</td>

                          <td>{user.phone}</td>

                          <td>
                            <span
                              className={
                                user.role === "admin"
                                  ? "admin-role-badge admin-role-admin"
                                  : "admin-role-badge admin-role-user"
                              }
                            >
                              {user.role === "admin" ? "Admin" : "User"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                user.locked
                                  ? "admin-status-badge admin-status-locked"
                                  : "admin-status-badge admin-status-active"
                              }
                            >
                              {user.locked ? "Đã khóa" : "Hoạt động"}
                            </span>
                          </td>

                          <td>
                            <div className="admin-user-row-actions">
                              <button
                                type="button"
                                onClick={() => handleToggleUserLock(user)}
                              >
                                {user.locked ? "Mở khóa" : "Khóa"}
                              </button>

                              <button
                                type="button"
                                className="danger"
                                onClick={() => handleDeleteUser(user)}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {renderPagination(userPage, userTotalPages, setUserPage)}
            </div>
          </div>
        )}

        {activeMenu === "promotions" && (
          <div className="homepage-admin">
            <h2>Quản lý khuyến mãi</h2>

            <div className="promotion-tabs">
              <button
                type="button"
                className={
                  promotionSubTab === "product-discount"
                    ? "promotion-tab active"
                    : "promotion-tab"
                }
                onClick={() => setPromotionSubTab("product-discount")}
              >
                Giảm giá sản phẩm
              </button>

              <button
                type="button"
                className={
                  promotionSubTab === "coupon"
                    ? "promotion-tab active"
                    : "promotion-tab"
                }
                onClick={() => setPromotionSubTab("coupon")}
              >
                Mã giảm giá
              </button>

              <button
                type="button"
                className={
                  promotionSubTab === "flash-sale"
                    ? "promotion-tab active"
                    : "promotion-tab"
                }
                onClick={() => setPromotionSubTab("flash-sale")}
              >
                Giờ vàng Flash Sale
              </button>
            </div>

            {promotionSubTab === "product-discount" && (
              <>
                <div className="homepage-card">
                  <h3>Giảm giá sản phẩm</h3>

                  <form onSubmit={handleSavePromotion}>
                    <input
                      type="text"
                      name="title"
                      placeholder="Tên chương trình: Sale laptop gaming"
                      value={promotionForm.title}
                      onChange={handlePromotionChange}
                    />

                    <div className="admin-product-picker">
                      <div className="admin-product-picker-head">
                        <div>
                          <strong>Chọn sản phẩm áp dụng</strong>
                          <span>
                            Đã chọn {selectedPromotionProductIds.length} sản
                            phẩm
                          </span>
                        </div>

                        <div className="admin-product-picker-actions">
                          <button
                            type="button"
                            onClick={toggleAllPromotionVisibleProducts}
                          >
                            Chọn / bỏ chọn kết quả đang lọc
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPromotionProductIds([])}
                          >
                            Bỏ chọn tất cả
                          </button>
                        </div>
                      </div>

                      <div className="admin-product-picker-toolbar">
                        <input
                          type="text"
                          placeholder="Tìm theo ID, tên sản phẩm, danh mục, thương hiệu..."
                          value={promotionProductKeyword}
                          onChange={(event) =>
                            setPromotionProductKeyword(event.target.value)
                          }
                        />

                        <select
                          value={promotionProductCategory}
                          onChange={(event) => {
                            setPromotionProductCategory(event.target.value);
                            setPromotionProductBrand("ALL");
                          }}
                        >
                          <option value="ALL">Tất cả danh mục</option>

                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.icon || "📦"} {category.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={promotionProductBrand}
                          onChange={(event) =>
                            setPromotionProductBrand(event.target.value)
                          }
                        >
                          <option value="ALL">Tất cả thương hiệu</option>

                          {getPickerBrandsByCategory(
                            promotionProductCategory,
                          ).map((brand) => (
                            <option key={brand.id} value={brand.name}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-product-picker-count">
                        Hiển thị {promotionPickerProducts.length} /{" "}
                        {products.length} sản phẩm
                      </div>

                      <div className="admin-product-picker-list">
                        {promotionPickerProducts.length === 0 ? (
                          <div className="admin-product-picker-empty">
                            Không tìm thấy sản phẩm phù hợp
                          </div>
                        ) : (
                          promotionPickerProducts.map((product) => {
                            const checked =
                              selectedPromotionProductIds.includes(
                                Number(product.id),
                              );

                            return (
                              <label
                                key={product.id}
                                className={
                                  checked
                                    ? "admin-product-picker-row selected"
                                    : "admin-product-picker-row"
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    togglePromotionProduct(product.id)
                                  }
                                />

                                <div>
                                  <strong>{product.name}</strong>

                                  <span>
                                    ID: {product.id} • {product.category} •{" "}
                                    {product.brand}
                                  </span>
                                </div>

                                <b>{formatAdminPrice(product.price)}</b>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <input
                      type="number"
                      name="discountPercent"
                      placeholder="Phần trăm giảm: 10"
                      value={promotionForm.discountPercent}
                      onChange={handlePromotionChange}
                    />

                    <input
                      type="date"
                      name="startDate"
                      value={promotionForm.startDate}
                      onChange={handlePromotionChange}
                    />

                    <input
                      type="date"
                      name="endDate"
                      value={promotionForm.endDate}
                      onChange={handlePromotionChange}
                    />

                    <label className="homepage-check">
                      <input
                        type="checkbox"
                        name="active"
                        checked={promotionForm.active}
                        onChange={handlePromotionChange}
                      />
                      Đang áp dụng
                    </label>

                    <button type="submit">
                      {editingPromotionId
                        ? "Cập nhật khuyến mãi"
                        : "Thêm khuyến mãi"}
                    </button>

                    {editingPromotionId && (
                      <button
                        type="button"
                        onClick={resetPromotionForm}
                        className="cancel-homepage-btn"
                      >
                        Hủy
                      </button>
                    )}
                  </form>
                </div>

                <div className="homepage-list-card">
                  <h3>Danh sách giảm giá sản phẩm</h3>

                  <div className="admin-list-toolbar admin-promotion-toolbar">
                    <input
                      type="text"
                      placeholder="Tìm theo ID, tên chương trình, sản phẩm, % giảm..."
                      value={promotionSearchKeyword}
                      onChange={(event) =>
                        setPromotionSearchKeyword(event.target.value)
                      }
                    />

                    <select
                      value={promotionProductFilter}
                      onChange={(event) =>
                        setPromotionProductFilter(event.target.value)
                      }
                    >
                      <option value="ALL">Tất cả sản phẩm</option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={promotionStatusFilter}
                      onChange={(event) =>
                        setPromotionStatusFilter(event.target.value)
                      }
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="ACTIVE">Đang áp dụng</option>
                      <option value="INACTIVE">Đang tắt</option>
                    </select>

                    <select
                      value={promotionSortMode}
                      onChange={(event) =>
                        setPromotionSortMode(event.target.value)
                      }
                    >
                      <option value="NEWEST">Mới nhất trước</option>
                      <option value="TITLE_ASC">Tên A-Z</option>
                      <option value="DISCOUNT_DESC">Giảm nhiều nhất</option>
                      <option value="DISCOUNT_ASC">Giảm ít nhất</option>
                      <option value="START_ASC">Ngày bắt đầu gần nhất</option>
                    </select>
                  </div>

                  <div className="admin-list-count">
                    Hiển thị {paginatedDiscountPromotions.length} /{" "}
                    {filteredDiscountPromotions.length} khuyến mãi sản phẩm
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên chương trình</th>
                        <th>Sản phẩm</th>
                        <th>Giảm</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedDiscountPromotions.map((promotion) => {
                        const product = products.find(
                          (item) =>
                            Number(item.id) === Number(promotion.productId),
                        );

                        return (
                          <tr key={promotion.id}>
                            <td>{promotion.id}</td>

                            <td>{promotion.title}</td>

                            <td>{product ? product.name : "-"}</td>

                            <td>{promotion.discountPercent}%</td>

                            <td>
                              {promotion.startDate}
                              {" → "}
                              {promotion.endDate}
                            </td>

                            <td>
                              {promotion.active ? "Đang áp dụng" : "Đang tắt"}
                            </td>

                            <td>
                              <button
                                onClick={() => handleEditPromotion(promotion)}
                              >
                                Sửa
                              </button>

                              <button
                                onClick={() =>
                                  handleDeletePromotion(promotion.id)
                                }
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {renderPagination(
                    promotionPage,
                    promotionTotalPages,
                    setPromotionPage,
                  )}
                </div>
              </>
            )}

            {promotionSubTab === "coupon" && (
              <>
                <div className="homepage-card">
                  <h3>Mã giảm giá</h3>

                  <form onSubmit={handleSaveCoupon}>
                    <input
                      type="text"
                      name="code"
                      placeholder="Mã coupon: SALE10"
                      value={couponForm.code}
                      onChange={handleCouponChange}
                    />

                    <input
                      type="text"
                      name="name"
                      placeholder="Tên mã: Giảm 10% đơn hàng"
                      value={couponForm.name}
                      onChange={handleCouponChange}
                    />

                    <select
                      name="discountType"
                      value={couponForm.discountType}
                      onChange={handleCouponChange}
                    >
                      <option value="PERCENT">Giảm theo %</option>

                      <option value="AMOUNT">Giảm số tiền</option>
                    </select>

                    <input
                      type="number"
                      name="discountValue"
                      placeholder="Giá trị giảm: 10 hoặc 200000"
                      value={couponForm.discountValue}
                      onChange={handleCouponChange}
                    />

                    <input
                      type="number"
                      name="minOrderValue"
                      placeholder="Đơn tối thiểu: 5000000"
                      value={couponForm.minOrderValue}
                      onChange={handleCouponChange}
                    />

                    <input
                      type="number"
                      name="maxDiscount"
                      placeholder="Giảm tối đa: 500000"
                      value={couponForm.maxDiscount}
                      onChange={handleCouponChange}
                    />

                    <input
                      type="date"
                      name="startDate"
                      value={couponForm.startDate}
                      onChange={handleCouponChange}
                    />

                    <input
                      type="date"
                      name="endDate"
                      value={couponForm.endDate}
                      onChange={handleCouponChange}
                    />

                    <input
                      type="number"
                      name="usageLimit"
                      placeholder="Số lượt dùng: 100"
                      value={couponForm.usageLimit}
                      onChange={handleCouponChange}
                    />

                    <label className="homepage-check">
                      <input
                        type="checkbox"
                        name="active"
                        checked={couponForm.active}
                        onChange={handleCouponChange}
                      />
                      Bật mã giảm giá
                    </label>

                    <button type="submit">
                      {editingCouponId ? "Cập nhật mã" : "Thêm mã giảm giá"}
                    </button>

                    {editingCouponId && (
                      <button
                        type="button"
                        onClick={resetCouponForm}
                        className="cancel-homepage-btn"
                      >
                        Hủy
                      </button>
                    )}
                  </form>
                </div>

                <div className="homepage-list-card">
                  <h3>Danh sách mã giảm giá</h3>

                  <div className="admin-list-toolbar admin-promotion-toolbar">
                    <input
                      type="text"
                      placeholder="Tìm theo ID, mã, tên mã, giá trị giảm..."
                      value={couponSearchKeyword}
                      onChange={(event) =>
                        setCouponSearchKeyword(event.target.value)
                      }
                    />

                    <select
                      value={couponTypeFilter}
                      onChange={(event) =>
                        setCouponTypeFilter(event.target.value)
                      }
                    >
                      <option value="ALL">Tất cả loại giảm</option>
                      <option value="PERCENT">Giảm theo %</option>
                      <option value="AMOUNT">Giảm số tiền</option>
                    </select>

                    <select
                      value={couponStatusFilter}
                      onChange={(event) =>
                        setCouponStatusFilter(event.target.value)
                      }
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="ACTIVE">Đang bật</option>
                      <option value="INACTIVE">Đang tắt</option>
                    </select>

                    <select
                      value={couponSortMode}
                      onChange={(event) =>
                        setCouponSortMode(event.target.value)
                      }
                    >
                      <option value="NEWEST">Mới nhất trước</option>
                      <option value="CODE_ASC">Mã A-Z</option>
                      <option value="VALUE_DESC">Giá trị giảm cao nhất</option>
                      <option value="VALUE_ASC">Giá trị giảm thấp nhất</option>
                      <option value="USED_DESC">Dùng nhiều nhất</option>
                    </select>
                  </div>

                  <div className="admin-list-count">
                    Hiển thị {paginatedCoupons.length} /{" "}
                    {filteredCoupons.length} mã giảm giá
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Mã</th>
                        <th>Tên</th>
                        <th>Loại</th>
                        <th>Giá trị</th>
                        <th>Đơn tối thiểu</th>
                        <th>Giảm tối đa</th>
                        <th>Lượt dùng</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedCoupons.map((coupon) => (
                        <tr key={coupon.id}>
                          <td>{coupon.id}</td>

                          <td>
                            <strong>{coupon.code}</strong>
                          </td>

                          <td>{coupon.name}</td>

                          <td>
                            {coupon.discountType === "PERCENT"
                              ? "Theo %"
                              : "Số tiền"}
                          </td>

                          <td>
                            {coupon.discountType === "PERCENT"
                              ? `${coupon.discountValue}%`
                              : `${Number(
                                  coupon.discountValue || 0,
                                ).toLocaleString("vi-VN")}đ`}
                          </td>

                          <td>
                            {Number(coupon.minOrderValue || 0).toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </td>

                          <td>
                            {Number(coupon.maxDiscount || 0).toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </td>

                          <td>
                            {coupon.usedCount || 0}/{coupon.usageLimit || "∞"}
                          </td>

                          <td>{coupon.active ? "Đang bật" : "Đang tắt"}</td>

                          <td>
                            <button onClick={() => handleEditCoupon(coupon)}>
                              Sửa
                            </button>

                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(
                    couponPage,
                    couponTotalPages,
                    setCouponPage,
                  )}
                </div>
              </>
            )}

            {promotionSubTab === "flash-sale" && (
              <div className="flash-sale-admin">
                <div className="homepage-card">
                  <h3>Chiến dịch Giờ vàng Flash Sale</h3>

                  <form onSubmit={handleSaveFlashSale}>
                    <input
                      type="text"
                      name="title"
                      placeholder="Tên chiến dịch: GIỜ VÀNG DEAL SỐC"
                      value={flashSaleForm.title}
                      onChange={handleFlashSaleChange}
                    />

                    <input
                      type="text"
                      name="subtitle"
                      placeholder="Mô tả: Săn ưu đãi giới hạn trong khung giờ vàng"
                      value={flashSaleForm.subtitle}
                      onChange={handleFlashSaleChange}
                    />

                    <div className="admin-upload-field">
                      <span>Ảnh banner Flash Sale</span>

                      <label className="admin-upload-box">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleUploadToForm(
                              event,
                              setFlashSaleForm,
                              "bannerImage",
                            )
                          }
                        />

                        <div>
                          <strong>Chọn ảnh Flash Sale</strong>
                          <small>Ảnh header cho chiến dịch</small>
                        </div>
                      </label>

                      {flashSaleForm.bannerImage && (
                        <div className="admin-upload-preview">
                          <img
                            src={flashSaleForm.bannerImage}
                            alt="Flash Sale banner"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setFlashSaleForm((prev) => ({
                                ...prev,
                                bannerImage: "",
                              }))
                            }
                          >
                            Xóa ảnh
                          </button>
                        </div>
                      )}
                    </div>

                    <label className="admin-field-label">
                      Thời gian bắt đầu
                    </label>

                    <input
                      type="datetime-local"
                      name="startTime"
                      value={flashSaleForm.startTime}
                      onChange={handleFlashSaleChange}
                    />

                    <label className="admin-field-label">
                      Thời gian kết thúc
                    </label>

                    <input
                      type="datetime-local"
                      name="endTime"
                      value={flashSaleForm.endTime}
                      onChange={handleFlashSaleChange}
                    />

                    <input
                      type="number"
                      name="sortOrder"
                      placeholder="Thứ tự hiển thị"
                      value={flashSaleForm.sortOrder}
                      onChange={handleFlashSaleChange}
                    />

                    <label className="homepage-check">
                      <input
                        type="checkbox"
                        name="active"
                        checked={flashSaleForm.active}
                        onChange={handleFlashSaleChange}
                      />
                      Bật chiến dịch này
                    </label>

                    <button type="submit">
                      {editingFlashSaleId
                        ? "Cập nhật chiến dịch"
                        : "Tạo chiến dịch"}
                    </button>

                    {editingFlashSaleId && (
                      <button
                        type="button"
                        className="cancel-homepage-btn"
                        onClick={resetFlashSaleForm}
                      >
                        Hủy
                      </button>
                    )}
                  </form>
                </div>

                <div className="homepage-list-card">
                  <h3>Danh sách chiến dịch Flash Sale</h3>

                  <div className="admin-list-toolbar admin-promotion-toolbar">
                    <input
                      type="text"
                      placeholder="Tìm theo ID, tên chiến dịch, mô tả..."
                      value={flashSaleSearchKeyword}
                      onChange={(event) =>
                        setFlashSaleSearchKeyword(event.target.value)
                      }
                    />

                    <select
                      value={flashSaleStatusFilter}
                      onChange={(event) =>
                        setFlashSaleStatusFilter(event.target.value)
                      }
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="ACTIVE">Đang bật</option>
                      <option value="INACTIVE">Đang tắt</option>
                    </select>

                    <select
                      value={flashSaleSortMode}
                      onChange={(event) =>
                        setFlashSaleSortMode(event.target.value)
                      }
                    >
                      <option value="NEWEST">Mới nhất trước</option>
                      <option value="SORT_ASC">Thứ tự hiển thị</option>
                      <option value="START_ASC">Bắt đầu gần nhất</option>
                      <option value="END_ASC">Kết thúc gần nhất</option>
                    </select>
                  </div>

                  <div className="admin-list-count">
                    Hiển thị {paginatedFlashSales.length} /{" "}
                    {filteredFlashSales.length} chiến dịch
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên chiến dịch</th>
                        <th>Thời gian</th>
                        <th>Banner</th>
                        <th>Trạng thái</th>
                        <th>Chọn</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedFlashSales.map((flashSale) => (
                        <tr key={flashSale.id}>
                          <td>{flashSale.id}</td>

                          <td>{flashSale.title}</td>

                          <td>
                            {flashSale.startTime}
                            <br />
                            →
                            <br />
                            {flashSale.endTime}
                          </td>

                          <td>
                            {flashSale.bannerImage ? (
                              <img
                                src={flashSale.bannerImage}
                                alt={flashSale.title}
                                className="flash-sale-admin-img"
                              />
                            ) : (
                              "-"
                            )}
                          </td>

                          <td>{flashSale.active ? "Đang bật" : "Đang tắt"}</td>

                          <td>
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectFlashSale(flashSale.id)
                              }
                              className={
                                Number(selectedFlashSaleId) ===
                                Number(flashSale.id)
                                  ? "flash-sale-select-btn active"
                                  : "flash-sale-select-btn"
                              }
                            >
                              {Number(selectedFlashSaleId) ===
                              Number(flashSale.id)
                                ? "Đang chọn"
                                : "Chọn"}
                            </button>
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() => handleEditFlashSale(flashSale)}
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteFlashSale(flashSale.id)
                              }
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(
                    flashSalePage,
                    flashSaleTotalPages,
                    setFlashSalePage,
                  )}
                </div>

                <div className="homepage-card">
                  <h3>Thêm sản phẩm vào Flash Sale</h3>

                  {selectedFlashSaleId ? (
                    <p className="admin-form-hint">
                      Đang thêm sản phẩm cho chiến dịch ID:{" "}
                      {selectedFlashSaleId}
                    </p>
                  ) : (
                    <p className="admin-form-hint warning">
                      Hãy chọn một chiến dịch Flash Sale ở bảng bên trên trước.
                    </p>
                  )}

                  <form onSubmit={handleSaveFlashSaleItem}>
                    <div className="admin-product-picker">
                      <div className="admin-product-picker-head">
                        <div>
                          <strong>Chọn sản phẩm Flash Sale</strong>
                          <span>
                            Đã chọn {selectedFlashSaleProductIds.length} sản
                            phẩm
                          </span>
                        </div>

                        <div className="admin-product-picker-actions">
                          <button
                            type="button"
                            onClick={toggleAllFlashSaleVisibleProducts}
                          >
                            Chọn / bỏ chọn kết quả đang lọc
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedFlashSaleProductIds([])}
                          >
                            Bỏ chọn tất cả
                          </button>
                        </div>
                      </div>

                      <div className="admin-product-picker-toolbar">
                        <input
                          type="text"
                          placeholder="Tìm theo ID, tên sản phẩm, danh mục, thương hiệu..."
                          value={flashSaleProductKeyword}
                          onChange={(event) =>
                            setFlashSaleProductKeyword(event.target.value)
                          }
                        />

                        <select
                          value={flashSaleProductCategory}
                          onChange={(event) => {
                            setFlashSaleProductCategory(event.target.value);
                            setFlashSaleProductBrand("ALL");
                          }}
                        >
                          <option value="ALL">Tất cả danh mục</option>

                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.icon || "📦"} {category.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={flashSaleProductBrand}
                          onChange={(event) =>
                            setFlashSaleProductBrand(event.target.value)
                          }
                        >
                          <option value="ALL">Tất cả thương hiệu</option>

                          {getPickerBrandsByCategory(
                            flashSaleProductCategory,
                          ).map((brand) => (
                            <option key={brand.id} value={brand.name}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-product-picker-count">
                        Hiển thị {flashSalePickerProducts.length} /{" "}
                        {products.length} sản phẩm
                      </div>

                      <div className="admin-product-picker-list">
                        {flashSalePickerProducts.length === 0 ? (
                          <div className="admin-product-picker-empty">
                            Không tìm thấy sản phẩm phù hợp
                          </div>
                        ) : (
                          flashSalePickerProducts.map((product) => {
                            const checked =
                              selectedFlashSaleProductIds.includes(
                                Number(product.id),
                              );
                            const alreadyInFlashSale = flashSaleItems.some(
                              (item) =>
                                Number(item.productId) === Number(product.id),
                            );

                            return (
                              <label
                                key={product.id}
                                className={
                                  checked
                                    ? "admin-product-picker-row selected"
                                    : "admin-product-picker-row"
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={
                                    !editingFlashSaleItemId &&
                                    alreadyInFlashSale
                                  }
                                  onChange={() =>
                                    toggleFlashSaleProduct(product.id)
                                  }
                                />

                                <div>
                                  <strong>{product.name}</strong>

                                  <span>
                                    ID: {product.id} • {product.category} •{" "}
                                    {product.brand}
                                  </span>

                                  {!editingFlashSaleItemId &&
                                    alreadyInFlashSale && (
                                      <em>Đã có trong Flash Sale này</em>
                                    )}
                                </div>

                                <b>{formatAdminPrice(product.price)}</b>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {editingFlashSaleItemId && (
                      <input
                        type="number"
                        name="salePrice"
                        placeholder="Giá sale khi sửa 1 sản phẩm"
                        value={flashSaleItemForm.salePrice}
                        onChange={handleFlashSaleItemChange}
                      />
                    )}

                    <input
                      type="number"
                      name="discountPercent"
                      placeholder="Phần trăm giảm: 15"
                      value={flashSaleItemForm.discountPercent}
                      onChange={handleFlashSaleItemChange}
                    />

                    <input
                      type="number"
                      name="saleQuantity"
                      placeholder="Số lượng sale: 100"
                      value={flashSaleItemForm.saleQuantity}
                      onChange={handleFlashSaleItemChange}
                    />

                    <input
                      type="number"
                      name="soldQuantity"
                      placeholder="Đã bán: 58"
                      value={flashSaleItemForm.soldQuantity}
                      onChange={handleFlashSaleItemChange}
                    />

                    <input
                      type="number"
                      name="limitPerUser"
                      placeholder="Mỗi người mua tối đa: 1"
                      value={flashSaleItemForm.limitPerUser}
                      onChange={handleFlashSaleItemChange}
                    />

                    <label className="homepage-check">
                      <input
                        type="checkbox"
                        name="active"
                        checked={flashSaleItemForm.active}
                        onChange={handleFlashSaleItemChange}
                      />
                      Bật sản phẩm này trong Flash Sale
                    </label>

                    <button type="submit" disabled={!selectedFlashSaleId}>
                      {editingFlashSaleItemId
                        ? "Cập nhật sản phẩm sale"
                        : "Thêm sản phẩm sale"}
                    </button>

                    {editingFlashSaleItemId && (
                      <button
                        type="button"
                        className="cancel-homepage-btn"
                        onClick={resetFlashSaleItemForm}
                      >
                        Hủy
                      </button>
                    )}
                  </form>
                </div>

                <div className="homepage-list-card">
                  <h3>Danh sách sản phẩm trong Flash Sale</h3>

                  <div className="admin-list-toolbar admin-promotion-toolbar">
                    <input
                      type="text"
                      placeholder="Tìm theo ID, tên sản phẩm, giá sale..."
                      value={flashSaleItemSearchKeyword}
                      onChange={(event) =>
                        setFlashSaleItemSearchKeyword(event.target.value)
                      }
                    />

                    <select
                      value={flashSaleItemStatusFilter}
                      onChange={(event) =>
                        setFlashSaleItemStatusFilter(event.target.value)
                      }
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="ACTIVE">Đang bật</option>
                      <option value="INACTIVE">Đang tắt</option>
                    </select>
                  </div>

                  <div className="admin-list-count">
                    Hiển thị {paginatedFlashSaleItems.length} /{" "}
                    {filteredFlashSaleItems.length} sản phẩm Flash Sale
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Sản phẩm</th>
                        <th>Giá gốc</th>
                        <th>Giá sale</th>
                        <th>Giảm</th>
                        <th>Số lượng</th>
                        <th>Đã bán</th>
                        <th>Giới hạn</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedFlashSaleItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>

                          <td>{getProductNameById(item.productId)}</td>

                          <td>
                            {formatAdminPrice(
                              getProductPriceById(item.productId),
                            )}
                          </td>

                          <td>{formatAdminPrice(item.salePrice)}</td>

                          <td>{item.discountPercent}%</td>

                          <td>{item.saleQuantity}</td>

                          <td>{item.soldQuantity}</td>

                          <td>{item.limitPerUser}</td>

                          <td>{item.active ? "Đang bật" : "Đang tắt"}</td>

                          <td>
                            <button
                              type="button"
                              onClick={() => handleEditFlashSaleItem(item)}
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteFlashSaleItem(item.id)}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(
                    flashSaleItemPage,
                    flashSaleItemTotalPages,
                    setFlashSaleItemPage,
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeMenu === "homepage" && (
          <div className="homepage-admin">
            <h2>Quản lý hiển thị trang chủ</h2>

            <div className="homepage-admin-grid">
              {/* BANNER FORM */}

              <div className="homepage-card">
                <h3>Banner trang chủ</h3>

                <form onSubmit={handleSaveBanner}>
                  <input
                    type="text"
                    name="title"
                    placeholder="Tiêu đề banner"
                    value={bannerForm.title}
                    onChange={handleBannerChange}
                  />

                  <input
                    type="text"
                    name="subtitle"
                    placeholder="Mô tả ngắn"
                    value={bannerForm.subtitle}
                    onChange={handleBannerChange}
                  />

                  <label className="homepage-check">
                    <input
                      type="checkbox"
                      name="showTitle"
                      checked={bannerForm.showTitle}
                      onChange={handleBannerChange}
                    />
                    Hiển thị tiêu đề trên banner
                  </label>

                  <label className="homepage-check">
                    <input
                      type="checkbox"
                      name="showSubtitle"
                      checked={bannerForm.showSubtitle}
                      onChange={handleBannerChange}
                    />
                    Hiển thị mô tả ngắn trên banner
                  </label>

                  <div className="admin-upload-field">
                    <span>Ảnh banner</span>

                    <label className="admin-upload-box">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          handleUploadToForm(event, setBannerForm, "imageUrl")
                        }
                      />

                      <div>
                        <strong>Chọn ảnh banner</strong>
                        <small>PNG, JPG, JPEG, WEBP</small>
                      </div>
                    </label>

                    {bannerForm.imageUrl && (
                      <div className="admin-upload-preview">
                        <img src={bannerForm.imageUrl} alt="Banner preview" />

                        <button
                          type="button"
                          onClick={() =>
                            setBannerForm((prev) => ({
                              ...prev,
                              imageUrl: "",
                            }))
                          }
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    )}
                  </div>

                  <select
                    name="targetType"
                    value={bannerForm.targetType}
                    onChange={(event) => {
                      setBannerForm({
                        ...bannerForm,
                        targetType: event.target.value,
                        targetUrl: "",
                        targetProductId: "",
                        linkUrl: "",
                      });
                    }}
                  >
                    <option value="COLLECTION">
                      Click ra danh sách sản phẩm
                    </option>
                    <option value="PRODUCT">Click ra chi tiết sản phẩm</option>
                    <option value="CUSTOM_LINK">Link tùy chỉnh</option>
                  </select>

                  {bannerForm.targetType === "PRODUCT" && (
                    <select
                      name="targetProductId"
                      value={bannerForm.targetProductId}
                      onChange={handleBannerChange}
                    >
                      <option value="">Chọn sản phẩm đích</option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {bannerForm.targetType === "CUSTOM_LINK" && (
                    <input
                      name="targetUrl"
                      placeholder="Nhập link tùy chỉnh. Ví dụ: /search?category=Laptop"
                      value={bannerForm.targetUrl}
                      onChange={handleBannerChange}
                    />
                  )}

                  {bannerForm.targetType === "COLLECTION" && (
                    <div className="admin-product-picker">
                      <div className="admin-product-picker-head">
                        <div>
                          <strong>Chọn sản phẩm khi click banner</strong>
                          <span>
                            Đã chọn {selectedBannerProductIds.length} sản phẩm
                          </span>
                        </div>

                        <div className="admin-product-picker-actions">
                          <button
                            type="button"
                            onClick={toggleAllHomeBannerVisibleProducts}
                          >
                            Chọn / bỏ chọn kết quả đang lọc
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedBannerProductIds([])}
                          >
                            Bỏ chọn tất cả
                          </button>
                        </div>
                      </div>

                      <div className="admin-product-picker-toolbar">
                        <input
                          type="text"
                          placeholder="Tìm theo ID, tên sản phẩm, danh mục, thương hiệu..."
                          value={homeBannerProductKeyword}
                          onChange={(event) =>
                            setHomeBannerProductKeyword(event.target.value)
                          }
                        />

                        <select
                          value={homeBannerProductCategory}
                          onChange={(event) => {
                            setHomeBannerProductCategory(event.target.value);
                            setHomeBannerProductBrand("ALL");
                          }}
                        >
                          <option value="ALL">Tất cả danh mục</option>

                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.icon || "📦"} {category.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={homeBannerProductBrand}
                          onChange={(event) =>
                            setHomeBannerProductBrand(event.target.value)
                          }
                        >
                          <option value="ALL">Tất cả thương hiệu</option>

                          {getPickerBrandsByCategory(
                            homeBannerProductCategory,
                          ).map((brand) => (
                            <option key={brand.id} value={brand.name}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-product-picker-count">
                        Hiển thị {homeBannerPickerProducts.length} /{" "}
                        {products.length} sản phẩm
                      </div>

                      <div className="admin-product-picker-list">
                        {homeBannerPickerProducts.length === 0 ? (
                          <div className="admin-product-picker-empty">
                            Không tìm thấy sản phẩm phù hợp
                          </div>
                        ) : (
                          homeBannerPickerProducts.map((product) => {
                            const checked = selectedBannerProductIds.includes(
                              Number(product.id),
                            );

                            return (
                              <label
                                key={product.id}
                                className={
                                  checked
                                    ? "admin-product-picker-row selected"
                                    : "admin-product-picker-row"
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    toggleHomeBannerProduct(product.id)
                                  }
                                />

                                <div>
                                  <strong>{product.name}</strong>

                                  <span>
                                    ID: {product.id} • {product.category} •{" "}
                                    {product.brand}
                                  </span>
                                </div>

                                <b>{formatAdminPrice(product.price)}</b>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  <select
                    name="position"
                    value={bannerForm.position}
                    onChange={handleBannerChange}
                  >
                    <option value="HOME_TOP">Banner ngang đầu trang</option>
                  </select>

                  <input
                    type="number"
                    name="sortOrder"
                    placeholder="Thứ tự"
                    value={bannerForm.sortOrder}
                    onChange={handleBannerChange}
                  />

                  <label className="homepage-check">
                    <input
                      type="checkbox"
                      name="active"
                      checked={bannerForm.active}
                      onChange={handleBannerChange}
                    />
                    Hiển thị banner
                  </label>

                  {bannerForm.imageUrl && (
                    <img
                      src={bannerForm.imageUrl}
                      alt="Preview"
                      className="homepage-banner-preview"
                    />
                  )}

                  <button type="submit">
                    {editingBannerId ? "Cập nhật banner" : "Thêm banner"}
                  </button>

                  {editingBannerId && (
                    <button
                      type="button"
                      onClick={resetBannerForm}
                      className="cancel-homepage-btn"
                    >
                      Hủy
                    </button>
                  )}
                </form>
              </div>

              {/* SECTION FORM */}

              <div className="homepage-card">
                <h3>Khối sản phẩm trang chủ</h3>

                <form onSubmit={handleSaveSection}>
                  <input
                    type="text"
                    name="title"
                    placeholder={
                      sectionForm.sectionType === "DEAL_CARD"
                        ? "Tên card: ASUS Vivobook 11, RTX Gaming PC..."
                        : "Tên khối: Laptop Gaming, PC Gaming, Gaming Gear..."
                    }
                    value={sectionForm.title}
                    onChange={handleSectionChange}
                  />

                  <select
                    name="sectionType"
                    value={sectionForm.sectionType}
                    onChange={handleSectionChange}
                  >
                    <option value="DEAL_CARD">Card deal dưới banner</option>

                    <option value="PRODUCT_SECTION">
                      Khối sản phẩm theo danh mục
                    </option>

                    <option value="TABBED_SECTION">
                      Khối sản phẩm dạng tab
                    </option>

                    <option value="GOLDEN_HOUR_DEAL">Giờ vàng deal sốc</option>

                    <option value="FLASH_SALE">Deal sốc mỗi ngày</option>

                    <option value="HOT_TREND">Sản phẩm hot trend</option>

                    <option value="NEW_ARRIVAL">Hàng mới về</option>

                    <option value="CATEGORY_GRID">Lưới danh mục nhanh</option>
                    <option value="BANNER_SLIDER_LARGE">
                      Banner lớn tự chạy
                    </option>

                    <option value="DOUBLE_BANNER_SLIDER">
                      2 banner ngang tự chạy
                    </option>

                    <option value="PRODUCT_BANNER_SLIDER">
                      Banner sản phẩm tự chạy
                    </option>
                  </select>

                  {isBannerSectionType(sectionForm.sectionType) && (
                    <>
                      <label className="homepage-check">
                        <input
                          type="checkbox"
                          name="autoSlide"
                          checked={sectionForm.autoSlide}
                          onChange={handleSectionChange}
                        />
                        Tự động chuyển banner
                      </label>

                      <input
                        type="number"
                        name="slideInterval"
                        value={sectionForm.slideInterval}
                        onChange={handleSectionChange}
                        placeholder="Thời gian chuyển banner, ví dụ 4000"
                        min="1000"
                      />

                      <p className="admin-form-hint">
                        1000 = 1 giây, 4000 = 4 giây.
                      </p>
                    </>
                  )}

                  {sectionForm.sectionType === "DEAL_CARD" && (
                    <>
                      <p>
                        Dùng để tạo khối card deal dưới banner chính. Sau khi
                        lưu khối, bấm nút "Quản lý banner" ở bảng danh sách khối
                        để thêm ảnh card deal, chọn kiểu click, nhóm slide và
                        thứ tự hiển thị.
                      </p>

                      <p>
                        Mỗi slide nên tạo 3 banner. Ví dụ: 3 ảnh đầu đặt Nhóm
                        slide = 1, 3 ảnh tiếp theo đặt Nhóm slide = 2 để khối tự
                        chạy.
                      </p>
                    </>
                  )}

                  {sectionForm.sectionType === "GOLDEN_HOUR_DEAL" && (
                    <div className="section-form-group">
                      <p className="admin-form-hint">
                        Dùng để tạo khối Giờ vàng deal sốc có đồng hồ đếm ngược
                        và danh sách sản phẩm giảm giá.
                      </p>

                      <input
                        type="text"
                        name="dealSubtitle"
                        placeholder="Mô tả phụ: Laptop Gaming giảm đến 35%"
                        value={sectionForm.dealSubtitle}
                        onChange={handleSectionChange}
                      />

                      <input
                        type="datetime-local"
                        name="dealEndTime"
                        value={sectionForm.dealEndTime}
                        onChange={handleSectionChange}
                      />

                      <select
                        name="dealTheme"
                        value={sectionForm.dealTheme}
                        onChange={handleSectionChange}
                      >
                        <option value="RED">Đỏ cam - sale mạnh</option>

                        <option value="BLUE">Xanh công nghệ</option>

                        <option value="ORANGE">Cam nổi bật</option>
                      </select>

                      <select
                        name="category"
                        value={sectionForm.category}
                        onChange={handleSectionChange}
                      >
                        <option value="">Chọn danh mục sản phẩm</option>

                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.icon || "📦"} {category.name}
                          </option>
                        ))}
                      </select>

                      <select
                        name="brand"
                        value={sectionForm.brand}
                        onChange={handleSectionChange}
                        disabled={!sectionForm.category}
                      >
                        <option value="">
                          {sectionForm.category
                            ? "Tất cả thương hiệu"
                            : "Chọn danh mục trước"}
                        </option>

                        {brands
                          .filter(
                            (brand) =>
                              String(brand.category || "").toLowerCase() ===
                              String(sectionForm.category || "").toLowerCase(),
                          )
                          .map((brand) => (
                            <option key={brand.id} value={brand.name}>
                              {brand.name}
                            </option>
                          ))}
                      </select>

                      <input
                        type="text"
                        name="bannerImage"
                        placeholder="Ảnh banner nền cho khối nếu có"
                        value={sectionForm.bannerImage}
                        onChange={handleSectionChange}
                      />

                      <select
                        name="productRows"
                        value={sectionForm.productRows}
                        onChange={handleSectionChange}
                      >
                        <option value="1">Hiển thị 1 hàng sản phẩm</option>

                        <option value="2">Hiển thị 2 hàng sản phẩm</option>
                      </select>

                      <input
                        type="number"
                        name="limitProduct"
                        placeholder="Số sản phẩm hiển thị, ví dụ: 8"
                        value={sectionForm.limitProduct}
                        onChange={handleSectionChange}
                      />
                    </div>
                  )}

                  {sectionForm.sectionType !== "DEAL_CARD" &&
                    sectionForm.sectionType !== "GOLDEN_HOUR_DEAL" &&
                    !isBannerSectionType(sectionForm.sectionType) && (
                      <div className="section-form-group">
                        <p className="admin-form-hint">
                          Dùng để tạo khối sản phẩm lớn bên dưới trang Home như
                          Laptop Gaming, PC Gaming, Gaming Gear.
                        </p>

                        {sectionForm.sectionType === "TABBED_SECTION" && (
                          <>
                            <input
                              type="text"
                              name="groupCode"
                              placeholder="Mã nhóm tab: HOME_MAIN_TABS"
                              value={sectionForm.groupCode}
                              onChange={handleSectionChange}
                            />

                            <input
                              type="text"
                              name="tabTitle"
                              placeholder="Tên tab: DEAL SỐC MỖI NGÀY, SẢN PHẨM HOT TREND..."
                              value={sectionForm.tabTitle}
                              onChange={handleSectionChange}
                            />

                            <input
                              type="number"
                              name="tabOrder"
                              placeholder="Thứ tự tab: 1, 2, 3..."
                              value={sectionForm.tabOrder}
                              onChange={handleSectionChange}
                            />
                          </>
                        )}
                        <select
                          name="category"
                          value={sectionForm.category}
                          onChange={handleSectionChange}
                        >
                          <option value="">
                            Chọn danh mục cho khối sản phẩm
                          </option>

                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.icon || "📦"} {category.name}
                            </option>
                          ))}
                        </select>

                        <select
                          name="brand"
                          value={sectionForm.brand}
                          onChange={handleSectionChange}
                          disabled={!sectionForm.category}
                        >
                          <option value="">
                            {sectionForm.category
                              ? "Tất cả thương hiệu"
                              : "Chọn danh mục trước"}
                          </option>

                          {brands
                            .filter(
                              (brand) =>
                                brand.category === sectionForm.category,
                            )
                            .map((brand) => (
                              <option key={brand.id} value={brand.name}>
                                {brand.name}
                              </option>
                            ))}
                        </select>

                        <div className="admin-upload-field">
                          <span>Ảnh banner khối</span>

                          <label className="admin-upload-box">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                handleUploadToForm(
                                  event,
                                  setSectionForm,
                                  "bannerImage",
                                )
                              }
                            />

                            <div>
                              <strong>Chọn ảnh banner khối</strong>
                              <small>Ảnh hiển thị trong khối sản phẩm</small>
                            </div>
                          </label>

                          {sectionForm.bannerImage && (
                            <div className="admin-upload-preview">
                              <img
                                src={sectionForm.bannerImage}
                                alt="Section banner"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setSectionForm((prev) => ({
                                    ...prev,
                                    bannerImage: "",
                                  }))
                                }
                              >
                                Xóa ảnh
                              </button>
                            </div>
                          )}
                        </div>

                        <input
                          type="text"
                          name="bannerLink"
                          placeholder="Link banner nếu có"
                          value={sectionForm.bannerLink}
                          onChange={handleSectionChange}
                        />

                        <div className="homepage-left-banner-box">
                          <div className="admin-upload-field">
                            <span>Ảnh banner cột trái</span>

                            <label className="admin-upload-box">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                  handleUploadToForm(
                                    event,
                                    setSectionForm,
                                    "leftBannerImage",
                                  )
                                }
                              />

                              <div>
                                <strong>Chọn ảnh banner trái</strong>
                                <small>Ảnh nằm bên trái khối sản phẩm</small>
                              </div>
                            </label>

                            {sectionForm.leftBannerImage && (
                              <div className="admin-upload-preview">
                                <img
                                  src={sectionForm.leftBannerImage}
                                  alt="Left banner"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSectionForm((prev) => ({
                                      ...prev,
                                      leftBannerImage: "",
                                    }))
                                  }
                                >
                                  Xóa ảnh
                                </button>
                              </div>
                            )}
                          </div>

                          <input
                            type="text"
                            name="leftBannerLink"
                            placeholder="Link khi bấm banner cột trái nếu có"
                            value={sectionForm.leftBannerLink}
                            onChange={handleSectionChange}
                          />

                          <select
                            name="productRows"
                            value={sectionForm.productRows}
                            onChange={handleSectionChange}
                          >
                            <option value={1}>Hiển thị 1 hàng sản phẩm</option>

                            <option value={2}>Hiển thị 2 hàng sản phẩm</option>
                          </select>
                        </div>

                        <input
                          type="number"
                          name="limitProduct"
                          placeholder="Số sản phẩm hiển thị"
                          value={sectionForm.limitProduct}
                          onChange={handleSectionChange}
                        />

                        {sectionForm.bannerImage && (
                          <img
                            src={sectionForm.bannerImage}
                            alt="Preview"
                            className="homepage-banner-preview"
                          />
                        )}
                      </div>
                    )}

                  <input
                    type="number"
                    name="sortOrder"
                    placeholder="Thứ tự hiển thị"
                    value={sectionForm.sortOrder}
                    onChange={handleSectionChange}
                  />

                  <label className="homepage-check">
                    <input
                      type="checkbox"
                      name="active"
                      checked={sectionForm.active}
                      onChange={handleSectionChange}
                    />
                    Hiển thị khối này
                  </label>

                  <button type="submit">
                    {editingSectionId ? "Cập nhật khối" : "Thêm khối"}
                  </button>

                  {editingSectionId && (
                    <button
                      type="button"
                      onClick={resetSectionForm}
                      className="cancel-homepage-btn"
                    >
                      Hủy
                    </button>
                  )}
                </form>
              </div>
            </div>

            <div className="homepage-list-card">
              <h3>Danh sách banner</h3>

              <div className="admin-list-toolbar admin-homepage-toolbar">
                <input
                  type="text"
                  placeholder="Tìm theo ID, tiêu đề, mô tả, link..."
                  value={homeBannerSearchKeyword}
                  onChange={(event) =>
                    setHomeBannerSearchKeyword(event.target.value)
                  }
                />

                <select
                  value={homeBannerTargetFilter}
                  onChange={(event) =>
                    setHomeBannerTargetFilter(event.target.value)
                  }
                >
                  <option value="ALL">Tất cả kiểu click</option>
                  <option value="COLLECTION">Bộ sưu tập</option>
                  <option value="PRODUCT">Sản phẩm</option>
                  <option value="CUSTOM_LINK">Link tùy chỉnh</option>
                </select>

                <select
                  value={homeBannerStatusFilter}
                  onChange={(event) =>
                    setHomeBannerStatusFilter(event.target.value)
                  }
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hiển thị</option>
                  <option value="INACTIVE">Đang ẩn</option>
                </select>

                <select
                  value={homeBannerSortMode}
                  onChange={(event) =>
                    setHomeBannerSortMode(event.target.value)
                  }
                >
                  <option value="NEWEST">Mới nhất trước</option>
                  <option value="SORT_ASC">Thứ tự tăng dần</option>
                  <option value="SORT_DESC">Thứ tự giảm dần</option>
                </select>
              </div>

              <div className="admin-list-count">
                Hiển thị {paginatedHomeBanners.length} /{" "}
                {filteredHomeBanners.length} banner
              </div>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ảnh</th>
                    <th>Tiêu đề</th>
                    <th>Vị trí</th>
                    <th>Thứ tự</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedHomeBanners.map((banner) => (
                    <tr key={banner.id}>
                      <td>{banner.id}</td>

                      <td>
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="homepage-table-img"
                        />
                      </td>

                      <td>{banner.title}</td>

                      <td>{banner.position}</td>

                      <td>{banner.sortOrder}</td>

                      <td>{banner.active ? "Hiển thị" : "Đang ẩn"}</td>

                      <td>
                        <button onClick={() => handleEditBanner(banner)}>
                          Sửa
                        </button>

                        <button onClick={() => handleDeleteBanner(banner.id)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination(
                homeBannerPage,
                homeBannerTotalPages,
                setHomeBannerPage,
              )}
            </div>

            <div className="homepage-list-card">
              {selectedBannerSectionId && (
                <div className="homepage-card">
                  <h3>
                    Quản lý banner của khối:{" "}
                    {selectedBannerSection?.title || selectedBannerSectionId}
                  </h3>

                  <form onSubmit={handleSaveSectionBanner}>
                    <div className="admin-upload-field">
                      <span>Ảnh banner</span>

                      <label className="admin-upload-box">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleUploadToForm(
                              event,
                              setSectionBannerForm,
                              "imageUrl",
                            )
                          }
                        />

                        <div>
                          <strong>Chọn ảnh banner</strong>
                          <small>Ảnh cho khối banner mới</small>
                        </div>
                      </label>

                      {sectionBannerForm.imageUrl && (
                        <div className="admin-upload-preview">
                          <img
                            src={sectionBannerForm.imageUrl}
                            alt="Banner preview"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setSectionBannerForm((prev) => ({
                                ...prev,
                                imageUrl: "",
                              }))
                            }
                          >
                            Xóa ảnh
                          </button>
                        </div>
                      )}
                    </div>

                    <input
                      name="title"
                      value={sectionBannerForm.title}
                      onChange={handleSectionBannerChange}
                      placeholder="Tiêu đề banner"
                    />

                    <input
                      name="subtitle"
                      value={sectionBannerForm.subtitle}
                      onChange={handleSectionBannerChange}
                      placeholder="Mô tả ngắn"
                    />

                    <select
                      name="targetType"
                      value={sectionBannerForm.targetType}
                      onChange={handleSectionBannerChange}
                    >
                      <option value="COLLECTION">
                        Click ra danh sách sản phẩm
                      </option>

                      <option value="PRODUCT">
                        Click ra chi tiết sản phẩm
                      </option>

                      <option value="CUSTOM_LINK">Link tùy chỉnh</option>
                    </select>

                    {sectionBannerForm.targetType === "PRODUCT" && (
                      <select
                        name="targetProductId"
                        value={sectionBannerForm.targetProductId}
                        onChange={handleSectionBannerChange}
                      >
                        <option value="">Chọn sản phẩm đích</option>

                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {sectionBannerForm.targetType === "CUSTOM_LINK" && (
                      <input
                        name="targetUrl"
                        value={sectionBannerForm.targetUrl}
                        onChange={handleSectionBannerChange}
                        placeholder="/product/6 hoặc /search?category=Laptop"
                      />
                    )}

                    <input
                      type="number"
                      name="slideGroup"
                      value={sectionBannerForm.slideGroup}
                      onChange={handleSectionBannerChange}
                      placeholder="Nhóm slide"
                      min="1"
                    />

                    {selectedBannerSection?.sectionType ===
                      "DOUBLE_BANNER_SLIDER" && (
                      <select
                        name="position"
                        value={sectionBannerForm.position}
                        onChange={handleSectionBannerChange}
                      >
                        <option value="">Chọn vị trí banner</option>
                        <option value="LEFT">Bên trái</option>
                        <option value="RIGHT">Bên phải</option>
                      </select>
                    )}

                    <input
                      type="number"
                      name="sortOrder"
                      value={sectionBannerForm.sortOrder}
                      onChange={handleSectionBannerChange}
                      placeholder="Thứ tự"
                      min="1"
                    />

                    <label className="homepage-check">
                      <input
                        type="checkbox"
                        name="active"
                        checked={sectionBannerForm.active}
                        onChange={handleSectionBannerChange}
                      />
                      Hiển thị banner
                    </label>

                    {sectionBannerForm.targetType === "COLLECTION" && (
                      <div className="admin-product-picker">
                        <div className="admin-product-picker-head">
                          <div>
                            <strong>Chọn sản phẩm cho banner trong khối</strong>
                            <span>
                              Đã chọn {sectionBannerProductIds.length} sản phẩm
                            </span>
                          </div>

                          <div className="admin-product-picker-actions">
                            <button
                              type="button"
                              onClick={toggleAllSectionBannerVisibleProducts}
                            >
                              Chọn / bỏ chọn kết quả đang lọc
                            </button>

                            <button
                              type="button"
                              onClick={() => setSectionBannerProductIds([])}
                            >
                              Bỏ chọn tất cả
                            </button>
                          </div>
                        </div>

                        <div className="admin-product-picker-toolbar">
                          <input
                            type="text"
                            placeholder="Tìm theo ID, tên sản phẩm, danh mục, thương hiệu..."
                            value={sectionBannerProductKeyword}
                            onChange={(event) =>
                              setSectionBannerProductKeyword(event.target.value)
                            }
                          />

                          <select
                            value={sectionBannerProductCategory}
                            onChange={(event) => {
                              setSectionBannerProductCategory(
                                event.target.value,
                              );
                              setSectionBannerProductBrand("ALL");
                            }}
                          >
                            <option value="ALL">Tất cả danh mục</option>

                            {categories.map((category) => (
                              <option key={category.id} value={category.name}>
                                {category.icon || "📦"} {category.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={sectionBannerProductBrand}
                            onChange={(event) =>
                              setSectionBannerProductBrand(event.target.value)
                            }
                          >
                            <option value="ALL">Tất cả thương hiệu</option>

                            {getPickerBrandsByCategory(
                              sectionBannerProductCategory,
                            ).map((brand) => (
                              <option key={brand.id} value={brand.name}>
                                {brand.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="admin-product-picker-count">
                          Hiển thị {sectionBannerPickerProducts.length} /{" "}
                          {products.length} sản phẩm
                        </div>

                        <div className="admin-product-picker-list">
                          {sectionBannerPickerProducts.length === 0 ? (
                            <div className="admin-product-picker-empty">
                              Không tìm thấy sản phẩm phù hợp
                            </div>
                          ) : (
                            sectionBannerPickerProducts.map((product) => {
                              const checked = sectionBannerProductIds.includes(
                                Number(product.id),
                              );

                              return (
                                <label
                                  key={product.id}
                                  className={
                                    checked
                                      ? "admin-product-picker-row selected"
                                      : "admin-product-picker-row"
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      handleToggleSectionBannerProduct(
                                        product.id,
                                      )
                                    }
                                  />

                                  <div>
                                    <strong>{product.name}</strong>

                                    <span>
                                      ID: {product.id} • {product.category} •{" "}
                                      {product.brand}
                                    </span>
                                  </div>

                                  <b>{formatAdminPrice(product.price)}</b>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    <button type="submit">
                      {editingSectionBannerId
                        ? "Cập nhật banner"
                        : "Thêm banner"}
                    </button>

                    {editingSectionBannerId && (
                      <button
                        type="button"
                        className="cancel-homepage-btn"
                        onClick={resetSectionBannerForm}
                      >
                        Hủy
                      </button>
                    )}
                  </form>

                  <h3>Danh sách banner trong khối</h3>

                  <div className="admin-list-toolbar admin-homepage-toolbar">
                    <input
                      type="text"
                      placeholder="Tìm theo ID, tiêu đề, mô tả, link..."
                      value={sectionBannerSearchKeyword}
                      onChange={(event) =>
                        setSectionBannerSearchKeyword(event.target.value)
                      }
                    />

                    <select
                      value={sectionBannerTargetFilter}
                      onChange={(event) =>
                        setSectionBannerTargetFilter(event.target.value)
                      }
                    >
                      <option value="ALL">Tất cả kiểu click</option>
                      <option value="COLLECTION">Bộ sưu tập</option>
                      <option value="PRODUCT">Sản phẩm</option>
                      <option value="CUSTOM_LINK">Link tùy chỉnh</option>
                    </select>

                    <select
                      value={sectionBannerStatusFilter}
                      onChange={(event) =>
                        setSectionBannerStatusFilter(event.target.value)
                      }
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="ACTIVE">Đang hiển thị</option>
                      <option value="INACTIVE">Đang ẩn</option>
                    </select>

                    <select
                      value={sectionBannerSortMode}
                      onChange={(event) =>
                        setSectionBannerSortMode(event.target.value)
                      }
                    >
                      <option value="SORT_ASC">Thứ tự tăng dần</option>
                      <option value="SORT_DESC">Thứ tự giảm dần</option>
                      <option value="GROUP_ASC">Theo nhóm slide</option>
                      <option value="NEWEST">Mới nhất trước</option>
                    </select>
                  </div>

                  <div className="admin-list-count">
                    Hiển thị {paginatedSectionBanners.length} /{" "}
                    {filteredSectionBanners.length} banner trong khối
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Ảnh</th>
                        <th>Tiêu đề</th>
                        <th>Kiểu click</th>
                        <th>Nhóm</th>
                        <th>Vị trí</th>
                        <th>Thứ tự</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedSectionBanners.map((banner) => (
                        <tr key={banner.id}>
                          <td>{banner.id}</td>

                          <td>
                            {banner.imageUrl && (
                              <img
                                src={banner.imageUrl}
                                alt=""
                                style={{
                                  width: "90px",
                                  borderRadius: "8px",
                                }}
                              />
                            )}
                          </td>

                          <td>{banner.title}</td>
                          <td>{banner.targetType}</td>
                          <td>{banner.slideGroup}</td>
                          <td>{banner.position || "-"}</td>
                          <td>{banner.sortOrder}</td>

                          <td>{banner.active ? "Hiển thị" : "Đang ẩn"}</td>

                          <td>
                            <button
                              type="button"
                              onClick={() => handleEditSectionBanner(banner)}
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteSectionBanner(banner.id)
                              }
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(
                    sectionBannerPage,
                    sectionBannerTotalPages,
                    setSectionBannerPage,
                  )}
                </div>
              )}

              <h3>Danh sách khối trang chủ</h3>

              <div className="admin-list-toolbar admin-homepage-toolbar">
                <input
                  type="text"
                  placeholder="Tìm theo ID, tên khối, danh mục, thương hiệu..."
                  value={homeSectionSearchKeyword}
                  onChange={(event) =>
                    setHomeSectionSearchKeyword(event.target.value)
                  }
                />

                <select
                  value={homeSectionTypeFilter}
                  onChange={(event) =>
                    setHomeSectionTypeFilter(event.target.value)
                  }
                >
                  <option value="ALL">Tất cả loại khối</option>
                  <option value="DEAL_CARD">Card deal dưới banner</option>
                  <option value="PRODUCT_SECTION">Khối sản phẩm</option>
                  <option value="TABBED_SECTION">Khối dạng tab</option>
                  <option value="GOLDEN_HOUR_DEAL">Giờ vàng deal sốc</option>
                  <option value="FLASH_SALE">Deal sốc mỗi ngày</option>
                  <option value="HOT_TREND">Hot trend</option>
                  <option value="NEW_ARRIVAL">Hàng mới về</option>
                  <option value="CATEGORY_GRID">Lưới danh mục</option>
                  <option value="BANNER_SLIDER_LARGE">
                    Banner lớn tự chạy
                  </option>
                  <option value="DOUBLE_BANNER_SLIDER">
                    Banner đôi tự chạy
                  </option>
                  <option value="PRODUCT_BANNER_SLIDER">
                    Banner sản phẩm tự chạy
                  </option>
                </select>

                <select
                  value={homeSectionStatusFilter}
                  onChange={(event) =>
                    setHomeSectionStatusFilter(event.target.value)
                  }
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hiển thị</option>
                  <option value="INACTIVE">Đang ẩn</option>
                </select>

                <select
                  value={homeSectionSortMode}
                  onChange={(event) =>
                    setHomeSectionSortMode(event.target.value)
                  }
                >
                  <option value="SORT_ASC">Thứ tự tăng dần</option>
                  <option value="SORT_DESC">Thứ tự giảm dần</option>
                  <option value="NEWEST">Mới nhất trước</option>
                </select>
              </div>

              <div className="admin-list-count">
                Hiển thị {paginatedHomeSections.length} /{" "}
                {filteredHomeSections.length} khối
              </div>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên khối</th>
                    <th>Loại</th>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Thương hiệu</th>
                    <th>Số SP</th>
                    <th>Thứ tự</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedHomeSections.map((section) => (
                    <tr key={section.id}>
                      <td>{section.id}</td>

                      <td>{section.title}</td>

                      <td>{section.sectionType}</td>

                      <td>
                        {products.find(
                          (product) =>
                            Number(product.id) === Number(section.productId),
                        )?.name || "-"}
                      </td>

                      <td>{section.category}</td>

                      <td>{section.brand}</td>

                      <td>{section.limitProduct}</td>

                      <td>{section.sortOrder}</td>

                      <td>{section.active ? "Hiển thị" : "Đang ẩn"}</td>

                      <td>
                        {isBannerSectionType(section.sectionType) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectBannerSection(section.id)
                            }
                          >
                            Quản lý banner
                          </button>
                        )}

                        <button onClick={() => handleEditSection(section)}>
                          Sửa
                        </button>

                        <button onClick={() => handleDeleteSection(section.id)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination(
                homeSectionPage,
                homeSectionTotalPages,
                setHomeSectionPage,
              )}
            </div>
          </div>
        )}

        {activeMenu === "products" && (
          <>
            {/* PRODUCT FORM */}

            <div className="product-form">
              <div className="product-form-header">
                <div>
                  <h2>{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</h2>

                  <p>
                    {editingId
                      ? "Bạn đang chỉnh sửa sản phẩm. Bấm làm mới để hủy sửa và nhập sản phẩm mới."
                      : "Nhập thông tin sản phẩm mới để thêm vào hệ thống."}
                  </p>
                </div>

                <button
                  type="button"
                  className="product-refresh-btn"
                  onClick={handleRefreshProductForm}
                  disabled={productFormRefreshing}
                >
                  {productFormRefreshing ? "Đang làm mới..." : "Làm mới"}
                </button>
              </div>

              <form
                onSubmit={editingId ? handleUpdateProduct : handleAddProduct}
              >
                <div className="form-grid">
                  {/* TÊN */}

                  <div>
                    <label className="form-label">Tên sản phẩm</label>

                    <input
                      type="text"
                      name="name"
                      placeholder="Tên sản phẩm"
                      value={product.name}
                      onChange={handleChange}
                    />
                  </div>

                  {/* DANH MỤC + THƯƠNG HIỆU */}

                  <div className="category-brand-group">
                    <div>
                      <label className="form-label">Danh mục</label>

                      <select
                        name="category"
                        value={product.category}
                        onChange={handleChange}
                      >
                        <option value="">Chọn danh mục</option>

                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Thương hiệu</label>

                      <select
                        name="brand"
                        value={product.brand}
                        onChange={handleChange}
                        disabled={!product.category}
                      >
                        <option value="">
                          {product.category
                            ? "Chọn thương hiệu"
                            : "Chọn danh mục trước"}
                        </option>

                        {brands
                          .filter(
                            (brand) => brand.category === product.category,
                          )
                          .map((brand) => (
                            <option key={brand.id} value={brand.name}>
                              {brand.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  {/* STOCK */}

                  <div>
                    <label className="form-label">Số lượng</label>

                    <input
                      type="number"
                      name="stock"
                      placeholder="Số lượng"
                      value={product.stock}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="form-label">Giá sản phẩm</label>

                    <input
                      type="number"
                      name="price"
                      placeholder="Giá sản phẩm"
                      value={product.price}
                      onChange={handleChange}
                    />
                  </div>

                  {/* ẢNH CHÍNH */}
                  {/* ẢNH CHÍNH + ẢNH PHỤ */}
                  <div
                    className="product-image-upload-group"
                    ref={productImageUploadRef}
                  >
                    <div className="product-image-upload-row">
                      <div>
                        <label className="form-label">Ảnh chính sản phẩm</label>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />

                        {product.image && (
                          <div className="product-image-preview-list">
                            <div className="product-image-preview-item main">
                              <img
                                src={product.image}
                                alt="Ảnh chính sản phẩm"
                              />

                              <button
                                type="button"
                                className="remove-product-image-btn"
                                onClick={handleRemoveMainImage}
                                aria-label="Xóa ảnh chính"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Ảnh phụ sản phẩm</label>

                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleMultipleUpload}
                        />

                        {product.images?.length > 0 && (
                          <div className="product-image-preview-list">
                            {product.images.map((img, index) => {
                              const imageUrl = getProductImageUrl(img);

                              if (!imageUrl) return null;

                              return (
                                <div
                                  className="product-image-preview-item"
                                  key={img.id || imageUrl || index}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Ảnh phụ ${index + 1}`}
                                  />

                                  <button
                                    type="button"
                                    className="remove-product-image-btn"
                                    onClick={() => handleRemoveSubImage(index)}
                                    aria-label={`Xóa ảnh phụ ${index + 1}`}
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRODUCT CONTENT */}

                <div className="admin-editor-layout">
                  {/* LEFT EDITOR */}

                  <div className="admin-editor-left">
                    {/* MÔ TẢ SẢN PHẨM */}

                    <div className="editor-card">
                      <h3 className="editor-card-title">Mô tả sản phẩm</h3>

                      <label className="form-label">
                        Mô tả chi tiết
                        <span className="required">*</span>
                      </label>

                      <div className="rich-editor simple-editor">
                        <textarea
                          name="description"
                          placeholder="Nhập mô tả chi tiết sản phẩm..."
                          value={product.description}
                          onChange={handleChange}
                          maxLength={5000}
                        />

                        <div className="char-count">
                          {product.description ? product.description.length : 0}
                          /5000 ký tự
                        </div>
                      </div>
                    </div>

                    {/* THÔNG SỐ KỸ THUẬT */}

                    <div className="editor-card">
                      <h3 className="editor-card-title">Thông số kỹ thuật</h3>

                      <div className="spec-table">
                        <div className="spec-table-head">
                          <span></span>

                          <span>
                            Tên thông số
                            <b>*</b>
                          </span>

                          <span>
                            Giá trị
                            <b>*</b>
                          </span>

                          <span></span>
                        </div>

                        {specifications.map((spec, index) => (
                          <div className="spec-table-row" key={index}>
                            <span className="drag-icon">⋮⋮</span>

                            <input
                              type="text"
                              placeholder="CPU"
                              value={spec.key}
                              onChange={(e) => {
                                const updated = [...specifications];

                                updated[index].key = e.target.value;

                                setSpecifications(updated);
                              }}
                            />

                            <input
                              type="text"
                              placeholder="Intel Core i7-13700HX"
                              value={spec.value}
                              onChange={(e) => {
                                const updated = [...specifications];

                                updated[index].value = e.target.value;

                                setSpecifications(updated);
                              }}
                            />

                            <button
                              type="button"
                              className="delete-small-btn"
                              onClick={() => {
                                setSpecifications(
                                  specifications.filter((_, i) => i !== index),
                                );
                              }}
                            >
                              🗑
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="outline-add-btn"
                        onClick={() => {
                          setSpecifications([
                            ...specifications,
                            {
                              key: "",
                              value: "",
                            },
                          ]);
                        }}
                      >
                        + Thêm thông số
                      </button>
                    </div>

                    {/* ĐIỂM NỔI BẬT */}

                    <div className="editor-card">
                      <h3 className="editor-card-title">Điểm nổi bật</h3>

                      <div className="highlight-grid">
                        {highlights.map((item, index) => (
                          <div className="highlight-card" key={index}>
                            <select
                              className="icon-select"
                              value={item.icon}
                              onChange={(e) => {
                                const updated = [...highlights];

                                updated[index].icon = e.target.value;

                                setHighlights(updated);
                              }}
                            >
                              {highlightIcons.map((icon) => (
                                <option key={icon} value={icon}>
                                  {icon}
                                </option>
                              ))}
                            </select>

                            <div className="highlight-inputs">
                              <input
                                type="text"
                                placeholder="Tiêu đề nổi bật"
                                value={item.title}
                                onChange={(e) => {
                                  const updated = [...highlights];

                                  updated[index].title = e.target.value;

                                  setHighlights(updated);
                                }}
                              />

                              <input
                                type="text"
                                placeholder="Mô tả ngắn"
                                value={item.description}
                                onChange={(e) => {
                                  const updated = [...highlights];

                                  updated[index].description = e.target.value;

                                  setHighlights(updated);
                                }}
                              />
                            </div>

                            <button
                              type="button"
                              className="delete-small-btn"
                              onClick={() => {
                                setHighlights(
                                  highlights.filter((_, i) => i !== index),
                                );
                              }}
                            >
                              🗑
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="outline-add-btn"
                        onClick={() => {
                          setHighlights([
                            ...highlights,
                            {
                              icon: "🖥",
                              title: "",
                              description: "",
                            },
                          ]);
                        }}
                      >
                        + Thêm điểm nổi bật
                      </button>
                    </div>
                  </div>

                  {/* RIGHT PREVIEW */}

                  <div className="admin-editor-right">
                    {/* ƯU ĐÃI */}

                    <div className="editor-card">
                      <h3 className="editor-card-title">Ưu đãi khi mua hàng</h3>

                      <div className="promotion-list">
                        {promotions.map((item, index) => (
                          <div className="promotion-item" key={index}>
                            <select
                              className="icon-select"
                              value={item.icon}
                              onChange={(e) => {
                                const updated = [...promotions];

                                updated[index].icon = e.target.value;

                                setPromotions(updated);
                              }}
                            >
                              {promotionIcons.map((icon) => (
                                <option key={icon} value={icon}>
                                  {icon}
                                </option>
                              ))}
                            </select>

                            <div className="promotion-inputs">
                              <input
                                type="text"
                                placeholder="Tên ưu đãi"
                                value={item.title}
                                onChange={(e) => {
                                  const updated = [...promotions];

                                  updated[index].title = e.target.value;

                                  setPromotions(updated);
                                }}
                              />

                              <input
                                type="text"
                                placeholder="Mô tả ưu đãi"
                                value={item.description}
                                onChange={(e) => {
                                  const updated = [...promotions];

                                  updated[index].description = e.target.value;

                                  setPromotions(updated);
                                }}
                              />
                            </div>

                            <button
                              type="button"
                              className="delete-small-btn"
                              onClick={() => {
                                setPromotions(
                                  promotions.filter((_, i) => i !== index),
                                );
                              }}
                            >
                              🗑
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="outline-add-btn"
                        onClick={() => {
                          setPromotions([
                            ...promotions,
                            {
                              icon: "🎁",
                              title: "",
                              description: "",
                            },
                          ]);
                        }}
                      >
                        + Thêm ưu đãi
                      </button>
                    </div>

                    {/* PREVIEW */}

                    <div className="editor-card preview-box">
                      <h3 className="editor-card-title">Xem trước hiển thị</h3>

                      <div className="preview-content">
                        <h4>MÔ TẢ SẢN PHẨM</h4>

                        <p>
                          {product.description ||
                            "Mô tả sản phẩm sẽ hiển thị ở đây..."}
                        </p>

                        <h4>THÔNG SỐ KỸ THUẬT</h4>

                        <div className="preview-spec-table">
                          {specifications
                            .filter((spec) => spec.key || spec.value)
                            .slice(0, 4)
                            .map((spec, index) => (
                              <div key={index} className="preview-spec-row">
                                <span>{spec.key}</span>

                                <strong>{spec.value}</strong>
                              </div>
                            ))}
                        </div>

                        <h4>ĐIỂM NỔI BẬT</h4>

                        <div className="preview-highlight-list">
                          {highlights
                            .filter((item) => item.title)
                            .map((item, index) => (
                              <div
                                key={index}
                                className="preview-highlight-item"
                              >
                                {item.icon} {item.title}
                              </div>
                            ))}
                        </div>

                        <h4>ƯU ĐÃI KHI MUA HÀNG</h4>

                        <div className="preview-promotion-list">
                          {promotions
                            .filter((item) => item.title)
                            .map((item, index) => (
                              <div
                                key={index}
                                className="preview-promotion-item"
                              >
                                <span className="preview-promotion-icon">
                                  {item.icon}
                                </span>

                                <div>
                                  <strong>{item.title}</strong>

                                  <p>{item.description}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TÙY CHỌN SẢN PHẨM */}

                <div className="editor-card option-editor-card">
                  <div className="option-editor-header">
                    <div>
                      <h3 className="editor-card-title">Tùy chọn sản phẩm</h3>

                      <p className="option-editor-desc">
                        Ví dụ: Phiên bản, Dung lượng, Màu sắc, RAM, SSD...
                      </p>
                    </div>

                    <button
                      type="button"
                      className="add-option-group-btn"
                      onClick={() => {
                        setProductOptions([
                          ...productOptions,
                          {
                            groupName: "",
                            values: [
                              {
                                name: "",
                                price: "",
                              },
                            ],
                          },
                        ]);
                      }}
                    >
                      + Thêm nhóm tùy chọn
                    </button>
                  </div>

                  <div className="option-group-grid">
                    {productOptions.map((group, groupIndex) => (
                      <div className="option-group-card" key={groupIndex}>
                        <div className="option-group-title-row">
                          <span className="drag-icon">⋮⋮</span>

                          <input
                            type="text"
                            placeholder="Tên nhóm, ví dụ: Dung lượng"
                            value={group.groupName}
                            onChange={(e) => {
                              const updated = [...productOptions];

                              updated[groupIndex].groupName = e.target.value;

                              setProductOptions(updated);
                            }}
                          />

                          <button
                            type="button"
                            className="delete-outline-btn"
                            onClick={() => {
                              setProductOptions(
                                productOptions.filter(
                                  (_, i) => i !== groupIndex,
                                ),
                              );
                            }}
                          >
                            Xóa nhóm
                          </button>
                        </div>

                        <div className="option-value-head">
                          <span>Tên lựa chọn</span>

                          <span>Giá (VNĐ)</span>

                          <span></span>
                        </div>

                        {group.values.map((value, valueIndex) => (
                          <div className="option-value-row" key={valueIndex}>
                            <input
                              type="text"
                              placeholder="256GB"
                              value={value.name}
                              onChange={(e) => {
                                const updated = [...productOptions];

                                updated[groupIndex].values[valueIndex].name =
                                  e.target.value;

                                setProductOptions(updated);
                              }}
                            />

                            <input
                              type="number"
                              placeholder="36990000"
                              value={value.price}
                              onChange={(e) => {
                                const updated = [...productOptions];

                                updated[groupIndex].values[valueIndex].price =
                                  e.target.value;

                                setProductOptions(updated);
                              }}
                            />

                            <button
                              type="button"
                              className="delete-option-btn"
                              onClick={() => {
                                const updated = [...productOptions];

                                updated[groupIndex].values = updated[
                                  groupIndex
                                ].values.filter((_, i) => i !== valueIndex);

                                setProductOptions(updated);
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="add-option-value-btn"
                          onClick={() => {
                            const updated = [...productOptions];

                            updated[groupIndex].values.push({
                              name: "",
                              price: "",
                            });

                            setProductOptions(updated);
                          }}
                        >
                          + Thêm lựa chọn
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="submit-wrapper">
                  <button type="submit">
                    {editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
                  </button>
                </div>
              </form>
            </div>
            {/* PRODUCT TABLE */}
            <div className="product-table">
              <h2>Quản lý sản phẩm</h2>

              <div className="admin-toolbar">
                <input
                  type="text"
                  placeholder="Tìm theo ID, tên sản phẩm, danh mục, thương hiệu..."
                  value={productSearchKeyword}
                  onChange={(event) =>
                    setProductSearchKeyword(event.target.value)
                  }
                />

                <select
                  value={productCategoryFilter}
                  onChange={(event) => {
                    setProductCategoryFilter(event.target.value);
                    setProductBrandFilter("");
                  }}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={productBrandFilter}
                  onChange={(event) =>
                    setProductBrandFilter(event.target.value)
                  }
                >
                  <option value="">Tất cả thương hiệu</option>
                  {brands
                    .filter(
                      (brand) =>
                        !productCategoryFilter ||
                        brand.category === productCategoryFilter,
                    )
                    .map((brand) => (
                      <option key={brand.id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                </select>

                <select
                  value={productStockFilter}
                  onChange={(event) =>
                    setProductStockFilter(event.target.value)
                  }
                >
                  <option value="ALL">Tất cả tồn kho</option>
                  <option value="IN_STOCK">Còn hàng</option>
                  <option value="LOW_STOCK">Sắp hết hàng</option>
                  <option value="OUT_OF_STOCK">Hết hàng</option>
                </select>

                <select
                  value={productSortMode}
                  onChange={(event) => setProductSortMode(event.target.value)}
                >
                  <option value="ID_DESC">Mới nhất trước</option>
                  <option value="ID_ASC">Cũ nhất trước</option>
                  <option value="NAME_ASC">Tên A-Z</option>
                  <option value="PRICE_ASC">Giá tăng dần</option>
                  <option value="PRICE_DESC">Giá giảm dần</option>
                  <option value="STOCK_ASC">Tồn kho tăng dần</option>
                  <option value="STOCK_DESC">Tồn kho giảm dần</option>
                </select>
              </div>

              <p className="admin-result-count">
                Hiển thị {paginatedProducts.length} / {filteredProducts.length}{" "}
                sản phẩm
              </p>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Thương hiệu</th>
                    <th>Giá</th>
                    <th>Kho</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="admin-product-row"
                        onClick={() => handleOpenProductDetail(product.id)}
                      >
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>{product.brand}</td>
                        <td>{formatAdminPrice(product.price)}</td>
                        <td>{product.stock}</td>
                        <td>
                          <div
                            className="admin-actions"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() => handleEditProduct(product)}
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() => handleDelete(product.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ textAlign: "center", padding: "24px" }}
                      >
                        Không tìm thấy sản phẩm phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {renderPagination(productPage, productTotalPages, setProductPage)}
            </div>
          </>
        )}

        {activeMenu === "orders" && (
          <div className="product-table">
            <div className="admin-order-heading">
              <div>
                <h2>Quản lý đơn hàng</h2>

                <p>Xác nhận và cập nhật quá trình xử lý đơn hàng.</p>
              </div>

              <button
                type="button"
                className="complete-btn"
                onClick={handleRefreshOrders}
                disabled={orderRefreshing}
              >
                {orderRefreshing ? "Đang tải..." : "Làm mới"}
              </button>
            </div>

            <div className="admin-toolbar">
              <input
                type="text"
                placeholder="Tìm mã đơn, khách hàng, số điện thoại, email..."
                value={orderSearchKeyword}
                onChange={(event) => setOrderSearchKeyword(event.target.value)}
              />

              <select
                value={orderStatusFilter}
                onChange={(event) => setOrderStatusFilter(event.target.value)}
              >
                <option value="ALL">Tất cả trạng thái đơn</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(event) => setPaymentStatusFilter(event.target.value)}
              >
                <option value="ALL">Tất cả thanh toán</option>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <p className="admin-result-count">
              Hiển thị {paginatedOrders.length} / {filteredOrders.length} đơn
              hàng
            </p>

            <table>
              <thead>
                <tr>
                  <th>Mã đơn</th>

                  <th>Khách hàng</th>

                  <th>Tổng tiền</th>

                  <th>Phương thức</th>

                  <th>Thanh toán</th>

                  <th>Trạng thái đơn</th>

                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="admin-order-row"
                      onClick={() => handleOpenOrderDetail(order)}
                    >
                      <td>{order.orderCode || `#${order.id}`}</td>

                      <td>
                        <strong>{order.customerName || "Chưa cập nhật"}</strong>

                        <br />

                        <small>{order.phone || "Chưa có số điện thoại"}</small>
                      </td>

                      <td>
                        {Number(order.totalAmount || 0).toLocaleString("vi-VN")}
                        đ
                      </td>

                      <td>{order.paymentMethod || "Chưa cập nhật"}</td>

                      <td>{order.paymentStatus || "Chưa cập nhật"}</td>

                      <td>{order.orderStatus || "Chưa cập nhật"}</td>

                      <td onClick={(event) => event.stopPropagation()}>
                        <select
                          value={order.orderStatus || ""}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            handleUpdateStatus(order.id, event.target.value)
                          }
                        >
                          <option value="WAITING_PAYMENT">
                            Chờ thanh toán
                          </option>

                          <option value="PENDING_CONFIRMATION">
                            Chờ xác nhận
                          </option>

                          <option value="CONFIRMED">Đã xác nhận</option>

                          <option value="PREPARING">Đang chuẩn bị</option>

                          <option value="SHIPPING">Đang giao hàng</option>

                          <option value="COMPLETED">Hoàn thành</option>

                          <option value="CANCELLED">Đã hủy</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: "24px",
                      }}
                    >
                      Chưa có đơn hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {renderPagination(orderPage, orderTotalPages, setOrderPage)}

            {selectedAdminOrder && (
              <div
                className="admin-order-modal-backdrop"
                onClick={handleCloseOrderDetail}
              >
                <section
                  className="admin-order-modal"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="admin-order-modal-header">
                    <div>
                      <span>Chi tiết đơn hàng</span>

                      <h2>
                        {selectedAdminOrder.orderCode ||
                          `#${selectedAdminOrder.id}`}
                      </h2>

                      <p>
                        Ngày tạo:{" "}
                        {formatOrderDate(
                          selectedAdminOrder.createdAt ||
                            selectedAdminOrder.orderDate ||
                            selectedAdminOrder.createdDate,
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="admin-order-modal-close"
                      onClick={handleCloseOrderDetail}
                    >
                      ×
                    </button>
                  </div>

                  {orderDetailLoading ? (
                    <div className="admin-order-loading">
                      Đang tải chi tiết đơn hàng...
                    </div>
                  ) : (
                    <>
                      <div className="admin-order-detail-grid">
                        <div className="admin-order-detail-card">
                          <h3>Thông tin khách hàng</h3>

                          <p>
                            <span>Họ tên</span>
                            <strong>
                              {selectedAdminOrder.customerName ||
                                "Chưa cập nhật"}
                            </strong>
                          </p>

                          <p>
                            <span>Số điện thoại</span>
                            <strong>
                              {selectedAdminOrder.phone || "Chưa cập nhật"}
                            </strong>
                          </p>

                          <p>
                            <span>Email</span>
                            <strong>
                              {selectedAdminOrder.email || "Chưa cập nhật"}
                            </strong>
                          </p>

                          <p>
                            <span>Địa chỉ</span>
                            <strong>
                              {selectedAdminOrder.shippingAddress ||
                                selectedAdminOrder.address ||
                                "Chưa cập nhật"}
                            </strong>
                          </p>
                        </div>

                        <div className="admin-order-detail-card">
                          <h3>Thanh toán & trạng thái</h3>

                          <p>
                            <span>Phương thức</span>
                            <strong>
                              {PAYMENT_METHOD_LABELS[
                                selectedAdminOrder.paymentMethod
                              ] ||
                                selectedAdminOrder.paymentMethod ||
                                "Chưa cập nhật"}
                            </strong>
                          </p>

                          <p>
                            <span>Thanh toán</span>
                            <strong>
                              {PAYMENT_STATUS_LABELS[
                                selectedAdminOrder.paymentStatus
                              ] ||
                                selectedAdminOrder.paymentStatus ||
                                "Chưa cập nhật"}
                            </strong>
                          </p>

                          <p>
                            <span>Trạng thái đơn</span>
                            <strong>
                              {ORDER_STATUS_LABELS[
                                selectedAdminOrder.orderStatus
                              ] ||
                                selectedAdminOrder.orderStatus ||
                                "Chưa cập nhật"}
                            </strong>
                          </p>

                          <p>
                            <span>Ghi chú</span>
                            <strong>
                              {selectedAdminOrder.note || "Không có"}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="admin-order-items-box">
                        <h3>Sản phẩm trong đơn</h3>

                        {Array.isArray(selectedAdminOrder.items) &&
                        selectedAdminOrder.items.length > 0 ? (
                          selectedAdminOrder.items.map((item, index) => {
                            const options = getOrderItemOptions(
                              item.selectedOptions,
                            );

                            return (
                              <div
                                className="admin-order-item-row"
                                key={item.id || index}
                              >
                                <img
                                  src={
                                    item.productImage ||
                                    item.image ||
                                    "/images/no-image.png"
                                  }
                                  alt={item.productName || "Sản phẩm"}
                                />

                                <div className="admin-order-item-info">
                                  <strong>
                                    {item.productName || "Sản phẩm"}
                                  </strong>

                                  {options.length > 0 && (
                                    <div className="admin-order-item-options">
                                      {options.map((option) => (
                                        <span key={option.groupName}>
                                          {option.groupName}:{" "}
                                          {option.optionName}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <small>Số lượng: {item.quantity || 1}</small>
                                </div>

                                <div className="admin-order-item-price">
                                  <span>Đơn giá</span>
                                  <strong>
                                    {formatOrderPrice(item.unitPrice)}
                                  </strong>
                                </div>

                                <div className="admin-order-item-price">
                                  <span>Thành tiền</span>
                                  <strong>
                                    {formatOrderPrice(
                                      item.lineTotal || item.totalPrice,
                                    )}
                                  </strong>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="admin-order-empty-items">
                            Đơn hàng chưa có thông tin sản phẩm.
                          </p>
                        )}
                      </div>

                      <div className="admin-order-total-box">
                        <div>
                          <span>Tạm tính</span>
                          <strong>
                            {formatOrderPrice(selectedAdminOrder.subtotal)}
                          </strong>
                        </div>

                        <div>
                          <span>Phí vận chuyển</span>
                          <strong>
                            {formatOrderPrice(selectedAdminOrder.shippingFee)}
                          </strong>
                        </div>

                        <div>
                          <span>Giảm giá</span>
                          <strong>
                            -
                            {formatOrderPrice(
                              selectedAdminOrder.discountAmount,
                            )}
                          </strong>
                        </div>

                        <div className="final">
                          <span>Tổng thanh toán</span>
                          <strong>
                            {formatOrderPrice(
                              selectedAdminOrder.totalAmount ||
                                selectedAdminOrder.totalPrice,
                            )}
                          </strong>
                        </div>
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}
          </div>
        )}

        {activeMenu === "categories" && (
          <div className="category-admin-section category-admin-upgrade">
            <div className="category-admin-head">
              <div>
                <h2>Quản lý danh mục & thương hiệu</h2>
                <p>
                  Quản lý nhóm sản phẩm, thương hiệu, số lượng sản phẩm và trạng
                  thái dữ liệu trong hệ thống.
                </p>
              </div>
            </div>

            <div className="category-stats-grid">
              <div className="category-stat-card">
                <span>🗂</span>
                <div>
                  <strong>{categories.length}</strong>
                  <p>Tổng danh mục</p>
                </div>
              </div>

              <div className="category-stat-card">
                <span>🏷️</span>
                <div>
                  <strong>{brands.length}</strong>
                  <p>Tổng thương hiệu</p>
                </div>
              </div>

              <div className="category-stat-card warning">
                <span>⚠️</span>
                <div>
                  <strong>{categoriesWithoutBrands.length}</strong>
                  <p>Danh mục chưa có thương hiệu</p>
                </div>
              </div>

              <div className="category-stat-card success">
                <span>⭐</span>
                <div>
                  <strong>
                    {mostBrandCategory
                      ? `${mostBrandCategory.name} - ${getCategoryBrandCount(
                          mostBrandCategory.name,
                        )}`
                      : "Chưa có"}
                  </strong>
                  <p>Danh mục nhiều thương hiệu nhất</p>
                </div>
              </div>
            </div>

            <div className="promotion-tabs category-tabs">
              <button
                type="button"
                className={categoryManageTab === "categories" ? "active" : ""}
                onClick={() => setCategoryManageTab("categories")}
              >
                Danh mục sản phẩm
              </button>

              <button
                type="button"
                className={categoryManageTab === "brands" ? "active" : ""}
                onClick={() => setCategoryManageTab("brands")}
              >
                Thương hiệu
              </button>
            </div>

            {categoryManageTab === "categories" && (
              <div className="category-box category-upgrade-card">
                <div className="category-form-heading">
                  <div className="category-icon-large">
                    {categoryIcon || "📦"}
                  </div>

                  <div>
                    <h3>
                      {editingCategoryId
                        ? "Cập nhật danh mục"
                        : "Thêm danh mục mới"}
                    </h3>
                    <p>Chọn icon và nhập tên danh mục sản phẩm.</p>
                  </div>
                </div>

                <form
                  className="category-form category-form-upgrade"
                  onSubmit={handleSaveCategory}
                >
                  <select
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                  >
                    {categoryIcons.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Nhập tên danh mục, ví dụ: Laptop"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />

                  <button type="submit">
                    {editingCategoryId ? "Cập nhật danh mục" : "Thêm danh mục"}
                  </button>

                  {editingCategoryId && (
                    <button
                      type="button"
                      className="cancel-category-btn"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setCategoryName("");
                        setCategoryIcon("💻");
                      }}
                    >
                      Hủy
                    </button>
                  )}
                </form>

                <div className="admin-list-toolbar category-toolbar">
                  <input
                    type="text"
                    placeholder="Tìm theo ID, tên danh mục, icon..."
                    value={categorySearchKeyword}
                    onChange={(event) =>
                      setCategorySearchKeyword(event.target.value)
                    }
                  />

                  <select
                    value={categoryStatusFilter}
                    onChange={(event) =>
                      setCategoryStatusFilter(event.target.value)
                    }
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="HAS_BRAND">Có thương hiệu</option>
                    <option value="NO_BRAND">Chưa có thương hiệu</option>
                    <option value="HAS_PRODUCT">Có sản phẩm</option>
                    <option value="NO_PRODUCT">Chưa có sản phẩm</option>
                  </select>

                  <select
                    value={categorySortMode}
                    onChange={(event) =>
                      setCategorySortMode(event.target.value)
                    }
                  >
                    <option value="ID_DESC">Mới nhất trước</option>
                    <option value="ID_ASC">Cũ nhất trước</option>
                    <option value="NAME_ASC">Tên A-Z</option>
                    <option value="NAME_DESC">Tên Z-A</option>
                    <option value="BRAND_DESC">Nhiều thương hiệu nhất</option>
                    <option value="PRODUCT_DESC">Nhiều sản phẩm nhất</option>
                  </select>
                </div>

                <div className="admin-list-count">
                  Hiển thị {paginatedCategories.length} /{" "}
                  {filteredCategories.length} danh mục
                </div>

                <table className="category-table admin-table category-modern-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Icon</th>
                      <th>Tên danh mục</th>
                      <th>Thương hiệu</th>
                      <th>Sản phẩm</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedCategories.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="admin-empty-cell">
                          Không có danh mục phù hợp
                        </td>
                      </tr>
                    ) : (
                      paginatedCategories.map((category) => {
                        const brandCount = getCategoryBrandCount(category.name);
                        const productCount = getCategoryProductCount(
                          category.name,
                        );

                        return (
                          <tr key={category.id}>
                            <td>{category.id}</td>

                            <td>
                              <span className="category-icon-preview">
                                {category.icon || "💻"}
                              </span>
                            </td>

                            <td>
                              <strong className="category-main-name">
                                {category.name}
                              </strong>
                            </td>

                            <td>
                              <span className="category-mini-badge blue">
                                {brandCount} thương hiệu
                              </span>
                            </td>

                            <td>
                              <span className="category-mini-badge green">
                                {productCount} sản phẩm
                              </span>
                            </td>

                            <td>
                              {brandCount === 0 ? (
                                <span className="category-status-badge warning">
                                  Chưa có thương hiệu
                                </span>
                              ) : productCount === 0 ? (
                                <span className="category-status-badge danger">
                                  Chưa có sản phẩm
                                </span>
                              ) : (
                                <span className="category-status-badge active">
                                  Đang hoạt động
                                </span>
                              )}
                            </td>

                            <td>
                              <button
                                className="edit-btn"
                                onClick={() => handleEditCategory(category)}
                              >
                                Sửa
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  handleDeleteCategory(category.id)
                                }
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {renderPagination(
                  categoryPage,
                  categoryTotalPages,
                  setCategoryPage,
                )}
              </div>
            )}

            {categoryManageTab === "brands" && (
              <div className="category-box category-upgrade-card">
                <div className="category-form-heading">
                  <div className="category-icon-large">🏷️</div>

                  <div>
                    <h3>
                      {editingBrandId
                        ? "Cập nhật thương hiệu"
                        : "Thêm thương hiệu"}
                    </h3>
                    <p>
                      Gắn thương hiệu vào đúng danh mục để lọc sản phẩm chính
                      xác.
                    </p>
                  </div>
                </div>

                <form
                  className="category-form category-form-upgrade"
                  onSubmit={handleSaveBrand}
                >
                  <select
                    value={brandCategory}
                    onChange={(e) => setBrandCategory(e.target.value)}
                  >
                    <option value="">Chọn danh mục</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.icon || "📦"} {category.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Nhập thương hiệu, ví dụ: ASUS"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />

                  <button type="submit">
                    {editingBrandId
                      ? "Cập nhật thương hiệu"
                      : "Thêm thương hiệu"}
                  </button>

                  {editingBrandId && (
                    <button
                      type="button"
                      className="cancel-category-btn"
                      onClick={() => {
                        setEditingBrandId(null);
                        setBrandName("");
                        setBrandCategory("");
                      }}
                    >
                      Hủy
                    </button>
                  )}
                </form>

                {brandCategory && (
                  <div className="brand-category-hint">
                    Danh mục <strong>{brandCategory}</strong> hiện có{" "}
                    <strong>{getCategoryBrandCount(brandCategory)}</strong>{" "}
                    thương hiệu.
                  </div>
                )}

                <div className="admin-list-toolbar category-toolbar">
                  <input
                    type="text"
                    placeholder="Tìm theo ID, tên thương hiệu, danh mục..."
                    value={brandSearchKeyword}
                    onChange={(event) =>
                      setBrandSearchKeyword(event.target.value)
                    }
                  />

                  <select
                    value={brandCategoryFilter}
                    onChange={(event) =>
                      setBrandCategoryFilter(event.target.value)
                    }
                  >
                    <option value="ALL">Tất cả danh mục</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.icon || "📦"} {category.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={brandStatusFilter}
                    onChange={(event) =>
                      setBrandStatusFilter(event.target.value)
                    }
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="HAS_PRODUCT">Có sản phẩm</option>
                    <option value="NO_PRODUCT">Chưa có sản phẩm</option>
                  </select>

                  <select
                    value={brandSortMode}
                    onChange={(event) => setBrandSortMode(event.target.value)}
                  >
                    <option value="ID_DESC">Mới nhất trước</option>
                    <option value="ID_ASC">Cũ nhất trước</option>
                    <option value="NAME_ASC">Tên A-Z</option>
                    <option value="NAME_DESC">Tên Z-A</option>
                    <option value="PRODUCT_DESC">Nhiều sản phẩm nhất</option>
                  </select>
                </div>

                <div className="admin-list-count">
                  Hiển thị {paginatedBrands.length} / {filteredBrands.length}{" "}
                  thương hiệu
                </div>

                <table className="category-table admin-table category-modern-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Danh mục</th>
                      <th>Tên thương hiệu</th>
                      <th>Sản phẩm</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedBrands.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="admin-empty-cell">
                          Không có thương hiệu phù hợp
                        </td>
                      </tr>
                    ) : (
                      paginatedBrands.map((brand) => {
                        const productCount = getBrandProductCount(
                          brand.name,
                          brand.category,
                        );

                        return (
                          <tr key={brand.id}>
                            <td>{brand.id}</td>

                            <td>
                              <span className="category-mini-badge blue">
                                {brand.category}
                              </span>
                            </td>

                            <td>
                              <strong className="category-main-name">
                                {brand.name}
                              </strong>
                            </td>

                            <td>
                              <span className="category-mini-badge green">
                                {productCount} sản phẩm
                              </span>
                            </td>

                            <td>
                              {productCount > 0 ? (
                                <span className="category-status-badge active">
                                  Có sản phẩm
                                </span>
                              ) : (
                                <span className="category-status-badge warning">
                                  Chưa có sản phẩm
                                </span>
                              )}
                            </td>

                            <td>
                              <button
                                className="edit-btn"
                                onClick={() => handleEditBrand(brand)}
                              >
                                Sửa
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteBrand(brand.id)}
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {renderPagination(brandPage, brandTotalPages, setBrandPage)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
