import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import styles from "../../styles/Home.module.css";
import {
  physicsStep,
  checkBucketCollision,
  checkRectCollision,
  resolveRectCollision,
  drawBall,
  drawBucket,
  drawBackground,
  createBall,
  resetBall,
} from "../../lib/ballPhysics";

const BALL_RADIUS = 15;
const BUCKET_WIDTH = 90;
const BUCKET_HEIGHT = 55;
const FAN_EFFECT_RADIUS = 150;
const MAX_FAN_POWER = 1.5;

const PHYSICS = {
  gravity: 0,
  frictionX: 0.995,
  frictionY: 0.995,
};

export default function FanZone() {
  const [darkMode, setDarkMode] = useState(true);
  const [gameState, setGameState] = useState("placing"); // placing, simulating, scored
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Ball state
  const ballRef = useRef(createBall(0, 0));

  // Fans array: { x, y, dirX, dirY, power }
  const fansRef = useRef([]);

  // Current fan being placed
  const placingRef = useRef({ isPlacing: false, startX: 0, startY: 0, endX: 0, endY: 0 });

  // Level data
  const levelRef = useRef({ ballStart: { x: 0, y: 0 }, bucket: { x: 0, y: 0 }, obstacles: [] });

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

    // Ball starts top-left
    const ballStart = {
      x: 80 + Math.random() * 80,
      y: 80,
    };

    // Bucket bottom-right
    const bucket = {
      x: width - 150 - Math.random() * 100,
      y: height - 100,
    };

    // Generate obstacles based on level
    const obstacles = [];
    const numObstacles = Math.min(2 + levelNum, 8);

    for (let i = 0; i < numObstacles; i++) {
      const isHorizontal = Math.random() > 0.5;
      const obstacleWidth = isHorizontal ? 80 + Math.random() * 120 : 25;
      const obstacleHeight = isHorizontal ? 25 : 80 + Math.random() * 120;

      let x, y;
      let attempts = 0;
      do {
        x = 100 + Math.random() * (width - 250);
        y = 150 + Math.random() * (height - 350);
        attempts++;
      } while (
        attempts < 20 &&
        ((Math.abs(x - ballStart.x) < 100 && Math.abs(y - ballStart.y) < 100) ||
         (Math.abs(x - bucket.x) < 130 && Math.abs(y - bucket.y) < 130))
      );

      obstacles.push({ x, y, width: obstacleWidth, height: obstacleHeight });
    }

    levelRef.current = { ballStart, bucket, obstacles };
    resetBall(ballRef.current, ballStart.x, ballStart.y);
    fansRef.current = [];
    setGameState("placing");
  }, []);

  useEffect(() => {
    generateLevel(level);
  }, [level, generateLevel]);

  const handleMouseDown = useCallback((e) => {
    if (gameState !== "placing") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    placingRef.current = {
      isPlacing: true,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    };
  }, [gameState]);

  const handleMouseMove = useCallback((e) => {
    if (!placingRef.current.isPlacing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    placingRef.current.endX = e.clientX - rect.left;
    placingRef.current.endY = e.clientY - rect.top;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!placingRef.current.isPlacing) return;

    const { startX, startY, endX, endY } = placingRef.current;
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only add if dragged enough
    if (distance > 20) {
      const power = Math.min(distance / 150, 1) * MAX_FAN_POWER;
      const dirX = dx / distance;
      const dirY = dy / distance;

      fansRef.current.push({
        x: startX,
        y: startY,
        dirX,
        dirY,
        power,
      });
    }

    placingRef.current.isPlacing = false;
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

  const startSimulation = useCallback(() => {
    const { ballStart } = levelRef.current;
    resetBall(ballRef.current, ballStart.x, ballStart.y);
    setGameState("simulating");
  }, []);

  const resetLevel = useCallback(() => {
    const { ballStart } = levelRef.current;
    resetBall(ballRef.current, ballStart.x, ballStart.y);
    fansRef.current = [];
    setGameState("placing");
  }, []);

  const nextLevel = useCallback(() => {
    setLevel(l => l + 1);
  }, []);

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
      const fans = fansRef.current;
      const placing = placingRef.current;
      const { ballStart, bucket, obstacles } = levelRef.current;

      // Physics when simulating
      if (gameState === "simulating") {
        // Apply fan forces
        for (const fan of fans) {
          const dx = ball.x - fan.x;
          const dy = ball.y - fan.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < FAN_EFFECT_RADIUS) {
            // Force decreases with distance
            const strength = (1 - dist / FAN_EFFECT_RADIUS) * fan.power;
            ball.vx += fan.dirX * strength;
            ball.vy += fan.dirY * strength;
          }
        }

        physicsStep(ball, PHYSICS);

        // Wall collisions (all sides - ball is on a table)
        if (ball.x - BALL_RADIUS < 0) {
          ball.x = BALL_RADIUS;
          ball.vx = -ball.vx * 0.6;
        }
        if (ball.x + BALL_RADIUS > width) {
          ball.x = width - BALL_RADIUS;
          ball.vx = -ball.vx * 0.6;
        }
        if (ball.y - BALL_RADIUS < 0) {
          ball.y = BALL_RADIUS;
          ball.vy = -ball.vy * 0.6;
        }
        if (ball.y + BALL_RADIUS > height) {
          ball.y = height - BALL_RADIUS;
          ball.vy = -ball.vy * 0.6;
        }

        // Obstacle collisions
        for (const obstacle of obstacles) {
          const collision = checkRectCollision(ball, obstacle, BALL_RADIUS);
          if (collision) {
            resolveRectCollision(ball, collision, BALL_RADIUS, 0.5);
          }
        }

        // Bucket collision
        if (checkBucketCollision(ball, bucket, BUCKET_WIDTH, BUCKET_HEIGHT)) {
          setScore(s => s + 1);
          setGameState("scored");
        }
      }

      // Draw background
      drawBackground(ctx, width, height, darkMode);

      // Draw fan effect zones (during placing)
      if (gameState === "placing") {
        for (const fan of fans) {
          ctx.strokeStyle = darkMode ? "rgba(100, 200, 255, 0.2)" : "rgba(0, 100, 200, 0.15)";
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(fan.x, fan.y, FAN_EFFECT_RADIUS, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw obstacles
      for (const obstacle of obstacles) {
        ctx.fillStyle = darkMode ? "#4a5568" : "#a0aec0";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Add some depth
        ctx.fillStyle = darkMode ? "#3a4558" : "#8090a0";
        ctx.fillRect(obstacle.x, obstacle.y + obstacle.height - 3, obstacle.width, 3);
      }

      // Draw fans
      for (const fan of fans) {
        // Fan base
        ctx.fillStyle = darkMode ? "#64b5f6" : "#2196f3";
        ctx.beginPath();
        ctx.arc(fan.x, fan.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Wind direction arrow
        const arrowLen = 30 + fan.power * 40;
        const endX = fan.x + fan.dirX * arrowLen;
        const endY = fan.y + fan.dirY * arrowLen;

        ctx.strokeStyle = darkMode ? "#90caf9" : "#1976d2";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(fan.x, fan.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrow head
        const headLen = 10;
        const angle = Math.atan2(fan.dirY, fan.dirX);
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(angle - 0.4),
          endY - headLen * Math.sin(angle - 0.4)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(angle + 0.4),
          endY - headLen * Math.sin(angle + 0.4)
        );
        ctx.stroke();

        // Wind effect lines (animated during simulation)
        if (gameState === "simulating") {
          const time = Date.now() / 100;
          ctx.strokeStyle = darkMode ? "rgba(100, 200, 255, 0.3)" : "rgba(0, 100, 200, 0.2)";
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const offset = ((time + i * 20) % 60);
            const lineStart = 20 + offset;
            const lineEnd = lineStart + 15;
            ctx.beginPath();
            ctx.moveTo(
              fan.x + fan.dirX * lineStart,
              fan.y + fan.dirY * lineStart
            );
            ctx.lineTo(
              fan.x + fan.dirX * lineEnd,
              fan.y + fan.dirY * lineEnd
            );
            ctx.stroke();
          }
        }
      }

      // Draw fan being placed
      if (placing.isPlacing) {
        const dx = placing.endX - placing.startX;
        const dy = placing.endY - placing.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
          // Preview circle
          ctx.fillStyle = darkMode ? "rgba(100, 181, 246, 0.5)" : "rgba(33, 150, 243, 0.5)";
          ctx.beginPath();
          ctx.arc(placing.startX, placing.startY, 15, 0, Math.PI * 2);
          ctx.fill();

          // Preview effect zone
          ctx.strokeStyle = darkMode ? "rgba(100, 200, 255, 0.2)" : "rgba(0, 100, 200, 0.15)";
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(placing.startX, placing.startY, FAN_EFFECT_RADIUS, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Preview arrow
          ctx.strokeStyle = darkMode ? "rgba(144, 202, 249, 0.7)" : "rgba(25, 118, 210, 0.7)";
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(placing.startX, placing.startY);
          ctx.lineTo(placing.endX, placing.endY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Power indicator
          const power = Math.min(distance / 150, 1) * 100;
          ctx.fillStyle = darkMode ? "#fff" : "#333";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${Math.round(power)}%`, placing.startX, placing.startY - 25);
        }
      }

      // Draw ball start indicator
      if (gameState === "placing") {
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

      // Draw bucket
      drawBucket(ctx, bucket, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "green");

      // Draw ball
      drawBall(ctx, ball, BALL_RADIUS, darkMode);

      // Draw UI
      ctx.fillStyle = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";

      if (gameState === "placing") {
        ctx.fillText("Click and drag to place fans, then start simulation!", 20, 30);
        ctx.fillText(`Fans placed: ${fans.length}`, 20, 55);
      } else if (gameState === "simulating") {
        ctx.fillText("Simulating...", 20, 30);
      }

      ctx.fillText(`Score: ${score}  |  Level: ${level}`, 20, gameState === "placing" ? 80 : 55);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, darkMode, score, level]);

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Fan Zone | Joe Powers</title>
        <meta name="description" content="Place fans to blow the ball through obstacles into the bucket!" />
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
          cursor: gameState === "placing" ? "crosshair" : "default",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {gameState === "placing" && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          display: "flex",
          gap: "0.5rem",
          zIndex: 10,
        }}>
          {fansRef.current.length > 0 && (
            <button
              onClick={resetLevel}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                backgroundColor: darkMode ? "#718096" : "#a0aec0",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Clear Fans
            </button>
          )}
          <button
            onClick={startSimulation}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.2rem",
              backgroundColor: darkMode ? "#64b5f6" : "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            Start!
          </button>
        </div>
      )}

      {gameState === "simulating" && (
        <button
          onClick={resetLevel}
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
          Reset
        </button>
      )}

      {gameState === "scored" && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39, 174, 96, 0.9)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}>
          <h1 style={{ fontSize: "3rem", color: "white", marginBottom: "1rem" }}>
            Nice!
          </h1>
          <p style={{ color: "white", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Fans used: {fansRef.current.length}
          </p>
          <p style={{ color: "white", fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.8 }}>
            Score: {score} | Level: {level}
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={nextLevel}
              style={{
                padding: "1rem 2rem",
                fontSize: "1.2rem",
                backgroundColor: "#2d7a4a",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Next Level
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
