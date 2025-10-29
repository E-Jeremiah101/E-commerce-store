import { useEffect, useRef } from "react";

export default function useTrackVisitors() {
  const hasLogged = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in dev or hot reload
    if (hasLogged.current || localStorage.getItem("visitorLogged")) return;
    hasLogged.current = true;
    localStorage.setItem("visitorLogged", "true");

    const logVisitor = async () => {
      try {
        const res = await fetch("/api/visitors", { method: "POST" });
        if (!res.ok) {
          console.warn("Failed to record visitor:", res.status);
          localStorage.removeItem("visitorLogged"); // allow retry
        } else {
          console.log(" Visitor recorded successfully");
        }
      } catch (err) {
        console.error("Visitor logging error:", err);
        localStorage.removeItem("visitorLogged");
      }
    };

    logVisitor();
  }, []);
}
