
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Loader,
  ArrowLeft,
  Shield,
  CheckCircle2,
  Check,
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";


const Card = ({ children }) => (
  <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-neutral-200 rounded-xl">
    {children}
  </div>
);

const InfoBox = ({ icon: Icon, title, children }) => (
  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
    <div className="flex gap-3">
      <Icon className="h-4 w-4 text-neutral-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        <div className="mt-1 text-sm text-neutral-600">{children}</div>
      </div>
    </div>
  </div>
);

const Field = ({ id, label, error, children }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-neutral-700 mb-2"
    >
      {label}
    </label>
    <div className="relative">{children}</div>
    {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
  </div>
);

const Requirement = ({ satisfied, children }) => (
  <li
    className={`flex items-center gap-2 ${
      satisfied ? "text-neutral-900" : "text-neutral-500"
    }`}
  >
    <span
      className={`flex items-center justify-center w-3.5 h-3.5 rounded-full border ${
        satisfied ? "bg-neutral-900 border-neutral-900" : "border-neutral-300"
      }`}
    >
      {satisfied && <Check size={9} strokeWidth={4} className="text-white" />}
    </span>
    {children}
  </li>
);

const PasswordToggle = ({ shown, onToggle }) => (
  <button
    type="button"
    className="absolute inset-y-0 right-0 pr-3 flex items-center"
    onClick={onToggle}
    aria-label={shown ? "Hide password" : "Show password"}
  >
    {shown ? (
      <EyeOff className="h-4 w-4 text-neutral-400 hover:text-neutral-700" />
    ) : (
      <Eye className="h-4 w-4 text-neutral-400 hover:text-neutral-700" />
    )}
  </button>
);

const inputClass = (hasError, withToggle = false) =>
  `block w-full pl-10 ${withToggle ? "pr-11" : "pr-3"} py-3 border rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
      : "border-neutral-300 focus:ring-neutral-900/10 focus:border-neutral-900"
  }`;



const ResetPasswordPageContent = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordLongEnough = formData.password.length >= 6;
  const passwordsMatch =
    !!formData.password && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const newErrors = {};
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
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const backendErrors = {};
        errorData.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-neutral-900">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>

        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
          {isSuccess ? "Password updated" : "Reset your password"}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500">
          {isSuccess
            ? "You'll be redirected to sign in shortly"
            : "Enter your new password below"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isSuccess ? (
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-neutral-900 mb-5">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                All set
              </h3>

              <p className="text-sm text-neutral-500 mb-6 max-w-sm">
                Your password has been reset successfully. You'll be redirected
                to sign in in a moment.
              </p>

              <InfoBox icon={Lock} title="Security tips">
                <ul className="space-y-1 list-disc pl-4">
                  <li>Use a unique password for each account</li>
                  <li>Enable two-factor authentication if available</li>
                  <li>Update your passwords regularly</li>
                </ul>
              </InfoBox>

              <Link
                to="/login"
                className="mt-6 w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field id="password" label="New password" error={errors.password}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={inputClass(!!errors.password, true)}
                  required
                  minLength={6}
                />
                <PasswordToggle
                  shown={showPassword}
                  onToggle={() => setShowPassword((p) => !p)}
                />
              </Field>

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
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={inputClass(!!errors.confirmPassword, true)}
                  required
                  minLength={6}
                />
                <PasswordToggle
                  shown={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((p) => !p)}
                />
              </Field>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5">
                <ul className="space-y-2 text-xs">
                  <Requirement satisfied={passwordLongEnough}>
                    At least 6 characters
                  </Requirement>
                  <Requirement satisfied={passwordsMatch}>
                    Passwords match
                  </Requirement>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4" />
                    Resetting password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Reset password
                  </>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-neutral-500">Or</span>
                </div>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="mt-6 w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </button>
            </div>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-500">
            Having trouble?{" "}
            <button
              onClick={() => navigate("/forgot-password")}
              className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
            >
              Request a new link
            </button>
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            © {new Date().getFullYear()} {settings?.storeName || "Your Company"}
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