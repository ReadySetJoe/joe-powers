import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import { BackToGamesLink, GameCanvas, ResultOverlay, ActionButtons, GameButton } from "../../components/game";
import styles from "../../styles/Home.module.css";
import { useDarkMode, getCanvasCoords, useGameLoop } from "../../lib/gameHooks";
import {
  physicsStep,
  checkBucketCollision,
  checkRectCollision,
  resolveRectCollision,
  drawBall,
  drawBucket,
  drawBackground,
  drawBallStartMarker,
  drawObstacles,
  drawGameText,
  createBall,
  resetBall,
} from "../../lib/ballPhysics";

const BALL_RADIUS = 15;
const BUCKET_WIDTH = 90;
const BUCKET_HEIGHT = 55;
const FAN_EFFECT_RADIUS = 150;
const MAX_FAN_POWER = 1.5;
const PHYSICS = { gravity: 0, frictionX: 0.995, frictionY: 0.995 };

export default function FanZone() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [gameState, setGameState] = useState("placing");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const canvasRef = useRef(null);
  const ballRef = useRef(createBall(0, 0));
  const fansRef = useRef([]);
  const placingRef = useRef({ isPlacing: false, startX: 0, startY: 0, endX: 0, endY: 0 });
  const levelRef = useRef({ ballStart: { x: 0, y: 0 }, bucket: { x: 0, y: 0 }, obstacles: [] });

  const generateLevel = useCallback((levelNum) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const ballStart = { x: 80 + Math.random() * 80, y: 80 };
    const bucket = { x: width - 150 - Math.random() * 100, y: height - 100 };

    const obstacles = [];
    const numObstacles = Math.min(2 + levelNum, 8);

    for (let i = 0; i < numObstacles; i++) {
      const isHorizontal = Math.random() > 0.5;
      const obstacleWidth = isHorizontal ? 80 + Math.random() * 120 : 25;
      const obstacleHeight = isHorizontal ? 25 : 80 + Math.random() * 120;

      let x, y, attempts = 0;
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
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (gameState !== "placing") return;
    const { x, y } = getCanvasCoords(e, canvasRef);
    placingRef.current = { isPlacing: true, startX: x, startY: y, endX: x, endY: y };
  }, [gameState]);

  const handlePointerMove = useCallback((e) => {
    if (!placingRef.current.isPlacing) return;
    const { x, y } = getCanvasCoords(e, canvasRef);
    placingRef.current.endX = x;
    placingRef.current.endY = y;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!placingRef.current.isPlacing) return;
    const { startX, startY, endX, endY } = placingRef.current;
    const dx = endX - startX, dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 20) {
      const power = Math.min(distance / 150, 1) * MAX_FAN_POWER;
      fansRef.current.push({ x: startX, y: startY, dirX: dx / distance, dirY: dy / distance, power });
    }
    placingRef.current.isPlacing = false;
  }, []);

  const startSimulation = useCallback(() => {
    resetBall(ballRef.current, levelRef.current.ballStart.x, levelRef.current.ballStart.y);
    setGameState("simulating");
  }, []);

  const resetLevel = useCallback(() => {
    resetBall(ballRef.current, levelRef.current.ballStart.x, levelRef.current.ballStart.y);
    fansRef.current = [];
    setGameState("placing");
  }, []);

  const nextLevel = useCallback(() => {
    setLevel(l => { generateLevel(l + 1); return l + 1; });
  }, [generateLevel]);

  const render = useCallback((ctx, width, height) => {
    const ball = ballRef.current;
    const fans = fansRef.current;
    const placing = placingRef.current;
    const { ballStart, bucket, obstacles } = levelRef.current;

    if (gameState === "simulating") {
      // Apply fan forces
      for (const fan of fans) {
        const dx = ball.x - fan.x, dy = ball.y - fan.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < FAN_EFFECT_RADIUS) {
          const strength = (1 - dist / FAN_EFFECT_RADIUS) * fan.power;
          ball.vx += fan.dirX * strength;
          ball.vy += fan.dirY * strength;
        }
      }

      physicsStep(ball, PHYSICS);

      // Wall collisions (all sides - ball is on a table)
      if (ball.x - BALL_RADIUS < 0) { ball.x = BALL_RADIUS; ball.vx = -ball.vx * 0.6; }
      if (ball.x + BALL_RADIUS > width) { ball.x = width - BALL_RADIUS; ball.vx = -ball.vx * 0.6; }
      if (ball.y - BALL_RADIUS < 0) { ball.y = BALL_RADIUS; ball.vy = -ball.vy * 0.6; }
      if (ball.y + BALL_RADIUS > height) { ball.y = height - BALL_RADIUS; ball.vy = -ball.vy * 0.6; }

      for (const obstacle of obstacles) {
        const collision = checkRectCollision(ball, obstacle, BALL_RADIUS);
        if (collision) resolveRectCollision(ball, collision, BALL_RADIUS, 0.5);
      }

      if (checkBucketCollision(ball, bucket, BUCKET_WIDTH, BUCKET_HEIGHT)) {
        setScore(s => s + 1);
        setGameState("scored");
      }
    }

    drawBackground(ctx, width, height, darkMode);

    // Fan effect zones
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

    drawObstacles(ctx, obstacles, darkMode);

    // Draw fans
    for (const fan of fans) {
      ctx.fillStyle = darkMode ? "#64b5f6" : "#2196f3";
      ctx.beginPath();
      ctx.arc(fan.x, fan.y, 15, 0, Math.PI * 2);
      ctx.fill();

      const arrowLen = 30 + fan.power * 40;
      const endX = fan.x + fan.dirX * arrowLen, endY = fan.y + fan.dirY * arrowLen;
      ctx.strokeStyle = darkMode ? "#90caf9" : "#1976d2";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(fan.x, fan.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      const headLen = 10, angle = Math.atan2(fan.dirY, fan.dirX);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLen * Math.cos(angle - 0.4), endY - headLen * Math.sin(angle - 0.4));
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLen * Math.cos(angle + 0.4), endY - headLen * Math.sin(angle + 0.4));
      ctx.stroke();

      // Wind effect lines during simulation
      if (gameState === "simulating") {
        const time = Date.now() / 100;
        ctx.strokeStyle = darkMode ? "rgba(100, 200, 255, 0.3)" : "rgba(0, 100, 200, 0.2)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const offset = ((time + i * 20) % 60);
          ctx.beginPath();
          ctx.moveTo(fan.x + fan.dirX * (20 + offset), fan.y + fan.dirY * (20 + offset));
          ctx.lineTo(fan.x + fan.dirX * (35 + offset), fan.y + fan.dirY * (35 + offset));
          ctx.stroke();
        }
      }
    }

    // Fan being placed
    if (placing.isPlacing) {
      const dx = placing.endX - placing.startX, dy = placing.endY - placing.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 5) {
        ctx.fillStyle = darkMode ? "rgba(100, 181, 246, 0.5)" : "rgba(33, 150, 243, 0.5)";
        ctx.beginPath();
        ctx.arc(placing.startX, placing.startY, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = darkMode ? "rgba(100, 200, 255, 0.2)" : "rgba(0, 100, 200, 0.15)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(placing.startX, placing.startY, FAN_EFFECT_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = darkMode ? "rgba(144, 202, 249, 0.7)" : "rgba(25, 118, 210, 0.7)";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(placing.startX, placing.startY);
        ctx.lineTo(placing.endX, placing.endY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = darkMode ? "#fff" : "#333";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(Math.min(distance / 150, 1) * 100)}%`, placing.startX, placing.startY - 25);
      }
    }

    if (gameState === "placing") {
      drawBallStartMarker(ctx, ballStart.x, ballStart.y, BALL_RADIUS, darkMode, "Start");
    }

    drawBucket(ctx, bucket, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "green");
    drawBall(ctx, ball, BALL_RADIUS, darkMode);

    const lines = gameState === "placing"
      ? ["Click and drag to place fans, then start simulation!", `Fans placed: ${fans.length}`]
      : ["Simulating..."];
    drawGameText(ctx, [...lines, `Score: ${score}  |  Level: ${level}`], darkMode);
  }, [gameState, darkMode, score, level]);

  useGameLoop(canvasRef, render, [gameState, darkMode, score, level], gameState !== "scored");

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Fan Zone | Joe Powers</title>
        <meta name="description" content="Place fans to blow the ball through obstacles into the bucket!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/confused-emote-no-bkgd.png" />
      </Head>

      <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <GameCanvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        cursor={gameState === "placing" ? "crosshair" : "default"}
      />

      <ActionButtons visible={gameState === "placing"}>
        {fansRef.current.length > 0 && (
          <GameButton onClick={resetLevel} variant="gray" size="medium">Clear Fans</GameButton>
        )}
        <GameButton onClick={startSimulation} variant="blue">Start!</GameButton>
      </ActionButtons>

      <ActionButtons visible={gameState === "simulating"}>
        <GameButton onClick={resetLevel} variant="gray" size="medium">Reset</GameButton>
      </ActionButtons>

      <ResultOverlay
        show={gameState === "scored"}
        success={true}
        title="Nice!"
        stats={`Fans used: ${fansRef.current.length} | Score: ${score} | Level: ${level}`}
        primaryAction={nextLevel}
        primaryLabel="Next Level"
        darkMode={darkMode}
      />

      <BackToGamesLink darkMode={darkMode} />
    </div>
  );
}
