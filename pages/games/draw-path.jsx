import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import styles from "../../styles/Home.module.css";
import {
  physicsStep,
  handlePathCollisions,
  checkBucketCollision,
  drawBall,
  drawBucket,
  drawBackground,
  drawPath,
  createBall,
  resetBall,
  isBallOffScreen,
} from "../../lib/ballPhysics";

const BALL_RADIUS = 12;
const BUCKET_WIDTH = 80;
const BUCKET_HEIGHT = 50;
const MIN_POINT_DISTANCE = 15;

// Physics config
const PHYSICS = {
  gravity: 0.3,
  frictionX: 0.995,
  maxVelocity: 20,
};

export default function DrawPath() {
  const [darkMode, setDarkMode] = useState(true);
  const [gameState, setGameState] = useState("drawing"); // drawing, rolling, scored, missed
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [inkRemaining, setInkRemaining] = useState(100);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Ball state
  const ballRef = useRef(createBall(0, 0));

  // Path points
  const pathRef = useRef([]);

  // Drawing state
  const drawingRef = useRef({ isDrawing: false });

  // Positions
  const positionsRef = useRef({ ballStart: { x: 0, y: 0 }, bucket: { x: 0, y: 0 } });

  // Max ink (path length)
  const maxInkRef = useRef(800);

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

    // Ball starts top-left
    positionsRef.current.ballStart = {
      x: 100 + Math.random() * 100,
      y: 80,
    };

    // Bucket bottom-right
    positionsRef.current.bucket = {
      x: width * 0.6 + Math.random() * (width * 0.3 - BUCKET_WIDTH),
      y: height - 90,
    };

    // Reset ball using shared utility
    const { ballStart } = positionsRef.current;
    resetBall(ballRef.current, ballStart.x, ballStart.y);

    pathRef.current = [];
    maxInkRef.current = 600 + round * 100;
    setInkRemaining(100);
    setGameState("drawing");
  }, [round]);

  useEffect(() => {
    initializeRound();
  }, [initializeRound]);

  const getPathLength = useCallback(() => {
    const path = pathRef.current;
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (gameState !== "drawing") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawingRef.current.isDrawing = true;
    pathRef.current.push({ x, y });
  }, [gameState]);

  const handleMouseMove = useCallback((e) => {
    if (!drawingRef.current.isDrawing || gameState !== "drawing") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const path = pathRef.current;
    if (path.length > 0) {
      const last = path[path.length - 1];
      const dist = Math.sqrt((x - last.x) ** 2 + (y - last.y) ** 2);

      if (dist >= MIN_POINT_DISTANCE) {
        const currentLength = getPathLength();
        if (currentLength < maxInkRef.current) {
          path.push({ x, y });
          const newLength = getPathLength();
          setInkRemaining(Math.max(0, Math.round((1 - newLength / maxInkRef.current) * 100)));
        }
      }
    }
  }, [gameState, getPathLength]);

  const handleMouseUp = useCallback(() => {
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

  const releaseBall = useCallback(() => {
    const { ballStart } = positionsRef.current;
    resetBall(ballRef.current, ballStart.x, ballStart.y);
    setGameState("rolling");
  }, []);

  const handleResetBall = useCallback(() => {
    const { ballStart } = positionsRef.current;
    resetBall(ballRef.current, ballStart.x, ballStart.y);
    setGameState("rolling");
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
      const path = pathRef.current;
      const { ballStart, bucket } = positionsRef.current;

      // Physics update when rolling
      if (gameState === "rolling") {
        // Use shared physics step
        physicsStep(ball, PHYSICS);

        // Wall collisions (but not bottom - ball can fall out)
        if (ball.x - BALL_RADIUS < 0) {
          ball.x = BALL_RADIUS;
          ball.vx = -ball.vx * 0.5;
        }
        if (ball.x + BALL_RADIUS > width) {
          ball.x = width - BALL_RADIUS;
          ball.vx = -ball.vx * 0.5;
        }
        if (ball.y - BALL_RADIUS < 0) {
          ball.y = BALL_RADIUS;
          ball.vy = -ball.vy * 0.5;
        }

        // Path collisions using shared utility
        handlePathCollisions(ball, path, BALL_RADIUS, {
          multiplier: 0.85,
          padding: 4,
        });

        // Bucket check using shared utility
        if (checkBucketCollision(ball, bucket, BUCKET_WIDTH, BUCKET_HEIGHT)) {
          setScore(s => s + 1);
          setGameState("scored");
        }

        // Fell off using shared utility
        if (isBallOffScreen(ball, height, BALL_RADIUS)) {
          setGameState("missed");
        }
      }

      // Draw background using shared utility
      drawBackground(ctx, width, height, darkMode);

      // Draw path using shared utility
      if (path.length > 1) {
        drawPath(ctx, path, darkMode);
      }

      // Draw ball start indicator
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
        ctx.fillText("Start", ballStart.x, ballStart.y + BALL_RADIUS + 25);
      }

      // Draw bucket using shared utility
      drawBucket(ctx, bucket, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "green");

      // Draw ball using shared utility
      drawBall(ctx, ball, BALL_RADIUS, darkMode);

      // Draw ink meter
      if (gameState === "drawing") {
        const meterWidth = 150;
        const meterHeight = 12;
        const meterX = width - meterWidth - 20;
        const meterY = 60;

        ctx.fillStyle = darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";
        ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

        ctx.fillStyle = darkMode ? "#4fd1c5" : "#319795";
        ctx.fillRect(meterX, meterY, meterWidth * (inkRemaining / 100), meterHeight);

        ctx.fillStyle = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`Ink: ${inkRemaining}%`, width - 20, meterY - 5);
      }

      // Draw UI
      ctx.fillStyle = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";

      if (gameState === "drawing") {
        ctx.fillText("Draw a path - the ball will bounce gently along it!", 20, 30);
      } else if (gameState === "rolling") {
        ctx.fillText("Bouncing...", 20, 30);
      }

      ctx.fillText(`Score: ${score}  |  Round: ${round}`, 20, 55);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, darkMode, score, round, inkRemaining]);

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Draw Path | Joe Powers</title>
        <meta name="description" content="Draw a path for the ball to bounce along into the bucket!" />
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
          onClick={releaseBall}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "1rem 2rem",
            fontSize: "1.2rem",
            backgroundColor: darkMode ? "#4fd1c5" : "#319795",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          Release Ball!
        </button>
      )}

      {gameState === "rolling" && (
        <button
          onClick={handleResetBall}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: darkMode ? "#718096" : "#a0aec0",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          Reset Ball
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
          <p style={{ color: "white", fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.8 }}>
            Score: {score} | Round: {round}
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={gameState === "scored" ? nextRound : retry}
              style={{
                padding: "1rem 2rem",
                fontSize: "1.2rem",
                backgroundColor: gameState === "scored" ? "#2d7a4a" : "#4fd1c5",
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
