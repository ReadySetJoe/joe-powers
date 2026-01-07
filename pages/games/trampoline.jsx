import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import styles from "../../styles/Home.module.css";
import {
  physicsStep,
  handleWallCollisions,
  handleMultipleLineCollisions,
  checkBucketCollision,
  drawBall,
  drawBucket,
  drawBackground,
  drawLine,
  createBall,
  resetBall,
  isBallOffScreen,
} from "../../lib/ballPhysics";

const BALL_RADIUS = 15;
const BUCKET_WIDTH = 90;
const BUCKET_HEIGHT = 55;

const PHYSICS = {
  gravity: 0.35,
  frictionX: 0.995,
};

const TRAMPOLINE_OPTIONS = {
  multiplier: 1.1,
  padding: 0,
};

export default function Trampoline() {
  const [darkMode, setDarkMode] = useState(true);
  const [gameState, setGameState] = useState("drawing"); // drawing, dropping, scored, missed
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Ball state
  const ballRef = useRef(createBall(0, 0));

  // Trampolines (lines)
  const trampolinesRef = useRef([]);

  // Current drawing line
  const drawingRef = useRef({ isDrawing: false, startX: 0, startY: 0, endX: 0, endY: 0 });

  // Fixed positions
  const positionsRef = useRef({ ballStart: { x: 0, y: 0 }, bucket: { x: 0, y: 0 } });

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

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const initializeRound = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Ball drops from top-left area
    positionsRef.current.ballStart = {
      x: 80 + Math.random() * 150,
      y: 60,
    };

    // Bucket in bottom-right area
    positionsRef.current.bucket = {
      x: width * 0.6 + Math.random() * (width * 0.3 - BUCKET_WIDTH),
      y: height - 80,
    };

    // Reset ball
    const { ballStart } = positionsRef.current;
    resetBall(ballRef.current, ballStart.x, ballStart.y);

    // Clear trampolines
    trampolinesRef.current = [];

    setGameState("drawing");
  }, []);

  useEffect(() => {
    initializeRound();
  }, [initializeRound, round]);

  const handleMouseDown = useCallback((e) => {
    if (gameState !== "drawing") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawingRef.current = {
      isDrawing: true,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    };
  }, [gameState]);

  const handleMouseMove = useCallback((e) => {
    if (!drawingRef.current.isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    drawingRef.current.endX = e.clientX - rect.left;
    drawingRef.current.endY = e.clientY - rect.top;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!drawingRef.current.isDrawing) return;

    const { startX, startY, endX, endY } = drawingRef.current;
    const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

    // Only add if line is long enough
    if (length > 30) {
      trampolinesRef.current.push({
        x1: startX,
        y1: startY,
        x2: endX,
        y2: endY,
      });
    }

    drawingRef.current.isDrawing = false;
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  }, [handleMouseDown]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }, [handleMouseMove]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  const dropBall = useCallback(() => {
    const { ballStart } = positionsRef.current;
    resetBall(ballRef.current, ballStart.x, ballStart.y, Math.random() * 2 - 1, 0);
    setGameState("dropping");
  }, []);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
  }, []);

  const retry = useCallback(() => {
    initializeRound();
  }, [initializeRound]);

  // Game loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const ball = ballRef.current;
      const trampolines = trampolinesRef.current;
      const drawing = drawingRef.current;
      const { ballStart, bucket } = positionsRef.current;

      // Physics update when dropping
      if (gameState === "dropping") {
        physicsStep(ball, PHYSICS);

        // Wall bounces (but not bottom)
        if (ball.x - BALL_RADIUS < 0) {
          ball.x = BALL_RADIUS;
          ball.vx = -ball.vx * 0.7;
        }
        if (ball.x + BALL_RADIUS > width) {
          ball.x = width - BALL_RADIUS;
          ball.vx = -ball.vx * 0.7;
        }
        if (ball.y - BALL_RADIUS < 0) {
          ball.y = BALL_RADIUS;
          ball.vy = -ball.vy * 0.7;
        }

        // Trampoline collisions
        handleMultipleLineCollisions(ball, trampolines, BALL_RADIUS, TRAMPOLINE_OPTIONS);

        // Bucket collision
        if (checkBucketCollision(ball, bucket, BUCKET_WIDTH, BUCKET_HEIGHT)) {
          setScore(s => s + 1);
          setGameState("scored");
        }

        // Fell off bottom
        if (isBallOffScreen(ball, height, BALL_RADIUS)) {
          setGameState("missed");
        }
      }

      // Draw background
      drawBackground(ctx, width, height, darkMode);

      // Draw ball start indicator (when drawing)
      if (gameState === "drawing") {
        ctx.strokeStyle = darkMode ? "rgba(246,173,85,0.5)" : "rgba(237,137,54,0.5)";
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ballStart.x, ballStart.y, BALL_RADIUS + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Drop", ballStart.x, ballStart.y + BALL_RADIUS + 25);
      }

      // Draw trampolines
      for (const line of trampolines) {
        drawLine(ctx, line.x1, line.y1, line.x2, line.y2, darkMode);
      }

      // Draw current drawing line
      if (drawing.isDrawing) {
        ctx.strokeStyle = darkMode ? "rgba(159,122,234,0.6)" : "rgba(128,90,213,0.6)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(drawing.startX, drawing.startY);
        ctx.lineTo(drawing.endX, drawing.endY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw bucket
      drawBucket(ctx, bucket, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "green");

      // Draw ball
      drawBall(ctx, ball, BALL_RADIUS, darkMode);

      // Draw UI
      ctx.fillStyle = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";

      if (gameState === "drawing") {
        ctx.fillText("Draw trampolines, then press Drop!", 20, 30);
        ctx.fillText(`Trampolines: ${trampolines.length}`, 20, 55);
      } else if (gameState === "dropping") {
        ctx.fillText("Bouncing...", 20, 30);
      }

      ctx.fillText(`Score: ${score}  |  Round: ${round}`, 20, gameState === "drawing" ? 80 : 55);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, darkMode, score, round]);

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Trampoline | Joe Powers</title>
        <meta name="description" content="Draw trampolines to bounce the ball into the bucket!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/confused-emote-no-bkgd.png" />
      </Head>

      <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          cursor: gameState === "drawing" ? "crosshair" : "default",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {gameState === "drawing" && (
        <button
          onClick={dropBall}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "1rem 2rem",
            fontSize: "1.2rem",
            backgroundColor: darkMode ? "#9f7aea" : "#805ad5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          Drop Ball!
        </button>
      )}

      {(gameState === "scored" || gameState === "missed") && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: gameState === "scored"
            ? "rgba(39, 174, 96, 0.9)"
            : "rgba(0, 0, 0, 0.8)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}>
          <h1 style={{ fontSize: "3rem", color: "white", marginBottom: "1rem" }}>
            {gameState === "scored" ? "Nice!" : "Missed!"}
          </h1>
          <p style={{ color: "white", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Trampolines used: {trampolinesRef.current.length}
          </p>
          <p style={{ color: "white", fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.8 }}>
            Score: {score} | Round: {round}
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={gameState === "scored" ? nextRound : retry}
              style={{
                padding: "1rem 2rem",
                fontSize: "1.2rem",
                backgroundColor: gameState === "scored" ? "#2d7a4a" : "#9f7aea",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              {gameState === "scored" ? "Next Round" : "Try Again"}
            </button>
            <Link
              href="/games"
              style={{
                padding: "1rem 2rem",
                fontSize: "1.2rem",
                backgroundColor: "#718096",
                color: "white",
                borderRadius: "10px",
                textDecoration: "none",
              }}
            >
              Back to Games
            </Link>
          </div>
        </div>
      )}

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
    </div>
  );
}
