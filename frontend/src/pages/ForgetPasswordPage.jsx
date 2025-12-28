import { useState } from "react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useEffect } from "react";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

const ForgotPasswordPageContent = () => {
  // Ensure spinner does not show if user navigates directly here

  useEffect(() => {
    useUserStore.setState({ checkingAuth: false });
  }, []);
  const [email, setEmail] = useState("");
  const { loading } = useUserStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/auth/forgot-password", { email });
      toast.success("Reset link sent to your email");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-2xl w-96"
      >
        <div className="className flex justify-center mb-7">
          <h2 className="text-2xl font-bold tracking-widest ">
            Forgot Password
          </h2>
        </div>
        <span className="text-sm mb-8 flex justify-center  ">
          Please provide the email address that you used when you signed up for
          your account.
        </span>

        <div className="my-5">
          <label htmlFor="">Email Address</label>
          <input
            type="email"
            placeholder=""
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded "
            required
          />
        </div>
        <span className="text-sm mb-8 flex justify-center text-center ">
          We will send you an email that will allow you to reset your pasword
        </span>

        <button
          type="submit"
          className="w-full bg-black hover:bg-black/80 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="mr-2 w-5 animate-spin" aria-hidden="true" />
              Loging...
            </>
          ) : (
            <>Send Reset Link</>
          )}
        </button>

        <Link
          to="/login"
          className="text-sm my-8 flex justify-center text-center font-bold text-blue-600"
        >
          Back To Login
        </Link>
      </form>
    </div>
  );
};

export default function ForgotPasswordPage() {
  return (
    <ErrorBoundary>
      <ForgotPasswordPageContent />
    </ErrorBoundary>
  );
}
