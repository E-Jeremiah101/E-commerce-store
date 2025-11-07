// UserBadge.jsx
import React from "react";
import axiosInstance from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
/**
 * Props:
 *  - name: full name string (e.g. "Enofe Jeremiah")
 *  - size: "sm" | "md" | "lg"  (default "md")
 *  - showFullName: boolean (if false, only shows initials)
 *  - className: extra classes for the wrapper
 */

const initialsFromName = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first}${last}`;
};

// deterministic color picker from string
const colorFromString = (str = "") => {
  const colors = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-pink-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-teal-500",
    "bg-amber-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
};

const sizeMap = {
  sm: {
    avatar: "h-8 w-8 text-sm",
    text: "text-sm",
    gap: "gap-2",
  },
  md: {
    avatar: "h-10 w-10 text-base",
    text: "text-base",
    gap: "gap-3",
  },
  lg: {
    avatar: "h-12 w-12 text-lg",
    text: "text-lg",
    gap: "gap-4",
  },
};

export default function UserBadge({
    
  name = "User",
  size = "md",
  showFullName = true,
  className = "",
}) {
  const initials = initialsFromName(name);
  const colorClass = colorFromString(name);
  const sz = sizeMap[size] || sizeMap.md;
  const { user } = useUserStore();

  return (
    <div
      className={`flex items-center ${sz.gap} ${className}`}
      role="group"
      aria-label={name}
    >
      {/* Initials circle */}
      <div
        className={`flex items-center justify-center rounded-full ${sz.avatar} ${colorClass} text-white font-semibold select-none`}
        title={name}
        aria-hidden="true"
      >
        <span className={`leading-none ${sz.text}`}>{initials}</span>
      </div>

      {/* Name + small tag */}
      {showFullName && (
        <div className="flex flex-col min-w-0">
          <span
            className={`truncate text-base whitespace-normal font-medium text-gray-900 ${sz.text}`}
            title={name}
          >
            {name}
          </span>
          {/* small nametag (first letter of first & last in a pill) */}
          <div className="mt-0.5 flex items-center space-x-2">
            {user && (
              <span className="text-xs text-gray-500 tracking-widest">
                {user.role.toUpperCase()}
              </span>
            )}
            {!user && (
              <span className="text-xs text-gray-500 tracking-widest">
                {"GUEST"}
              </span>
            )}

            {/* optionally add role/status text */}
          </div>
        </div>
      )}
    </div>
  );
}
