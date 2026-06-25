import "./AdminDashboard.css";
import AdminOverview from "../components/admin/AdminOverview";
import {
  getBanners,
  createBanner,
  updateBanner,
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

import { useEffect, useState } from "react";

import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../services/brandApi";

import { useNavigate } from "react-router-dom";

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

import { getOrders, updateOrderStatus } from "../services/orderApi";

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

export default function AdminDashboard() {
  const navigate = useNavigate();

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
  });

  const [homeSections, setHomeSections] = useState([]);

  const [selectedBannerSectionId, setSelectedBannerSectionId] = useState("");

  const [sectionBanners, setSectionBanners] = useState([]);

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

  const [activeMenu, setActiveMenu] = useState("overview");

  const [brands, setBrands] = useState([]);

  const [brandName, setBrandName] = useState("");
  const [brandCategory, setBrandCategory] = useState("");

  const [editingBrandId, setEditingBrandId] = useState(null);

  const [categoryName, setCategoryName] = useState("");

  const [categoryIcon, setCategoryIcon] = useState("💻");

  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);

  const [orders, setOrders] = useState([]);

  const [users, setUsers] = useState([]);

  const [userSearchKeyword, setUserSearchKeyword] = useState("");

  const [promotionSubTab, setPromotionSubTab] = useState("product-discount");

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
      alert("Vui lòng nhập tên danh mục");

      return;
    }

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, {
          name: categoryName.trim(),
          icon: categoryIcon,
        });

        alert("Cập nhật danh mục thành công");
      } else {
        await createCategory({
          name: categoryName.trim(),
          icon: categoryIcon,
        });

        alert("Thêm danh mục thành công");
      }

      setCategoryName("");

      setEditingCategoryId(null);

      fetchCategories();
    } catch (error) {
      console.log(error);

      alert("Lỗi khi lưu danh mục");
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
      alert("Vui lòng chọn danh mục cho thương hiệu");

      return;
    }

    if (!brandName.trim()) {
      alert("Vui lòng nhập tên thương hiệu");

      return;
    }

    try {
      if (editingBrandId) {
        await updateBrand(editingBrandId, {
          name: brandName,
          category: brandCategory,
        });

        alert("Cập nhật thương hiệu thành công");
      } else {
        await createBrand({
          name: brandName,
          category: brandCategory,
        });

        alert("Thêm thương hiệu thành công");
      }

      setBrandName("");

      setBrandCategory("");

      setEditingBrandId(null);

      fetchBrands();
    } catch (error) {
      console.log(error);

      alert("Lỗi khi lưu thương hiệu");
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

      alert("Xóa thương hiệu thành công");
    } catch (error) {
      console.log(error);

      alert("Không thể xóa thương hiệu này");
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa danh mục này?");

    if (!confirmDelete) return;

    try {
      await deleteCategory(id);

      fetchCategories();

      alert("Xóa danh mục thành công");
    } catch (error) {
      console.log(error);

      alert("Không thể xóa danh mục này");
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

      alert(error.response?.data || "Không thể upload ảnh");
    }
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

      alert(error.response?.data || "Không thể upload ảnh");
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await getOrders();

      setOrders(data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);

      alert("Không thể tải danh sách người dùng");
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

      alert(nextLocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
    } catch (error) {
      console.log(error);

      alert(
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

      alert("Xóa người dùng thành công");
    } catch (error) {
      console.log(error);

      alert(
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
      alert("Vui lòng nhập tên sản phẩm");
      return false;
    }

    if (!product.category) {
      alert("Vui lòng chọn danh mục");
      return false;
    }

    if (!product.brand.trim()) {
      alert("Vui lòng nhập thương hiệu");
      return false;
    }

    if (!product.stock) {
      alert("Vui lòng nhập số lượng");
      return false;
    }

    if (Number(product.stock) < 0) {
      alert("Số lượng không được nhỏ hơn 0");
      return false;
    }

    if (!product.price) {
      alert("Vui lòng nhập giá sản phẩm");
      return false;
    }

    if (Number(product.price) <= 0) {
      alert("Giá sản phẩm phải lớn hơn 0");
      return false;
    }

    if (!editingId && !product.image) {
      alert("Vui lòng chọn ảnh chính sản phẩm");
      return false;
    }

    if (!product.description.trim()) {
      alert("Vui lòng nhập mô tả sản phẩm");
      return false;
    }

    const hasValidSpec = specifications.some(
      (spec) => spec.key.trim() && spec.value.trim(),
    );

    if (!hasValidSpec) {
      alert("Vui lòng nhập ít nhất 1 thông số kỹ thuật");
      return false;
    }

    const hasValidHighlight = highlights.some(
      (item) => item.title.trim() || item.description.trim(),
    );

    if (!hasValidHighlight) {
      alert("Vui lòng nhập ít nhất 1 điểm nổi bật");
      return false;
    }

    const hasValidPromotion = promotions.some(
      (item) => item.title.trim() || item.description.trim(),
    );

    if (!hasValidPromotion) {
      alert("Vui lòng nhập ít nhất 1 ưu đãi mua hàng");
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
      alert("Thêm sản phẩm thành công");
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
      alert("Cập nhật sản phẩm thành công");
    } catch (error) {
      console.log(error);
    }
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
  };

  const handleSavePromotion = async (e) => {
    e.preventDefault();

    if (!promotionForm.title.trim()) {
      alert("Vui lòng nhập tên khuyến mãi");
      return;
    }

    if (!promotionForm.productId) {
      alert("Vui lòng chọn sản phẩm");
      return;
    }

    if (!promotionForm.discountPercent) {
      alert("Vui lòng nhập phần trăm giảm");
      return;
    }

    const payload = {
      ...promotionForm,

      productId: Number(promotionForm.productId),

      discountPercent: Number(promotionForm.discountPercent),
    };

    try {
      if (editingPromotionId) {
        await updatePromotion(editingPromotionId, payload);

        alert("Cập nhật khuyến mãi thành công");
      } else {
        await createPromotion(payload);

        alert("Thêm khuyến mãi thành công");
      }

      await fetchPromotions();

      resetPromotionForm();
    } catch (error) {
      console.log(error);

      alert("Lưu khuyến mãi thất bại");
    }
  };

  const handleEditPromotion = (promotion) => {
    setEditingPromotionId(promotion.id);

    setPromotionForm({
      title: promotion.title || "",

      productId: promotion.productId || "",

      discountPercent: promotion.discountPercent || "",

      startDate: promotion.startDate || "",

      endDate: promotion.endDate || "",

      active: promotion.active ?? true,
    });

    setPromotionSubTab("product-discount");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeletePromotion = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa khuyến mãi này?")) {
      return;
    }

    try {
      await deletePromotion(id);

      await fetchPromotions();

      alert("Xóa khuyến mãi thành công");
    } catch (error) {
      console.log(error);

      alert("Xóa khuyến mãi thất bại");
    }
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

    if (!couponForm.code.trim()) {
      alert("Vui lòng nhập mã coupon");
      return;
    }

    if (!couponForm.name.trim()) {
      alert("Vui lòng nhập tên mã giảm giá");
      return;
    }

    if (!couponForm.discountValue) {
      alert("Vui lòng nhập giá trị giảm");
      return;
    }

    const oldCoupon = coupons.find(
      (item) => Number(item.id) === Number(editingCouponId),
    );

    const payload = {
      ...couponForm,

      code: couponForm.code.trim().toUpperCase(),

      discountValue: Number(couponForm.discountValue) || 0,

      minOrderValue: Number(couponForm.minOrderValue) || 0,

      maxDiscount: Number(couponForm.maxDiscount) || 0,

      usageLimit: Number(couponForm.usageLimit) || 0,

      usedCount: oldCoupon?.usedCount || 0,
    };

    try {
      if (editingCouponId) {
        await updateCoupon(editingCouponId, payload);

        alert("Cập nhật mã giảm giá thành công");
      } else {
        await createCoupon(payload);

        alert("Thêm mã giảm giá thành công");
      }

      await fetchCoupons();

      resetCouponForm();
    } catch (error) {
      console.log(error);

      alert("Lưu mã giảm giá thất bại");
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
    if (!window.confirm("Bạn có chắc muốn xóa mã giảm giá này?")) {
      return;
    }

    try {
      await deleteCoupon(id);

      await fetchCoupons();

      alert("Xóa mã giảm giá thành công");
    } catch (error) {
      console.log(error);

      alert("Xóa mã giảm giá thất bại");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa?");

    if (!confirmDelete) return;

    try {
      await deleteProduct(id);

      fetchProducts();
    } catch (error) {
      console.log(error);
    }
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

      alert("Cập nhật trạng thái đơn hàng thành công");
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);

      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Không thể cập nhật trạng thái đơn";

      alert(message);
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

  const resetBannerForm = () => {
    setEditingBannerId(null);

    setBannerForm({
      title: "",
      subtitle: "",
      imageUrl: "",
      linkUrl: "",
      position: "HOME_TOP",
      active: true,
      sortOrder: 1,
    });
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();

    if (!bannerForm.title.trim()) {
      alert("Vui lòng nhập tiêu đề banner");
      return;
    }

    if (!bannerForm.imageUrl) {
      alert("Vui lòng upload ảnh banner");
      return;
    }

    const payload = {
      ...bannerForm,
      sortOrder: Number(bannerForm.sortOrder) || 1,
    };

    try {
      if (editingBannerId) {
        await updateBanner(editingBannerId, payload);

        alert("Cập nhật banner thành công");
      } else {
        await createBanner(payload);

        alert("Thêm banner thành công");
      }

      resetBannerForm();

      fetchBanners();
    } catch (error) {
      console.log(error);

      alert("Lỗi khi lưu banner");
    }
  };

  const handleEditBanner = (banner) => {
    setEditingBannerId(banner.id);

    setBannerForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      linkUrl: banner.linkUrl || "",
      position: banner.position || "HOME_TOP",
      active: banner.active === undefined ? true : banner.active,
      sortOrder: banner.sortOrder || 1,
    });
  };

  const handleDeleteBanner = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa banner này?");

    if (!confirmDelete) return;

    try {
      await deleteBanner(id);

      fetchBanners();
    } catch (error) {
      console.log(error);

      alert("Lỗi khi xóa banner");
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
      alert("Vui lòng nhập tên khối");
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

    if (payload.sectionType === "DEAL_CARD") {
      payload = {
        ...payload,

        category: "",
        brand: "",
        bannerImage: "",
        bannerLink: "",
        leftBannerImage: "",
        leftBannerLink: "",
        productRows: 1,
        limitProduct: 1,

        groupCode: "",
        tabTitle: "",
        tabOrder: 1,
      };
    }

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

        alert("Cập nhật khối trang chủ thành công");
      } else {
        await createHomeSection(payload);

        alert("Thêm khối trang chủ thành công");
      }

      resetSectionForm();

      fetchHomeSections();
    } catch (error) {
      console.log(error);

      alert("Lỗi khi lưu khối trang chủ");
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

      alert("Lỗi khi xóa khối trang chủ");
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
      alert("Không thể tải danh sách banner của khối");
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

  const handleSaveSectionBanner = async (e) => {
    e.preventDefault();

    if (!selectedBannerSectionId) {
      alert("Vui lòng chọn khối cần quản lý banner");
      return;
    }

    if (!sectionBannerForm.imageUrl) {
      alert("Vui lòng chọn ảnh banner");
      return;
    }

    if (!sectionBannerForm.title.trim()) {
      alert("Vui lòng nhập tiêu đề banner");
      return;
    }

    if (
      sectionBannerForm.targetType === "PRODUCT" &&
      !sectionBannerForm.targetProductId
    ) {
      alert("Vui lòng chọn sản phẩm đích");
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

      alert(
        editingSectionBannerId
          ? "Cập nhật banner thành công"
          : "Thêm banner thành công",
      );

      resetSectionBannerForm();

      await fetchSectionBanners(selectedBannerSectionId);
    } catch (error) {
      console.log(error);
      alert("Lỗi khi lưu banner của khối");
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

      alert("Xóa banner thành công");
    } catch (error) {
      console.log(error);
      alert("Lỗi khi xóa banner");
    }
  };

  const selectedBannerSection = homeSections.find(
    (section) => Number(section.id) === Number(selectedBannerSectionId),
  );

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

    if (!flashSaleForm.title.trim()) {
      alert("Vui lòng nhập tên chiến dịch");
      return;
    }

    if (!flashSaleForm.startTime) {
      alert("Vui lòng chọn thời gian bắt đầu");
      return;
    }

    if (!flashSaleForm.endTime) {
      alert("Vui lòng chọn thời gian kết thúc");
      return;
    }

    const payload = {
      ...flashSaleForm,
      sortOrder: Number(flashSaleForm.sortOrder) || 1,
    };

    try {
      if (editingFlashSaleId) {
        await updateFlashSale(editingFlashSaleId, payload);

        alert("Cập nhật chiến dịch thành công");
      } else {
        await createFlashSale(payload);

        alert("Tạo chiến dịch thành công");
      }

      await fetchFlashSales();

      resetFlashSaleForm();
    } catch (error) {
      console.log(error);

      alert("Lưu chiến dịch thất bại");
    }
  };

  const handleEditFlashSale = (flashSale) => {
    setEditingFlashSaleId(flashSale.id);

    setFlashSaleForm({
      title: flashSale.title || "",

      subtitle: flashSale.subtitle || "",

      bannerImage: flashSale.bannerImage || "/images/golden-hour-header.png",

      startTime: flashSale.startTime || "",

      endTime: flashSale.endTime || "",

      active: flashSale.active ?? true,

      sortOrder: flashSale.sortOrder || 1,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteFlashSale = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa chiến dịch này?")) {
      return;
    }

    try {
      await deleteFlashSale(id);

      if (Number(selectedFlashSaleId) === Number(id)) {
        setSelectedFlashSaleId("");
        setFlashSaleItems([]);
      }

      await fetchFlashSales();

      alert("Xóa chiến dịch thành công");
    } catch (error) {
      console.log(error);

      alert("Xóa chiến dịch thất bại");
    }
  };

  const handleSelectFlashSale = async (id) => {
    setSelectedFlashSaleId(id);

    await fetchFlashSaleItems(id);
  };

  const handleFlashSaleItemChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFlashSaleItemForm({
      ...flashSaleItemForm,
      [name]: type === "checkbox" ? checked : value,
    });
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
  };

  const handleProductForFlashSaleChange = (e) => {
    const productId = e.target.value;

    const product = products.find(
      (item) => Number(item.id) === Number(productId),
    );

    let discountPercent = "";

    let salePrice = "";

    if (product?.price) {
      salePrice = Math.round(Number(product.price) * 0.9);

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

    if (!selectedFlashSaleId) {
      alert("Vui lòng chọn chiến dịch flash sale trước");
      return;
    }

    if (!flashSaleItemForm.productId) {
      alert("Vui lòng chọn sản phẩm");
      return;
    }

    if (!flashSaleItemForm.salePrice) {
      alert("Vui lòng nhập giá sale");
      return;
    }

    const payload = {
      ...flashSaleItemForm,

      productId: Number(flashSaleItemForm.productId),

      salePrice: Number(flashSaleItemForm.salePrice),

      discountPercent: Number(flashSaleItemForm.discountPercent) || 0,

      saleQuantity: Number(flashSaleItemForm.saleQuantity) || 0,

      soldQuantity: Number(flashSaleItemForm.soldQuantity) || 0,

      limitPerUser: Number(flashSaleItemForm.limitPerUser) || 1,
    };

    try {
      if (editingFlashSaleItemId) {
        await updateFlashSaleItem(editingFlashSaleItemId, payload);

        alert("Cập nhật sản phẩm flash sale thành công");
      } else {
        await addFlashSaleItem(selectedFlashSaleId, payload);

        alert("Thêm sản phẩm vào flash sale thành công");
      }

      await fetchFlashSaleItems(selectedFlashSaleId);

      resetFlashSaleItemForm();
    } catch (error) {
      console.log(error);

      alert("Lưu sản phẩm flash sale thất bại");
    }
  };

  const handleEditFlashSaleItem = (item) => {
    setEditingFlashSaleItemId(item.id);

    setFlashSaleItemForm({
      productId: item.productId || "",

      salePrice: item.salePrice || "",

      discountPercent: item.discountPercent || "",

      saleQuantity: item.saleQuantity || 100,

      soldQuantity: item.soldQuantity || 0,

      limitPerUser: item.limitPerUser || 1,

      active: item.active ?? true,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteFlashSaleItem = async (itemId) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi flash sale?")) {
      return;
    }

    try {
      await deleteFlashSaleItem(itemId);

      await fetchFlashSaleItems(selectedFlashSaleId);

      alert("Xóa sản phẩm flash sale thành công");
    } catch (error) {
      console.log(error);

      alert("Xóa sản phẩm flash sale thất bại");
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

  const managedUsers = users.filter(
    (user) => String(user.role || "").toLowerCase() !== "admin",
  );

  const filteredUsers = managedUsers.filter((user) => {
    const keyword = userSearchKeyword.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      String(user.fullName || "")
        .toLowerCase()
        .includes(keyword) ||
      String(user.email || "")
        .toLowerCase()
        .includes(keyword) ||
      String(user.phone || "")
        .toLowerCase()
        .includes(keyword) ||
      String(user.role || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}

      <div className="sidebar">
        {/* LOGO */}

        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>

          <span>ElectroShop</span>
        </div>

        {/* MENU */}

        <div className="sidebar-menu">
          <div
            className={
              activeMenu === "overview" ? "sidebar-item active" : "sidebar-item"
            }
            onClick={() => setActiveMenu("overview")}
          >
            <span>📊</span>

            <span>Tổng quan</span>
          </div>

          <div
            className={
              activeMenu === "products" ? "sidebar-item active" : "sidebar-item"
            }
            onClick={() => setActiveMenu("products")}
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
            onClick={() => setActiveMenu("promotions")}
          >
            <span>🔥</span>

            <span>Khuyến mãi</span>
          </div>

          <div
            className={
              activeMenu === "homepage" ? "sidebar-item active" : "sidebar-item"
            }
            onClick={() => setActiveMenu("homepage")}
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
            onClick={() => setActiveMenu("categories")}
          >
            <span>🗂</span>

            <span>Danh mục</span>
          </div>

          <div
            className={
              activeMenu === "orders" ? "sidebar-item active" : "sidebar-item"
            }
            onClick={() => {
              setActiveMenu("orders");
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
              setActiveMenu("users");
              fetchUsers();
            }}
          >
            <span>👥</span>

            <span>Người dùng</span>
          </button>

          <div className="sidebar-item">
            <span>⚙️</span>

            <span>Cài đặt</span>
          </div>
        </div>
      </div>

      {/* MAIN */}

      <div className="main-content">
        {/* HEADER */}

        <div className="dashboard-header">
          <h1>Trang quản trị</h1>

          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>

        {activeMenu === "overview" && (
          <AdminOverview
            products={products}
            orders={orders}
            users={users}
            promotions={discountPromotions}
            coupons={coupons}
            flashSales={flashSales}
            onOpenMenu={setActiveMenu}
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
                  placeholder="Tìm theo tên, email, số điện thoại..."
                  onChange={(event) => setUserSearchKeyword(event.target.value)}
                />
              </div>

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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="admin-empty-cell">
                          Không có người dùng nào
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
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

                    <select
                      name="productId"
                      value={promotionForm.productId}
                      onChange={handlePromotionChange}
                    >
                      <option value="">Chọn sản phẩm áp dụng</option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>

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
                      {discountPromotions.map((promotion) => {
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
                      {coupons.map((coupon) => (
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
                      {flashSales.map((flashSale) => (
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
                    <select
                      name="productId"
                      value={flashSaleItemForm.productId}
                      onChange={handleProductForFlashSaleChange}
                    >
                      <option value="">Chọn sản phẩm</option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {formatAdminPrice(product.price)}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      name="salePrice"
                      placeholder="Giá sale: 18990000"
                      value={flashSaleItemForm.salePrice}
                      onChange={handleFlashSaleItemChange}
                    />

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
                      {flashSaleItems.map((item) => (
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

                  <input
                    type="text"
                    name="linkUrl"
                    placeholder="Link khi bấm banner"
                    value={bannerForm.linkUrl}
                    onChange={handleBannerChange}
                  />

                  <select
                    name="position"
                    value={bannerForm.position}
                    onChange={handleBannerChange}
                  >
                    <option value="HOME_TOP">Banner ngang đầu trang</option>

                    <option value="HOME_MIDDLE">Banner giữa trang</option>

                    <option value="HOME_SIDE_LAPTOP">Banner dọc Laptop</option>

                    <option value="HOME_SIDE_PC">Banner dọc PC</option>

                    <option value="HOME_SIDE_GEAR">
                      Banner dọc Gaming Gear
                    </option>
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
                    <div className="section-form-group">
                      <p className="admin-form-hint">
                        Dùng để tạo 3 card nhỏ nằm ngay dưới banner chính.
                      </p>

                      <select
                        name="productId"
                        value={sectionForm.productId}
                        onChange={handleSectionChange}
                      >
                        <option value="">Chọn sản phẩm cho card deal</option>

                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        name="badgeText"
                        placeholder="Badge: HOT DEAL, GIẢM 20%, BÁN CHẠY..."
                        value={sectionForm.badgeText}
                        onChange={handleSectionChange}
                      />

                      <input
                        type="text"
                        name="shortDescription"
                        placeholder="Mô tả ngắn: Intel i7 • RTX 4070 • 32GB RAM..."
                        value={sectionForm.shortDescription}
                        onChange={handleSectionChange}
                      />
                    </div>
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
                  {banners.map((banner) => (
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
                      <div className="admin-card-sub">
                        <h4>Sản phẩm hiển thị khi click banner</h4>

                        <div className="product-check-list">
                          {products.map((product) => (
                            <label
                              key={product.id}
                              className="product-check-item"
                            >
                              <input
                                type="checkbox"
                                checked={sectionBannerProductIds.includes(
                                  Number(product.id),
                                )}
                                onChange={() =>
                                  handleToggleSectionBannerProduct(product.id)
                                }
                              />

                              <span>{product.name}</span>
                            </label>
                          ))}
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
                      {sectionBanners.map((banner) => (
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
                </div>
              )}

              <h3>Danh sách khối trang chủ</h3>

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
                  {homeSections.map((section) => (
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
            </div>
          </div>
        )}

        {activeMenu === "products" && (
          <>
            {/* PRODUCT FORM */}

            <div className="product-form">
              <h2>{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</h2>

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

                  <div>
                    <label className="form-label">Ảnh chính sản phẩm</label>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImageUpload}
                    />

                    {product.image && (
                      <img
                        src={product.image}
                        alt=""
                        style={{
                          width: "160px",
                          height: "160px",
                          objectFit: "cover",
                          borderRadius: "12px",
                          marginTop: "16px",
                          border: "2px solid #ddd",
                        }}
                      />
                    )}
                  </div>

                  {/* ẢNH PHỤ */}

                  <div>
                    <label className="form-label">Ảnh phụ sản phẩm</label>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      multiple
                      onChange={handleMultipleUpload}
                    />

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      {product.images?.map((img, index) => (
                        <img
                          key={index}
                          src={img.imageUrl}
                          alt=""
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "12px",
                            border: "2px solid #ddd",
                          }}
                        />
                      ))}
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
                  {Array.isArray(products) &&
                    products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>

                        <td>{product.name}</td>

                        <td>{product.category}</td>

                        <td>{product.brand}</td>

                        <td>{product.price}</td>

                        <td>{product.stock}</td>

                        <td>
                          <div className="admin-actions">
                            <button
                              className="edit-btn"
                              onClick={() => handleEditProduct(product)}
                            >
                              Sửa
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(product.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
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
                onClick={fetchOrders}
              >
                Làm mới
              </button>
            </div>

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
                {Array.isArray(orders) && orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id}>
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

                      <td>
                        <select
                          value={order.orderStatus || ""}
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
          </div>
        )}

        {activeMenu === "categories" && (
          <div className="category-admin-section">
            <h2>Quản lý danh mục & thương hiệu</h2>

            <div className="category-brand-layout">
              {/* DANH MỤC */}

              <div className="category-box">
                <h3>Danh mục sản phẩm</h3>

                <form className="category-form" onSubmit={handleSaveCategory}>
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
                    placeholder="Nhập tên danh mục..."
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />

                  <button type="submit">
                    {editingCategoryId ? "Cập nhật" : "Thêm"}
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

                <table className="category-table">
                  <thead>
                    <tr>
                      <th>ID</th>

                      <th>Icon</th>

                      <th>Tên danh mục</th>

                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.id}</td>

                        <td>
                          <span className="category-icon-preview">
                            {category.icon || "💻"}
                          </span>
                        </td>

                        <td>{category.name}</td>

                        <td>
                          <button
                            className="edit-btn"
                            onClick={() => handleEditCategory(category)}
                          >
                            Sửa
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* THƯƠNG HIỆU */}

              <div className="category-box">
                <h3>Thương hiệu</h3>

                <form className="category-form" onSubmit={handleSaveBrand}>
                  <select
                    value={brandCategory}
                    onChange={(e) => setBrandCategory(e.target.value)}
                  >
                    <option value="">Chọn danh mục</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Nhập thương hiệu..."
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />

                  <button type="submit">
                    {editingBrandId ? "Cập nhật" : "Thêm"}
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

                <table className="category-table">
                  <thead>
                    <tr>
                      <th>ID</th>

                      <th>Danh mục</th>

                      <th>Tên thương hiệu</th>

                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {brands.map((brand) => (
                      <tr key={brand.id}>
                        <td>{brand.id}</td>

                        <td>{brand.category}</td>

                        <td>{brand.name}</td>

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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
