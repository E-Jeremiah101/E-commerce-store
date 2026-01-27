import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Loader,
  ArrowLeft,
  Shield,
  CheckCircle,
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";

const ResetPasswordPageContent = () => {
  const { token } = useParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    let newErrors = {};

    // Simple validation
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await axios.post(`/auth/reset-password/${token}`, formData);
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      const errorData = error.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const backendErrors = {};
        errorData.errors.forEach((err) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      } else if (errorData?.message) {
        toast.error(errorData.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-2xl shadow-lg">
            <Shield className="h-12 w-12 text-indigo-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSuccess ? "Password Reset Successful!" : "Reset Your Password"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSuccess
            ? "Your password has been updated successfully"
            : "Enter your new password below"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isSuccess ? (
          // Success State
          <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-green-100">
            <div className="flex flex-col items-center text-center">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                All Set!
              </h3>

              <p className="text-gray-600 mb-6">
                Your password has been reset successfully. You will be
                redirected to login in a moment.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 w-full">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Lock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">
                      Security Tips
                    </h4>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use a unique password for each account</li>
                        <li>Enable two-factor authentication if available</li>
                        <li>Regularly update your passwords</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full">
                <Link
                  to="/login"
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Form State
          <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`block w-full pl-10 pr-12 py-3.5 border ${
                      errors.password
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-all duration-200`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={`block w-full pl-10 pr-12 py-3.5 border ${
                      errors.confirmPassword
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-all duration-200`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-800">
                      Password Requirements
                    </h4>
                    <div className="mt-1 text-sm text-gray-600">
                      <ul className="space-y-1">
                        <li
                          className={`flex items-center ${formData.password.length >= 6 ? "text-green-600" : "text-gray-500"}`}
                        >
                          <svg
                            className={`h-4 w-4 mr-2 ${formData.password.length >= 6 ? "text-green-500" : "text-gray-400"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            {formData.password.length >= 6 ? (
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            ) : (
                              <circle
                                cx="10"
                                cy="10"
                                r="9"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                              />
                            )}
                          </svg>
                          At least 6 characters long
                        </li>
                        <li
                          className={`flex items-center ${formData.password === formData.confirmPassword && formData.password ? "text-green-600" : "text-gray-500"}`}
                        >
                          <svg
                            className={`h-4 w-4 mr-2 ${formData.password === formData.confirmPassword && formData.password ? "text-green-500" : "text-gray-400"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            {formData.password === formData.confirmPassword &&
                            formData.password ? (
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            ) : (
                              <circle
                                cx="10"
                                cy="10"
                                r="9"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                              />
                            )}
                          </svg>
                          Passwords match
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="-ml-1 mr-3 h-5 w-5" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => navigate("/login")}
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Having trouble?{" "}
            <button
              onClick={() => navigate("/forgot-password")}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Request new reset link
            </button>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            © {new Date().getFullYear()} {settings?.storeName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function ResetPasswordPage() {
  return (
    <ErrorBoundary>
      <ResetPasswordPageContent />
    </ErrorBoundary>
  );
}