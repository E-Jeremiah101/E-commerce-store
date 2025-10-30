import { Link } from "react-router-dom";

const CategoryItem = ({ category }) => {
  return (
    <Link
      to={`/category/${category.name}`}
      className="relative group block  overflow-hidden shadow-lgtransition-transform duration-300"
    >
      <img
        src={category.imageUrl}
        alt={category.name}
        className="w-full h-43 sm:h-48 object-cover transition-transform group-hover:opacity-90 duration-300 ease-in-out hover:scale-110"
      />
      <div className=" flex items-center justify-center">
        <h2 className="text-gray-800 uppercase py-2 text-md">{category.name}</h2>
      </div>
    </Link>
  );
};

export default CategoryItem;
