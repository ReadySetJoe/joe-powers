import Head from "next/head";
import { useCallback, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import { BackToGamesLink, GameCanvas, ResultOverlay, ActionButton } from "../../components/game";
import styles from "../../styles/Home.module.css";
import { useDarkMode, getCanvasCoords, useGameLoop } from "../../lib/gameHooks";
import {
  physicsStep,
  handleMultipleLineCollisions,
  checkBucketCollision,
  drawBall,
  drawBucket,
  drawBackground,
  drawLine,
  drawBallStartMarker,
  drawGameText,
  createBall,
  resetBall,
  isBallOffScreen,
} from "../../lib/ballPhysics";

const BALL_RADIUS = 15;
const BUCKET_WIDTH = 90;
const BUCKET_HEIGHT = 55;
const PHYSICS = { gravity: 0.35, frictionX: 0.995 };
const TRAMPOLINE_OPTIONS = { multiplier: 1.1, padding: 0 };

export default function Trampoline() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [gameState, setGameState] = useState("drawing");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);

  const canvasRef = useRef(null);
  const ballRef = useRef(createBall(0, 0));
  const trampolinesRef = useRef([]);
  const drawingRef = useRef({ isDrawing: false, startX: 0, startY: 0, endX: 0, endY: 0 });
  const positionsRef = useRef({ ballStart: { x: 0, y: 0 }, bucket: { x: 0, y: 0 } });

  const initializeRound = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    positionsRef.current.ballStart = { x: 80 + Math.random() * 150, y: 60 };
    positionsRef.current.bucket = {
      x: width * 0.6 + Math.random() * (width * 0.3 - BUCKET_WIDTH),
      y: height - 80,
    };

    resetBall(ballRef.current, positionsRef.current.ballStart.x, positionsRef.current.ballStart.y);
    trampolinesRef.current = [];
    setGameState("drawing");
  }, []);

  useState(() => initializeRound());

  const handlePointerDown = useCallback((e) => {
    if (gameState !== "drawing") return;
    const { x, y } = getCanvasCoords(e, canvasRef);
    drawingRef.current = { isDrawing: true, startX: x, startY: y, endX: x, endY: y };
  }, [gameState]);

  const handlePointerMove = useCallback((e) => {
    if (!drawingRef.current.isDrawing) return;
    const { x, y } = getCanvasCoords(e, canvasRef);
    drawingRef.current.endX = x;
    drawingRef.current.endY = y;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!drawingRef.current.isDrawing) return;
    const { startX, startY, endX, endY } = drawingRef.current;
    const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    if (length > 30) {
      trampolinesRef.current.push({ x1: startX, y1: startY, x2: endX, y2: endY });
    }
    drawingRef.current.isDrawing = false;
  }, []);

  const dropBall = useCallback(() => {
    const { ballStart } = positionsRef.current;
    resetBall(ballRef.current, ballStart.x, ballStart.y, Math.random() * 2 - 1, 0);
    setGameState("dropping");
  }, []);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    initializeRound();
  }, [initializeRound]);

  const retry = useCallback(() => initializeRound(), [initializeRound]);

  const render = useCallback((ctx, width, height) => {
    const ball = ballRef.current;
    const trampolines = trampolinesRef.current;
    const drawing = drawingRef.current;
    const { ballStart, bucket } = positionsRef.current;

    if (gameState === "dropping") {
      physicsStep(ball, PHYSICS);

      // Wall bounces (not bottom)
      if (ball.x - BALL_RADIUS < 0) { ball.x = BALL_RADIUS; ball.vx = -ball.vx * 0.7; }
      if (ball.x + BALL_RADIUS > width) { ball.x = width - BALL_RADIUS; ball.vx = -ball.vx * 0.7; }
      if (ball.y - BALL_RADIUS < 0) { ball.y = BALL_RADIUS; ball.vy = -ball.vy * 0.7; }

      handleMultipleLineCollisions(ball, trampolines, BALL_RADIUS, TRAMPOLINE_OPTIONS);

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
      drawBallStartMarker(ctx, ballStart.x, ballStart.y, BALL_RADIUS, darkMode, "Drop");
    }

    for (const line of trampolines) {
      drawLine(ctx, line.x1, line.y1, line.x2, line.y2, darkMode);
    }

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

    drawBucket(ctx, bucket, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "green");
    drawBall(ctx, ball, BALL_RADIUS, darkMode);

    const lines = gameState === "drawing"
      ? ["Draw trampolines, then press Drop!", `Trampolines: ${trampolines.length}`]
      : ["Bouncing..."];
    drawGameText(ctx, [...lines, `Score: ${score}  |  Round: ${round}`], darkMode);
  }, [gameState, darkMode, score, round]);

  useGameLoop(canvasRef, render, [gameState, darkMode, score, round], gameState !== "scored" && gameState !== "missed");

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Trampoline | Joe Powers</title>
        <meta name="description" content="Draw trampolines to bounce the ball into the bucket!" />
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

      <ActionButton onClick={dropBall} variant="purple" visible={gameState === "drawing"}>
        Drop Ball!
      </ActionButton>

      <ResultOverlay
        show={gameState === "scored" || gameState === "missed"}
        success={gameState === "scored"}
        title={gameState === "scored" ? "Nice!" : "Missed!"}
        stats={`Trampolines: ${trampolinesRef.current.length} | Score: ${score} | Round: ${round}`}
        primaryAction={gameState === "scored" ? nextRound : retry}
        primaryLabel={gameState === "scored" ? "Next Round" : "Try Again"}
        darkMode={darkMode}
      />

      <BackToGamesLink darkMode={darkMode} />
    </div>
  );
}
