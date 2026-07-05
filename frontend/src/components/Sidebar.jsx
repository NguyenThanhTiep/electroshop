import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { getCategories } from "../services/categoryApi";

import { getBrands } from "../services/brandApi";

export default function Sidebar() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [brands, setBrands] = useState([]);

  const [openCategory, setOpenCategory] = useState(null);

  useEffect(() => {
    fetchCategories();

    fetchBrands();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();

      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await getBrands();

      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const normalizeText = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase();
  };

  const getBrandCategoryName = (brand) => {
    return brand.category?.name || brand.category || "";
  };

  const getBrandsByCategory = (categoryName) => {
    return brands.filter(
      (brand) =>
        normalizeText(getBrandCategoryName(brand)) ===
        normalizeText(categoryName),
    );
  };

  const toggleCategory = (categoryName) => {
    setOpenCategory(openCategory === categoryName ? null : categoryName);
  };

  const handleGoCategory = (categoryName) => {
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  const handleGoBrand = (categoryName, brandName) => {
    navigate(
      `/search?category=${encodeURIComponent(categoryName)}&brand=${encodeURIComponent(brandName)}`,
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-menu-heading">
        <div className="sidebar-menu-heading-icon">🛍️</div>

        <div>
          <strong>Danh mục</strong>
          <span>Sản phẩm nổi bật</span>
        </div>
      </div>

      <div className="sidebar-scroll">
        <ul>
          {categories.map((category) => {
            const categoryBrands = getBrandsByCategory(category.name);

            const isOpen = openCategory === category.name;

            return (
              <li
                className={
                  isOpen ? "sidebar-category active" : "sidebar-category"
                }
                key={category.id}
              >
                <div
                  className="sidebar-category-title"
                  onClick={() => {
                    if (categoryBrands.length > 0) {
                      toggleCategory(category.name);

                      return;
                    }

                    handleGoCategory(category.name);
                  }}
                >
                  <div className="sidebar-category-left">
                    <span className="sidebar-category-icon">
                      {category.icon || "💻"}
                    </span>

                    <span>{category.name}</span>
                  </div>

                  <span
                    className={isOpen ? "sidebar-arrow open" : "sidebar-arrow"}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (categoryBrands.length > 0) {
                        toggleCategory(category.name);
                        return;
                      }

                      handleGoCategory(category.name);
                    }}
                  >
                    ❯
                  </span>
                </div>

                {isOpen && categoryBrands.length > 0 && (
                  <div className="sidebar-brand-list">
                    <div
                      className="sidebar-brand-item all-brand"
                      onClick={() => handleGoCategory(category.name)}
                    >
                      Tất cả {category.name}
                    </div>

                    {categoryBrands.map((brand) => (
                      <div
                        className="sidebar-brand-item"
                        key={brand.id}
                        onClick={() => handleGoBrand(category.name, brand.name)}
                      >
                        {brand.name}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}

          <li
            className="sidebar-sale"
            onClick={() =>
              navigate(`/?section=flash-sale&scroll=${Date.now()}`)
            }
          >
            🔥 Flash Sale
          </li>
        </ul>
      </div>
    </div>
  );
}
