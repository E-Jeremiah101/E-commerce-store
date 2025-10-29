import { Link } from "react-router-dom";

const CategoryItem = ({ category }) => {
  return (
    <Link
      to={`/category/${category.name
        }`}
      className="relative group block rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
    >
      <img
        src={category.imageUrl}
        alt={category.name}
        className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity duration-300"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <h2 className="text-white text-lg font-semibold tracking-widest uppercase">
          {category.name}
        </h2>
      </div>
    </Link>
  );
};

export default CategoryItem;
