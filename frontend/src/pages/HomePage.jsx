import CategoryItem from "../components/CategoryItem.jsx";
import { useProductStore } from "../stores/useProductStore.jsx";
import { useEffect, useState } from "react";
import FeaturedProducts from "../components/FeaturedProducts.jsx";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard.jsx";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer.jsx";
import HeroSlider from "../components/HeroSlider";
import CollectionTab from "../components/CollectionTab.jsx";
import OtherFeatures from "../components/OtherFeatures.jsx";

const categories = [
  { href: "/bottoms", name: "Bottoms", imageUrl: "/jeans-man.jpg" },
  { href: "/t-shirts", name: "T-Shirt", imageUrl: "/man-tshirt.jpg" },
  { href: "/footwears", name: "Footwear", imageUrl: "/shoe-brown.jpg" },
  {
    href: "/accessories",
    name: "Accessories & Essentials",
    imageUrl: "/watchgold.jpg",
  },
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
];
const HomePage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingss, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.get("/products/recommendations");
        setRecommendations(res.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "An error occured while fetching recommendations"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecommendations();
  }, [])
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
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div>
            <HeroSlider />
          </div>

        </motion.div>

        
          <CollectionTab />
        
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 root lg:px-25">
         
            <h1 className="text-black font-sans text-1xl md:hidden  tracking-widest mb-4 root">
              Explore Our Collections
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 md:gap-6 gap-5 look ">
              {categories.map((category, index) => (
                <CategoryItem category={category} key={category.name} />
              ))}
            </div>
        

         
            <div className="text-black flex justify-center items-center my-17 lg:mt-25 look">
              <div className="text-center">
                <h1
                  className="text-3xl tracking-widest  mb-4 text-black drop-shadow-lg"
                  style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.4)" }}
                >
                  CLASSIC WEARS
                </h1>
                <p
                  className="text-1xl lg:text-sm tracking-widest"
                  style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.3)" }}
                >
                  Stay Relaxed, Stay Stylish: Redefine Comfort with the Perfect
                  style Fit!
                </p>
              </div>
            </div>
            

              <OtherFeatures className="look" />
          
            
              
           
          

          {!isLoading && products.length > 0 && (
           
              <FeaturedProducts className="look" featuredProducts={products} />
           
          )} 
        
          <FAQSection className="look"/>
        
        </div>

       
        <Footer />
      </motion.div>
    </>
  );
};

export default HomePage;
