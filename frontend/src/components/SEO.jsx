import { Helmet } from "react-helmet-async";
import { useStoreSettings } from "./StoreSettingsContext";

/**
 * SEO Component - Wrapper for adding meta tags to pages
 * Usage: <SEO title="Page Title" description="Page description" />
 */
export const SEO = ({
  title,
  description,
  image,
  url,
  type = "website",
  canonicalUrl,
  author,
  twitterHandle,
}) => {
  const { settings } = useStoreSettings();

  // Use dynamic store settings or fallbacks
  const storeName = settings?.storeName || "Store";
  const logo = settings?.logo || "/logo-buz.jpg";
  const storeEmail = settings?.supportEmail || "support@store.com";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : url || "https://yourdomain.com";

  const finalTitle = title || `${storeName} - Quality Products`;
  const finalDescription = description || `Shop at ${storeName} for quality products and great deals`;
  const finalImage = image || logo;
  const finalUrl = url || baseUrl;
  const finalAuthor = author || storeName;
  const currentUrl = canonicalUrl || finalUrl || baseUrl;

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="author" content={finalAuthor} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={storeName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
    </Helmet>
  );
};

/**
 * Product SEO Component - Specialized for product pages
 */
export const ProductSEO = ({
  productName,
  productDescription,
  productImage,
  productPrice,
  productUrl,
  inStock = true,
  rating,
  reviewCount = 0,
  brand,
}) => {
  const { settings } = useStoreSettings();
  const storeName = settings?.storeName || "Store";
  const finalBrand = brand || storeName;

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: productName,
    description: productDescription,
    image: productImage,
    brand: {
      "@type": "Brand",
      name: finalBrand,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: settings?.currency || "USD",
      price: productPrice,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating,
        reviewCount: reviewCount,
      },
    }),
  };

  return (
    <>
      <SEO
        title={`${productName} | ${storeName}`}
        description={productDescription}
        image={productImage}
        url={productUrl}
        type="product"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
    </>
  );
};

/**
 * Organization Schema Component
 */
export const OrganizationSchema = () => {
  const { settings } = useStoreSettings();
  const storeName = settings?.storeName || "Store";
  const logo = settings?.logo || "/logo-buz.jpg";
  const email = settings?.supportEmail || "support@store.com";
  const phone = settings?.phoneNumber || "";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: baseUrl,
    logo: logo.startsWith("http") ? logo : `${baseUrl}${logo}`,
    description: `Shop at ${storeName} for quality products and great deals`,
    sameAs: [
      // Add your social media URLs
      // "https://www.facebook.com/yourpage",
      // "https://www.instagram.com/yourpage",
      // "https://www.twitter.com/yourpage",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: email,
      ...(phone && { telephone: phone }),
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
      // Add your actual address from warehouseLocation
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default SEO;;
