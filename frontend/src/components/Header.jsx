import "./Header.css";

import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  MapPin,
  Search,
  UserRound,
  PackageCheck,
  ShoppingCart,
  Menu,
  Flame,
  Monitor,
  Laptop,
  Gamepad2,
  Tag,
  Cpu,
  Sparkles,
  Star,
  BadgePercent,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import { getProducts } from "../services/productApi";

import { getCart } from "../utils/cartUtils";

const SEARCH_SUGGESTION_LIMIT = 20;

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSectionById = (sectionId, attempt = 0) => {
    const element = document.getElementById(sectionId);

    if (!element) {
      if (attempt < 40) {
        setTimeout(() => {
          scrollToSectionById(sectionId, attempt + 1);
        }, 50);
      }

      return;
    }

    const headerHeight =
      document.querySelector(".main-header")?.offsetHeight || 0;

    const targetTop =
      element.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  };

  const scrollToHomeSection = (sectionId) => {
    const targetUrl = `/?section=${sectionId}&scroll=${Date.now()}`;

    if (location.pathname !== "/") {
      navigate(targetUrl);
      return;
    }

    window.history.replaceState(null, "", targetUrl);

    requestAnimationFrame(() => {
      scrollToSectionById(sectionId);
    });
  };

  const searchRef = useRef(null);

  const userMenuRef = useRef(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [keyword, setKeyword] = useState("");

  const [products, setProducts] = useState([]);

  const [cartCount, setCartCount] = useState(0);

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("currentUser");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const savedRole = localStorage.getItem("role");

      if (savedRole) {
        return savedRole;
      }

      const savedUser = localStorage.getItem("currentUser");
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;

      return parsedUser?.role || "";
    } catch {
      return "";
    }
  });

  const normalizeRole = (role) => {
    return String(role || "")
      .trim()
      .toUpperCase();
  };

  const isAdminUser = ["ADMIN", "ROLE_ADMIN"].includes(
    normalizeRole(currentRole || currentUser?.role),
  );

  const userRoleLabel = isAdminUser ? "Quản trị viên" : "Khách hàng";

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = getCart();

      const totalQuantity = cart.reduce(
        (total, item) => total + Number(item.quantity || 1),
        0,
      );

      setCartCount(totalQuantity);
    };

    const syncCurrentUser = () => {
      try {
        const savedUser = localStorage.getItem("currentUser");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;

        setCurrentUser(parsedUser);

        const savedRole = localStorage.getItem("role");

        setCurrentRole(savedRole || parsedUser?.role || "");
      } catch {
        setCurrentUser(null);
        setCurrentRole("");
      }

      updateCartCount();
    };

    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("authChanged", syncCurrentUser);
    window.addEventListener("storage", syncCurrentUser);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("authChanged", syncCurrentUser);
      window.removeEventListener("storage", syncCurrentUser);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  const formatPrice = (price) => {
    if (!price) {
      return "Đang cập nhật";
    }

    return Number(price).toLocaleString("vi-VN") + "đ";
  };

  const searchResults = useMemo(() => {
    const text = normalizeText(keyword);

    if (!text) {
      return [];
    }

    const searchTokens = text.split(/\s+/).filter(Boolean);

    return products.filter((product) => {
      const name = normalizeText(product.name);
      const category = normalizeText(product.category);
      const brand = normalizeText(product.brand);

      const searchableText = `${name} ${category} ${brand}`;

      return searchTokens.every((token) => searchableText.includes(token));
    });
  }, [keyword, products]);

  const visibleSearchResults = useMemo(() => {
    return searchResults.slice(0, SEARCH_SUGGESTION_LIMIT);
  }, [searchResults]);

  const hasMoreSearchResults =
    searchResults.length > visibleSearchResults.length;

  const suggestedProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  const handleSearch = (e) => {
    e.preventDefault();

    const text = keyword.trim();

    if (!text) {
      setIsSearchOpen(true);

      return;
    }

    setIsSearchOpen(false);

    navigate(`/search?keyword=${encodeURIComponent(text)}`);
  };

  const handleViewAllSearchResults = () => {
    const text = keyword.trim();

    if (!text) {
      return;
    }

    setIsSearchOpen(false);

    navigate(`/search?keyword=${encodeURIComponent(text)}`);
  };

  const handleGoProduct = (productId) => {
    setKeyword("");

    setIsSearchOpen(false);

    navigate(`/product/${productId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("currentUser");

    setCurrentUser(null);
    setCurrentRole("");
    setIsUserMenuOpen(false);

    window.dispatchEvent(new Event("authChanged"));
    window.dispatchEvent(new Event("cartUpdated"));

    navigate("/login");
  };

  return (
    <header className="main-header">
      {/* TOP HEADER */}

      <div className="top-header">
        <div className="header-left">
          <Link to="/" className="logo">
            <span>Electro</span>
            <b>Shop</b>
          </Link>

          <Link to="/contact" className="address">
            <MapPin size={20} />

            <div>
              <span>Giao hàng</span>
              <strong>Toàn quốc</strong>
            </div>
          </Link>
        </div>

        <div className="header-search-wrapper" ref={searchRef}>
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, danh mục..."
              value={keyword}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setKeyword(e.target.value);

                setIsSearchOpen(true);
              }}
            />

            <button type="submit">
              <Search size={27} />
            </button>
          </form>

          {isSearchOpen && (
            <div className="search-suggestion-box">
              {keyword.trim() ? (
                <>
                  <div className="search-suggestion-title">
                    <span>🔎</span>

                    <strong>Kết quả tìm kiếm</strong>

                    <small>{searchResults.length} sản phẩm</small>
                  </div>

                  {searchResults.length > 0 ? (
                    <>
                      <div className="search-suggestion-list">
                        {visibleSearchResults.map((product) => (
                          <div
                            className="search-suggestion-item"
                            key={product.id}
                            onClick={() => handleGoProduct(product.id)}
                          >
                            <img src={product.image} alt={product.name} />

                            <div>
                              <h4>{product.name}</h4>

                              <p>{formatPrice(product.price)}</p>

                              <span>
                                {product.category} • {product.brand}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {hasMoreSearchResults && (
                        <button
                          type="button"
                          className="search-view-all-btn"
                          onClick={handleViewAllSearchResults}
                        >
                          Xem tất cả {searchResults.length} sản phẩm phù hợp
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="search-empty-mini">
                      Không tìm thấy sản phẩm phù hợp.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="search-suggestion-title">
                    <span>⚡</span>

                    <strong>Bạn muốn tìm gì hôm nay?</strong>
                  </div>

                  <div className="search-keyword-row">
                    <button type="button" onClick={() => setKeyword("Laptop")}>
                      Laptop
                    </button>

                    <button
                      type="button"
                      onClick={() => setKeyword("PC Gaming")}
                    >
                      PC Gaming
                    </button>

                    <button type="button" onClick={() => setKeyword("RTX")}>
                      RTX
                    </button>

                    <button
                      type="button"
                      onClick={() => setKeyword("Gaming Gear")}
                    >
                      Gaming Gear
                    </button>
                  </div>

                  <div className="search-suggestion-subtitle">Đừng bỏ lỡ</div>

                  <div className="search-suggestion-grid">
                    {suggestedProducts.map((product) => (
                      <div
                        className="search-mini-product"
                        key={product.id}
                        onClick={() => handleGoProduct(product.id)}
                      >
                        <div>
                          <h4>{product.name}</h4>

                          <p>{formatPrice(product.price)}</p>
                        </div>

                        <img src={product.image} alt={product.name} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="header-right">
          {currentUser ? (
            <div className="header-user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="header-item header-user-logged"
                onClick={() => setIsUserMenuOpen((current) => !current)}
              >
                <UserRound size={24} />

                <div>
                  <span>
                    {currentUser.fullName ||
                      currentUser.firstName ||
                      "Tài khoản"}
                  </span>

                  <small>{userRoleLabel}</small>
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="header-user-dropdown">
                  <div className="header-user-info">
                    <strong>
                      {currentUser.fullName ||
                        currentUser.firstName ||
                        "Khách hàng"}
                    </strong>

                    <span>{currentUser.email || ""}</span>
                  </div>

                  <Link to="/orders" onClick={() => setIsUserMenuOpen(false)}>
                    Đơn hàng của tôi
                  </Link>

                  {isAdminUser && (
                    <Link
                      to="/admin"
                      className="header-admin-link"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Trang quản trị
                    </Link>
                  )}

                  <button
                    type="button"
                    className="header-logout-btn"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login">
              <div className="header-item">
                <UserRound size={24} />

                <div>
                  <span>Đăng nhập</span>
                  <small>Tài khoản</small>
                </div>
              </div>
            </Link>
          )}

          <Link to="/orders">
            <div className="header-item">
              <PackageCheck size={24} />

              <div>
                <span>Đơn hàng</span>
                <small>Theo dõi</small>
              </div>
            </div>
          </Link>

          <Link to="/cart">
            <div className="header-item cart-header-item">
              <ShoppingCart size={24} />

              <div>
                <span>Giỏ hàng</span>
                <small>Sản phẩm</small>
              </div>

              <em>{cartCount}</em>
            </div>
          </Link>
        </div>
      </div>

      {/* MENU */}

      <nav className="menu-bar">
        <Link
          to="/?section=flash-sale"
          className="menu-flash"
          onClick={(e) => {
            e.preventDefault();

            scrollToHomeSection("flash-sale");
          }}
        >
          <Flame size={22} />
          <span>Flash Sale</span>
        </Link>

        <Link
          to="/?section=coupons"
          onClick={(e) => {
            e.preventDefault();

            scrollToHomeSection("coupons");
          }}
        >
          <Tag size={22} />
          <span>Mã giảm giá</span>
        </Link>

        <Link
          to="/?section=new-arrival"
          onClick={(e) => {
            e.preventDefault();

            scrollToHomeSection("new-arrival");
          }}
        >
          <Sparkles size={22} />
          <span>Hàng mới</span>
        </Link>

        <Link
          to="/?section=featured-tabs"
          onClick={(e) => {
            e.preventDefault();

            scrollToHomeSection("featured-tabs");
          }}
        >
          <Star size={22} />
          <span>Sản phẩm nổi bật</span>
        </Link>

        <Link to="/search?sort=newest&page=promotion">
          <BadgePercent size={22} />
          <span>Khuyến mãi</span>
        </Link>
      </nav>
    </header>
  );
}
