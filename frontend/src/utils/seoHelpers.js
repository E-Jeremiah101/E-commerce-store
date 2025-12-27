/**
 * SEO Helper functions for meta tag management
 * NOTE: This file contains helper functions. For actual implementation,
 * use the SEO component in frontend/src/components/SEO.jsx which uses
 * dynamic store settings via useStoreSettings hook.
 */

// This function is kept for reference but you should use the SEO component instead
// as it automatically pulls store name, logo, and contact info from store settings
export const generateSEOMetaTags = (config = {}, storeSettings = {}) => {
  const storeName = storeSettings.storeName || "Store";
  const logo = storeSettings.logo || "/logo-buz.jpg";

  const {
    title = `${storeName} - Quality Products`,
    description = `Shop at ${storeName} for quality products and great deals`,
    url = typeof window !== "undefined" ? window.location.href : "",
    image = logo,
    type = "website",
    author = storeName,
    canonicalUrl = url,
  } = config;

  return {
    title,
    meta: [
      {
        name: "description",
        content: description,
      },
      {
        name: "og:title",
        property: "og:title",
        content: title,
      },
      {
        name: "og:description",
        property: "og:description",
        content: description,
      },
      {
        property: "og:type",
        content: type,
      },
      {
        property: "og:url",
        content: url,
      },
      {
        property: "og:image",
        content: image,
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: title,
      },
      {
        name: "twitter:description",
        content: description,
      },
      {
        name: "twitter:image",
        content: image,
      },
      {
        name: "author",
        content: author,
      },
    ],
    link: [
      {
        rel: "canonical",
        href: canonicalUrl,
      },
    ],
  };
};

/**
 * Generate product schema for structured data
 * @param {Object} product - Product details
 * @param {Object} storeSettings - Store settings with currency and name
 * @returns {Object} JSON-LD schema
 */
export const generateProductSchema = (product, storeSettings = {}) => {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://yourdomain.com";
  const storeName = storeSettings.storeName || "Store";
  const currency = storeSettings.currency || "USD";

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      "@type": "Brand",
      name: product.brand || storeName,
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/product/${product.id}`,
      priceCurrency: currency,
      price: product.price,
      availability:
        product.inStock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: storeName,
      },
    },
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 0,
      },
    }),
  };
};

/**
 * Generate organization schema
 * NOTE: Use the OrganizationSchema component from SEO.jsx instead
 * as it automatically pulls data from store settings
 * @param {Object} storeSettings - Store settings
 * @returns {Object} JSON-LD schema
 */
export const generateOrganizationSchema = (storeSettings = {}) => {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://yourdomain.com";
  const storeName = storeSettings.storeName || "Store";
  const logo = storeSettings.logo || "/logo-buz.jpg";
  const email = storeSettings.supportEmail || "support@store.com";
  const phone = storeSettings.phoneNumber || "";

  return {
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
  };
};

/**
 * Generate breadcrumb schema
 * @param {Array} breadcrumbs - Array of breadcrumb items
 * @returns {Object} JSON-LD schema
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${DEFAULT_DOMAIN}${crumb.url}`,
    })),
  };
};

/**
 * Generate FAQ schema
 * @param {Array} faqs - Array of FAQ items
 * @returns {Object} JSON-LD schema
 */
export const generateFAQSchema = (faqs) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};
("https://yourdomain.com");

/**
 * Get current page URL
 * @returns {string} Current page URL
 */
export const getCurrentPageUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.href;
  }
  return DEFAULT_DOMAIN;
};
