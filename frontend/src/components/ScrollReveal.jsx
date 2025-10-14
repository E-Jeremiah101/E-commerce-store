import { useEffect, useRef, useState } from "react";

export default function ScrollReveal({
  children,
  className = "",
  threshold = 0.2, // % of element visible before animation triggers
  once = true, // if false, animates every time it enters view
  delay = 0, // ms delay before animating
  duration = 700, // total animation duration (ms)
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add delay for smoother entry
          setTimeout(() => setIsVisible(true), delay);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once, delay]);

  return (
    <div
      ref={ref}
      style={{
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
      className={`transform ${
        isVisible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}
