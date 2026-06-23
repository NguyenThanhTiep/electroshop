import "./HomePage.css";

import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

import { useEffect, useRef, useMemo, useState } from "react";

import { useLocation } from "react-router-dom";

import { useNavigate, useSearchParams } from "react-router-dom";

import { getProducts } from "../services/productApi";

import { getCategories } from "../services/categoryApi";

import { getBrands } from "../services/brandApi";

import { getBannersByPosition } from "../services/bannerApi";

import { getActiveHomeSections } from "../services/homeSectionApi";

import { getActiveFlashSale } from "../services/flashSaleApi";

import { getActivePromotions } from "../services/promotionApi";

import { getActiveCoupons } from "../services/couponApi";

import { addToCart } from "../utils/cartUtils";

export default function HomePage() {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);

  const location = useLocation();

  const [products, setProducts] = useState([]);

  const [activeFlashSale, setActiveFlashSale] = useState(null);

  const [activePromotions, setActivePromotions] = useState([]);

  const [activeCoupons, setActiveCoupons] = useState([]);

  const couponSliderRef = useRef(null);

  const [categories, setCategories] = useState([]);

  const [brands, setBrands] = useState([]);

  const [homeFilterForm, setHomeFilterForm] = useState(() => {
    const savedFilter = localStorage.getItem("homeFilterForm");

    if (savedFilter) {
      return JSON.parse(savedFilter);
    }

    return {
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      sort: "",
    };
  });

  useEffect(() => {
    localStorage.setItem("homeFilterForm", JSON.stringify(homeFilterForm));
  }, [homeFilterForm]);

  const [searchParams, setSearchParams] = useSearchParams();

  const keywordFromUrl = searchParams.get("keyword") || "";

  const categoryFromUrl = searchParams.get("category") || "";

  const [filterForm, setFilterForm] = useState({
    keyword: keywordFromUrl,
    category: categoryFromUrl,
    brand: "",
    minPrice: "",
    maxPrice: "",
    sort: "",
  });

  const [topBanners, setTopBanners] = useState([]);

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const [homeSections, setHomeSections] = useState([]);

  const [activeTabByGroup, setActiveTabByGroup] = useState({});

  const [flashSaleTick, setFlashSaleTick] = useState(0);

  useEffect(() => {
    fetchProducts();

    fetchHomepageData();

    fetchCategories();

    fetchBrands();

    fetchActivePromotions();

    fetchActiveFlashSale();

    fetchActiveCoupons();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const section = params.get("section");

    if (!section) {
      return;
    }

    setTimeout(() => {
      const element = document.getElementById(section);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 300);
  }, [location.search]);

  useEffect(() => {
    if (topBanners.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setActiveBannerIndex((prevIndex) =>
        prevIndex === topBanners.length - 1 ? 0 : prevIndex + 1,
      );
    }, 4000);

    return () => clearInterval(timer);
  }, [topBanners]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFlashSaleTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();

      setCategories(data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await getBrands();

      setBrands(data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchHomepageData = async () => {
    try {
      const bannerData = await getBannersByPosition("HOME_TOP");

      setTopBanners(Array.isArray(bannerData) ? bannerData : []);

      const sectionData = await getActiveHomeSections();

      setHomeSections(Array.isArray(sectionData) ? sectionData : []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchActivePromotions = async () => {
    try {
      const data = await getActivePromotions();

      setActivePromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchActiveCoupons = async () => {
    try {
      const data = await getActiveCoupons();

      setActiveCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);

      setActiveCoupons([]);
    }
  };

  const fetchActiveFlashSale = async () => {
    try {
      const data = await getActiveFlashSale();

      setActiveFlashSale(data || null);
    } catch (error) {
      console.log(error);

      setActiveFlashSale(null);
    }
  };

  const normalizeText = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase();
  };

  const getProductsForSection = (section) => {
    let result = [...products];

    const sectionCategory = normalizeText(section.category);

    const sectionBrand = normalizeText(section.brand);

    if (sectionCategory) {
      result = result.filter((product) => {
        const productCategory = normalizeText(product.category);

        return (
          productCategory === sectionCategory ||
          productCategory.includes(sectionCategory) ||
          sectionCategory.includes(productCategory)
        );
      });
    }

    if (sectionBrand) {
      result = result.filter((product) => {
        const productBrand = normalizeText(product.brand);

        return (
          productBrand === sectionBrand ||
          productBrand.includes(sectionBrand) ||
          sectionBrand.includes(productBrand)
        );
      });
    }

    if (section.sectionType === "NEW_ARRIVAL") {
      result = result.sort((a, b) => Number(b.id) - Number(a.id));
    }

    if (section.sectionType === "HOT_TREND") {
      result = result.sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
    }

    if (section.sectionType === "FLASH_SALE") {
      result = result.sort(
        (a, b) => Number(a.price || 0) - Number(b.price || 0),
      );
    }

    return result.slice(0, Number(section.limitProduct || 10));
  };

  const handleBuyNow = (product) => {
    addToCart(product);

    navigate("/cart");
  };

  const formatPrice = (price) => {
    if (!price) {
      return "Đang cập nhật";
    }

    return Number(price).toLocaleString("vi-VN") + "đ";
  };

  const getPromotionForProduct = (productId) => {
    const today = new Date();

    return activePromotions.find((promotion) => {
      if (!promotion.active) {
        return false;
      }

      if (Number(promotion.productId) !== Number(productId)) {
        return false;
      }

      const startDate = promotion.startDate
        ? new Date(promotion.startDate)
        : null;

      const endDate = promotion.endDate ? new Date(promotion.endDate) : null;

      if (startDate && today < startDate) {
        return false;
      }

      if (endDate && today > endDate) {
        return false;
      }

      return true;
    });
  };

  const getDiscountPrice = (price, discountPercent) => {
    return Math.round(
      (Number(price || 0) * (100 - Number(discountPercent || 0))) / 100,
    );
  };

  const getFlashSaleItemForProduct = (productId) => {
    const item = activeFlashSale?.items?.find(
      (flashItem) => Number(flashItem.productId) === Number(productId),
    );

    if (!item) {
      return null;
    }

    const salePrice = Number(item.salePrice || 0);

    const originalPrice = Number(item.originalPrice || 0);

    const saleQuantity = Number(item.saleQuantity || 0);

    const soldQuantity = Number(item.soldQuantity || 0);

    const remainingQuantity = Math.max(0, saleQuantity - soldQuantity);

    if (
      salePrice <= 0 ||
      originalPrice <= 0 ||
      salePrice >= originalPrice ||
      remainingQuantity <= 0
    ) {
      return null;
    }

    return item;
  };

  const getEffectiveHomePrice = (product) => {
    const productOriginalPrice = Number(product?.price || 0);

    /*
     * Ưu tiên 1: Flash Sale
     */
    const flashSaleItem = getFlashSaleItemForProduct(product.id);

    if (flashSaleItem) {
      const originalPrice = Number(
        flashSaleItem.originalPrice || productOriginalPrice,
      );

      const finalPrice = Number(flashSaleItem.salePrice);

      const calculatedPercent =
        originalPrice > 0
          ? Math.round(((originalPrice - finalPrice) * 100) / originalPrice)
          : 0;

      return {
        originalPrice,

        finalPrice,

        priceSource: "FLASH_SALE",

        discountPercent:
          Number(flashSaleItem.discountPercent || 0) || calculatedPercent,

        flashSaleItemId: flashSaleItem.itemId,
      };
    }

    /*
     * Ưu tiên 2: Promotion
     */
    const promotion = getPromotionForProduct(product.id);

    if (promotion) {
      const discountPercent = Number(promotion.discountPercent || 0);

      return {
        originalPrice: productOriginalPrice,

        finalPrice: getDiscountPrice(productOriginalPrice, discountPercent),

        priceSource: "PROMOTION",

        discountPercent,

        promotionId: promotion.id,
      };
    }

    /*
     * Giá gốc
     */
    return {
      originalPrice: productOriginalPrice,

      finalPrice: productOriginalPrice,

      priceSource: "REGULAR",

      discountPercent: 0,
    };
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
  };

  const copyCouponCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);

      alert(`Đã sao chép mã ${code}`);
    } catch (error) {
      console.log(error);

      alert("Không thể sao chép mã");
    }
  };

  const getCouponMainText = (coupon) => {
    const type = coupon.discountType || coupon.type;

    const value = Number(coupon.discountValue || coupon.value || 0);

    if (type === "PERCENT" || type === "percent") {
      return `${value}%`;
    }

    if (value >= 1000) {
      return `${Math.round(value / 1000)}K`;
    }

    return value;
  };

  const getCouponDesc = (coupon) => {
    const type = coupon.discountType || coupon.type;

    const value = Number(coupon.discountValue || coupon.value || 0);

    const maxDiscount = Number(coupon.maxDiscountAmount || 0);

    if (type === "PERCENT" || type === "percent") {
      if (maxDiscount > 0) {
        return `Tối đa ${formatCurrency(maxDiscount)}`;
      }

      return `Giảm ${value}% đơn hàng`;
    }

    return `Giảm ${formatCurrency(value)}`;
  };

  const getCouponMinOrderText = (coupon) => {
    const minOrder = Number(coupon.minOrderValue || 0);

    if (minOrder <= 0) {
      return "Không yêu cầu đơn tối thiểu";
    }

    return `Đơn từ ${formatCurrency(minOrder)}`;
  };

  const formatCouponDate = (dateValue) => {
    if (!dateValue) {
      return "Không giới hạn";
    }

    const date = new Date(dateValue);

    return date.toLocaleDateString("vi-VN");
  };

  const getDealTimeLeft = (endTime) => {
    if (!endTime) {
      return {
        hours: "00",
        minutes: "00",
        seconds: "00",
        expired: true,
      };
    }

    const now = new Date();

    const end = new Date(endTime);

    const diff = end - now;

    if (diff <= 0) {
      return {
        hours: "00",
        minutes: "00",
        seconds: "00",
        expired: true,
      };
    }

    const totalSeconds = Math.floor(diff / 1000);

    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");

    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0",
    );

    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return {
      hours,
      minutes,
      seconds,
      expired: false,
    };
  };

  const formatNumberInput = (value) => {
    const numberOnly = String(value || "").replace(/\D/g, "");

    if (!numberOnly) {
      return "";
    }

    return Number(numberOnly).toLocaleString("vi-VN");
  };

  const cleanNumberInput = (value) => {
    return String(value || "").replace(/\D/g, "");
  };

  const handlePriceInputChange = (e) => {
    const { name, value } = e.target;

    setHomeFilterForm({
      ...homeFilterForm,
      [name]: cleanNumberInput(value),
    });
  };

  const handlePriceInputBlur = (e) => {
    const { name, value } = e.target;

    setHomeFilterForm({
      ...homeFilterForm,
      [name]: formatNumberInput(value),
    });
  };

  const getProductById = (productId) => {
    return products.find((product) => Number(product.id) === Number(productId));
  };

  const dealCardSections = homeSections
    .filter((section) => section.sectionType === "DEAL_CARD")
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .slice(0, 3);

  const tabbedSections = homeSections
    .filter((section) => section.sectionType === "TABBED_SECTION")
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  const normalHomeSections = homeSections.filter(
    (section) =>
      section.sectionType !== "DEAL_CARD" &&
      section.sectionType !== "TABBED_SECTION" &&
      section.sectionType !== "GOLDEN_HOUR_DEAL",
  );

  const groupedTabbedSections = tabbedSections.reduce((groups, section) => {
    const key = section.groupCode || "DEFAULT_TAB_GROUP";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(section);

    return groups;
  }, {});

  const activeBanner = topBanners[activeBannerIndex];

  const handlePrevBanner = () => {
    if (topBanners.length === 0) {
      return;
    }

    setActiveBannerIndex((prevIndex) =>
      prevIndex === 0 ? topBanners.length - 1 : prevIndex - 1,
    );
  };

  const handleNextBanner = () => {
    if (topBanners.length === 0) {
      return;
    }

    setActiveBannerIndex((prevIndex) =>
      prevIndex === topBanners.length - 1 ? 0 : prevIndex + 1,
    );
  };

  const handleHomeFilterChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setHomeFilterForm({
        ...homeFilterForm,
        category: value,
        brand: "",
      });

      return;
    }

    setHomeFilterForm({
      ...homeFilterForm,
      [name]: value,
    });
  };
  const handleApplyHomeFilter = () => {
    const params = new URLSearchParams();

    if (homeFilterForm.category) {
      params.set("category", homeFilterForm.category);
    }

    if (homeFilterForm.brand) {
      params.set("brand", homeFilterForm.brand);
    }

    if (homeFilterForm.minPrice) {
      params.set("minPrice", cleanNumberInput(homeFilterForm.minPrice));
    }

    if (homeFilterForm.maxPrice) {
      params.set("maxPrice", cleanNumberInput(homeFilterForm.maxPrice));
    }

    if (homeFilterForm.sort) {
      params.set("sort", homeFilterForm.sort);
    }

    navigate(`/search?${params.toString()}`);
  };

  const handleClearHomeFilter = () => {
    const emptyFilter = {
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      sort: "",
    };

    setHomeFilterForm(emptyFilter);

    localStorage.removeItem("homeFilterForm");
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const keyword = normalizeText(filterForm.keyword || keywordFromUrl);

    const category = normalizeText(filterForm.category || categoryFromUrl);

    const brand = normalizeText(filterForm.brand);

    const minPrice = Number(filterForm.minPrice) || 0;

    const maxPrice = Number(filterForm.maxPrice) || 0;

    if (keyword) {
      result = result.filter((product) => {
        const name = normalizeText(product.name);

        const productCategory = normalizeText(product.category);

        const productBrand = normalizeText(product.brand);

        return (
          name.includes(keyword) ||
          productCategory.includes(keyword) ||
          productBrand.includes(keyword)
        );
      });
    }

    if (category) {
      result = result.filter(
        (product) => normalizeText(product.category) === category,
      );
    }

    if (brand) {
      result = result.filter(
        (product) => normalizeText(product.brand) === brand,
      );
    }

    if (minPrice > 0) {
      result = result.filter(
        (product) => Number(product.price || 0) >= minPrice,
      );
    }

    if (maxPrice > 0) {
      result = result.filter(
        (product) => Number(product.price || 0) <= maxPrice,
      );
    }

    if (filterForm.sort === "price-asc") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (filterForm.sort === "price-desc") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    if (filterForm.sort === "newest") {
      result.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }

    return result;
  }, [products, filterForm, keywordFromUrl, categoryFromUrl]);

  const isFiltering = Boolean(
    keywordFromUrl ||
    categoryFromUrl ||
    filterForm.keyword ||
    filterForm.category ||
    filterForm.brand ||
    filterForm.minPrice ||
    filterForm.maxPrice ||
    filterForm.sort,
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setFilterForm({
        ...filterForm,
        category: value,
        brand: "",
      });

      return;
    }

    setFilterForm({
      ...filterForm,
      [name]: value,
    });
  };

  const handleClearFilter = () => {
    setFilterForm({
      keyword: "",
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      sort: "",
    });

    setSearchParams({});
  };

  const getHomeSectionId = (section) => {
    if (section.sectionType === "NEW_ARRIVAL") {
      return "new-arrival";
    }

    if (section.sectionType === "HOT_TREND") {
      return "hot-products";
    }

    if (section.sectionType === "PROMOTION") {
      return "promotion";
    }

    return undefined;
  };

  useEffect(() => {
    setFilterForm((prev) => ({
      ...prev,
      keyword: keywordFromUrl,
      category: categoryFromUrl,
      brand: "",
    }));
  }, [keywordFromUrl, categoryFromUrl]);
  return (
    <div className="homepage">
      <Header />

      {/* HERO */}

      <section className="hero-layout">
        <Sidebar />

        <div className="hero-right">
          {topBanners.length > 0 && activeBanner ? (
            <section className="home-top-banner">
              <div
                className="home-top-banner-item"
                onClick={() => {
                  if (activeBanner.linkUrl) {
                    window.location.href = activeBanner.linkUrl;
                  }
                }}
              >
                <img src={activeBanner.imageUrl} alt={activeBanner.title} />

                <div className="home-top-banner-content">
                  <span className="banner-sale-badge">🔥 GAMING WEEK</span>

                  <h2>{activeBanner.title}</h2>

                  <p>{activeBanner.subtitle}</p>

                  <button>
                    Khám phá ngay
                    <span>→</span>
                  </button>

                  <div className="banner-benefits">
                    <div>
                      🚚
                      <span>Giao nhanh 2h</span>
                    </div>

                    <div>
                      🛡️
                      <span>Bảo hành chính hãng</span>
                    </div>

                    <div>
                      💳
                      <span>Trả góp 0%</span>
                    </div>
                  </div>
                </div>
              </div>

              {topBanners.length > 1 && (
                <>
                  <button
                    className="banner-nav-btn banner-prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevBanner();
                    }}
                  >
                    ❮
                  </button>

                  <button
                    className="banner-nav-btn banner-next"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextBanner();
                    }}
                  >
                    ❯
                  </button>

                  <div className="banner-dots">
                    {topBanners.map((banner, index) => (
                      <button
                        key={banner.id}
                        className={
                          index === activeBannerIndex
                            ? "banner-dot active"
                            : "banner-dot"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveBannerIndex(index);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          ) : (
            <div className="hero-banner">
              <div className="hero-content">
                <h1>GAMING SETUP 2026</h1>

                <p>Build góc gaming mơ ước của bạn</p>

                <button onClick={() => navigate("/")}>Khám phá ngay</button>
              </div>
            </div>
          )}

          {/* DEAL CARDS GIỮ LẠI */}

          {dealCardSections.length > 0 && (
            <div className="deal-section">
              {dealCardSections.map((section) => {
                const product = getProductById(section.productId);

                const image =
                  section.bannerImage ||
                  product?.image ||
                  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80";

                const title =
                  section.title || product?.name || "Sản phẩm nổi bật";

                const price = product?.price
                  ? formatPrice(product.price)
                  : "Đang cập nhật";

                return (
                  <div className="deal-card" key={section.id}>
                    {section.badgeText && (
                      <div className="deal-badge">{section.badgeText}</div>
                    )}

                    <img
                      src={image}
                      alt={title}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80";
                      }}
                    />

                    <div className="deal-info">
                      <h3>{title}</h3>

                      {section.shortDescription && (
                        <p className="deal-desc">{section.shortDescription}</p>
                      )}

                      <p className="deal-price">{price}</p>

                      <button
                        onClick={() => {
                          if (section.bannerLink) {
                            window.location.href = section.bannerLink;
                            return;
                          }

                          if (product?.id) {
                            navigate(`/product/${product.id}`);
                          }
                        }}
                      >
                        Xem ngay
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* BỘ LỌC SẢN PHẨM NHANH */}

      <section className="home-filter-section">
        <div className="home-filter-top">
          <div className="home-filter-heading">
            <div className="home-filter-icon">⌕</div>

            <div>
              <h2>Lọc sản phẩm nhanh</h2>

              <p>Chọn bộ lọc để chuyển sang trang kết quả sản phẩm phù hợp</p>
            </div>
          </div>

          <button
            type="button"
            className="home-filter-clear"
            onClick={handleClearHomeFilter}
          >
            ↻ Xóa lọc
          </button>
        </div>

        <div className="home-filter-line"></div>

        <div className="home-filter-grid">
          <div className="home-filter-field">
            <label>Danh mục</label>

            <select
              name="category"
              value={homeFilterForm.category}
              onChange={handleHomeFilterChange}
            >
              <option value="">Tất cả danh mục</option>

              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.icon || "📦"} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="home-filter-field">
            <label>Thương hiệu</label>

            <select
              name="brand"
              value={homeFilterForm.brand}
              onChange={handleHomeFilterChange}
              disabled={!homeFilterForm.category}
            >
              <option value="">
                {homeFilterForm.category
                  ? "Tất cả thương hiệu"
                  : "Chọn danh mục trước"}
              </option>

              {brands
                .filter(
                  (brand) =>
                    normalizeText(brand.category) ===
                    normalizeText(homeFilterForm.category),
                )
                .map((brand) => (
                  <option key={brand.id} value={brand.name}>
                    {brand.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="home-filter-field">
            <label>Giá từ</label>

            <input
              type="text"
              inputMode="numeric"
              name="minPrice"
              placeholder="Nhập giá từ"
              value={homeFilterForm.minPrice}
              onChange={handlePriceInputChange}
              onBlur={handlePriceInputBlur}
            />
          </div>

          <div className="home-filter-field">
            <label>Giá đến</label>

            <input
              type="text"
              inputMode="numeric"
              name="maxPrice"
              placeholder="Nhập giá đến"
              value={homeFilterForm.maxPrice}
              onChange={handlePriceInputChange}
              onBlur={handlePriceInputBlur}
            />
          </div>

          <div className="home-filter-field">
            <label>Sắp xếp</label>

            <select
              name="sort"
              value={homeFilterForm.sort}
              onChange={handleHomeFilterChange}
            >
              <option value="">Sắp xếp mặc định</option>

              <option value="price-asc">Giá thấp đến cao</option>

              <option value="price-desc">Giá cao đến thấp</option>

              <option value="newest">Sản phẩm mới nhất</option>
            </select>
          </div>

          <button
            type="button"
            className="home-filter-submit"
            onClick={handleApplyHomeFilter}
          >
            🔍 Xem kết quả
          </button>
        </div>
      </section>

      {/* KHỐI GIỜ VÀNG FLASH SALE TỪ API MỚI */}

      {activeFlashSale &&
        activeFlashSale.items &&
        activeFlashSale.items.length > 0 && (
          <section
            id="flash-sale"
            className="golden-hour-pro-section flash-bg-full"
            style={{
              backgroundImage: `
      linear-gradient(
        180deg,
        rgba(130, 0, 0, 0.08) 0%,
        rgba(255, 77, 0, 0.18) 38%,
        rgba(255, 245, 235, 0.88) 58%,
        rgba(255, 255, 255, 0.96) 100%
      ),
      url(${activeFlashSale.bannerImage || "/images/golden-hour-bg.png"})
    `,
            }}
          >
            <div className="golden-hour-header banner-has-title">
              <div className="golden-hour-header-overlay"></div>

              <div className="golden-hour-title-box">
                <div className="golden-hour-icon">⚡</div>

                <div>
                  <h2>GIỜ VÀNG</h2>

                  <h3>DEAL SỐC</h3>
                </div>
              </div>

              <div className="golden-hour-countdown">
                <p>KẾT THÚC TRONG</p>

                {(() => {
                  const dealTime = getDealTimeLeft(activeFlashSale.endTime);

                  return (
                    <div className="golden-hour-time-row">
                      <div className="golden-hour-time-item">
                        <strong>{dealTime.hours}</strong>

                        <span>Giờ</span>
                      </div>

                      <b>:</b>

                      <div className="golden-hour-time-item">
                        <strong>{dealTime.minutes}</strong>

                        <span>Phút</span>
                      </div>

                      <b>:</b>

                      <div className="golden-hour-time-item">
                        <strong>{dealTime.seconds}</strong>

                        <span>Giây</span>
                      </div>
                    </div>
                  );
                })()}

                <small>
                  {activeFlashSale.subtitle ||
                    "Săn ưu đãi giới hạn trong khung giờ vàng"}
                </small>
              </div>

              <div className="golden-hour-limit-badge">
                <span>ƯU ĐÃI</span>

                <strong>GIỚI HẠN</strong>

                <em>DUY NHẤT HÔM NAY</em>
              </div>
            </div>

            <div className="golden-hour-product-wrap">
              <button
                type="button"
                className="golden-hour-arrow left"
                onClick={() => {
                  document.querySelector(".golden-hour-grid")?.scrollBy({
                    left: -1000,
                    behavior: "smooth",
                  });
                }}
              >
                ❮
              </button>

              <div className="golden-hour-grid">
                {activeFlashSale.items.map((item) => {
                  const soldPercent = Number(item.soldPercent || 0);

                  return (
                    <div
                      className="golden-hour-card"
                      key={item.itemId}
                      onClick={() => navigate(`/product/${item.productId}`)}
                    >
                      <div className="golden-hour-sale-badge">
                        -{item.discountPercent || 0}%
                      </div>

                      <div className="golden-hour-installment">Trả góp 0%</div>

                      <div className="golden-hour-image-box">
                        <img src={item.image} alt={item.productName} />
                      </div>

                      <div className="golden-hour-card-info">
                        <h4>{item.productName}</h4>

                        <p className="golden-hour-price">
                          {formatCurrency(item.salePrice)}
                        </p>

                        <p className="golden-hour-old-price">
                          {formatCurrency(item.originalPrice)}
                        </p>

                        <div className="golden-hour-gift">
                          🎁 Tặng kèm: Ưu đãi thành viên
                        </div>

                        <div className="golden-hour-sold-box">
                          <span>Đã bán {soldPercent}%</span>

                          <div className="golden-hour-progress">
                            <i
                              style={{
                                width: `${soldPercent}%`,
                              }}
                            ></i>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="golden-hour-buy-btn"
                          onClick={(e) => {
                            e.stopPropagation();

                            const flashSaleProduct = {
                              id: item.productId,
                              name: item.productName,
                              image: item.image,
                              price: item.salePrice,
                              originalPrice: item.originalPrice,
                              flashSalePrice: item.salePrice,
                              flashSaleItemId: item.itemId,
                              isFlashSale: true,
                              quantity: 1,
                            };

                            handleBuyNow(flashSaleProduct);
                          }}
                        >
                          MUA NGAY 🛒
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="golden-hour-arrow right"
                onClick={() => {
                  document.querySelector(".golden-hour-grid")?.scrollBy({
                    left: 1000,
                    behavior: "smooth",
                  });
                }}
              >
                ❯
              </button>
            </div>

            <div className="golden-hour-service-row">
              <div>
                <span>🛡️</span>

                <p>
                  <strong>Hàng chính hãng 100%</strong>

                  <small>Cam kết chất lượng</small>
                </p>
              </div>

              <div>
                <span>🔄</span>

                <p>
                  <strong>Đổi trả dễ dàng</strong>

                  <small>Trong 7 ngày</small>
                </p>
              </div>

              <div>
                <span>🚚</span>

                <p>
                  <strong>Giao hàng siêu tốc</strong>

                  <small>Toàn quốc</small>
                </p>
              </div>

              <div>
                <span>💳</span>

                <p>
                  <strong>Thanh toán đa dạng</strong>

                  <small>An toàn, bảo mật</small>
                </p>
              </div>
            </div>

            <div className="golden-hour-dots">
              <span className="active"></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </section>
        )}

      {/* KHỐI SẢN PHẨM DẠNG TAB DO ADMIN QUẢN LÝ */}

      {Object.entries(groupedTabbedSections).map(
        ([groupCode, sections], index) => {
          const sortedTabs = [...sections].sort(
            (a, b) => Number(a.tabOrder || 0) - Number(b.tabOrder || 0),
          );

          const activeTab =
            sortedTabs.find(
              (tab) => Number(tab.id) === Number(activeTabByGroup[groupCode]),
            ) || sortedTabs[0];

          const productsForTab = getProductsForSection(activeTab);

          return (
            <section
              id={index === 0 ? "featured-tabs" : undefined}
              className="home-tabbed-section"
              key={groupCode}
            >
              <div className="home-tab-header">
                {sortedTabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    className={
                      Number(tab.id) === Number(activeTab.id)
                        ? "home-tab-btn active"
                        : "home-tab-btn"
                    }
                    onClick={() =>
                      setActiveTabByGroup({
                        ...activeTabByGroup,
                        [groupCode]: tab.id,
                      })
                    }
                  >
                    {tab.tabTitle || tab.title}
                  </button>
                ))}
              </div>

              {activeTab.bannerImage && (
                <div
                  className="home-tab-banner"
                  onClick={() => {
                    if (activeTab.bannerLink) {
                      window.location.href = activeTab.bannerLink;
                    }
                  }}
                >
                  <img
                    src={activeTab.bannerImage}
                    alt={activeTab.tabTitle || activeTab.title}
                  />
                </div>
              )}

              <div
                className={
                  activeTab.leftBannerImage
                    ? "home-tab-body has-left-banner"
                    : "home-tab-body"
                }
              >
                {activeTab.leftBannerImage && (
                  <div
                    className="home-tab-left-banner"
                    onClick={() => {
                      if (activeTab.leftBannerLink) {
                        navigate(activeTab.leftBannerLink);
                      }
                    }}
                  >
                    <img
                      src={activeTab.leftBannerImage}
                      alt={activeTab.tabTitle || activeTab.title}
                    />
                  </div>
                )}

                <div
                  className={
                    Number(activeTab.productRows || 1) === 2
                      ? "home-tab-products rows-2"
                      : "home-tab-products rows-1"
                  }
                >
                  {productsForTab.length > 0 ? (
                    productsForTab.map((product) => {
                      const priceInfo = getEffectiveHomePrice(product);

                      const finalPrice = priceInfo.finalPrice;

                      return (
                        <div
                          className="home-section-card"
                          key={product.id}
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          {priceInfo.priceSource !== "REGULAR" && (
                            <div className="home-section-sale-badge">
                              {priceInfo.priceSource === "FLASH_SALE"
                                ? `Flash Sale -${priceInfo.discountPercent}%`
                                : `Giảm ${priceInfo.discountPercent}%`}
                            </div>
                          )}

                          <div className="home-section-installment">
                            Trả góp 0%
                          </div>

                          <div className="home-section-card-image">
                            <img src={product.image} alt={product.name} />
                          </div>

                          <div className="home-section-card-info">
                            <h3>{product.name}</h3>

                            <p className="home-section-card-price">
                              {formatCurrency(finalPrice)}
                            </p>

                            {priceInfo.finalPrice < priceInfo.originalPrice && (
                              <p className="home-section-old-price">
                                {formatCurrency(priceInfo.originalPrice)}
                              </p>
                            )}

                            <div className="home-section-discount blue">
                              Thành viên giảm thêm 300.000đ
                            </div>

                            <div className="home-section-discount purple">
                              Sinh viên giảm thêm 200.000đ
                            </div>

                            <p className="home-section-gift">
                              Trả góp 0% - Đổi trả dễ dàng trong 7 ngày
                            </p>

                            <div className="home-section-card-bottom">
                              <span>⭐ 5</span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                ♡ Yêu thích
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="home-section-empty">
                      Chưa có sản phẩm phù hợp với tab này. Kiểm tra lại danh
                      mục hoặc thương hiệu trong admin.
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        },
      )}

      {/* KHỐI SẢN PHẨM TRANG CHỦ DO ADMIN QUẢN LÝ */}

      {normalHomeSections.length > 0 && (
        <div className="home-dynamic-wrapper">
          {normalHomeSections.map((section) => {
            const sectionProducts = getProductsForSection(section);

            return (
              <div className="home-product-block" key={section.id}>
                {/* KHUNG CHỨA TIÊU ĐỀ + BANNER + SẢN PHẨM */}

                <section
                  id={getHomeSectionId(section)}
                  className="home-product-section"
                >
                  <div className="home-product-title-inside">
                    <h2>{section.title}</h2>
                  </div>

                  {section.bannerImage && (
                    <div
                      className="home-section-banner home-section-banner-animated"
                      onClick={() => {
                        if (section.bannerLink) {
                          window.location.href = section.bannerLink;
                        }
                      }}
                    >
                      <img src={section.bannerImage} alt={section.title} />

                      <div className="home-section-banner-shine"></div>
                    </div>
                  )}

                  <div
                    className={
                      section.leftBannerImage
                        ? "home-section-body has-left-banner"
                        : "home-section-body"
                    }
                  >
                    {section.leftBannerImage && (
                      <div
                        className="home-section-left-banner"
                        onClick={() => {
                          if (section.leftBannerLink) {
                            navigate(section.leftBannerLink);
                          }
                        }}
                      >
                        <img
                          src={section.leftBannerImage}
                          alt={section.title}
                        />
                      </div>
                    )}

                    <div className="home-section-slider-wrapper">
                      <button
                        className="home-section-arrow left"
                        onClick={() => {
                          document
                            .querySelector(`.home-section-grid-${section.id}`)
                            ?.scrollBy({
                              left: -900,
                              behavior: "smooth",
                            });
                        }}
                      >
                        ❮
                      </button>

                      <div
                        className={
                          Number(section.productRows || 1) === 2
                            ? `home-section-grid home-section-grid-${section.id} rows-2`
                            : `home-section-grid home-section-grid-${section.id} rows-1`
                        }
                      >
                        {sectionProducts.length > 0 ? (
                          sectionProducts.map((product) => {
                            const priceInfo = getEffectiveHomePrice(product);

                            const finalPrice = priceInfo.finalPrice;

                            return (
                              <div
                                className="home-section-card"
                                key={product.id}
                                onClick={() =>
                                  navigate(`/product/${product.id}`)
                                }
                              >
                                {priceInfo.priceSource !== "REGULAR" && (
                                  <div className="home-section-sale-badge">
                                    {priceInfo.priceSource === "FLASH_SALE"
                                      ? `Flash Sale -${priceInfo.discountPercent}%`
                                      : `Giảm ${priceInfo.discountPercent}%`}
                                  </div>
                                )}

                                <div className="home-section-installment">
                                  Trả góp 0%
                                </div>

                                <div className="home-section-card-image">
                                  <img src={product.image} alt={product.name} />
                                </div>

                                <div className="home-section-card-info">
                                  <h3>{product.name}</h3>

                                  <p className="home-section-card-price">
                                    {formatCurrency(finalPrice)}
                                  </p>

                                  {priceInfo.finalPrice <
                                    priceInfo.originalPrice && (
                                    <p className="home-section-old-price">
                                      {formatCurrency(priceInfo.originalPrice)}
                                    </p>
                                  )}

                                  <div className="home-section-discount blue">
                                    Thành viên giảm thêm 300.000đ
                                  </div>

                                  <div className="home-section-discount purple">
                                    Sinh viên giảm thêm 200.000đ
                                  </div>

                                  <p className="home-section-gift">
                                    Trả góp 0% - Đổi trả dễ dàng trong 7 ngày
                                  </p>

                                  <div className="home-section-card-bottom">
                                    <span>⭐ 5</span>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      ♡ Yêu thích
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="home-section-empty">
                            Chưa có sản phẩm phù hợp với khối này. Kiểm tra lại
                            danh mục hoặc thương hiệu trong admin.
                          </div>
                        )}
                      </div>

                      <button
                        className="home-section-arrow right"
                        onClick={() => {
                          document
                            .querySelector(`.home-section-grid-${section.id}`)
                            ?.scrollBy({
                              left: 900,
                              behavior: "smooth",
                            });
                        }}
                      >
                        ❯
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            );
          })}
        </div>
      )}

      {/* KHỐI MÃ GIẢM GIÁ HOMEPAGE */}

      {activeCoupons.length > 0 && (
        <section id="coupons" className="home-coupon-section">
          <div className="home-coupon-left">
            <div className="home-coupon-icon">%</div>

            <div>
              <span>ƯU ĐÃI KHÔNG THỂ BỎ LỠ</span>

              <h2>
                MÃ GIẢM GIÁ <b>HOT</b> 🔥
              </h2>

              <p>Lưu mã ngay để tiết kiệm hơn khi thanh toán</p>

              <div className="home-coupon-note">
                Sao chép mã và áp dụng khi thanh toán
              </div>
            </div>
          </div>

          <div className="home-coupon-slider-wrap">
            <button
              type="button"
              className="home-coupon-arrow left"
              onClick={() => {
                couponSliderRef.current?.scrollBy({
                  left: -430,
                  behavior: "smooth",
                });
              }}
            >
              ❮
            </button>

            <div className="home-coupon-slider" ref={couponSliderRef}>
              {activeCoupons.slice(0, 20).map((coupon, index) => (
                <div
                  className={`home-coupon-card coupon-color-${index % 5}`}
                  key={coupon.id || coupon.code}
                >
                  <div className="home-coupon-hot">HOT</div>

                  <div className="home-coupon-discount-label">Giảm</div>

                  <div className="home-coupon-main">
                    {getCouponMainText(coupon)}
                  </div>

                  <p className="home-coupon-desc">{getCouponDesc(coupon)}</p>

                  <div className="home-coupon-code-box">
                    <strong>{coupon.code}</strong>

                    <button
                      type="button"
                      onClick={() => copyCouponCode(coupon.code)}
                    >
                      ⧉
                    </button>
                  </div>

                  <div className="home-coupon-info">
                    <span>{getCouponMinOrderText(coupon)}</span>

                    <span>HSD: {formatCouponDate(coupon.endDate)}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="home-coupon-arrow right"
              onClick={() => {
                couponSliderRef.current?.scrollBy({
                  left: 430,
                  behavior: "smooth",
                });
              }}
            >
              ❯
            </button>
          </div>

          <div className="home-coupon-gift">🎁</div>
        </section>
      )}

      {/* FALLBACK: NẾU ADMIN CHƯA TẠO KHỐI NÀO THÌ HIỆN SẢN PHẨM NỔI BẬT CŨ */}

      {homeSections.length === 0 && (
        <section className="featured-products-section">
          <div className="section-header">
            <h2>Sản phẩm nổi bật</h2>

            <p>Công nghệ bán chạy</p>
          </div>

          <div className="slider-wrapper">
            <button
              className="slider-btn left"
              onClick={() => {
                document.querySelector(".featured-slider")?.scrollBy({
                  left: -700,
                  behavior: "smooth",
                });
              }}
            >
              ❮
            </button>

            <div className="featured-slider">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <button
              className="slider-btn right"
              onClick={() => {
                document.querySelector(".featured-slider")?.scrollBy({
                  left: 700,
                  behavior: "smooth",
                });
              }}
            >
              ❯
            </button>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
