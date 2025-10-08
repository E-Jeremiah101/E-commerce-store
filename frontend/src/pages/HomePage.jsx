import CategoryItem from "../components/CategoryItem.jsx";
import { useProductStore } from "../stores/useProductStore.jsx";
import { useEffect } from "react";
import FeaturedProducts from "../components/FeaturedProducts.jsx";
import { motion } from "framer-motion";
import ScrollReveal from "../components/ScrollReveal.jsx";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer.jsx";
import HeroSlider from "../components/HeroSlider";
const categories = [
  { href: "/bottoms", name: "Bottoms", imageUrl: "/jeans-man.jpg" },
  { href: "/t-shirts", name: "T-Shirt", imageUrl: "/man-tshirt.jpg" },
  { href: "/footwears", name: "Footwear", imageUrl: "/shoe-brown.jpg" },
  { href: "/accessories", name: "Accessories", imageUrl: "/watchgold.jpg" },
  {
    href: "/jackets&Outerwear",
    name: "Jackets & Outerwear",
    imageUrl: "/jacket-nice2.jpg",
  },
  {
    href: "/sets&cords",
    name: "Sets & Cords",
    imageUrl: "/complete-outfit2.jpg",
  },
  {
    href: "/underwear&socks",
    name: "Underwears & Socks",
    imageUrl: "/boxers.jpg",
  },
  {
    href: "/suits&blazers",
    name: "Suits & Blazers",
    imageUrl: "/suits-good.jpg",
  },
  { href: "/bags", name: "Bags", imageUrl: "/bag-bg.jpg" },
  { href: "/sportwear", name: "Sportwear", imageUrl: "/sport2.jpg" },
];
const HomePage = () => {
  const { fetchFeaturedProducts, products, isLoading } = useProductStore();

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  return (
    <>
      <motion.div
        className="relative min-h-screen text-white overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="relative pt-16 pb-5 md:py-0"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div>
           
            <HeroSlider />
          </div>
         
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4  lg:px-8">
          <ScrollReveal delay={0.1}>
            <h1 className="text-black text-lg tracking-widest  mb-4 lg:my-3">
              Collections
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 md:gap-6 gap-x-6 gap-y-2 ">
              {categories.map((category, index) => (
                <ScrollReveal key={index} delay={index * 0.2 }>
                  <CategoryItem category={category} key={category.name} />
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="grid grid-cols-1 md:grid-cols-2 m-0 md:mt-0 mt-9 gap-5 md:gap-30 ">
              <div className="text-black flex justify-center items-center">
                <div className="text-center">
                  <h1 className="text-3xl tracking-widest md:text-5xl mb-4">
                    CLASSIC WEARS
                  </h1>
                  <p className="text-1xl md:text-2xl tracking-widest">
                    Stay Relaxed, Stay Stylish: Redefine Comfort with the
                    Perfect style Fit!
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <img src="/man-black.png" alt="" className="h-115 md:h-130" />
              </div>
            </div>
          </ScrollReveal>

          {!isLoading && products.length > 0 && (
            <ScrollReveal delay={0.4}>
              <FeaturedProducts featuredProducts={products} />
            </ScrollReveal>
          )}
        </div>

        <ScrollReveal delay={0.5}>
          <FAQSection />
        </ScrollReveal>
        
        <Footer />
      </motion.div>
    </>
  );
};

export default HomePage;
