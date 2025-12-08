import React, { useState } from "react";
import {
  LogIn,
  Mail,
  Lock,
  Loader,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";
import GoBackButton from "../components/GoBackButton";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useUserStore();
  const [backendError, setBackendError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBackendError("");

    if (!email || !password) {
      setBackendError("Email and password are required");
      return;
    }

    const result = await login(email, password);

    if (result?.error) {
      setBackendError(result.error); // show the backend message
      return;
    }
    console.log(email, password);
  };
  return (
    <div className=" overflow-hidden flex-col py-12  sm:px-6 lg:px-8">
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <GoBackButton/>
        <h2 className="mt-6 px-4 text-3xl  text-black  tracking-widest">
          Login
        </h2>
      </motion.div>

      <motion.div
        className=" mt-8 sm:mx-auto sm:w-full md:max-w-md  "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="py-8 px-4 ">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block text-black w-full px-3 py-4 pl-10  border-b-2 border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-2x1 "
                  placeholder="Johdoe@example.com"
                />
              </div>
            </div>
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block text-black w-full py-4 px-10  border-b-2 border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-black sm:text-1x1  "
                  placeholder="******"
                />
                <div className="absolute inset-y-0 right-1 pl-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff
                        size={20}
                        className="cursor-pointer text-gray-500"
                      />
                    ) : (
                      <Eye size={20} className="cursor-pointer text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black transition hover:bg-gray-800 focus:outline-none    duration-150 ease-in-out disabled:opacity-50 mt-20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader
                      className="mr-2 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    Loging...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 w-5 " aria-hidden="true" />
                    Login
                  </>
                )}
              </button>
            </div>

            {backendError && (
              <p className="mt-2 text-sm text-red-400 text-center">
                {backendError}
              </p>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-black hover:text-gray-800"
            >
              Sign Up
            </Link>
          </p>
          <p className="mt-7 text-center text-sm text-gray-400">
            <Link
              to="/forgot-password"
              className="font-medium text-black hover:text-gray-800"
            >
              Forget Password?
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
