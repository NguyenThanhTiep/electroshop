import "./ProductDetail.css";

import { getImageUrl } from "../utils/imageUtils";

import HomeProductCard from "../components/home/HomeProductCard";

import ProductReviews from "../components/ProductReviews";

import { useToast } from "../components/common/ToastProvider";

import Footer from "../components/Footer";

import Header from "../components/Header";

import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { addToCart, saveBuyNowItem } from "../utils/cartUtils";

import { getProductById } from "../services/productApi";

import {
  getActiveFlashSaleProduct,
} from "../services/flashSaleApi";

import { getReviewSummary } from "../services/reviewApi";

import {
  getCachedActiveFlashSales,
  getCachedActivePromotions,
  getCachedProducts,
} from "../utils/productDetailCache";

const RELATED_FILTERS = [
  {
    value: "ALL",
    label: "Tất cả",
  },
  {
    value: "BRAND",
    label: "Cùng thương hiệu",
  },
  {
    value: "PRICE",
    label: "Cùng tầm giá",
  },
  {
    value: "DEAL",
    label: "Đang giảm giá",
  },
  {
    value: "BEST_SELLER",
    label: "Bán chạy",
  },
];

const RELATED_PRICE_GAP_RATIO = 0.25;

const DEFAULT_REVIEW_SUMMARY = {
  averageRating: 0,
  totalReviews: 0,
  ratingCounts: {},
};

export default function ProductDetail() {
  const toast = useToast();

  const { id } = useParams();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState({});

  const [productLoading, setProductLoading] = useState(true);

  const [relatedLoading, setRelatedLoading] = useState(false);

  const [activeFlashSaleProduct, setActiveFlashSaleProduct] = useState(null);

  const [activePromotion, setActivePromotion] = useState(null);

  const [reviewSummary, setReviewSummary] = useState(DEFAULT_REVIEW_SUMMARY);

  const [activePromotions, setActivePromotions] = useState([]);

  const [activeFlashSales, setActiveFlashSales] = useState([]);

  const [selectedImage, setSelectedImage] = useState("");

  const [relatedProducts, setRelatedProducts] = useState([]);

  const [relatedFilter, setRelatedFilter] = useState("ALL");

  const [showFullscreen, setShowFullscreen] = useState(false);

  const [quantity, setQuantity] = useState(1);

  const [selectedOptions, setSelectedOptions] = useState({});

  const [showAllOptions, setShowAllOptions] = useState(false);

  const [activeTab, setActiveTab] = useState("description");

  const [thumbStart, setThumbStart] = useState(0);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    setRelatedFilter("ALL");
  }, [id]);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");

    if (requestedTab === "reviews") {
      setActiveTab("reviews");
    }
  }, [searchParams]);
  const parseJsonArray = (data) => {
    try {
      if (!data) {
        return [];
      }

      if (Array.isArray(data)) {
        return data;
      }

      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  };
  const convertPriceToNumber = (price) => {
    if (price === null || price === undefined || price === "") {
      return 0;
    }

    if (typeof price === "number") {
      return price;
    }

    return Number(String(price).replace(/\D/g, "")) || 0;
  };

  const formatPrice = (price) => {
    return convertPriceToNumber(price).toLocaleString("vi-VN") + "đ";
  };

  const normalizeComparableText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const buildRelatedProducts = (currentProduct, products) => {
    if (!currentProduct || !Array.isArray(products)) {
      return [];
    }

    const currentId = Number(currentProduct.id);
    const currentCategory = normalizeComparableText(currentProduct.category);
    const currentBrand = normalizeComparableText(currentProduct.brand);
    const currentPrice = convertPriceToNumber(currentProduct.price);

    const candidates = products
      .filter((item) => item && Number(item.id) !== currentId)
      .map((item) => {
        const sameCategory =
          currentCategory &&
          normalizeComparableText(item.category) === currentCategory;
        const sameBrand =
          currentBrand && normalizeComparableText(item.brand) === currentBrand;
        const itemPrice = convertPriceToNumber(item.price);
        const priceDistance =
          currentPrice > 0 && itemPrice > 0
            ? Math.abs(itemPrice - currentPrice) / currentPrice
            : 1;

        return {
          product: item,
          sameCategory,
          sameBrand,
          priceDistance,
          soldQuantity: Number(item.soldQuantity || 0),
          inStock: Number(item.stock || 0) > 0,
        };
      });

    const similarCandidates = candidates.filter(
      (item) => item.sameCategory || item.sameBrand,
    );

    return (similarCandidates.length > 0 ? similarCandidates : candidates)
      .sort((a, b) => {
        const scoreA =
          (a.sameCategory ? 100 : 0) +
          (a.sameBrand ? 45 : 0) +
          (a.inStock ? 8 : 0);
        const scoreB =
          (b.sameCategory ? 100 : 0) +
          (b.sameBrand ? 45 : 0) +
          (b.inStock ? 8 : 0);

        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        if (a.priceDistance !== b.priceDistance) {
          return a.priceDistance - b.priceDistance;
        }

        if (a.soldQuantity !== b.soldQuantity) {
          return b.soldQuantity - a.soldQuantity;
        }

        return Number(b.product.id || 0) - Number(a.product.id || 0);
      })
      .slice(0, 12)
      .map((item) => item.product);
  };

  const specifications = parseJsonArray(product.specifications);

  const highlights = parseJsonArray(product.highlights);

  const promotions = parseJsonArray(product.promotions);
  const productOptions = parseJsonArray(product.options);

  const findActivePromotion = (promotionList, productId) => {
    const today = new Date();

    return (
      promotionList.find((promotion) => {
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
      }) || null
    );
  };

  const getDiscountPrice = (price, discountPercent) => {
    return Math.round(
      (Number(price || 0) * (100 - Number(discountPercent || 0))) / 100,
    );
  };

  const getFlashSaleItemForProduct = (productId) => {
    for (const flashSale of activeFlashSales) {
      const item = flashSale?.items?.find(
        (flashItem) => Number(flashItem.productId) === Number(productId),
      );

      if (!item) {
        continue;
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
        continue;
      }

      return item;
    }

    return null;
  };

  const getRelatedPriceInfo = (item) => {
    const productOriginalPrice = convertPriceToNumber(item?.price);
    const flashSaleItem = getFlashSaleItemForProduct(item?.id);

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

    const promotion = findActivePromotion(activePromotions, item?.id);

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

  const isSameRelatedBrand = (item) => {
    const currentBrand = normalizeComparableText(product?.brand);

    return (
      currentBrand && normalizeComparableText(item?.brand) === currentBrand
    );
  };

  const isSameRelatedCategory = (item) => {
    const currentCategory = normalizeComparableText(product?.category);

    return (
      currentCategory &&
      normalizeComparableText(item?.category) === currentCategory
    );
  };

  const isRelatedNearPrice = (item) => {
    const currentPrice = convertPriceToNumber(product?.price);
    const itemPrice = convertPriceToNumber(item?.price);

    if (currentPrice <= 0 || itemPrice <= 0) {
      return false;
    }

    return (
      Math.abs(itemPrice - currentPrice) / currentPrice <=
      RELATED_PRICE_GAP_RATIO
    );
  };

  const isRelatedOnDeal = (item) => {
    const priceInfo = getRelatedPriceInfo(item);

    return priceInfo.priceSource && priceInfo.priceSource !== "REGULAR";
  };

  const isRelatedBestSeller = (item) => {
    return Number(item?.soldQuantity || item?.sold || 0) > 0;
  };

  const isRelatedProductVisible = (item, filterType) => {
    if (filterType === "BRAND") {
      return isSameRelatedBrand(item);
    }

    if (filterType === "PRICE") {
      return isRelatedNearPrice(item);
    }

    if (filterType === "DEAL") {
      return isRelatedOnDeal(item);
    }

    if (filterType === "BEST_SELLER") {
      return isRelatedBestSeller(item);
    }

    return true;
  };

  const getRelatedReasonBadges = (item) => {
    const badges = [];

    if (isSameRelatedBrand(item)) {
      badges.push(`Cùng ${item.brand}`);
    } else if (isSameRelatedCategory(item)) {
      badges.push("Cùng danh mục");
    }

    if (isRelatedNearPrice(item)) {
      badges.push("Giá gần giống");
    }

    if (isRelatedBestSeller(item)) {
      badges.push("Bán chạy");
    }

    return badges.slice(0, 1);
  };

  const getRelatedFilterCount = (filterType) => {
    return relatedProducts.filter((item) =>
      isRelatedProductVisible(item, filterType),
    ).length;
  };

  const filteredRelatedProducts = relatedProducts.filter((item) =>
    isRelatedProductVisible(item, relatedFilter),
  );

  const handleRelatedFilterChange = (filterType) => {
    setRelatedFilter(filterType);
  };

  const calculateRegularPrice = () => {
    const basePrice = convertPriceToNumber(product.price);

    const selectedPrices = Object.values(selectedOptions || {})
      .map((option) => convertPriceToNumber(option?.price))
      .filter((price) => price > 0);

    if (selectedPrices.length === 0) {
      return basePrice;
    }

    return Math.max(basePrice, ...selectedPrices);
  };

  const regularPrice = calculateRegularPrice();

  const baseProductPrice = convertPriceToNumber(product.price);

  const flashSalePrice = convertPriceToNumber(
    activeFlashSaleProduct?.salePrice,
  );

  const flashSaleDiscountPercent = Number(
    activeFlashSaleProduct?.discountPercent || 0,
  );

  const promotionPercent = Number(activePromotion?.discountPercent || 0);

  let finalPrice = regularPrice;
  let priceSource = "REGULAR";

  /*
   * Ưu tiên Flash Sale.
   *
   * Flash Sale áp dụng theo % giảm
   * cho giá của tùy chọn đang chọn.
   */
  if (
    activeFlashSaleProduct &&
    flashSaleDiscountPercent > 0 &&
    flashSaleDiscountPercent < 100
  ) {
    finalPrice = Math.round(
      (regularPrice * (100 - flashSaleDiscountPercent)) / 100,
    );

    priceSource = "FLASH_SALE";
  } else if (
    activeFlashSaleProduct &&
    flashSalePrice > 0 &&
    flashSalePrice < baseProductPrice &&
    regularPrice === baseProductPrice
  ) {
    finalPrice = flashSalePrice;
    priceSource = "FLASH_SALE";
  }

  /*
   * Nếu không áp dụng Flash Sale,
   * mới dùng Promotion.
   */
  if (
    priceSource === "REGULAR" &&
    activePromotion &&
    promotionPercent > 0 &&
    promotionPercent < 100
  ) {
    finalPrice = Math.round((regularPrice * (100 - promotionPercent)) / 100);

    priceSource = "PROMOTION";
  }

  const discountPercent =
    priceSource === "FLASH_SALE"
      ? Number(activeFlashSaleProduct?.discountPercent || 0)
      : priceSource === "PROMOTION"
        ? promotionPercent
        : 0;

  const savedAmount = Math.max(0, regularPrice - finalPrice);

  const displaySoldQuantity =
    priceSource === "FLASH_SALE"
      ? Number(activeFlashSaleProduct?.soldQuantity || 0)
      : Number(product.soldQuantity || 0);

  const averageRating = Number(reviewSummary.averageRating || 0);

  const totalReviews = Number(reviewSummary.totalReviews || 0);

  const ratingText =
    totalReviews > 0 && averageRating > 0
      ? averageRating.toFixed(1).replace(".0", "")
      : "Chưa có đánh giá";

  const visibleOptions = showAllOptions
    ? productOptions
    : productOptions.slice(0, 2);

  /* ALL IMAGES */

  const allImages = [
    getImageUrl(product.image),

    ...(product.images?.map((img) => getImageUrl(img.imageUrl)) || []),
  ].filter(Boolean);
  const visibleThumbs = allImages.slice(thumbStart, thumbStart + 3);
  /* CURRENT IMAGE INDEX */

  const currentIndex = allImages.indexOf(selectedImage);

  /* FETCH PRODUCT */

  useEffect(() => {
    let cancelled = false;

    const getSettledValue = (result, fallback) =>
      result.status === "fulfilled" ? result.value : fallback;

    const fetchProduct = async () => {
      setProductLoading(true);
      setRelatedLoading(true);
      setProduct({});
      setSelectedImage("");
      setQuantity(1);
      setThumbStart(0);
      setSelectedOptions({});
      setShowAllOptions(false);
      setActiveFlashSaleProduct(null);
      setActivePromotion(null);
      setActivePromotions([]);
      setActiveFlashSales([]);
      setRelatedProducts([]);
      setReviewSummary(DEFAULT_REVIEW_SUMMARY);

      try {
        const productData = await getProductById(id);

        if (cancelled) {
          return;
        }

        setProduct(productData);
        setSelectedImage(getImageUrl(productData.image));
        setQuantity(1);
        setThumbStart(0);
        setSelectedOptions({});
        setReviewSummary({
          ...DEFAULT_REVIEW_SUMMARY,
          averageRating: Number(productData.averageRating || 0),
          totalReviews: Number(productData.totalReviews || 0),
        });
        setProductLoading(false);

        const [
          flashSaleResult,
          promotionsResult,
          flashSalesResult,
          reviewSummaryResult,
          productsResult,
        ] = await Promise.allSettled([
          getActiveFlashSaleProduct(id),
          getCachedActivePromotions(),
          getCachedActiveFlashSales(),
          getReviewSummary(id),
          getCachedProducts(),
        ]);

        if (cancelled) {
          return;
        }

        const promotionData = getSettledValue(promotionsResult, []);
        const activeFlashSaleList = getSettledValue(flashSalesResult, []);
        const allProducts = getSettledValue(productsResult, []);

        setActiveFlashSaleProduct(getSettledValue(flashSaleResult, null));
        setActivePromotion(
          findActivePromotion(
            Array.isArray(promotionData) ? promotionData : [],
            productData.id,
          ),
        );
        setActivePromotions(Array.isArray(promotionData) ? promotionData : []);
        setActiveFlashSales(
          Array.isArray(activeFlashSaleList) ? activeFlashSaleList : [],
        );
        setReviewSummary(
          getSettledValue(reviewSummaryResult, DEFAULT_REVIEW_SUMMARY) ||
            DEFAULT_REVIEW_SUMMARY,
        );
        setRelatedProducts(buildRelatedProducts(productData, allProducts));
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Khong the tai san pham:", error);

        setProduct({});
        setActiveFlashSaleProduct(null);
        setActivePromotion(null);
        setReviewSummary(DEFAULT_REVIEW_SUMMARY);
        setActivePromotions([]);
        setActiveFlashSales([]);
        setRelatedProducts([]);
      } finally {
        if (!cancelled) {
          setProductLoading(false);
          setRelatedLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (productOptions.length === 0) {
      return;
    }

    const defaultSelectedOptions = {};

    productOptions.forEach((group) => {
      const validValues = group.values?.filter((value) => value.name) || [];

      if (group.groupName && validValues.length > 0) {
        defaultSelectedOptions[group.groupName] = validValues[0];
      }
    });

    setSelectedOptions(defaultSelectedOptions);
  }, [product.options]);

  const buildCartProduct = () => {
    const cartProduct = {
      ...product,

      productId: product.id,

      basePrice: product.price,

      originalPrice: regularPrice,

      price: finalPrice,

      effectivePrice: finalPrice,

      priceSource,

      isFlashSale: priceSource === "FLASH_SALE",

      flashSalePrice: priceSource === "FLASH_SALE" ? finalPrice : null,

      flashSaleItemId:
        priceSource === "FLASH_SALE" ? activeFlashSaleProduct?.itemId : null,

      isPromotion: priceSource === "PROMOTION",

      promotionId: priceSource === "PROMOTION" ? activePromotion?.id : null,

      discountPercent,

      quantity: Number(quantity || 1),

      selectedOptions: {
        ...selectedOptions,
      },
    };

    return cartProduct;
  };

  const validatePurchase = () => {
    if (!product?.id) {
      toast.error("Không tìm thấy thông tin sản phẩm");

      return false;
    }

    const stock = Number(product.stock || 0);

    if (stock <= 0) {
      toast.warning("Sản phẩm hiện đã hết hàng");

      return false;
    }

    if (quantity < 1) {
      toast.warning("Số lượng mua không hợp lệ");

      return false;
    }

    if (quantity > stock) {
      toast.warning(`Sản phẩm chỉ còn ${stock} sản phẩm`);

      return false;
    }

    const missingOption = productOptions.find((group) => {
      const validValues = group.values?.filter((value) => value.name) || [];

      return (
        group.groupName &&
        validValues.length > 0 &&
        !selectedOptions[group.groupName]
      );
    });

    if (missingOption) {
      toast.warning(`Vui lòng chọn ${missingOption.groupName}`);

      return false;
    }

    return true;
  };

  const handleBuyNow = () => {
    if (!validatePurchase()) {
      return;
    }

    const cartProduct = buildCartProduct();

    /*
     * Mua ngay không thêm vào giỏ hàng thường.
     * Chỉ lưu tạm vào sessionStorage để CheckoutPage xử lý riêng.
     */
    saveBuyNowItem(cartProduct);

    const token = localStorage.getItem("token");

    if (!token) {
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login");
      return;
    }

    navigate("/checkout");
  };

  const handleAddToCart = () => {
    if (!validatePurchase()) {
      return;
    }

    const cartProduct = buildCartProduct();

    addToCart(cartProduct);

    toast.success("Đã thêm sản phẩm vào giỏ hàng");
  };

  const getCategoryLink = () => {
    if (!product.category) {
      return "/search";
    }

    return `/search?category=${encodeURIComponent(product.category)}`;
  };

  const getBrandLink = () => {
    const params = new URLSearchParams();

    if (product.category) {
      params.set("category", product.category);
    }

    if (product.brand) {
      params.set("brand", product.brand);
    }

    const queryString = params.toString();

    return queryString ? `/search?${queryString}` : "/search";
  };

  return (
    <>
      <Header />

      <div className="product-detail-breadcrumb-wrap">
        <nav className="product-detail-breadcrumb" aria-label="breadcrumb">
          <Link to="/" className="product-detail-breadcrumb-home">
            <span>⌂</span>
            Trang chủ
          </Link>

          {product.category && (
            <>
              <span className="product-detail-breadcrumb-separator">/</span>

              <Link to={getCategoryLink()}>{product.category}</Link>
            </>
          )}

          {product.brand && (
            <>
              <span className="product-detail-breadcrumb-separator">/</span>

              <Link to={getBrandLink()}>{product.brand}</Link>
            </>
          )}

          {product.name && (
            <>
              <span className="product-detail-breadcrumb-separator">/</span>

              <span className="product-detail-breadcrumb-current">
                {product.name}
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="product-detail-page">
        <div className="product-detail-container">
          {/* LEFT */}

          <div className="product-gallery">
            {/* MAIN IMAGE */}

            <div className="main-image">
              {productLoading ? (
                <div className="product-image-skeleton" aria-hidden="true" />
              ) : selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  onClick={() => setShowFullscreen(true)}
                />
              ) : (
                null
              )}
            </div>

            {/* THUMBNAILS */}

            {/* THUMBNAILS */}

            <div className="thumbnail-wrapper">
              {/* LEFT BUTTON */}

              <button
                className="thumb-btn left"
                onClick={() => {
                  if (thumbStart > 0) {
                    const newStart = thumbStart - 1;

                    setThumbStart(newStart);

                    setSelectedImage(allImages[newStart]);
                  }
                }}
              >
                ❮
              </button>

              {/* THUMBNAIL LIST */}

              <div className="thumbnail-list">
                {visibleThumbs.map((imageUrl, index) => (
                  <img
                    key={thumbStart + index}
                    src={imageUrl}
                    alt=""
                    onClick={() => setSelectedImage(imageUrl)}
                    className={selectedImage === imageUrl ? "active-thumb" : ""}
                  />
                ))}
              </div>

              {/* RIGHT BUTTON */}

              <button
                className="thumb-btn right"
                onClick={() => {
                  if (thumbStart < allImages.length - 3) {
                    const newStart = thumbStart + 1;

                    setThumbStart(newStart);

                    setSelectedImage(allImages[newStart]);
                  }
                }}
              >
                ❯
              </button>
            </div>
          </div>

          {/* CENTER INFO */}

          <div className="product-detail-info">
            <h1>{productLoading ? "Đang tải sản phẩm..." : product.name}</h1>

            <div className="product-brand-row">
              <span>Thương hiệu: {product.brand || "ElectroShop"}</span>

              <span>|</span>

              <span>
                Tình trạng: {product.stock > 0 ? "Còn hàng" : "Hết hàng"}
              </span>
            </div>

            <div className="product-meta">
              <span>
                {totalReviews > 0
                  ? `⭐ ${ratingText} • ${totalReviews} đánh giá`
                  : "⭐ Chưa có đánh giá"}
              </span>

              <span>
                • Đã bán {displaySoldQuantity} • Còn lại {product?.stock || 0}
              </span>
            </div>

            <div className="product-price-row">
              <span className="price-label">Giá:</span>

              <span className="product-price">{formatPrice(finalPrice)}</span>

              {priceSource !== "REGULAR" && (
                <span className="product-flash-badge">
                  {priceSource === "FLASH_SALE"
                    ? `⚡ Flash Sale -${discountPercent}%`
                    : `🏷 Giảm ${discountPercent}%`}
                </span>
              )}
            </div>

            {priceSource !== "REGULAR" ? (
              <div className="market-price-row">
                <span>Giá gốc:</span>

                <del>{formatPrice(regularPrice)}</del>

                <span>Tiết kiệm:</span>

                <strong>{formatPrice(savedAmount)}</strong>
              </div>
            ) : (
              <div className="market-price-row">
                <span>Giá thị trường:</span>

                <del>{Number(finalPrice * 1.15).toLocaleString("vi-VN")}đ</del>

                <span>Tiết kiệm:</span>

                <strong>
                  {Number(finalPrice * 0.15).toLocaleString("vi-VN")}đ
                </strong>
              </div>
            )}

            <div className="variant-box">
              <p>
                Phân loại:
                <strong> Chính hãng</strong>
              </p>
            </div>

            {/* TÙY CHỌN SẢN PHẨM */}

            {productOptions.length > 0 && (
              <div className="product-options-wrapper">
                {visibleOptions
                  .filter(
                    (group) =>
                      group.groupName &&
                      group.values?.some((item) => item.name),
                  )
                  .map((group, groupIndex) => {
                    const validValues = group.values.filter(
                      (item) => item.name,
                    );

                    return (
                      <div className="product-option-group" key={groupIndex}>
                        <h3>{group.groupName}</h3>

                        <div className="product-option-list">
                          {validValues.map((item, itemIndex) => {
                            const isActive =
                              selectedOptions[group.groupName]?.name ===
                              item.name;

                            return (
                              <button
                                type="button"
                                key={itemIndex}
                                className={
                                  isActive
                                    ? "product-option-item active"
                                    : "product-option-item"
                                }
                                onClick={() => {
                                  setSelectedOptions({
                                    ...selectedOptions,

                                    [group.groupName]: item,
                                  });
                                }}
                              >
                                <span className="option-name">{item.name}</span>

                                {item.price && (
                                  <span className="option-price">
                                    {formatPrice(item.price)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                {productOptions.length > 2 && (
                  <button
                    type="button"
                    className="show-more-options-btn"
                    onClick={() => setShowAllOptions(!showAllOptions)}
                  >
                    {showAllOptions ? "Thu gọn tùy chọn" : "Xem thêm tùy chọn"}
                  </button>
                )}
              </div>
            )}

            <div className="quantity-title">Số lượng:</div>

            <div className="quantity-box product-quantity-center">
              <button
                onClick={() => {
                  if (quantity > 1) {
                    setQuantity(quantity - 1);
                  }
                }}
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                onClick={() => {
                  if (quantity < (product.stock || 0)) {
                    setQuantity(quantity + 1);
                  }
                }}
              >
                +
              </button>
            </div>

            <div className="main-buy-actions">
              <button
                type="button"
                className="main-buy-btn"
                onClick={handleBuyNow}
                disabled={!product?.id || Number(product.stock || 0) <= 0}
              >
                🛒 MUA NGAY
                <span>Giao hàng tận nơi hoặc nhận tại cửa hàng</span>
              </button>

              <button
                type="button"
                className="outline-cart-btn full-cart-btn"
                onClick={handleAddToCart}
                disabled={!product?.id || Number(product.stock || 0) <= 0}
              >
                {Number(product.stock || 0) > 0
                  ? "THÊM VÀO GIỎ HÀNG"
                  : "SẢN PHẨM ĐÃ HẾT HÀNG"}
              </button>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}

          <div className="product-side-panel">
            <div className="side-policy-box">
              <h3>CHÍNH SÁCH CỦA CHÚNG TÔI</h3>

              <div className="side-policy-item">
                <span>🚚</span>

                <p>Giao hàng tận nơi - Nhận hàng trả tiền</p>
              </div>

              <div className="side-policy-item">
                <span>🎧</span>

                <p>Tư vấn chu đáo - Hỗ trợ nhanh 24/7</p>
              </div>

              <div className="side-policy-item">
                <span>🔄</span>

                <p>1 đổi 1 nếu sản phẩm lỗi</p>
              </div>
            </div>

            <div className="side-suggest-box">
              <h3>CÓ THỂ BẠN THÍCH</h3>

              {relatedProducts.slice(0, 3).map((item) => (
                  <Link
                    to={`/product/${item.id}`}
                    className="side-suggest-item"
                    key={item.id}
                  >
                    {item.image && <img src={item.image} alt={item.name} />}

                    <div>
                      <p>{item.name}</p>

                      <strong>
                        {Number(item.price || 0).toLocaleString("vi-VN")}đ
                      </strong>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>

        {/* PRODUCT DETAIL CONTENT */}

        <div className="detail-content-section">
          <div className="detail-tabs">
            <button
              type="button"
              className={activeTab === "description" ? "active" : ""}
              onClick={() => setActiveTab("description")}
            >
              MÔ TẢ SẢN PHẨM
            </button>

            <button
              type="button"
              className={activeTab === "policy" ? "active" : ""}
              onClick={() => setActiveTab("policy")}
            >
              CHÍNH SÁCH ĐỔI TRẢ
            </button>

            <button
              type="button"
              className={activeTab === "reviews" ? "active" : ""}
              onClick={() => setActiveTab("reviews")}
            >
              ĐÁNH GIÁ
            </button>
          </div>

          {activeTab === "description" && (
            <>
              <div className="detail-content-grid">
                {/* MÔ TẢ */}

                <div className="detail-content-card detail-description-card">
                  <h3>MÔ TẢ SẢN PHẨM</h3>

                  <p>{product.description}</p>
                </div>

                {/* THÔNG SỐ */}

                <div className="detail-content-card detail-spec-card">
                  <h3>THÔNG SỐ KỸ THUẬT</h3>

                  <div className="specification-table">
                    {specifications
                      .filter((spec) => spec.key || spec.value)
                      .map((spec, index) => (
                        <div className="specification-row" key={index}>
                          <span>{spec.key}</span>

                          <strong>{spec.value}</strong>
                        </div>
                      ))}
                  </div>
                </div>

                {/* ĐIỂM NỔI BẬT */}

                <div className="detail-content-card detail-highlight-card">
                  <h3>ĐIỂM NỔI BẬT</h3>

                  <div className="highlight-list">
                    {highlights
                      .filter((item) => item.title || item.description)
                      .map((item, index) => (
                        <div className="highlight-detail-item" key={index}>
                          <span>{item.icon}</span>

                          <div>
                            <strong>{item.title}</strong>

                            <p>{item.description}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* ƯU ĐÃI */}

              <div className="promotion-detail-section">
                <h3>ƯU ĐÃI KHI MUA HÀNG</h3>

                <div className="promotion-detail-list">
                  {promotions
                    .filter((item) => item.title || item.description)
                    .map((item, index) => (
                      <div className="promotion-detail-item" key={index}>
                        <span>{item.icon}</span>

                        <div>
                          <strong>{item.title}</strong>

                          <p>{item.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "policy" && (
            <div className="return-policy-content">
              <h3>CHÍNH SÁCH ĐỔI – BÁN LẠI SẢN PHẨM:</h3>

              <h4>I. ĐỔI MỚI SẢN PHẨM:</h4>

              <p>
                - Thời gian: trong 15 ngày đầu tiên. Chỉ áp dụng 1 lần và không
                áp dụng cho hình thức trả góp.
              </p>

              <p>- Điều kiện: sản phẩm có lỗi từ nhà sản xuất.</p>

              <p>
                - Lưu ý: Chỉ bao test tại chỗ đối với các vấn đề ngoại hình, màn
                hình có nứt kính, cấn móp, trầy xước hay không. Sau khi ra khỏi
                shop sẽ không được hỗ trợ về các vấn đề này.
              </p>

              <p>
                - Nếu sản phẩm không phù hợp với nhu cầu sử dụng trong 15 ngày
                đầu, Quý khách có thể yêu cầu đổi sang sản phẩm khác có giá trị
                cao hơn sản phẩm hiện tại và bị trừ phí sử dụng theo quy định.
              </p>

              <h4>II. BÁN LẠI SẢN PHẨM:</h4>

              <p>
                Trong 15 ngày đầu, khách hàng có thể trả hoặc bán lại sản phẩm.
                Giá trị thu lại sẽ được tính theo tình trạng máy, hóa đơn và phụ
                kiện đi kèm.
              </p>

              <p>
                Lưu ý: Máy đổi trả phải giữ nguyên hiện trạng ban đầu, không có
                dấu hiệu tháo mở, cấn móp, rơi vỡ, vào nước, dính tài khoản, mất
                vân tay hoặc mất FaceID nếu có.
              </p>

              <h3>CHÍNH SÁCH BẢO HÀNH:</h3>

              <h4>I. CHÍNH SÁCH BẢO HÀNH:</h4>

              <p>
                Thời gian bao test: 15 ngày, sản phẩm sẽ được hỗ trợ 1 đổi 1 nếu
                có lỗi từ nhà sản xuất.
              </p>

              <p>
                Thời gian bảo hành: tùy theo từng sản phẩm và tình trạng sản
                phẩm. Laptop, PC, linh kiện, phụ kiện sẽ áp dụng theo chính sách
                bảo hành của cửa hàng hoặc hãng.
              </p>

              <p>
                Quyền lợi bảo hành: Hỗ trợ sửa chữa hoặc thay thế linh kiện miễn
                phí nếu sản phẩm phát sinh lỗi phần cứng do nhà sản xuất.
              </p>

              <h4>II. ĐIỀU KIỆN TỪ CHỐI BẢO HÀNH:</h4>

              <p>
                - Sản phẩm bị rơi vỡ, cấn móp, trầy xước nặng, vào nước hoặc
                cháy nổ.
              </p>

              <p>- Sản phẩm bị tự ý tháo lắp, sửa chữa tại nơi khác.</p>

              <p>
                - Sản phẩm mất tem bảo hành, mất số serial hoặc thông tin bảo
                hành không còn nguyên vẹn.
              </p>

              <p>
                - Lỗi phát sinh do người dùng sử dụng sai cách, dùng sai nguồn
                điện hoặc cài đặt phần mềm không phù hợp.
              </p>
            </div>
          )}
          {activeTab === "reviews" && product.id && (
            <ProductReviews
              productId={product.id}
              onSummaryChange={setReviewSummary}
            />
          )}
        </div>

        {/* RELATED PRODUCTS */}

        {(relatedLoading || relatedProducts.length > 0) && (
          <div className="related-section">
            <div className="related-section-head">
              <div className="section-header">
                <h2>Sản phẩm tương tự</h2>

                <p>Cùng danh mục, thương hiệu hoặc mức giá gần sản phẩm này</p>
              </div>

              <div className="related-filter-tabs" role="tablist">
                {RELATED_FILTERS.map((filter) => {
                  const count = getRelatedFilterCount(filter.value);
                  const isActive = relatedFilter === filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      className={isActive ? "active" : ""}
                      disabled={count === 0}
                      onClick={() => handleRelatedFilterChange(filter.value)}
                    >
                      {filter.label}
                      <span>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="slider-wrapper">
              {relatedLoading ? (
                <div className="related-skeleton-grid" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div className="related-card-skeleton" key={index} />
                  ))}
                </div>
              ) : filteredRelatedProducts.length > 0 ? (
                <div className="related-slider">
                  {filteredRelatedProducts.map((item) => {
                    const reasonBadges = getRelatedReasonBadges(item);

                    return (
                      <div className="related-product-card-shell" key={item.id}>
                        {reasonBadges.length > 0 && (
                          <div className="related-reason-badges">
                            {reasonBadges.map((badge) => (
                              <span key={badge}>{badge}</span>
                            ))}
                          </div>
                        )}

                        <HomeProductCard
                          product={item}
                          priceInfo={getRelatedPriceInfo(item)}
                          onOpen={() => navigate(`/product/${item.id}`)}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="related-empty-state">
                  Chưa có sản phẩm phù hợp với bộ lọc này.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* FULLSCREEN */}

      {showFullscreen && (
        <div
          className="fullscreen-image"
          onClick={() => setShowFullscreen(false)}
        >
          <img src={selectedImage} alt="" />
        </div>
      )}
    </>
  );
}
