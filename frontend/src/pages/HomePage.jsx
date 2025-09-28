import CategoryItem from "../components/CategoryItem.jsx";
import { useProductStore } from "../stores/useProductStore.jsx";
import { useEffect } from "react";
import FeaturedProducts from "../components/FeaturedProducts.jsx";
const categories = [
  { href: "/jeans", name: "Jeans", imageUrl: "/jeans.jpg" },
  { href: "/t-shirts", name: "T-shirts", imageUrl: "/tshirts.jpg" },
  { href: "/shoes", name: "Shoes", imageUrl: "/shoes.jpg" },
  { href: "/glasses", name: "Glasses", imageUrl: "/glasses.jpg" },
  { href: "/jackets", name: "Jackets", imageUrl: "/jackets.jpg" },
  { href: "/suits", name: "Suits", imageUrl: "/suits.webp" },
  { href: "/bags", name: "Bags", imageUrl: "/bags.jpg" },
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
            className="lg:h-[36rem] l sm:h-[30rem] object-cover w-full object-center"
          />
        </div>
        {/* Text below image (only visible on mobile) */}
        <div className="md:hidden text-center text-white px-4 py-6 bg-black/60 ">
          <h1 className="text-3xl font-bold mb-3 ">Discover What's New</h1>
          <p className="text-lg text-gray-300">
            Discover the latest trends in eco-friendly fashion designed to
            inspire your look and lifestyle
          </p>
        </div>

        {/* Desktop view */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white px-4 py-2 rounded">
          <h1 className="text-center text-5xl sm:text-6xl font-bold mb-4">
            Discover What's New
          </h1>
          <p className="text-center text-xl text-gray-300 mb-12">
            Discover the latest trends in eco-friendly fashion designed to
            inspire your look and lifestyle
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-black text-4xl tracking-widest mb-4">
          COLLECTIONS
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryItem category={category} key={category.name} />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-30 ">
          <div className="text-black flex justify-center items-center">
            <div>
              <h1 className="text-5xl tracking-widest mb-5">BAGGY JEANS</h1>
              <p className="text-2xl tracking-widest">
                Stay Relaxed, Stay Stylish: Redefine Comfort with the Perfect
                Baggy Fit!
              </p>
            </div>
          </div>
          <div>
            <img src="/man-black.png" alt="" className="h-130" />
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