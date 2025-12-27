# SEO Implementation with Dynamic Store Settings

## 📋 Overview

All SEO components have been updated to use **dynamic store settings** instead of hardcoded values. This makes your website resellable and customizable for different store owners.

---

## 🔧 What Uses Store Settings

### 1. **Store Name**

- Used in: Page titles, meta descriptions, OG tags, schema names
- Source: `settings.storeName` from StoreSettings

### 2. **Store Logo**

- Used in: OG image, Organization schema
- Source: `settings.logo` from StoreSettings

### 3. **Contact Email**

- Used in: Organization schema contactPoint
- Source: `settings.supportEmail` from StoreSettings

### 4. **Phone Number**

- Used in: Organization schema contactPoint
- Source: `settings.phoneNumber` from StoreSettings

### 5. **Currency**

- Used in: Product schema offers priceCurrency
- Source: `settings.currency` from StoreSettings

---

## 📁 Updated Files

### Frontend Components

#### 1. **SEO.jsx** ✅

```jsx
import { useStoreSettings } from "./StoreSettingsContext";

export const SEO = ({ title, description, ... }) => {
  const { settings } = useStoreSettings();
  const storeName = settings?.storeName || "Store";
  const logo = settings?.logo || "/logo-buz.jpg";
  // ... uses dynamic values
}
```

**What it does:**

- `<SEO />` - Generic page SEO with dynamic store info
- `<ProductSEO />` - Product page SEO with brand from store settings
- `<OrganizationSchema />` - Organization structured data from store settings

#### 2. **HomePage.jsx** ✅

```jsx
<SEO
  title={`${settings?.storeName || "Store"} - Quality Products`}
  description={`Shop at ${settings?.storeName || "Store"} for...`}
  image={settings?.logo || "/logo-buz.jpg"}
/>
```

#### 3. **seoHelpers.js** ✅

Updated functions to accept `storeSettings` parameter:

```javascript
export const generateProductSchema = (product, storeSettings = {}) => {
  const storeName = storeSettings.storeName || "Store";
  const currency = storeSettings.currency || "USD";
  // ... uses dynamic values
};
```

### Backend Routes

#### **sitemap.route.js** ✅ (NEW)

Creates dynamic:

- `/robots.txt` - Uses actual domain from request
- `/sitemap.xml` - Static pages list
- `/sitemap-products.xml` - All products

---

## 🚀 How to Use in Your Pages

### Basic Page (HomePage, CategoryPage, etc.)

```jsx
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext";

export default function MyPage() {
  const { settings } = useStoreSettings();

  return (
    <>
      <SEO
        title={`${settings?.storeName || "Store"} | Custom Page Title`}
        description="Custom description"
        image={settings?.logo}
      />
      {/* Page content */}
    </>
  );
}
```

### Product Page

```jsx
import { ProductSEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext";

export default function ViewProductPage() {
  const { settings } = useStoreSettings();
  const [product, setProduct] = useState(null);

  return (
    <>
      {product && (
        <ProductSEO
          productName={product.name}
          productDescription={product.description}
          productImage={product.image}
          productPrice={product.price}
          productUrl={`https://yourdomain.com/product/${product._id}`}
          inStock={product.inStock}
          rating={product.rating}
          reviewCount={product.reviewCount}
          // brand automatically uses settings.storeName
        />
      )}
      {/* Page content */}
    </>
  );
}
```

### Using Schema Helpers

```jsx
import { generateProductSchema } from "../utils/seoHelpers";
import { useStoreSettings } from "../components/StoreSettingsContext";

export default function MyComponent() {
  const { settings } = useStoreSettings();

  const schema = generateProductSchema(product, settings);

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      {/* Component content */}
    </>
  );
}
```

---

## 📝 Files That Still Need SEO Implementation

Add SEO components to these pages:

### 1. **ViewProductPage.jsx**

```jsx
import { ProductSEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext";

// Inside component:
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
    {/* rest of page */}
  </>
);
```

### 2. **CategoryPage.jsx**

```jsx
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext";

// Inside component:
return (
  <>
    <SEO
      title={`${categoryName} | ${settings?.storeName || "Store"}`}
      description={`Browse our ${categoryName} collection`}
      image={settings?.logo}
    />
    {/* rest of page */}
  </>
);
```

### 3. **SearchResultsPage.jsx**

```jsx
import { SEO } from "../components/SEO";

// Inside component:
return (
  <>
    <SEO
      title={`Search: "${query}" | ${settings?.storeName || "Store"}`}
      description={`Search results for "${query}"`}
    />
    {/* rest of page */}
  </>
);
```

### 4. **LoginPage.jsx, SignUpPage.jsx**

```jsx
import { SEO } from "../components/SEO";

return (
  <>
    <SEO
      title={`Login | ${settings?.storeName || "Store"}`}
      description="Login to your account"
    />
    {/* page content */}
  </>
);
```

---

## 🔄 Data Flow

```
StoreSettings Database
        ↓
StoreSettingsContext (fetched on app load)
        ↓
useStoreSettings() hook
        ↓
SEO Components & Pages
        ↓
Meta tags, schema, titles updated dynamically
```

---

## 🌐 Backend Routes

### Dynamic Sitemap Routes

Added to `/backend/routes/sitemap.route.js`:

1. **`GET /robots.txt`**

   - Dynamically generated based on request domain
   - Tells search engines which pages to crawl
   - Automatically includes sitemap URL

2. **`GET /sitemap.xml`**

   - Lists static pages (home, products, categories)
   - Uses actual domain from request

3. **`GET /sitemap-products.xml`**
   - Lists all products from database
   - Updates automatically as products change
   - Includes lastmod date for each product

### How to Use

Already added to `server.js`:

```javascript
import sitemapRoutes from "./routes/sitemap.route.js";
app.use("/", sitemapRoutes);
```

---

## ✅ Store Settings Configuration

In your admin panel, users can configure:

```javascript
{
  storeName: "My Awesome Store",      // Used in titles, meta, schema
  logo: "https://cdn.../logo.png",    // Used in OG image
  supportEmail: "help@store.com",     // Used in schema contactPoint
  phoneNumber: "+234-XXX-XXXX",       // Used in schema contactPoint
  currency: "NGN",                     // Used in product schema
  // ... other settings
}
```

All SEO components will automatically use these values.

---

## 🧪 Testing

### 1. Check Meta Tags

Open browser DevTools → Inspect → <head>

- Verify store name appears in titles
- Verify logo appears in OG images

### 2. Test Robots.txt

Visit: `https://yourdomain.com/robots.txt`
Should display dynamic content with your domain

### 3. Test Sitemap

Visit: `https://yourdomain.com/sitemap.xml`
Should show static pages

Visit: `https://yourdomain.com/sitemap-products.xml`
Should list all products

### 4. Validate Structured Data

- Google Rich Results Test: https://search.google.com/test/rich-results
- Should show Product, Organization schemas with correct info

---

## 📋 Implementation Checklist

### Frontend

- [x] SEO.jsx updated with useStoreSettings
- [x] HomePage.jsx updated with dynamic SEO
- [x] seoHelpers.js updated to accept storeSettings
- [x] index.html generic meta tags (no hardcoded store name)
- [ ] ViewProductPage.jsx - Add ProductSEO
- [ ] CategoryPage.jsx - Add SEO
- [ ] SearchResultsPage.jsx - Add SEO
- [ ] Other pages - Add SEO where appropriate

### Backend

- [x] sitemap.route.js created with dynamic routes
- [x] server.js updated to use sitemap routes
- [x] Robots.txt endpoint created
- [x] Sitemap.xml endpoints created
- [x] SEO headers added to server

### External

- [ ] Deploy to production
- [ ] Update StoreSettings with real store name, logo, email
- [ ] Submit `/sitemap.xml` to Google Search Console
- [ ] Submit `/sitemap.xml` to Bing Webmaster Tools
- [ ] Test with Google Rich Results Test
- [ ] Monitor search performance

---

## 🎯 Key Points

1. **No Hardcoded Values** - Store name, logo, etc. come from database
2. **Resellable** - Each customer can configure their own store name
3. **Dynamic Sitemaps** - Automatically updates as products change
4. **Professional SEO** - Schema.org structured data included
5. **Mobile Optimized** - Meta tags for all devices

---

## 🚀 Next Steps

1. Test the current implementation locally
2. Add SEO components to remaining pages
3. Deploy to production
4. Configure StoreSettings with your store information
5. Submit sitemaps to Google Search Console
6. Monitor performance

---

**Your SEO is now fully dynamic and ready to resell! 🎉**
