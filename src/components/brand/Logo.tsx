import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "dark" | "gold";
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  variant = "default",
  showText = true,
  className = "",
}) => {
  const iconDimensions = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-3xl",
  };

  const badgeSizes = {
    sm: "text-[9px] px-1 py-0.2",
    md: "text-[10px] px-1.5 py-0.5",
    lg: "text-xs px-2 py-0.5",
    xl: "text-sm px-2.5 py-1",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* ── VECTOR EMBLEM (AI Calendar Grid & Spark Matrix) ── */}
      <div
        className={`relative ${iconDimensions[size]} rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
          variant === "gold"
            ? "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 shadow-amber-500/25"
            : variant === "white"
            ? "bg-white text-indigo-600 shadow-white/20"
            : "bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 shadow-indigo-500/25"
        }`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5"
        >
          {/* Calendar Plate Outline */}
          <rect
            x="4"
            y="6"
            width="24"
            height="22"
            rx="5"
            stroke="currentColor"
            strokeWidth="2.2"
            className={variant === "white" ? "text-indigo-600" : "text-white"}
          />
          {/* Calendar Top Pins */}
          <line
            x1="10"
            y1="3"
            x2="10"
            y2="7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className={variant === "white" ? "text-indigo-600" : "text-white"}
          />
          <line
            x1="22"
            y1="3"
            x2="22"
            y2="7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className={variant === "white" ? "text-indigo-600" : "text-white"}
          />
          {/* Divider line */}
          <line
            x1="4"
            y1="12"
            x2="28"
            y2="12"
            stroke="currentColor"
            strokeWidth="1.8"
            className={variant === "white" ? "text-indigo-600" : "text-white"}
          />
          {/* Timetable Grid Blocks */}
          <rect
            x="8"
            y="16"
            width="4"
            height="4"
            rx="1.2"
            fill="currentColor"
            className={variant === "white" ? "text-indigo-600" : "text-white"}
          />
          <rect
            x="14"
            y="16"
            width="4"
            height="4"
            rx="1.2"
            fill="currentColor"
            className={variant === "white" ? "text-indigo-400" : "text-cyan-200"}
          />
          <rect
            x="20"
            y="16"
            width="4"
            height="4"
            rx="1.2"
            fill="currentColor"
            className={variant === "white" ? "text-indigo-600" : "text-white"}
          />
          <rect
            x="8"
            y="22"
            width="4"
            height="4"
            rx="1.2"
            fill="currentColor"
            className={variant === "white" ? "text-indigo-400" : "text-cyan-200"}
          />
          <rect
            x="14"
            y="22"
            width="4"
            height="4"
            rx="1.2"
            fill="currentColor"
            className={variant === "white" ? "text-indigo-600" : "text-white"}
          />

          {/* AI Neural Spark Star in the bottom right block */}
          <path
            d="M22 20.5L22.6 22.4L24.5 23L22.6 23.6L22 25.5L21.4 23.6L19.5 23L21.4 22.4L22 20.5Z"
            fill="currentColor"
            className={variant === "white" ? "text-amber-500" : "text-amber-300"}
          />
        </svg>
      </div>

      {/* ── LOGOTYPE TYPOGRAPHY ── */}
      {showText && (
        <div className="flex items-baseline tracking-tight">
          <span
            className={`font-black ${textSizes[size]} ${
              variant === "white"
                ? "text-white"
                : variant === "dark"
                ? "text-slate-900"
                : "text-slate-900 dark:text-white"
            }`}
          >
            Jadval
          </span>
          <span
            className={`font-black ${textSizes[size]} ${
              variant === "gold"
                ? "text-amber-400"
                : "bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent"
            }`}
          >
            .AI
          </span>
          <span
            className={`ml-1.5 font-bold uppercase rounded-md ${badgeSizes[size]} ${
              variant === "gold"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
            }`}
          >
            SaaS
          </span>
        </div>
      )}
    </div>
  );
};
