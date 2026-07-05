import "./SearchPage.css";

import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import HomeProductCard from "../components/home/HomeProductCard";

import { getProducts } from "../services/productApi";

import { getSectionBannerDetail } from "../services/homeSectionBannerApi";

import { getActivePromotions } from "../services/promotionApi";

import { getActiveFlashSale } from "../services/flashSaleApi";

export default function SearchPage() {
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const pageParam = searchParams.get("page") || "";

  const isPromotionPage = pageParam === "promotion";

  const keyword = searchParams.get("keyword") || "";

  const categoryParam = searchParams.get("category") || "";

  const brandParam = searchParams.get("brand") || "";

  const minPriceParam = searchParams.get("minPrice") || "";

  const maxPriceParam = searchParams.get("maxPrice") || "";

  const sortParam = searchParams.get("sort") || "";

  const bannerIdParam = searchParams.get("bannerId") || "";

  const productIdsParam = searchParams.get("productIds") || "";

  const [products, setProducts] = useState([]);

  const [bannerInfo, setBannerInfo] = useState(null);

  const [bannerProducts, setBannerProducts] = useState([]);

  const [activePromotions, setActivePromotions] = useState([]);

  const [activeFlashSale, setActiveFlashSale] = useState(null);

  const [loadingBanner, setLoadingBanner] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchActivePromotions();
    fetchActiveFlashSale();
  }, []);

  useEffect(() => {
    fetchBannerProducts(bannerIdParam);
  }, [bannerIdParam]);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);

      setProducts([]);
    }
  };

  const fetchBannerProducts = async (bannerId) => {
    if (!bannerId) {
      setBannerInfo(null);
      setBannerProducts([]);
      return;
    }

    try {
      setLoadingBanner(true);

      const detail = await getSectionBannerDetail(bannerId);

      setBannerInfo(detail?.banner || null);

      setBannerProducts(Array.isArray(detail?.products) ? detail.products : []);
    } catch (error) {
      console.log(error);

      setBannerInfo(null);
      setBannerProducts([]);
    } finally {
      setLoadingBanner(false);
    }
  };

  const fetchActivePromotions = async () => {
    try {
      const data = await getActivePromotions();

      setActivePromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);

      setActivePromotions([]);
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
    const text =
      typeof value === "object" && value !== null
        ? value.name || value.title || value.value || ""
        : value;

    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  };

  const CATEGORY_ALIASES = {
    laptop: ["laptop", "laptop gaming", "may tinh xach tay"],
    "may tinh bang": ["may tinh bang", "tablet", "ipad"],
    "dien thoai": ["dien thoai", "smartphone", "phone"],
    "tai nghe": ["tai nghe", "headphone", "earphone"],
    "phu kien": ["phu kien", "accessory", "phu kien cong nghe"],
    tivi: ["tivi", "tv", "television"],
    "tu lanh": ["tu lanh", "refrigerator"],
    "dong ho thong minh": ["dong ho thong minh", "smartwatch", "watch"],
  };

  const matchesFilterText = (productValue, filterValue, aliases = {}) => {
    const productText = normalizeText(productValue);
    const filterText = normalizeText(filterValue);

    if (!filterText) return true;
    if (!productText) return false;

    if (
      productText === filterText ||
      productText.includes(filterText) ||
      filterText.includes(productText)
    ) {
      return true;
    }

    const aliasList = aliases[filterText] || [];

    return aliasList.some((alias) => {
      const aliasText = normalizeText(alias);

      return (
        productText === aliasText ||
        productText.includes(aliasText) ||
        aliasText.includes(productText)
      );
    });
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

  const getEffectiveSearchPrice = (product) => {
    const productOriginalPrice = Number(product?.price || 0);

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

    return {
      originalPrice: productOriginalPrice,
      finalPrice: productOriginalPrice,
      priceSource: "REGULAR",
      discountPercent: 0,
    };
  };

  const searchResults = useMemo(() => {
    const filterProducts = (skipCategory = false) => {
      let result = [...products];

      const text = normalizeText(keyword);
      const category = normalizeText(categoryParam);
      const brand = normalizeText(brandParam);
      const minPrice = Number(minPriceParam) || 0;
      const maxPrice = Number(maxPriceParam) || 0;

      if (isPromotionPage) {
        result = result.filter((product) =>
          Boolean(getPromotionForProduct(product.id)),
        );
      }

      if (text) {
        result = result.filter((product) => {
          const name = normalizeText(product.name);
          const productCategory = normalizeText(product.category);
          const productBrand = normalizeText(product.brand);

          return (
            name.includes(text) ||
            productCategory.includes(text) ||
            productBrand.includes(text)
          );
        });
      }

      if (category && !skipCategory) {
        result = result.filter((product) =>
          matchesFilterText(product.category, categoryParam, CATEGORY_ALIASES),
        );
      }

      if (brand) {
        result = result.filter((product) =>
          matchesFilterText(product.brand, brandParam),
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

      if (sortParam === "price-asc") {
        result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      }

      if (sortParam === "price-desc") {
        result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      }

      if (sortParam === "newest") {
        result.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      }

      return result;
    };

    const normalResult = filterProducts(false);

    /*
     * Nếu bấm thương hiệu từ menu mà category + brand không có kết quả,
     * tự fallback sang lọc theo brand để tránh hiện 0 sản phẩm.
     */
    if (
      !bannerIdParam &&
      categoryParam &&
      brandParam &&
      normalResult.length === 0
    ) {
      return filterProducts(true);
    }

    return normalResult;
  }, [
    products,
    keyword,
    categoryParam,
    brandParam,
    minPriceParam,
    maxPriceParam,
    sortParam,
    isPromotionPage,
    activePromotions,
    activeFlashSale,
  ]);

  const displayedProducts = bannerIdParam ? bannerProducts : searchResults;

  const getResultDescription = () => {
    if (bannerIdParam) {
      return (
        <>
          Sản phẩm thuộc chương trình:
          <strong> {bannerInfo?.title || "Banner khuyến mãi"}</strong>
        </>
      );
    }

    if (keyword) {
      return (
        <>
          Kết quả cho từ khóa:
          <strong> {keyword}</strong>
        </>
      );
    }

    if (
      categoryParam ||
      brandParam ||
      minPriceParam ||
      maxPriceParam ||
      sortParam
    ) {
      return (
        <>
          Kết quả theo bộ lọc:
          <strong>
            {" "}
            {categoryParam || "Tất cả danh mục"}
            {brandParam ? ` - ${brandParam}` : ""}
          </strong>
        </>
      );
    }

    return <>Chưa có từ khóa hoặc bộ lọc</>;
  };

  const getPageTitle = () => {
    if (bannerIdParam) {
      return bannerInfo?.title || "Bộ sưu tập sản phẩm nổi bật";
    }

    if (productIdsParam) {
      return "Gợi ý nổi bật từ ElectroShop";
    }

    if (isPromotionPage) {
      return "Ưu đãi công nghệ đang diễn ra";
    }

    return `Tìm thấy ${displayedProducts.length} sản phẩm phù hợp`;
  };

  const getPageSubtitle = () => {
    if (bannerIdParam) {
      return (
        bannerInfo?.subtitle ||
        "Khám phá những sản phẩm được ElectroShop chọn lọc riêng cho chương trình này."
      );
    }

    if (productIdsParam) {
      return "Những lựa chọn đáng chú ý được ElectroShop gợi ý riêng từ banner trang chủ.";
    }

    if (isPromotionPage) {
      return "Tổng hợp các sản phẩm đang có ưu đãi tốt nhất tại ElectroShop.";
    }

    return getResultDescription();
  };

  return (
    <div
      className={
        bannerIdParam ? "search-page banner-search-page" : "search-page"
      }
    >
      <Header />

      <div className="search-breadcrumb">
        <Link to="/">Trang chủ</Link>

        <span>›</span>

        <strong>
          {bannerIdParam
            ? "Bộ sưu tập"
            : isPromotionPage
              ? "Khuyến mãi"
              : "Tìm kiếm"}
        </strong>
      </div>

      {bannerIdParam && bannerInfo?.imageUrl && (
        <div className="search-banner-hero">
          <img
            src={bannerInfo.imageUrl}
            alt={bannerInfo.title || "Banner khuyến mãi"}
          />
        </div>
      )}

      <section className="search-result-wrapper">
        <div className="search-result-title">
          <div className="search-result-title-left">
            <span className="search-result-badge">
              {bannerIdParam ? "Bộ sưu tập nổi bật" : "Kết quả tìm kiếm"}
            </span>

            <h2>{getPageTitle()}</h2>

            <p>{getPageSubtitle()}</p>
          </div>

          <div className="search-result-title-right">
            <span className="search-result-count">
              {displayedProducts.length} sản phẩm
            </span>
          </div>
        </div>

        {loadingBanner ? (
          <div className="search-empty-page">
            <div className="search-empty-icon">⏳</div>

            <h3>Đang tải sản phẩm...</h3>
          </div>
        ) : displayedProducts.length > 0 ? (
          <div className="search-product-grid">
            {displayedProducts.map((product) => {
              const priceInfo = getEffectiveSearchPrice(product);

              return (
                <HomeProductCard
                  key={product.id}
                  product={product}
                  priceInfo={priceInfo}
                  onOpen={() => navigate(`/product/${product.id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="search-empty-page">
            <div className="search-empty-icon">🔍</div>

            <h3>Không tìm thấy sản phẩm phù hợp</h3>

            <p>
              {bannerIdParam
                ? "Banner này chưa được gắn sản phẩm. Hãy vào Admin → Trang chủ → Quản lý banner để chọn sản phẩm."
                : "Hãy thử tìm bằng tên sản phẩm, danh mục, thương hiệu hoặc khoảng giá khác."}
            </p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
