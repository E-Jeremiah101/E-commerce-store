import { useState, useEffect } from "react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { Loader, Mail, ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
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


const ForgotPasswordPageContent = () => {
  useEffect(() => {
    useUserStore.setState({ checkingAuth: false });
  }, []);

  const [email, setEmail] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { settings } = useStoreSettings();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      await axios.post("/auth/forgot-password", { email });
      setIsSubmitted(true);
      toast.success("Reset link sent to your email!");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `block w-full pl-10 pr-3 py-3 border rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors ${
    error
      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
      : "border-neutral-300 focus:ring-neutral-900/10 focus:border-neutral-900"
  }`;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-neutral-900">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>

        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
          {isSubmitted ? "Check your email" : "Forgot your password?"}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500">
          {isSubmitted
            ? "We've sent reset instructions to your email"
            : "Enter your email and we'll send you a reset link"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isSubmitted ? (
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-neutral-900 mb-5">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                Reset link sent
              </h3>

              <p className="text-sm text-neutral-500 mb-6 max-w-sm">
                We've sent a password reset link to{" "}
                <span className="font-medium text-neutral-900">{email}</span>.
               
              </p>

              <InfoBox icon={Mail} title="Didn't receive the email?">
                <ul className="space-y-1 list-disc pl-4">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few minutes and try again</li>
                </ul>
              </InfoBox>

              <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Try another email
                </button>

                <Link
                  to="/login"
                  className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail
                      className="h-4 w-4 text-neutral-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>
                {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
              </div>

              <InfoBox icon={Shield} title="What happens next?">
                We'll send a secure link to reset your password. The link
                expires in 15 minutes for your safety.
              </InfoBox>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4" />
                    Sending reset link...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send reset link
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

              <Link
                to="/login"
                className="mt-6 w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-500">
            Need help?{" "}
            {settings?.supportEmail && (
              <a
                href={`mailto:${settings.supportEmail}`}
                className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
              >
                Contact support
              </a>
            )}
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            © {new Date().getFullYear()} {settings?.storeName || "Your Company"}
          </p>
        </div>
      </div>
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