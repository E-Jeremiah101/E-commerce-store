# SEO Implementation Examples - Copy & Paste Ready

## 1. HomePage.jsx (Already Done ✅)

```jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore.js";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import axios from "../lib/axios";
import FeaturedProducts from "../components/FeaturedProducts.jsx";
import { Link } from "react-router-dom";
import FAQSection from "../components/FAQSection.jsx";
import Footer from "../components/Footer.jsx";
import HeroSlider from "../components/HeroSlider.jsx";
import OtherFeatures from "../components/OtherFeatures.jsx";
import LandingProducts from "../components/LandingProducts.jsx";
import { SEO, OrganizationSchema } from "../components/SEO";

const HomePage = () => {
  const { settings } = useStoreSettings();

  return (
    <motion.div>
      {/* SEO Meta Tags */}
      <SEO
        title={`${
          settings?.storeName || "Store"
        } - Quality Products at Great Prices`}
        description={`Shop at ${
          settings?.storeName || "Store"
        } for quality products...`}
        image={settings?.logo || "/logo-buz.jpg"}
      />

      {/* Organization Schema */}
      <OrganizationSchema />

      {/* Rest of your page... */}
    </motion.div>
  );
};

export default HomePage;
```

---

## 2. ViewProductPage.jsx (Todo)

```jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductSEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import { useProductStore } from "../stores/useProductStore.js";

const ViewProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { settings } = useStoreSettings();
  const { fetchProductById } = useProductStore();

  useEffect(() => {
    const loadProduct = async () => {
      const data = await fetchProductById(id);
      setProduct(data);
    };
    loadProduct();
  }, [id, fetchProductById]);

  return (
    <>
      {/* Add ProductSEO when product loads */}
      {product && (
        <ProductSEO
          productName={product.name}
          productDescription={product.description || "Quality product"}
          productImage={product.images?.[0] || "/placeholder.jpg"}
          productPrice={product.price}
          productUrl={`${window.location.origin}/product/${product._id}`}
          inStock={product.stock > 0}
          rating={product.averageRating || 0}
          reviewCount={product.reviews?.length || 0}
          // brand automatically uses settings.storeName
        />
      )}

      {/* Rest of your product page... */}
      <div className="product-container">{/* Your existing product UI */}</div>
    </>
  );
};

export default ViewProductPage;
```

---

## 3. CategoryPage.jsx (Todo)

```jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import axios from "../lib/axios";

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const { settings } = useStoreSettings();

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await axios.get(`/categories/${categoryName}`);
        setCategory(res.data);
        setProducts(res.data.products || []);
      } catch (error) {
        console.error("Error fetching category:", error);
      }
    };
    fetchCategory();
  }, [categoryName]);

  const categoryDescription = `Browse our collection of ${categoryName} products. Find quality items with great prices and fast shipping.`;

  return (
    <>
      {/* Add SEO with category name */}
      <SEO
        title={`${categoryName} | ${settings?.storeName || "Store"}`}
        description={categoryDescription}
        image={category?.image || settings?.logo || "/logo-buz.jpg"}
        url={`${window.location.origin}/category/${categoryName}`}
      />

      {/* Rest of your category page... */}
      <div className="category-container">
        <h1>{categoryName}</h1>
        {/* Your products grid */}
      </div>
    </>
  );
};

export default CategoryPage;
```

---

## 4. SearchResultsPage.jsx (Todo)

```jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import axios from "../lib/axios";

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useStoreSettings();

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;

      try {
        const res = await axios.get(`/products/search?q=${query}`);
        setResults(res.data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <>
      {/* Add SEO with search query */}
      <SEO
        title={`Search Results for "${query}" | ${
          settings?.storeName || "Store"
        }`}
        description={`Found ${results.length} products matching "${query}". Shop now!`}
        url={`${window.location.origin}/search?q=${query}`}
      />

      {/* Rest of search results page... */}
      <div className="search-results">
        <h1>Search Results for "{query}"</h1>
        {loading ? (
          <p>Loading...</p>
        ) : results.length > 0 ? (
          /* Your results grid */
          <></>
        ) : (
          <p>No products found matching "{query}"</p>
        )}
      </div>
    </>
  );
};

export default SearchResultsPage;
```

---

## 5. LoginPage.jsx (Todo)

```jsx
import { useState } from "react";
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { settings } = useStoreSettings();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // Your login logic here
  };

  return (
    <>
      {/* SEO for login page */}
      <SEO
        title={`Login to Your Account | ${settings?.storeName || "Store"}`}
        description={`Login to your ${
          settings?.storeName || "Store"
        } account to view orders and manage preferences.`}
      />

      {/* Your login form */}
      <div className="login-container">
        <h1>Login</h1>
        <form onSubmit={handleLogin}>{/* Your form fields */}</form>
      </div>
    </>
  );
};

export default LoginPage;
```

---

## 6. SignUpPage.jsx (Todo)

```jsx
import { useState } from "react";
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";

const SignUpPage = () => {
  const [formData, setFormData] = useState({});
  const { settings } = useStoreSettings();

  const handleSignUp = async (e) => {
    e.preventDefault();
    // Your signup logic here
  };

  return (
    <>
      {/* SEO for signup page */}
      <SEO
        title={`Create Account | ${settings?.storeName || "Store"}`}
        description={`Sign up for a ${
          settings?.storeName || "Store"
        } account to shop and track orders.`}
      />

      {/* Your signup form */}
      <div className="signup-container">
        <h1>Create Account</h1>
        <form onSubmit={handleSignUp}>{/* Your form fields */}</form>
      </div>
    </>
  );
};

export default SignUpPage;
```

---

## 7. CartPage.jsx (Todo)

```jsx
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import { useCartStore } from "../stores/useCartStore";

const CartPage = () => {
  const { cart } = useCartStore();
  const { settings } = useStoreSettings();

  return (
    <>
      {/* SEO for cart page */}
      <SEO
        title={`Shopping Cart | ${settings?.storeName || "Store"}`}
        description={`View and manage items in your shopping cart.`}
      />

      {/* Your cart content */}
      <div className="cart-container">
        <h1>Shopping Cart</h1>
        {cart.length > 0 ? (
          /* Your cart items */
          <></>
        ) : (
          <p>Your cart is empty</p>
        )}
      </div>
    </>
  );
};

export default CartPage;
```

---

## 8. OrderHistoryPage.jsx (Todo)

```jsx
import { useEffect, useState } from "react";
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import axios from "../lib/axios";

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const { settings } = useStoreSettings();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/orders/my-orders");
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  return (
    <>
      {/* SEO for orders page */}
      <SEO
        title={`Order History | ${settings?.storeName || "Store"}`}
        description={`View your order history and track deliveries.`}
      />

      {/* Your orders content */}
      <div className="orders-container">
        <h1>Order History</h1>
        {orders.length > 0 ? (
          /* Your orders list */
          <></>
        ) : (
          <p>No orders yet</p>
        )}
      </div>
    </>
  );
};

export default OrderHistoryPage;
```

---

## Implementation Checklist

Copy this implementation list into each file:

- [ ] Import `SEO` or `ProductSEO` from `../components/SEO`
- [ ] Import `useStoreSettings` from `../components/StoreSettingsContext.jsx`
- [ ] Add `<SEO />` component with dynamic title/description
- [ ] Use `settings?.storeName` for store name
- [ ] Use `settings?.logo` for image
- [ ] Test in browser DevTools
- [ ] Verify in Google Rich Results Test

---

## Quick Copy-Paste Template

```jsx
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";

const MyPage = () => {
  const { settings } = useStoreSettings();

  return (
    <>
      <SEO
        title={`Page Title | ${settings?.storeName || "Store"}`}
        description={`Page description`}
        image={settings?.logo || "/logo-buz.jpg"}
      />

      {/* Your page content */}
    </>
  );
};

export default MyPage;
```

---

## For Product Pages

```jsx
import { ProductSEO } from "../components/SEO";

const ProductPage = () => {
  const [product, setProduct] = useState(null);

  return (
    <>
      {product && (
        <ProductSEO
          productName={product.name}
          productDescription={product.description}
          productImage={product.image}
          productPrice={product.price}
          productUrl={`${window.location.origin}/product/${product._id}`}
          inStock={product.inStock}
          rating={product.rating}
          reviewCount={product.reviewCount}
        />
      )}

      {/* Your product content */}
    </>
  );
};

export default ProductPage;
```

---

That's it! Just follow these patterns for all your pages. 🚀
