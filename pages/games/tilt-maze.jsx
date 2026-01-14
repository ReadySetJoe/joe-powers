import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import { BackToGamesLink, GameCanvas, ResultOverlay } from "../../components/game";
import styles from "../../styles/Home.module.css";
import { useDarkMode, getCanvasCoords, useGameLoop } from "../../lib/gameHooks";
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
  drawBallStartMarker,
  drawDragIndicator,
  drawTiltIndicator,
  drawObstacles,
  drawGameText,
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
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [gameState, setGameState] = useState("playing");
  const [level, setLevel] = useState(1);
  const [deaths, setDeaths] = useState(0);

  const canvasRef = useRef(null);
  const ballRef = useRef(createBall(0, 0));
  const gravityRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const levelRef = useRef({ obstacles: [], bucket: { x: 0, y: 0 }, ballStart: { x: 0, y: 0 } });

  const generateLevel = useCallback((levelNum) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const ballStart = {
      x: 80 + Math.random() * 100,
      y: 80 + Math.random() * 100,
    };

    const bucket = {
      x: width - 150 - Math.random() * 100,
      y: height - 120 - Math.random() * 80,
    };

    const obstacles = [];
    const numObstacles = Math.min(3 + levelNum * 2, 15);

    for (let i = 0; i < numObstacles; i++) {
      const isHorizontal = Math.random() > 0.5;
      const obstacleWidth = isHorizontal ? 100 + Math.random() * 150 : 20;
      const obstacleHeight = isHorizontal ? 20 : 100 + Math.random() * 150;

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
        x, y,
        width: obstacleWidth,
        height: obstacleHeight,
        deadly: Math.random() < 0.3 && levelNum > 1,
      });
    }

    levelRef.current = { obstacles, bucket, ballStart };
    resetBall(ballRef.current, ballStart.x, ballStart.y);
    gravityRef.current = { x: 0, y: 0 };
  }, []);

  // Generate level on mount
  useEffect(() => {
    generateLevel(level);
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (gameState !== "playing") return;
    const { x, y } = getCanvasCoords(e, canvasRef);
    dragRef.current = { isDragging: true, startX: x, startY: y, currentX: x, currentY: y };
  }, [gameState]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;
    const { x, y } = getCanvasCoords(e, canvasRef);
    dragRef.current.currentX = x;
    dragRef.current.currentY = y;

    const dx = x - dragRef.current.startX;
    const dy = y - dragRef.current.startY;
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
  }, []);

  const resetBallToStart = useCallback(() => {
    const { ballStart } = levelRef.current;
    resetBall(ballRef.current, ballStart.x, ballStart.y);
    gravityRef.current = { x: 0, y: 0 };
    setGameState("playing");
  }, []);

  const nextLevel = useCallback(() => {
    setLevel(l => {
      generateLevel(l + 1);
      return l + 1;
    });
    setGameState("playing");
  }, [generateLevel]);

  const render = useCallback((ctx, width, height) => {
    const ball = ballRef.current;
    const gravity = gravityRef.current;
    const drag = dragRef.current;
    const { obstacles, bucket } = levelRef.current;

    // Physics
    applyGravity(ball, gravity.y * GRAVITY_STRENGTH, gravity.x * GRAVITY_STRENGTH);
    applyFriction(ball, FRICTION);
    capVelocity(ball, MAX_VELOCITY);
    updatePosition(ball);
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

    // Draw
    drawBackground(ctx, width, height, darkMode);
    if (drag.isDragging) {
      drawDragIndicator(ctx, drag.startX, drag.startY, drag.currentX, drag.currentY, darkMode);
    }
    drawTiltIndicator(ctx, width - 60, 60, gravity.x, gravity.y, darkMode);
    drawObstacles(ctx, obstacles, darkMode);
    drawBucket(ctx, bucket, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "green");
    drawBall(ctx, ball, BALL_RADIUS, darkMode);
    drawGameText(ctx, [
      "Click/drag anywhere to tilt",
      `Level: ${level}  |  Deaths: ${deaths}`,
    ], darkMode);

    // Legend
    ctx.fillStyle = darkMode ? "#e53e3e" : "#c53030";
    ctx.fillRect(20, 70, 15, 15);
    ctx.fillStyle = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
    ctx.fillText("= Deadly", 40, 82);
  }, [darkMode, level, deaths]);

  useGameLoop(canvasRef, render, [darkMode, level, deaths], gameState === "playing");

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Tilt Maze | Joe Powers</title>
        <meta name="description" content="Drag to tilt and guide the ball through obstacles into the bucket!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/confused-emote-no-bkgd.png" />
      </Head>

      <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <GameCanvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        cursor="crosshair"
      />

      <ResultOverlay
        show={gameState === "won" || gameState === "dead"}
        success={gameState === "won"}
        title={gameState === "won" ? "Level Complete!" : "You Died!"}
        stats={`Level: ${level} | Deaths: ${deaths}`}
        primaryAction={gameState === "won" ? nextLevel : resetBallToStart}
        primaryLabel={gameState === "won" ? "Next Level" : "Try Again"}
        darkMode={darkMode}
      />

      <BackToGamesLink darkMode={darkMode} />
    </div>
  );
}
