import Head from "next/head";
import { useCallback, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import { BackToGamesLink, GameCanvas, ResultOverlay } from "../../components/game";
import styles from "../../styles/Home.module.css";
import { useDarkMode, getCanvasCoords, useGameLoop } from "../../lib/gameHooks";
import {
  physicsStep,
  handleWallCollisions,
  checkBucketCollision,
  drawBall,
  drawBucket,
  drawBackground,
  drawGameText,
  createBall,
  resetBall,
  hasBallSettled,
} from "../../lib/ballPhysics";

const BALL_RADIUS = 20;
const BUCKET_WIDTH = 100;
const BUCKET_HEIGHT = 60;
const POWER_MULTIPLIER = 0.15;
const MAX_DRAG_DISTANCE = 200;
const PHYSICS = { gravity: 0.4, frictionX: 0.99, frictionY: 0.99 };

export default function Slingshot() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [gameState, setGameState] = useState("aiming");
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);

  const canvasRef = useRef(null);
  const ballRef = useRef(createBall(0, 0));
  const ballStartRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const bucketRef = useRef({ x: 0, y: 0 });

  const initializeGame = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const ballStartX = width * 0.12;
    const ballStartY = height * 0.65;
    ballStartRef.current = { x: ballStartX, y: ballStartY };
    resetBall(ballRef.current, ballStartX, ballStartY);

    bucketRef.current = {
      x: width * 0.55 + Math.random() * (width * 0.35 - BUCKET_WIDTH),
      y: height * 0.1 + Math.random() * (height * 0.35),
    };

    setGameState("aiming");
  }, []);

  useState(() => initializeGame());

  const handlePointerDown = useCallback((e) => {
    if (gameState !== "aiming") return;
    const { x, y } = getCanvasCoords(e, canvasRef);
    const ball = ballRef.current;
    const dist = Math.sqrt((x - ball.x) ** 2 + (y - ball.y) ** 2);

    if (dist < BALL_RADIUS * 3) {
      dragRef.current = { isDragging: true, startX: ball.x, startY: ball.y, currentX: x, currentY: y };
    }
  }, [gameState]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;
    const { x, y } = getCanvasCoords(e, canvasRef);
    dragRef.current.currentX = x;
    dragRef.current.currentY = y;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current.isDragging) return;
    const drag = dragRef.current;
    const ball = ballRef.current;

    const dx = drag.startX - drag.currentX;
    const dy = drag.startY - drag.currentY;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_DRAG_DISTANCE);

    if (distance > 10) {
      const angle = Math.atan2(dy, dx);
      const power = distance * POWER_MULTIPLIER;
      ball.vx = Math.cos(angle) * power;
      ball.vy = Math.sin(angle) * power;
      setShots(s => s + 1);
      setGameState("flying");
    }

    dragRef.current.isDragging = false;
  }, []);

  const resetBallToStart = useCallback(() => {
    resetBall(ballRef.current, ballStartRef.current.x, ballStartRef.current.y);
    setGameState("aiming");
  }, []);

  const nextRound = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    bucketRef.current = {
      x: width * 0.55 + Math.random() * (width * 0.35 - BUCKET_WIDTH),
      y: height * 0.1 + Math.random() * (height * 0.35),
    };
    resetBallToStart();
  }, [resetBallToStart]);

  const render = useCallback((ctx, width, height) => {
    const ball = ballRef.current;
    const bucket = bucketRef.current;
    const drag = dragRef.current;
    const ballStart = ballStartRef.current;

    if (gameState === "flying") {
      physicsStep(ball, PHYSICS);
      handleWallCollisions(ball, width, height, BALL_RADIUS, 0.6);

      if (checkBucketCollision(ball, bucket, BUCKET_WIDTH, BUCKET_HEIGHT)) {
        setScore(s => s + 1);
        setGameState("scored");
      }
      if (hasBallSettled(ball, height, BALL_RADIUS, 0.5)) {
        setGameState("settled");
      }
    }

    drawBackground(ctx, width, height, darkMode);

    // Ground line
    ctx.strokeStyle = darkMode ? "#3a3a4e" : "#b8d4e8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - 40);
    ctx.lineTo(width, height - 40);
    ctx.stroke();

    drawBucket(ctx, bucket, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "gray");

    // Aiming UI
    if (drag.isDragging && gameState === "aiming") {
      ctx.strokeStyle = darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ballStart.x, ballStart.y);
      ctx.lineTo(drag.currentX, drag.currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Trajectory dots
      const dx = drag.startX - drag.currentX;
      const dy = drag.startY - drag.currentY;
      const distance = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_DRAG_DISTANCE);
      const angle = Math.atan2(dy, dx);
      const power = distance * POWER_MULTIPLIER;

      ctx.fillStyle = darkMode ? "rgba(246,173,85,0.5)" : "rgba(237,137,54,0.5)";
      let simX = ballStart.x, simY = ballStart.y;
      let simVx = Math.cos(angle) * power, simVy = Math.sin(angle) * power;

      for (let i = 0; i < 30; i++) {
        simVy += PHYSICS.gravity;
        simX += simVx;
        simY += simVy;
        if (simY > height || simX < 0 || simX > width) break;
        ctx.beginPath();
        ctx.arc(simX, simY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = darkMode ? "#fff" : "#333";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Power: ${Math.round((distance / MAX_DRAG_DISTANCE) * 100)}%`, ballStart.x, ballStart.y + 50);
    }

    drawBall(ctx, ball, BALL_RADIUS, darkMode);

    const statusText = gameState === "aiming" ? "Click and drag the ball to aim, release to shoot!" : "Flying...";
    drawGameText(ctx, [statusText, `Score: ${score}  |  Shots: ${shots}`], darkMode);
  }, [gameState, darkMode, score, shots]);

  useGameLoop(canvasRef, render, [gameState, darkMode, score, shots], gameState !== "scored" && gameState !== "settled");

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Slingshot | Joe Powers</title>
        <meta name="description" content="A slingshot game - drag and release to shoot the ball into the bucket!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/confused-emote-no-bkgd.png" />
      </Head>

      <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <GameCanvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        cursor={gameState === "aiming" ? "grab" : "default"}
      />

      <ResultOverlay
        show={gameState === "scored" || gameState === "settled"}
        success={gameState === "scored"}
        title={gameState === "scored" ? "Nice Shot!" : "Missed!"}
        stats={`Score: ${score} | Shots: ${shots}`}
        primaryAction={gameState === "scored" ? nextRound : resetBallToStart}
        primaryLabel={gameState === "scored" ? "Next Round" : "Try Again"}
        darkMode={darkMode}
      />

      <BackToGamesLink darkMode={darkMode} />
    </div>
  );
}
