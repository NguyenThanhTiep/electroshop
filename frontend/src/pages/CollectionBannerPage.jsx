import "./CollectionBannerPage.css";

import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

import {
  getSectionBannerDetail,
  getSectionBannerProducts,
} from "../services/homeSectionBannerApi";

export default function CollectionBannerPage() {
  const { bannerId } = useParams();

  const navigate = useNavigate();

  const [banner, setBanner] = useState(null);

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBannerCollection();
  }, [bannerId]);

  const fetchBannerCollection = async () => {
    try {
      setLoading(true);

      const detail = await getSectionBannerDetail(bannerId);

      setBanner(detail?.banner || null);

      if (Array.isArray(detail?.products)) {
        setProducts(detail.products);
      } else {
        const productData = await getSectionBannerProducts(bannerId);

        setProducts(Array.isArray(productData) ? productData : []);
      }
    } catch (error) {
      console.log(error);

      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="collection-banner-page">
      <Header />

      <main className="collection-banner-main">
        <div className="collection-breadcrumb">
          <button type="button" onClick={() => navigate("/")}>
            Trang chủ
          </button>

          <span>/</span>

          <strong>{banner?.title || "Bộ sưu tập sản phẩm"}</strong>
        </div>

        {banner?.imageUrl && (
          <div className="collection-banner-hero">
            <img src={banner.imageUrl} alt={banner.title || "Banner"} />
          </div>
        )}

        <div className="collection-banner-header">
          <div>
            <h1>{banner?.title || "Danh sách sản phẩm"}</h1>

            {banner?.subtitle && <p>{banner.subtitle}</p>}
          </div>

          <span>{products.length} sản phẩm</span>
        </div>

        {loading ? (
          <div className="collection-loading">Đang tải sản phẩm...</div>
        ) : products.length === 0 ? (
          <div className="collection-empty">
            <h2>Chưa có sản phẩm trong banner này</h2>

            <p>
              Bạn hãy vào Admin → Trang chủ → Quản lý banner và chọn sản phẩm
              cho banner này.
            </p>

            <button type="button" onClick={() => navigate("/")}>
              Quay lại trang chủ
            </button>
          </div>
        ) : (
          <div className="collection-product-grid">
            {products.map((product) => (
              <div key={product.id} className="collection-product-item">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
