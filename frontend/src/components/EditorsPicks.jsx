// components/EditorsPicks.jsx
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import ScrollReveal from "./ScrollReveal.jsx";
import { useState, useEffect } from "react";
import { useProductStore } from "../stores/useProductStore.js";

const EditorsPicks = ({ className = "", products = [] }) => {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { fetchAllProducts } = useProductStore();

  // If no products are passed as props, fetch them
  useEffect(() => {
    const loadProducts = async () => {
      if (products && products.length > 0) {
        // Use products passed as props
        console.log("Using products from props:", products.length);
        createPicks(products);
      } else {
        // Fetch products if none provided
        setLoading(true);
        try {
          console.log("Fetching products from store...");
          await fetchAllProducts();
          // Store will update and trigger re-render
        } catch (error) {
          console.error("Error fetching products:", error);
          createPicks([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProducts();
  }, [products, fetchAllProducts]);

  // Also watch for store updates
  const { products: storeProducts } = useProductStore();

  useEffect(() => {
    if (storeProducts && storeProducts.length > 0 && picks.length === 0) {
      console.log("Store products updated:", storeProducts.length);
      createPicks(storeProducts);
    }
  }, [storeProducts]);

  const getRandomProducts = (productsArray) => {
    if (!productsArray || productsArray.length === 0) return [];

    if (productsArray.length <= 2) {
      return [...productsArray];
    }

    // Shuffle and get 2 random products
    const shuffled = [...productsArray];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 2);
  };

  const createPicks = (productsArray) => {
    const randomProducts = getRandomProducts(productsArray);

    if (randomProducts.length === 0) {
      // Fallback content
      setPicks([
        {
          id: "1",
          title: "Editor's Choice: Discover Excellence",
          narrative:
            "Our team selects products that define quality standards in their respective categories.",
          image:
            "https://images.unsplash.com/photo-1511556820780-d912e42b4980?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
          curator: "Editorial Team",
          date: new Date().toLocaleDateString("en-US", { month: "long" }),
          productLink: "/products",
          productName: "Premium Collection",
          category: "Collection",
        },
        {
          id: "2",
          title: "Curated Selection: Artisan Craftsmanship",
          narrative:
            "Handpicked items showcasing exceptional attention to detail and innovative design.",
          image:
            "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
          curator: "Curated Team",
          date: new Date().toLocaleDateString("en-US", { month: "long" }),
          productLink: "/collections",
          productName: "Artisan Works",
          category: "Featured",
        },
      ]);
      return;
    }

    const titles = [
      "Editor's Choice: A Study in Excellence",
      "Curated Selection: The Art of Quality",
    ];

    const narratives = [
      "Our editorial team selects this piece for its exceptional craftsmanship and timeless design. A testament to quality that transcends trends.",
      "Chosen for its innovative approach and meticulous attention to detail. This product represents the standard we believe in.",
    ];

    const categories = ["Premium Selection", "Design Excellence"];

    const editorialPicks = randomProducts.map((product, index) => ({
      id: product._id || `temp-${index}`,
      title: titles[index] || titles[0],
      narrative: narratives[index] || narratives[0],
      image:
        product.images?.[0] ||
        "https://images.unsplash.com/photo-1511556820780-d912e42b4980?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      curator: "Editorial Board",
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      productLink: `/product/${product._id}`,
      productName: product.name || "Featured Product",
      category: product.category || categories[index] || "Featured",
    }));

    setPicks(editorialPicks);
  };

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Refreshing editor's picks...");
      const currentProducts = products || storeProducts || [];
      createPicks(currentProducts);
    }, 120000); // 2 minutes

    return () => clearInterval(intervalId);
  }, [products, storeProducts]);

  if (loading) {
    return (
      <section className={`${className} py-20`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-6 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <ScrollReveal direction="up" delay={0.8} duration={1}>
      <section className={`${className} py-20`}>
        <div className="max-w-4xl mx-auto px-4">
          {/* Editorial Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light tracking-tight text-gray-900 mb-4">
              <span className="font-medium">Editor's</span> Selections
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              Curated products that meet our highest standards of quality and
              design
            </p>
          </div>

          {/* Curated Picks Grid */}
          <div className="grid md:grid-cols-2 gap-12">
            {picks.map((pick) => (
              <article key={pick.id} className="group">
                {/* Editorial Image */}
                <div className="mb-6 overflow-hidden rounded-lg">
                  <div
                    className="h-64 bg-gray-100 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{
                      backgroundImage: pick.image
                        ? `url(${pick.image})`
                        : "none",
                    }}
                  >
                    {!pick.image && (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        Editorial Selection
                      </div>
                    )}
                  </div>
                </div>

                {/* Editorial Content */}
                <div className="space-y-4">
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      {pick.productName}
                    </span>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span>{pick.curator}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-serif font-light text-gray-900 leading-tight">
                    {pick.title}
                  </h3>

                  {/* Narrative */}
                  <p className="text-gray-600 leading-relaxed">
                    {pick.narrative}
                  </p>

                  {/* Action */}
                  <div className="pt-2">
                    <Link
                      to={pick.productLink}
                      className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium group-hover:underline"
                    >
                      Explore Selection
                      <svg
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
};

export default EditorsPicks;
