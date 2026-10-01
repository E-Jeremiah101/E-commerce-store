import { useState } from "react";
import { useForm } from "@formspree/react";

const ContactSupport = () => {
  const [state, handleSubmit] = useForm("mvkgyykk");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ----- Validation rules -----
  const validateForm = (data) => {
    const next = {};

    if (!data.name.trim()) {
      next.name = "Please enter your name.";
    } else if (data.name.trim().length < 2) {
      next.name = "Name must be at least 2 characters.";
    }

    if (!data.email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      next.email = "Please enter a valid email address.";
    }

    if (!data.subject) {
      next.subject = "Please select a topic.";
    }

    if (!data.message.trim()) {
      next.message = "Please enter your message.";
    } else if (data.message.trim().length < 10) {
      next.message = "Message must be at least 10 characters.";
    }

    return next;
  };

  // ----- Handlers -----
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field as the user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate only this field on blur
    const fieldErrors = validateForm(formData);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || "" }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    setTouched({
      name: true,
      email: true,
      subject: true,
      message: true,
    });

    if (Object.keys(validationErrors).length > 0) return;

    handleSubmit(e);
  };

  // ----- Shared input classes -----
  const baseField =
    "w-full bg-neutral-50 border rounded-xl px-4 py-3.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:bg-white focus:ring-4";

  const okField =
    "border-neutral-200 hover:border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900/5";

  const errField =
    "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/5";

  const fieldClass = (field) =>
    `${baseField} ${errors[field] && touched[field] ? errField : okField}`;

  // ----- Success screen -----
  if (state.succeeded) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-light mb-4">Message Received</h2>
          <p className="text-neutral-600 leading-relaxed">
            Thanks for reaching out. Our support team will get back to you
            within 24 hours at{" "}
            <span className="font-medium text-neutral-900">
              {formData.email}
            </span>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 antialiased">
      {/* Hero */}
      <section className="bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-6">
            Support
          </p>
          <h1 className="text-4xl md:text-6xl font-light leading-[1.1] tracking-tight max-w-3xl">
            How can we help?
          </h1>
          <p className="mt-8 text-lg text-neutral-300 max-w-xl leading-relaxed">
            Tell us what's going on. Whether it's an order issue, a product
            question, or something else, we're here to help.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
            Submit a Request
          </p>
          <h2 className="text-3xl md:text-4xl font-light leading-tight mb-10">
            Send us a message.
          </h2>

          <form onSubmit={onSubmit} noValidate className="space-y-8">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Jane Doe"
                className={fieldClass("name")}
              />
              {errors.name && touched.name && (
                <p className="mt-2 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@example.com"
                className={fieldClass("email")}
              />
              {errors.email && touched.email && (
                <p className="mt-2 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Order Number (optional) */}
            <div>
              <label
                htmlFor="orderNumber"
                className="block text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3"
              >
                Order Number{" "}
                <span className="text-neutral-400 normal-case tracking-normal">
                  (Optional)
                </span>
              </label>
              <input
                type="text"
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                placeholder="#12345"
                className={`${baseField} ${okField}`}
              />
            </div>

            {/* Subject */}
            <div>
              <label
                htmlFor="subject"
                className="block text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3"
              >
                What is this regarding? *
              </label>

              <div className="relative group">
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`
                    w-full appearance-none cursor-pointer rounded-xl
                    px-4 py-3.5 pr-12 text-[15px]
                    transition-all duration-200 focus:outline-none focus:ring-4
                    ${
                      errors.subject && touched.subject
                        ? "bg-red-50 border border-red-300 focus:border-red-500 focus:ring-red-500/5"
                        : "bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:border-neutral-900 focus:bg-white focus:ring-neutral-900/5"
                    }
                    ${
                      formData.subject === ""
                        ? "text-neutral-400"
                        : "text-neutral-900"
                    }
                  `}
                >
                  <option value="" disabled hidden>
                    Select a topic
                  </option>
                  <option value="order">Order Issue</option>
                  <option value="product">Product Question</option>
                  <option value="return">Return or Exchange</option>
                  <option value="shipping">Shipping &amp; Delivery</option>
                  <option value="other">Something Else</option>
                </select>

                <div
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                    flex items-center justify-center
                    w-7 h-7 rounded-full bg-white border border-neutral-200
                    group-hover:border-neutral-300 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5 text-neutral-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </div>
              </div>

              {errors.subject && touched.subject && (
                <p className="mt-2 text-xs text-red-600">{errors.subject}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="block text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3"
              >
                Your Message *
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                value={formData.message}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Please describe your issue in detail..."
                className={`${fieldClass("message")} resize-none`}
              />
              {errors.message && touched.message && (
                <p className="mt-2 text-xs text-red-600">{errors.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={state.submitting}
                className="px-10 py-4 bg-neutral-900 text-white text-sm font-medium tracking-wide rounded-full hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.submitting ? "Sending..." : "Send Message"}
              </button>
            </div>

            {/* Submission error (from Formspree) */}
            {state.errors && state.errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  Something went wrong. Please try again or email us directly.
                </p>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

export default ContactSupport;