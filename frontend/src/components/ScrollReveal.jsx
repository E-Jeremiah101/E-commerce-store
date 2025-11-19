import React from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const ScrollReveal = ({
  children,
  delay = 0,
  direction = "up",
  duration = 0.8,
  distance = 30,
  easing = [0.25, 0.1, 0.25, 1], // Custom easing curve for smoothness
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    threshold: 0.1,
    margin: "-50px", // Starts animation slightly before element is fully in view
  });

  const getInitialState = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: distance, scale: 0.95 };
      case "down":
        return { opacity: 0, y: -distance, scale: 0.95 };
      case "left":
        return { opacity: 0, x: distance, scale: 0.95 };
      case "right":
        return { opacity: 0, x: -distance, scale: 0.95 };
      case "fade":
        return { opacity: 0, scale: 0.98 };
      case "scale":
        return { opacity: 0, scale: 0.8 };
      default:
        return { opacity: 0, y: distance, scale: 0.95 };
    }
  };

  const getAnimateState = () => {
    switch (direction) {
      case "up":
      case "down":
        return { opacity: 1, y: 0, scale: 1 };
      case "left":
      case "right":
        return { opacity: 1, x: 0, scale: 1 };
      case "fade":
      case "scale":
        return { opacity: 1, scale: 1 };
      default:
        return { opacity: 1, y: 0, scale: 1 };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={getInitialState()}
      animate={isInView ? getAnimateState() : {}}
      transition={{
        duration: duration,
        delay: delay,
        ease: easing,
        scale: {
          type: "spring",
          damping: 15,
          stiffness: 100,
        },
      }}
      style={{
        transformOrigin: "center center",
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
