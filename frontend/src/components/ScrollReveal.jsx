// components/ScrollReveal.jsx
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

const ScrollReveal = ({ children, delay = 0 }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const variants = {
    hidden: { opacity: 1, y: 20 }, // ✅ visible by default
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut", delay },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={controls}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;



// export default function AnimatedItem({ children, delay = 0 }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 40 }}          // Start faded and slightly below
//       whileInView={{ opacity: 1, y: 0 }}       // Fade in and move up
//       viewport={{ once: true, amount: 0.2 }}   // Animate once when 20% visible
//       transition={{
//         duration: 0.6,
//         delay,
//         ease: "easeOut",
//       }}
//     >
//       {children}
//     </motion.div>
//   );
// }
