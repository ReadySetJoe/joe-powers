import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import styles from "../../styles/Home.module.css";
import {
  physicsStep,
  handleWallCollisions,
  checkBucketCollision,
  drawBall,
  drawBucket,
  drawBackground,
  createBall,
  resetBall,
  getBallSpeed,
  hasBallSettled,
} from "../../lib/ballPhysics";

const BALL_RADIUS = 20;
const BUCKET_WIDTH = 100;
const BUCKET_HEIGHT = 60;
const POWER_MULTIPLIER = 0.15;
const MAX_DRAG_DISTANCE = 200;

const PHYSICS = {
  gravity: 0.4,
  frictionX: 0.99,
  frictionY: 0.99,
};

export default function Slingshot() {
  const [darkMode, setDarkMode] = useState(true);
  const [gameState, setGameState] = useState("aiming"); // aiming, flying, scored, settled
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Ball state
  const ballRef = useRef(createBall(0, 0));
  const ballStartRef = useRef({ x: 0, y: 0 });

  // Drag state
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  // Bucket position
  const bucketRef = useRef({ x: 0, y: 0 });

  // Dimensions
  const dimensionsRef = useRef({ width: 0, height: 0 });

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

  const initializeGame = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    dimensionsRef.current = { width, height };

    // Ball starts bottom-left, high enough to allow pullback
    const ballStartX = width * 0.12;
    const ballStartY = height * 0.65;
    ballStartRef.current = { x: ballStartX, y: ballStartY };
    resetBall(ballRef.current, ballStartX, ballStartY);

    // Place bucket randomly in upper-right quadrant
    bucketRef.current = {
      x: width * 0.55 + Math.random() * (width * 0.35 - BUCKET_WIDTH),
      y: height * 0.1 + Math.random() * (height * 0.35),
    };

    setGameState("aiming");
  }, []);

  useEffect(() => {
    initializeGame();
    window.addEventListener("resize", initializeGame);
    return () => window.removeEventListener("resize", initializeGame);
  }, [initializeGame]);

  const resetBallToStart = useCallback(() => {
    const { x, y } = ballStartRef.current;
    resetBall(ballRef.current, x, y);
    setGameState("aiming");
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (gameState !== "aiming") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking near the ball
    const ball = ballRef.current;
    const dist = Math.sqrt((x - ball.x) ** 2 + (y - ball.y) ** 2);

    if (dist < BALL_RADIUS * 3) {
      dragRef.current = {
        isDragging: true,
        startX: ball.x,
        startY: ball.y,
        currentX: x,
        currentY: y,
      };
    }
  }, [gameState]);

  const handleMouseMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    dragRef.current.currentX = e.clientX - rect.left;
    dragRef.current.currentY = e.clientY - rect.top;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current.isDragging) return;

    const drag = dragRef.current;
    const ball = ballRef.current;

    // Calculate drag vector
    const dx = drag.startX - drag.currentX;
    const dy = drag.startY - drag.currentY;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_DRAG_DISTANCE);

    if (distance > 10) {
      // Normalize and apply power
      const angle = Math.atan2(dy, dx);
      const power = distance * POWER_MULTIPLIER;

      ball.vx = Math.cos(angle) * power;
      ball.vy = Math.sin(angle) * power;

      setShots(s => s + 1);
      setGameState("flying");
    }

    dragRef.current.isDragging = false;
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

  const nextRound = useCallback(() => {
    const width = dimensionsRef.current.width;
    const height = dimensionsRef.current.height;

    // New bucket position in upper-right quadrant
    bucketRef.current = {
      x: width * 0.55 + Math.random() * (width * 0.35 - BUCKET_WIDTH),
      y: height * 0.1 + Math.random() * (height * 0.35),
    };

    resetBallToStart();
  }, [resetBallToStart]);

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
      dimensionsRef.current = { width, height };

      const ball = ballRef.current;
      const bucket = bucketRef.current;
      const drag = dragRef.current;

      // Update physics if flying
      if (gameState === "flying") {
        physicsStep(ball, PHYSICS);
        handleWallCollisions(ball, width, height, BALL_RADIUS, 0.6);

        // Check bucket collision
        if (checkBucketCollision(ball, bucket, BUCKET_WIDTH, BUCKET_HEIGHT)) {
          setScore(s => s + 1);
          setGameState("scored");
        }

        // Check if ball has settled
        if (hasBallSettled(ball, height, BALL_RADIUS, 0.5)) {
          setGameState("settled");
        }
      }

      // Draw background
      drawBackground(ctx, width, height, darkMode);

      // Draw ground line
      ctx.strokeStyle = darkMode ? "#3a3a4e" : "#b8d4e8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - 40);
      ctx.lineTo(width, height - 40);
      ctx.stroke();

      // Draw bucket
      drawBucket(ctx, bucket, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "gray");

      // Draw aiming UI when dragging
      if (drag.isDragging && gameState === "aiming") {
        const ballStart = ballStartRef.current;

        // Draw drag line
        ctx.strokeStyle = darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(ballStart.x, ballStart.y);
        ctx.lineTo(drag.currentX, drag.currentY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw projected trajectory
        const dx = drag.startX - drag.currentX;
        const dy = drag.startY - drag.currentY;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_DRAG_DISTANCE);
        const angle = Math.atan2(dy, dx);
        const power = distance * POWER_MULTIPLIER;

        // Draw trajectory dots
        ctx.fillStyle = darkMode ? "rgba(246,173,85,0.5)" : "rgba(237,137,54,0.5)";
        let simX = ballStart.x;
        let simY = ballStart.y;
        let simVx = Math.cos(angle) * power;
        let simVy = Math.sin(angle) * power;

        for (let i = 0; i < 30; i++) {
          simVy += PHYSICS.gravity;
          simX += simVx;
          simY += simVy;

          if (simY > height || simX < 0 || simX > width) break;

          ctx.beginPath();
          ctx.arc(simX, simY, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Power indicator
        const powerPercent = Math.round((distance / MAX_DRAG_DISTANCE) * 100);
        ctx.fillStyle = darkMode ? "#fff" : "#333";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Power: ${powerPercent}%`, ballStart.x, ballStart.y + 50);
      }

      // Draw ball
      drawBall(ctx, ball, BALL_RADIUS, darkMode);

      // Draw instructions/status
      ctx.fillStyle = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";

      if (gameState === "aiming") {
        ctx.fillText("Click and drag the ball to aim, release to shoot!", 20, 30);
      } else if (gameState === "flying") {
        ctx.fillText("Flying...", 20, 30);
      }

      ctx.fillText(`Score: ${score}  |  Shots: ${shots}`, 20, 60);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, darkMode, score, shots]);

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Slingshot | Joe Powers</title>
        <meta name="description" content="A slingshot game - drag and release to shoot the ball into the bucket!" />
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
          cursor: gameState === "aiming" ? "grab" : "default",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {(gameState === "scored" || gameState === "settled") && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: gameState === "scored"
            ? "rgba(39, 174, 96, 0.9)"
            : "rgba(0, 0, 0, 0.7)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}>
          <h1 style={{
            fontSize: "3rem",
            color: "white",
            marginBottom: "1rem",
          }}>
            {gameState === "scored" ? "Nice Shot!" : "Missed!"}
          </h1>
          <p style={{ color: "white", fontSize: "1.5rem", marginBottom: "2rem" }}>
            Score: {score} | Shots: {shots}
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={gameState === "scored" ? nextRound : resetBallToStart}
              style={{
                padding: "1rem 2rem",
                fontSize: "1.2rem",
                backgroundColor: gameState === "scored" ? "#2d7a4a" : "#4a5568",
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
