import CategoryItem from "../components/CategoryItem.jsx";
import { useProductStore } from "../stores/useProductStore.jsx";
import { useEffect } from "react";
import FeaturedProducts from "../components/FeaturedProducts.jsx";
const categories = [
  { href: "/bottoms", name: "Bottoms", imageUrl: "/jeans-man.jpg" },
  { href: "/t-shirts", name: "T-Shirt", imageUrl: "/man-tshirt.jpg" },
  { href: "/footwears", name: "Footwear", imageUrl: "/black-shoe.jpg" },
  { href: "/accessories", name: "Accessories", imageUrl: "/watch.jpg" },
  { href: "/jackets&Outerwear", name: "Jackets & Outerwear", imageUrl: "/jacket-nice2.jpg" },
  { href: "/sets&cords", name: "Sets & Cords", imageUrl: "/complete-outfit2.jpg" },
  {
    href: "/underwear&socks",
    name: "Underwears & Socks",
    imageUrl: "/boxers.jpg",
  },
  { href: "/suits&blazers", name: "Suits & Blazers", imageUrl: "/suits-good.jpg" },
  { href: "/bags", name: "Bags", imageUrl: "/Bag-man.jpg" },
];
const HomePage = () => {
  const {fetchFeaturedProducts, products, isLoading} = useProductStore();



  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts])
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <div className="relative">
        <div> 
          <img
            src="/Three-man.webp"
            alt=""
            className="h-[22rem]       
      sm:h-[32rem]    
      lg:h-[36rem]     
      w-full object-cover object-center"
          />
        </div>
        {/* Text below image (only visible on mobile) */}
        <div className="md:hidden text-center text-white px-4 py-6 bg-black ">
          <h1 className="text-3xl font-bold mb-3 tracking-wider">
            Discover What's New
          </h1>
          <p className="flex flex-wrap justify-center px-15 max-w-5xl text-gray-300 text-sm tracking-wide">
            Discover the latest trends in eco-friendly fashion designed to
            inspire your look and lifestyle.
          </p>
        </div>

        {/* Desktop view */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white px-4 py-2 rounded">
          <h1 className="text-center text-5xl sm:text-5xl font-bold mb-4 tracking-widest">
            Discover What's New
          </h1>
          <p className="text-center text-xl text-gray-300 mb-12">
            Discover the latest trends in eco-friendly fashion designed to
            inspire your look and lifestyle
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-black text-3xl tracking-widest font-bold mb-4">
          Collections
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 gap-x-6 gap-y-2 ">
          {categories.map((category) => (
            <CategoryItem category={category} key={category.name} />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 m-0 sm:mt-0 mt-9 gap-5 sm:gap-30 ">
          <div className="text-black flex justify-center items-center">
            <div className="text-center">
              <h1 className="text-3xl tracking-widest sm:text-5xl mb-4">CLASSIC WEARS</h1>
              <p className="text-1xl sm:text-2xl tracking-widest">
                Stay Relaxed, Stay Stylish: Redefine Comfort with the Perfect
                style Fit!
              </p>
            </div>
          </div>
          <div>
            <img src="/man-black.png" alt="" className="h-115 sm:h-130" />
          </div>
        </div>
        {!isLoading && products.length > 0 && (
          <FeaturedProducts featuredProducts={products} />
        )}
      </div>
    </div>
  );
}

export default HomePage