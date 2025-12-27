import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    url: "/hat-shot.webp",
    title: "Discover What's New",
    description:
      "Discover the latest trends in eco-friendly fashion designed.",
  },
  {
    url: "/portrait-happy-young-womans.jpg",
    title: "Redefine Wardrobe",
    description:
      "Step into timeless fashion built for confidence and comfort every day.",
  },
  {
    url: "/man-sit.webp",
    title: "Timeless Basics",
    description: "Everyday pieces made to last and inspire.",
  },
];

const HeroSlider = () => {
    const [current, setCurrent] = useState(0);
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
      }, 3000);
      return () => clearInterval(timer);
    }, []);
  return (
    <div className="relative w-full  overflow-hidden lg:mt-0 md:mt-16 bg-gradient-to-br from-white via-white to-gray-100 pb-0">
      {/* Images */}
      <div
        className="flex transition-transform duration-[1000ms] ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="w-full h-full flex-shrink-0 relative overflow-hidden"
          >
            <img
              src={slide.url}
              alt={slide.title}
              loading="lazy"
              className="w-full h-[40rem] sm:h-[35rem] lg:h-[44rem] object-cover object-center lg:object-center"
            />
            {/* Absolute text */}
            <div className="lg:hidden text-center text-black px-3 py-6  h-[10rem] ">
              <h1
                className="text-2xl font-bold mb-3 tracking-wider"
                style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.2)" }}
              >
                {slide.title}
              </h1>
              <p className="flex flex-wrap justify-center px-15 max-w-5xl text-gray-900 text-sm tracking-wide">
                {slide.description}
              </p>
            </div>

            {/* {Desktop view} */}
            <div className="hidden absolute inset-0 lg:flex flex-col justify-center items-center text-center px-4 bg-black/30">
              <h2 className="text-white md:text-5xl font-extrabold mb-3 drop-shadow-lg">
                {slide.title}
              </h2>
              <p className="text-white  md:text-lg max-w-2xl leading-relaxed">
                {slide.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Optional Dots Indicator */}
      {/* <div
        className=" text-black/80 
       justify-center items-center flex gap-3 border-b-1 h-10 border-gray-300 "
      >
        <>
          <span
            onClick={() => setCurrent((prev) => (prev > 0 ? prev - 1 : prev))}
            className="cursor-pointer"
          >
            <ChevronLeft size={18} />
          </span>
          <span className="text-sm">
            {current + 1}/{slides.length}
          </span>
          <span
            onClick={() =>
              setCurrent((next) => (next < slides.length - 1 ? next + 1 : next))
            }
            className="cursor-pointer"
          >
            <ChevronRight size={18} />
          </span>
        </>
      </div> */}
    </div>
  );
};

export default HeroSlider;
