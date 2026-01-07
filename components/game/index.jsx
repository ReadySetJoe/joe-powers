import Link from "next/link";
import { forwardRef } from "react";

/**
 * Back to games link - fixed position at bottom left
 */
export function BackToGamesLink({ darkMode }) {
  return (
    <Link
      href="/games"
      style={{
        position: "fixed",
        bottom: "10px",
        left: "20px",
        color: darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
        textDecoration: "underline",
        zIndex: 5,
      }}
    >
      &larr; Back to Games
    </Link>
  );
}

/**
 * Result overlay shown when game ends (won/lost/scored/missed)
 */
export function ResultOverlay({
  show,
  success,
  title,
  stats,
  primaryAction,
  primaryLabel,
  darkMode,
}) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: success
          ? "rgba(39, 174, 96, 0.9)"
          : "rgba(197, 48, 48, 0.9)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <h1
        style={{ fontSize: "3rem", color: "white", marginBottom: "1rem" }}
      >
        {title}
      </h1>
      {stats && (
        <p
          style={{
            color: "white",
            fontSize: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {stats}
        </p>
      )}
      <div style={{ display: "flex", gap: "1rem" }}>
        <GameButton onClick={primaryAction} variant={success ? "success" : "secondary"}>
          {primaryLabel}
        </GameButton>
        <Link
          href="/games"
          style={{
            padding: "1rem 2rem",
            fontSize: "1.2rem",
            backgroundColor: "#718096",
            color: "white",
            borderRadius: "10px",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          Back to Games
        </Link>
      </div>
    </div>
  );
}

/**
 * Styled game button
 */
export function GameButton({
  children,
  onClick,
  variant = "primary",
  size = "large",
  style = {},
}) {
  const baseStyle = {
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    color: "white",
    ...style,
  };

  const sizeStyles = {
    small: { padding: "0.5rem 1rem", fontSize: "0.9rem" },
    medium: { padding: "0.75rem 1.5rem", fontSize: "1rem" },
    large: { padding: "1rem 2rem", fontSize: "1.2rem" },
  };

  const variantStyles = {
    primary: { backgroundColor: "#3182ce" },
    secondary: { backgroundColor: "#4a5568" },
    success: { backgroundColor: "#2d7a4a" },
    danger: { backgroundColor: "#c53030" },
    purple: { backgroundColor: "#805ad5" },
    teal: { backgroundColor: "#319795" },
    blue: { backgroundColor: "#2196f3" },
    gray: { backgroundColor: "#718096" },
  };

  return (
    <button
      onClick={onClick}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
    >
      {children}
    </button>
  );
}

/**
 * Full-screen game canvas with touch/mouse event handling
 */
export const GameCanvas = forwardRef(function GameCanvas(
  {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    cursor = "default",
    style = {},
  },
  ref
) {
  const handleTouchStart = (e) => {
    e.preventDefault();
    onPointerDown?.(e);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    onPointerMove?.(e);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    onPointerUp?.(e);
  };

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        cursor,
        ...style,
      }}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
});

/**
 * Action button positioned in top-right corner
 */
export function ActionButton({
  children,
  onClick,
  variant = "primary",
  size = "large",
  visible = true,
}) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 10,
      }}
    >
      <GameButton onClick={onClick} variant={variant} size={size}>
        {children}
      </GameButton>
    </div>
  );
}

/**
 * Multiple action buttons in top-right corner
 */
export function ActionButtons({ children, visible = true }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        display: "flex",
        gap: "0.5rem",
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
}
