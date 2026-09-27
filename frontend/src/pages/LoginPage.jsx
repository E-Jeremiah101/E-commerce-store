import React, { useState } from "react";
import { LogIn, Mail, Lock, Loader, Eye, EyeOff, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SEO } from "../components/SEO";
import { useUserStore } from "../stores/useUserStore";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

const LoginPageContent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUserStore();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!email.includes("@"))
      newErrors.email = "Please enter a valid email";
    if (!password.trim()) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(email, password);
      if (result?.error) setErrors({ general: result.error });
    } catch {
      setErrors({ general: "Login failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title={`Login to Your Account | ${settings?.storeName || "Store"}`}
        description={`Sign in to your account to manage orders, track shipments, and save preferences at ${settings?.storeName}.`}
        image={settings?.logo}
        canonicalUrl={window.location.href}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500">
          Sign in to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-neutral-200 rounded-xl"
        >
          {errors.general && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 text-center font-medium">
                {errors.general}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.email
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                      : "border-neutral-300 focus:ring-neutral-900/10 focus:border-neutral-900"
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                      : "border-neutral-300 focus:ring-neutral-900/10 focus:border-neutral-900"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-700" />
                  ) : (
                    <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-700" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin h-4 w-4" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-neutral-500">
                  New to {settings?.storeName || "our store"}?
                </span>
              </div>
            </div>

            {/* Secondary CTA */}
            <Link
              to="/signup"
              className="mt-6 w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Create an account
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-500">
            By signing in, you agree to our{" "}
            <Link
              to="/terms"
              className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
            >
              Privacy Policy
            </Link>
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            © {new Date().getFullYear()} {settings?.storeName || "Your Company"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() {
  return (
    <ErrorBoundary>
      <LoginPageContent />
    </ErrorBoundary>
  );
}