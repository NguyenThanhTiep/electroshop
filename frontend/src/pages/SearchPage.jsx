import "./SearchPage.css";

import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { getProducts } from "../services/productApi";

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

  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const normalizeText = (value) => {
    return String(value || "")
      .toLowerCase()
      .trim();
  };

  const searchResults = useMemo(() => {
    let result = [...products];

    const text = normalizeText(keyword);

    const category = normalizeText(categoryParam);

    const brand = normalizeText(brandParam);

    const minPrice = Number(minPriceParam) || 0;

    const maxPrice = Number(maxPriceParam) || 0;

    /*
        Có keyword thì lọc theo:
        - tên sản phẩm
        - danh mục
        - thương hiệu
      */
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

    /*
        Lọc theo danh mục.
        Dùng so sánh mềm để tránh lỗi:
        Laptop vs laptop vs Laptop Gaming
      */
    if (category) {
      result = result.filter((product) => {
        const productCategory = normalizeText(product.category);

        return (
          productCategory === category ||
          productCategory.includes(category) ||
          category.includes(productCategory)
        );
      });
    }

    /*
        Lọc theo thương hiệu.
        Dùng so sánh mềm để tránh lỗi:
        ASUS vs Asus vs asus
      */
    if (brand) {
      result = result.filter((product) => {
        const productBrand = normalizeText(product.brand);

        return (
          productBrand === brand ||
          productBrand.includes(brand) ||
          brand.includes(productBrand)
        );
      });
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
  }, [
    products,
    keyword,
    categoryParam,
    brandParam,
    minPriceParam,
    maxPriceParam,
    sortParam,
  ]);

  const getResultDescription = () => {
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

  return (
    <div className="search-page">
      <Header />

      <div className="search-breadcrumb">
        <Link to="/">Trang chủ</Link>

        <span>›</span>

        <strong>{isPromotionPage ? "Khuyến mãi" : "Tìm kiếm"}</strong>
      </div>

      <section className="search-result-wrapper">
        <div className="search-result-title">
          {isPromotionPage ? (
            <div className="promotion-page-heading">
              <h1>Sản phẩm đang khuyến mãi</h1>

              <p>Tổng hợp các sản phẩm có ưu đãi tốt nhất tại ElectroShop</p>
            </div>
          ) : (
            <>
              <h2>Có {searchResults.length} kết quả tìm kiếm phù hợp</h2>

              <p>{getResultDescription()}</p>
            </>
          )}
        </div>

        {searchResults.length > 0 ? (
          <div className="search-product-grid">
            {searchResults.map((product) => (
              <div
                className="search-home-card"
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="search-sale-badge">Giảm 10%</div>

                <div className="search-installment">Trả góp 0%</div>

                <div className="search-card-image">
                  <img src={product.image} alt={product.name} />
                </div>

                <div className="search-card-info">
                  <h3>{product.name}</h3>

                  <p className="search-card-price">
                    {Number(product.price || 0).toLocaleString("vi-VN")}đ
                  </p>

                  <div className="search-discount blue">
                    Thành viên giảm thêm 300.000đ
                  </div>

                  <div className="search-discount purple">
                    Sinh viên giảm thêm 200.000đ
                  </div>

                  <p className="search-gift">
                    Trả góp 0% - Đổi trả dễ dàng trong 7 ngày
                  </p>

                  <div className="search-card-bottom">
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
            ))}
          </div>
        ) : (
          <div className="search-empty-page">
            <div className="search-empty-icon">🔍</div>

            <h3>Không tìm thấy sản phẩm phù hợp</h3>

            <p>
              Hãy thử tìm bằng tên sản phẩm, danh mục, thương hiệu hoặc khoảng
              giá khác.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
