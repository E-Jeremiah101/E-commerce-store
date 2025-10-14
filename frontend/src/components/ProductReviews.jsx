import { useEffect, useState } from "react";
import {
  getProductReviews,
  addReview,
  canReviewProduct,
  deleteReview,
} from "../stores/reviewStore.js";
import { useUserStore } from "../stores/useUserStore.js";
import toast from "react-hot-toast";
import { Star } from "lucide-react";
import { CircleCheck } from "lucide-react";

const ProductReviews = ({ productId }) => {
  const { user, fetchUser } = useUserStore();
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Load all reviews
  const fetchReviews = async () => {
    try {
      const data = await getProductReviews(productId);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error("❌ Error fetching reviews:", err);
    }
  };

  // Check if user can review
  const checkCanReview = async () => {
    try {
      console.log("🔍 Checking canReview for:", productId);
      const res = await canReviewProduct(productId);
      console.log("✅ canReview response:", res);
      setCanReview(res.canReview);
    } catch (err) {
      console.error("❌ Error checking canReview:", err);
    }
  };

  // Load reviews always
  useEffect(() => {
    console.log("🟡 Product ID:", productId);
    fetchReviews();
  }, [productId]);

  // Ensure user is loaded from store or backend
  useEffect(() => {
    if (!user && fetchUser) {
      console.log("👤 No user yet → fetching user...");
      fetchUser();
    }
  }, []);

  // Run eligibility check only when user becomes available
  useEffect(() => {
    console.log("👤 User in ProductReviews:", user);
    if (user) {
      console.log("✅ User available → Checking canReview...");
      checkCanReview();
    }
  }, [user, productId]);

  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      const res = await addReview(productId, rating, comment);
      toast.success("Review submitted!");
      setComment("");
      setRating(0);
      setCanReview(false);
      fetchReviews();
      console.log("✅ Review added:", res);
    } catch (err) {
      console.error("❌ Error adding review:", err);
      toast.error("Failed to submit review");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0"); // Day with leading zero
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const StarDisplay = ({ rating }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={
            i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-400"
          }
        />
      ))}
    </div>
  );

  return (
    <div className="mt-10 px-4 sm:px-6">
      <h3 className="text- text-black mb-4 tracking-widest">
        Reviews ({reviews.length})
      </h3>

      {reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">No reviews yet</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {reviews.map((r) => (
            <div
              key={r._id}
              className="border-b-1 border-gray-300 p-3 mb-6  space-y-2"
            >
              <div className=" flex justify-between">
                <span className="font-semibold">{r.name}</span>
                <span className="text-xs ">{formatDate(r.createdAt)}</span>
              </div>
              <StarDisplay rating={r.rating} />
              <p className="text-gray-700">{r.comment}</p>
              <p className="text-green-500 text-sm flex ">
                <CircleCheck size={20} /> Verified Purchase
              </p>
              {user && r.user?._id === user._id && (
                <button
                  onClick={async () => {
                    if (!window.confirm("Delete your review?")) return;
                    try {
                      await deleteReview(productId, r.user._id);
                      toast.success("Review deleted!");
                      fetchReviews();
                    } catch (err) {
                      console.error("❌ Error deleting review:", err);
                      toast.error("Failed to delete review");
                    }
                  }}
                  className="text-red-500 text-xs hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canReview && (
        <form onSubmit={handleAddReview} className="mt-6 space-y-3">
          <h4 className="font-semibold tracking-widest">Add your review</h4>
          {/* ⭐ Star Rating Input */}

          <div className="mb-3">
            <label className="block font-medium mb-1">Your Rating:</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={28}
                  className={`cursor-pointer transition-colors duration-200 ${
                    star <= rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your comment"
            required
            className="border p-2 rounded-2xl resize-none border-gray-400 w-full"
          />
          <button
            type="submit"
            className="bg-black text-white py-2 px-4 rounded-lg hover:bg-black/80 transition"
          >
            Submit Review
          </button>
        </form>
      )}
    </div>
  );
};

export default ProductReviews;
