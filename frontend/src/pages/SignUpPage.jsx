import React, { useState } from "react";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Loader,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SEO } from "../components/SEO";
import { useUserStore } from "../stores/useUserStore";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";


const Field = ({ id, label, error, children, action }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-neutral-700"
      >
        {label}
      </label>
      {action}
    </div>
    <div className="relative">{children}</div>
    {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
  </div>
);

const inputClass = (hasError) =>
  `block w-full pl-10 pr-3 py-3 border rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
      : "border-neutral-300 focus:ring-neutral-900/10 focus:border-neutral-900"
  }`;

const inputClassWithToggle = (hasError) =>
  `block w-full pl-10 pr-11 py-3 border rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
      : "border-neutral-300 focus:ring-neutral-900/10 focus:border-neutral-900"
  }`;



const SignUpPageContent = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const { signup } = useUserStore();
  const { settings } = useStoreSettings();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstname.trim()) {
      newErrors.firstname = "First name is required";
    } else if (formData.firstname.length < 2) {
      newErrors.firstname = "First name must be at least 2 characters";
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = "Last name is required";
    } else if (formData.lastname.length < 2) {
      newErrors.lastname = "Last name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBackendError("");
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup(formData);

      if (result?.error) {
        setBackendError(result.error);
      } else {
        setIsSuccess(true);
        setTimeout(() => navigate("/"), 2000);
      }
    } catch {
      setBackendError("Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const passwordLongEnough = formData.password.length >= 6;
  const passwordsMatch =
    !!formData.password && formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title={`Create an Account | ${settings?.storeName || "Store"}`}
        description={`Sign up for a free account at ${settings?.storeName}. Access exclusive deals, track your orders, and enjoy a seamless shopping experience.`}
        image={settings?.logo}
        canonicalUrl={window.location.href}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
          {isSuccess ? "You're all set" : "Create your account"}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500">
          {isSuccess
            ? "Your account has been created"
            : "It only takes a minute"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-neutral-200 rounded-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-neutral-900 mb-5">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                Account created
              </h3>

              <p className="text-sm text-neutral-500 mb-6 max-w-sm">
                Welcome to {settings?.storeName || "our community"},{" "}
                {formData.firstname}. You'll be redirected to the home page
                shortly.
              </p>

              <div className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-4 mb-6 text-left">
                <div className="flex gap-3">
                  <Mail className="h-4 w-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      Check your email
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      We sent a welcome email to{" "}
                      <span className="font-medium text-neutral-900">
                        {formData.email}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/")}
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 transition-colors"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-neutral-200 rounded-xl"
          >
            {backendError && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 text-center font-medium">
                  {backendError}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  id="firstname"
                  label="First name"
                  error={errors.firstname}
                >
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    id="firstname"
                    type="text"
                    value={formData.firstname}
                    onChange={(e) =>
                      handleInputChange("firstname", e.target.value)
                    }
                    className={inputClass(!!errors.firstname)}
                    placeholder="John"
                    autoComplete="given-name"
                  />
                </Field>

                <Field id="lastname" label="Last name" error={errors.lastname}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    id="lastname"
                    type="text"
                    value={formData.lastname}
                    onChange={(e) =>
                      handleInputChange("lastname", e.target.value)
                    }
                    className={inputClass(!!errors.lastname)}
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                </Field>
              </div>

              {/* Email */}
              <Field id="email" label="Email" error={errors.email}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={inputClass(!!errors.email)}
                  placeholder="you@example.com"
                />
              </Field>

              {/* Password */}
              <Field id="password" label="Password" error={errors.password}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={inputClassWithToggle(!!errors.password)}
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-400 hover:text-neutral-700" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-400 hover:text-neutral-700" />
                  )}
                </button>
              </Field>

              {/* Confirm password */}
              <Field
                id="confirmPassword"
                label="Confirm password"
                error={errors.confirmPassword}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={inputClassWithToggle(!!errors.confirmPassword)}
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-400 hover:text-neutral-700" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-400 hover:text-neutral-700" />
                  )}
                </button>
              </Field>

              {/* Requirements */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5">
                <ul className="space-y-2 text-xs">
                  <li
                    className={`flex items-center gap-2 ${
                      passwordLongEnough
                        ? "text-neutral-900"
                        : "text-neutral-500"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-3.5 h-3.5 rounded-full border ${
                        passwordLongEnough
                          ? "bg-neutral-900 border-neutral-900"
                          : "border-neutral-300"
                      }`}
                    >
                      {passwordLongEnough && (
                        <Check
                          size={9}
                          strokeWidth={4}
                          className="text-white"
                        />
                      )}
                    </span>
                    At least 6 characters
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      passwordsMatch ? "text-neutral-900" : "text-neutral-500"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-3.5 h-3.5 rounded-full border ${
                        passwordsMatch
                          ? "bg-neutral-900 border-neutral-900"
                          : "border-neutral-300"
                      }`}
                    >
                      {passwordsMatch && (
                        <Check
                          size={9}
                          strokeWidth={4}
                          className="text-white"
                        />
                      )}
                    </span>
                    Passwords match
                  </li>
                </ul>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create account
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
                    Already have an account?
                  </span>
                </div>
              </div>

              <Link
                to="/login"
                className="mt-6 w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-colors"
              >
                Sign in instead
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-500">
            Have questions?{" "}
            <a
              href={`mailto:${settings?.supportEmail}`}
              className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
            >
              Contact support
            </a>
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            © {new Date().getFullYear()} {settings?.storeName || "Your Company"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function SignUpPage() {
  return (
    <ErrorBoundary>
      <SignUpPageContent />
    </ErrorBoundary>
  );
}
