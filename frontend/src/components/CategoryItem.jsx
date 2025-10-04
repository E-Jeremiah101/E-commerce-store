import { Link } from "react-router-dom";
import { useState } from "react";

const CategoryItem = ({ category }) => {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  return (
    <div className="relative overflow-hidden h-94 w-full rounded-lg group ">
      <Link
        to={{
          pathname: "/category" + category.href,
          state: { size: selectedSize, color: selectedColor },
        }}
      >
        <div className="w-full h-full cursor-pointer">
          <div className=" inset-0 bg-gradient-to-b from-transparent to-gray-500 z-10">
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-59 object-fill transition-transform duration-500 ease-out group-hover:scale-110"
              loading="lazy"
            />

            <div className="p-2 z-20">
              <h3 className="text-black/80  text-lg font mb-2 tracking-widest">
                {category.name}
              </h3>
              <p className="text-white text-sm mb-1 w-fit tracking-widest rounded-md">
                Explore {category.name}
              </p>

              {/* Sizes */}
              {category.sizes && category.sizes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {category.sizes.map((size) => (
                    <span
                      key={size}
                      className={`px-2 py-1 rounded text-xs border cursor-pointer ${
                        selectedSize === size
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-700 text-gray-200"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedSize(size);
                      }}
                    >
                      {size}
                    </span>
                  ))}
                </div>
              )}

              {/* Colors */}
              {category.colors && category.colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {category.colors.map((color) => (
                    <span
                      key={color}
                      className={`w-5 h-5 rounded-full border cursor-pointer ${
                        selectedColor === color ? "ring-2 ring-emerald-400" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedColor(color);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CategoryItem;
