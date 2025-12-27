import express from "express";

const router = express.Router();

/**
 * Dynamic robots.txt that uses actual domain from request
 */
router.get("/robots.txt", (req, res) => {
  const host = req.get("host") || "yourdomain.com";
  const protocol = req.protocol || "https";
  const baseUrl = `${protocol}://${host}`;

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /login
Disallow: /signup
Disallow: /reset-password
Disallow: /forgot-password
Disallow: /personal-info
Disallow: /cart

# Search Engine Crawlers
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-products.xml`;

  res.header("Content-Type", "text/plain");
  res.send(robotsTxt);
});

/**
 * Dynamic sitemap.xml - lists all products
 */
router.get("/sitemap.xml", async (req, res) => {
  try {
    const host = req.get("host") || "yourdomain.com";
    const protocol = req.protocol || "https";
    const baseUrl = `${protocol}://${host}`;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/products", priority: "0.8", changefreq: "daily" },
      { url: "/categories", priority: "0.7", changefreq: "weekly" },
    ];

    staticPages.forEach((page) => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += "</urlset>";

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Dynamic sitemap for products - includes all products
 */
router.get("/sitemap-products.xml", async (req, res) => {
  try {
    const host = req.get("host") || "yourdomain.com";
    const protocol = req.protocol || "https";
    const baseUrl = `${protocol}://${host}`;

    // Import Product model
    const { default: Product } = await import("../models/product.model.js");

    const products = await Product.find()
      .select("_id updatedAt")
      .lean()
      .limit(50000); // Sitemap has 50k URL limit

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    products.forEach((product) => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/product/${product._id}</loc>\n`;
      if (product.updatedAt) {
        xml += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
      }
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += "</urlset>";

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
