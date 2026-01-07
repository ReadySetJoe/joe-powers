import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import styles from "../../styles/Home.module.css";
import {
  applyGravity,
  applyFriction,
  capVelocity,
  updatePosition,
  handleWallCollisions,
  checkRectCollision,
  resolveRectCollision,
  checkBucketCollision,
  drawBall,
  drawBucket,
  drawBackground,
  createBall,
  resetBall,
} from "../../lib/ballPhysics";

const BALL_RADIUS = 15;
const BUCKET_WIDTH = 80;
const BUCKET_HEIGHT = 50;
const GRAVITY_STRENGTH = 0.4;
const FRICTION = 0.98;
const BOUNCE_DAMPENING = 0.5;
const MAX_VELOCITY = 12;
const MAX_DRAG_DISTANCE = 100;

export default function TiltMaze() {
  const [darkMode, setDarkMode] = useState(true);
  const [gameState, setGameState] = useState("playing"); // playing, won, dead
  const [level, setLevel] = useState(1);
  const [deaths, setDeaths] = useState(0);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Ball state
  const ballRef = useRef(createBall(0, 0));

  // Gravity direction (affected by drag)
  const gravityRef = useRef({ x: 0, y: 0 });

  // Drag state
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });

  // Level data
  const levelRef = useRef({ obstacles: [], bucket: { x: 0, y: 0 }, ballStart: { x: 0, y: 0 } });

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

  const generateLevel = useCallback((levelNum) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Ball starts top-left area
    const ballStart = {
      x: 80 + Math.random() * 100,
      y: 80 + Math.random() * 100,
    };

    // Bucket in bottom-right area
    const bucket = {
      x: width - 150 - Math.random() * 100,
      y: height - 120 - Math.random() * 80,
    };

    // Generate obstacles based on level
    const obstacles = [];
    const numObstacles = Math.min(3 + levelNum * 2, 15);

    for (let i = 0; i < numObstacles; i++) {
      const isHorizontal = Math.random() > 0.5;
      const obstacleWidth = isHorizontal ? 100 + Math.random() * 150 : 20;
      const obstacleHeight = isHorizontal ? 20 : 100 + Math.random() * 150;

      // Keep obstacles away from start and bucket
      let x, y;
      let attempts = 0;
      do {
        x = 50 + Math.random() * (width - 150);
        y = 50 + Math.random() * (height - 150);
        attempts++;
      } while (
        attempts < 20 &&
        ((Math.abs(x - ballStart.x) < 120 && Math.abs(y - ballStart.y) < 120) ||
         (Math.abs(x - bucket.x) < 150 && Math.abs(y - bucket.y) < 150))
      );

      obstacles.push({
        x,
        y,
        width: obstacleWidth,
        height: obstacleHeight,
        deadly: Math.random() < 0.3 && levelNum > 1, // Some obstacles are deadly after level 1
      });
    }

    levelRef.current = { obstacles, bucket, ballStart };
    resetBall(ballRef.current, ballStart.x, ballStart.y);
    gravityRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    generateLevel(level);
  }, [level, generateLevel]);

  // Mouse/touch handlers for drag control
  const handlePointerDown = useCallback((e) => {
    if (gameState !== "playing") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    dragRef.current = {
      isDragging: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    };
  }, [gameState]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    dragRef.current.currentX = x;
    dragRef.current.currentY = y;

    // Update gravity based on drag
    const dx = dragRef.current.currentX - dragRef.current.startX;
    const dy = dragRef.current.currentY - dragRef.current.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const clampedDist = Math.min(distance, MAX_DRAG_DISTANCE);
      const strength = clampedDist / MAX_DRAG_DISTANCE;
      gravityRef.current.x = (dx / distance) * strength;
      gravityRef.current.y = (dy / distance) * strength;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current.isDragging = false;
    // Gravity persists until next drag
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    handlePointerDown(e);
  }, [handlePointerDown]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    handlePointerMove(e);
  }, [handlePointerMove]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    handlePointerUp();
  }, [handlePointerUp]);

  const resetBallToStart = useCallback(() => {
    const { ballStart } = levelRef.current;
    resetBall(ballRef.current, ballStart.x, ballStart.y);
    gravityRef.current = { x: 0, y: 0 };
    setGameState("playing");
  }, []);

  const nextLevel = useCallback(() => {
    setLevel(l => l + 1);
    setGameState("playing");
  }, []);

  // Game loop
  useEffect(() => {
    if (!canvasRef.current || gameState !== "playing") return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const gameLoop = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const ball = ballRef.current;
      const gravity = gravityRef.current;
      const drag = dragRef.current;
      const { obstacles, bucket } = levelRef.current;

      // Apply physics using shared utilities
      applyGravity(ball, gravity.y * GRAVITY_STRENGTH, gravity.x * GRAVITY_STRENGTH);
      applyFriction(ball, FRICTION);
      capVelocity(ball, MAX_VELOCITY);
      updatePosition(ball);

      // Wall collisions
      handleWallCollisions(ball, width, height, BALL_RADIUS, BOUNCE_DAMPENING);

      // Obstacle collisions
      for (const obstacle of obstacles) {
        const collision = checkRectCollision(ball, obstacle, BALL_RADIUS);
        if (collision) {
          if (obstacle.deadly) {
            setDeaths(d => d + 1);
            setGameState("dead");
            return;
          }
          resolveRectCollision(ball, collision, BALL_RADIUS, BOUNCE_DAMPENING);
        }
      }

      // Bucket collision
      if (checkBucketCollision(ball, bucket, BUCKET_WIDTH, BUCKET_HEIGHT)) {
        setGameState("won");
        return;
      }

      // Draw background
      drawBackground(ctx, width, height, darkMode);

      // Draw drag indicator (where you're dragging from)
      if (drag.isDragging) {
        // Draw origin point
        ctx.fillStyle = darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.arc(drag.startX, drag.startY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Draw drag line
        ctx.strokeStyle = darkMode ? "rgba(246,173,85,0.6)" : "rgba(237,137,54,0.6)";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(drag.startX, drag.startY);
        ctx.lineTo(drag.currentX, drag.currentY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw arrow head
        const dx = drag.currentX - drag.startX;
        const dy = drag.currentY - drag.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 20) {
          const angle = Math.atan2(dy, dx);
          const headLen = 12;
          ctx.beginPath();
          ctx.moveTo(drag.currentX, drag.currentY);
          ctx.lineTo(
            drag.currentX - headLen * Math.cos(angle - 0.4),
            drag.currentY - headLen * Math.sin(angle - 0.4)
          );
          ctx.moveTo(drag.currentX, drag.currentY);
          ctx.lineTo(
            drag.currentX - headLen * Math.cos(angle + 0.4),
            drag.currentY - headLen * Math.sin(angle + 0.4)
          );
          ctx.stroke();
        }
      }

      // Draw tilt indicator (top right)
      const indicatorX = width - 60;
      const indicatorY = 60;
      ctx.strokeStyle = darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 30, 0, Math.PI * 2);
      ctx.stroke();

      // Show current gravity direction
      ctx.fillStyle = darkMode ? "#f6ad55" : "#ed8936";
      ctx.beginPath();
      ctx.arc(indicatorX + gravity.x * 25, indicatorY + gravity.y * 25, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw obstacles
      for (const obstacle of obstacles) {
        ctx.fillStyle = obstacle.deadly
          ? (darkMode ? "#e53e3e" : "#c53030")
          : (darkMode ? "#4a5568" : "#a0aec0");
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        if (obstacle.deadly) {
          // Draw X pattern on deadly obstacles
          ctx.strokeStyle = darkMode ? "#1a1a2e" : "#fff";
          ctx.lineWidth = 2;
          const cx = obstacle.x + obstacle.width / 2;
          const cy = obstacle.y + obstacle.height / 2;
          const size = Math.min(obstacle.width, obstacle.height) / 3;
          ctx.beginPath();
          ctx.moveTo(cx - size, cy - size);
          ctx.lineTo(cx + size, cy + size);
          ctx.moveTo(cx + size, cy - size);
          ctx.lineTo(cx - size, cy + size);
          ctx.stroke();
        }
      }

      // Draw bucket
      drawBucket(ctx, bucket, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "green");

      // Draw ball
      drawBall(ctx, ball, BALL_RADIUS, darkMode);

      // Draw instructions
      ctx.fillStyle = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Click/drag anywhere to tilt", 20, 30);
      ctx.fillText(`Level: ${level}  |  Deaths: ${deaths}`, 20, 55);

      // Legend
      ctx.fillStyle = darkMode ? "#e53e3e" : "#c53030";
      ctx.fillRect(20, 70, 15, 15);
      ctx.fillStyle = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
      ctx.fillText("= Deadly", 40, 82);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, darkMode, level, deaths]);

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Tilt Maze | Joe Powers</title>
        <meta name="description" content="Drag to tilt and guide the ball through obstacles into the bucket!" />
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
          cursor: "crosshair",
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {(gameState === "won" || gameState === "dead") && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: gameState === "won"
            ? "rgba(39, 174, 96, 0.9)"
            : "rgba(197, 48, 48, 0.9)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}>
          <h1 style={{ fontSize: "3rem", color: "white", marginBottom: "1rem" }}>
            {gameState === "won" ? "Level Complete!" : "You Died!"}
          </h1>
          <p style={{ color: "white", fontSize: "1.5rem", marginBottom: "2rem" }}>
            Level: {level} | Deaths: {deaths}
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={gameState === "won" ? nextLevel : resetBallToStart}
              style={{
                padding: "1rem 2rem",
                fontSize: "1.2rem",
                backgroundColor: gameState === "won" ? "#2d7a4a" : "#4a5568",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              {gameState === "won" ? "Next Level" : "Try Again"}
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
