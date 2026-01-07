import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Custom hook for dark mode state management
 * Handles localStorage persistence and body class toggling
 */
export function useDarkMode(defaultValue = true) {
  const [darkMode, setDarkMode] = useState(defaultValue);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(isDarkMode);
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);

  return [darkMode, toggleDarkMode];
}

/**
 * Get canvas-relative coordinates from a mouse/touch event
 */
export function getCanvasCoords(e, canvasRef) {
  const rect = canvasRef.current.getBoundingClientRect();
  const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

/**
 * Creates touch event handlers that wrap mouse handlers
 * Returns { handleTouchStart, handleTouchMove, handleTouchEnd }
 */
export function createTouchHandlers(mouseHandlers) {
  const { onDown, onMove, onUp } = mouseHandlers;

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    onDown?.(e);
  }, [onDown]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    onMove?.(e);
  }, [onMove]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    onUp?.(e);
  }, [onUp]);

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}

/**
 * Custom hook for game loop with canvas
 * Handles canvas setup, resize, and animation frame management
 */
export function useGameLoop(canvasRef, renderFn, deps = [], enabled = true) {
  const animationRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !enabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const loop = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      renderFn(ctx, width, height);

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasRef, renderFn, enabled, ...deps]);
}
