import Head from "next/head";
import { useCallback, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import { BackToGamesLink, GameCanvas, ResultOverlay, ActionButton } from "../../components/game";
import styles from "../../styles/Home.module.css";
import { useDarkMode, getCanvasCoords, useGameLoop } from "../../lib/gameHooks";
import {
  physicsStep,
  handlePathCollisions,
  checkBucketCollision,
  drawBall,
  drawBucket,
  drawBackground,
  drawPath,
  drawBallStartMarker,
  drawGameText,
  createBall,
  resetBall,
  isBallOffScreen,
} from "../../lib/ballPhysics";

const BALL_RADIUS = 12;
const BUCKET_WIDTH = 80;
const BUCKET_HEIGHT = 50;
const MIN_POINT_DISTANCE = 15;
const PHYSICS = { gravity: 0.3, frictionX: 0.995, maxVelocity: 20 };

export default function DrawPath() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [gameState, setGameState] = useState("drawing");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [inkRemaining, setInkRemaining] = useState(100);

  const canvasRef = useRef(null);
  const ballRef = useRef(createBall(0, 0));
  const pathRef = useRef([]);
  const drawingRef = useRef({ isDrawing: false });
  const positionsRef = useRef({ ballStart: { x: 0, y: 0 }, bucket: { x: 0, y: 0 } });
  const maxInkRef = useRef(800);

  const initializeRound = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    positionsRef.current.ballStart = { x: 100 + Math.random() * 100, y: 80 };
    positionsRef.current.bucket = {
      x: width * 0.6 + Math.random() * (width * 0.3 - BUCKET_WIDTH),
      y: height - 90,
    };

    resetBall(ballRef.current, positionsRef.current.ballStart.x, positionsRef.current.ballStart.y);
    pathRef.current = [];
    maxInkRef.current = 600 + round * 100;
    setInkRemaining(100);
    setGameState("drawing");
  }, [round]);

  useState(() => initializeRound());

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

  const handlePointerDown = useCallback((e) => {
    if (gameState !== "drawing") return;
    const { x, y } = getCanvasCoords(e, canvasRef);
    drawingRef.current.isDrawing = true;
    pathRef.current.push({ x, y });
  }, [gameState]);

  const handlePointerMove = useCallback((e) => {
    if (!drawingRef.current.isDrawing || gameState !== "drawing") return;
    const { x, y } = getCanvasCoords(e, canvasRef);
    const path = pathRef.current;
    if (path.length > 0) {
      const last = path[path.length - 1];
      const dist = Math.sqrt((x - last.x) ** 2 + (y - last.y) ** 2);
      if (dist >= MIN_POINT_DISTANCE) {
        const currentLength = getPathLength();
        if (currentLength < maxInkRef.current) {
          path.push({ x, y });
          setInkRemaining(Math.max(0, Math.round((1 - getPathLength() / maxInkRef.current) * 100)));
        }
      }
    }
  }, [gameState, getPathLength]);

  const handlePointerUp = useCallback(() => {
    drawingRef.current.isDrawing = false;
  }, []);

  const releaseBall = useCallback(() => {
    resetBall(ballRef.current, positionsRef.current.ballStart.x, positionsRef.current.ballStart.y);
    setGameState("rolling");
  }, []);

  const resetBallPosition = useCallback(() => {
    resetBall(ballRef.current, positionsRef.current.ballStart.x, positionsRef.current.ballStart.y);
    setGameState("rolling");
  }, []);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    initializeRound();
  }, [initializeRound]);

  const retry = useCallback(() => initializeRound(), [initializeRound]);

  const render = useCallback((ctx, width, height) => {
    const ball = ballRef.current;
    const path = pathRef.current;
    const { ballStart, bucket } = positionsRef.current;

    if (gameState === "rolling") {
      physicsStep(ball, PHYSICS);

      // Wall collisions (not bottom)
      if (ball.x - BALL_RADIUS < 0) { ball.x = BALL_RADIUS; ball.vx = -ball.vx * 0.5; }
      if (ball.x + BALL_RADIUS > width) { ball.x = width - BALL_RADIUS; ball.vx = -ball.vx * 0.5; }
      if (ball.y - BALL_RADIUS < 0) { ball.y = BALL_RADIUS; ball.vy = -ball.vy * 0.5; }

      handlePathCollisions(ball, path, BALL_RADIUS, { multiplier: 0.85, padding: 4 });

      if (checkBucketCollision(ball, bucket, BUCKET_WIDTH, BUCKET_HEIGHT)) {
        setScore(s => s + 1);
        setGameState("scored");
      }
      if (isBallOffScreen(ball, height, BALL_RADIUS)) {
        setGameState("missed");
      }
    }

    drawBackground(ctx, width, height, darkMode);

    if (gameState === "drawing") {
      drawBallStartMarker(ctx, ballStart.x, ballStart.y, BALL_RADIUS, darkMode, "Start");
    }

    if (path.length > 1) drawPath(ctx, path, darkMode);

    drawBucket(ctx, bucket, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "green");
    drawBall(ctx, ball, BALL_RADIUS, darkMode);

    // Ink meter
    if (gameState === "drawing") {
      const meterWidth = 150, meterHeight = 12;
      const meterX = width - meterWidth - 20, meterY = 60;
      ctx.fillStyle = darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";
      ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
      ctx.fillStyle = darkMode ? "#4fd1c5" : "#319795";
      ctx.fillRect(meterX, meterY, meterWidth * (inkRemaining / 100), meterHeight);
      ctx.fillStyle = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`Ink: ${inkRemaining}%`, width - 20, meterY - 5);
    }

    const lines = gameState === "drawing"
      ? ["Draw a path - the ball will bounce gently along it!"]
      : ["Bouncing..."];
    drawGameText(ctx, [...lines, `Score: ${score}  |  Round: ${round}`], darkMode);
  }, [gameState, darkMode, score, round, inkRemaining]);

  useGameLoop(canvasRef, render, [gameState, darkMode, score, round, inkRemaining], gameState !== "scored" && gameState !== "missed");

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Draw Path | Joe Powers</title>
        <meta name="description" content="Draw a path for the ball to bounce along into the bucket!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/confused-emote-no-bkgd.png" />
      </Head>

      <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <GameCanvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        cursor={gameState === "drawing" ? "crosshair" : "default"}
      />

      <ActionButton onClick={releaseBall} variant="teal" visible={gameState === "drawing"}>
        Release Ball!
      </ActionButton>

      <ActionButton onClick={resetBallPosition} variant="gray" size="medium" visible={gameState === "rolling"}>
        Reset Ball
      </ActionButton>

      <ResultOverlay
        show={gameState === "scored" || gameState === "missed"}
        success={gameState === "scored"}
        title={gameState === "scored" ? "Nice!" : "Missed!"}
        stats={`Score: ${score} | Round: ${round}`}
        primaryAction={gameState === "scored" ? nextRound : retry}
        primaryLabel={gameState === "scored" ? "Next Round" : "Try Again"}
        darkMode={darkMode}
      />

      <BackToGamesLink darkMode={darkMode} />
    </div>
  );
}
