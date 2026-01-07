import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import DarkModeToggle from "../../components/dark-mode-toggle";
import { BackToGamesLink, ResultOverlay, GameButton } from "../../components/game";
import styles from "../../styles/Home.module.css";
import { useDarkMode } from "../../lib/gameHooks";
import {
  applyGravity,
  applyFriction,
  capVelocity,
  updatePosition,
  handleWallCollisions,
  checkBucketCollision,
  drawBall,
  drawBucket,
  drawBackground,
  drawGameText,
  createBall,
} from "../../lib/ballPhysics";

const BALL_RADIUS = 20;
const BUCKET_WIDTH = 100;
const BUCKET_HEIGHT = 60;
const GRAVITY = 0.5;
const FRICTION_X = 0.995;
const FRICTION_Y = 0.99;
const EDGE_BOUNCE_MULTIPLIER = 2.5;
const MAX_VELOCITY = 30;

export default function WindowBall() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [gameState, setGameState] = useState("intro");
  const [score, setScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const ballRef = useRef(createBall(100, 100));
  const bucketScreenPos = useRef({ x: 0, y: 0 });
  const prevDimensions = useRef({ width: 0, height: 0, screenX: 0, screenY: 0 });
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  const placeBucketRandomly = useCallback(() => {
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    bucketScreenPos.current = {
      x: 100 + Math.random() * (screenWidth / 2 - 200),
      y: 200 + Math.random() * (screenHeight - 400),
    };
  }, []);

  const resetBall = useCallback(() => {
    const ball = ballRef.current;
    ball.x = window.innerWidth - 100;
    ball.y = window.innerHeight - 100;
    ball.vx = Math.random() * 2 - 1;
    ball.vy = 0;
  }, []);

  const startGame = useCallback(() => {
    prevDimensions.current = {
      width: window.innerWidth,
      height: window.innerHeight,
      screenX: window.screenX,
      screenY: window.screenY,
    };
    placeBucketRandomly();
    resetBall();
    setGameState("playing");
  }, [placeBucketRandomly, resetBall]);

  const nextRound = useCallback(() => {
    placeBucketRandomly();
    resetBall();
    setGameState("playing");
  }, [placeBucketRandomly, resetBall]);

  // Main game loop
  useEffect(() => {
    if (gameState !== "playing" || !canvasRef.current || isMobile) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const gameLoop = () => {
      const ball = ballRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width;
      canvas.height = height;

      const deltaWidth = width - prevDimensions.current.width;
      const deltaHeight = height - prevDimensions.current.height;
      const deltaScreenX = window.screenX - prevDimensions.current.screenX;
      const deltaScreenY = window.screenY - prevDimensions.current.screenY;

      if (deltaWidth < -2 && ball.x > width - BALL_RADIUS - 50) {
        ball.vx += deltaWidth * EDGE_BOUNCE_MULTIPLIER * 0.3;
      }
      if (deltaHeight < -2 && ball.y > height - BALL_RADIUS - 50) {
        ball.vy += deltaHeight * EDGE_BOUNCE_MULTIPLIER * 0.5;
      }
      if (Math.abs(deltaScreenX) > 2) ball.vx -= deltaScreenX * 0.3;
      if (Math.abs(deltaScreenY) > 2) ball.vy -= deltaScreenY * 0.3;

      applyGravity(ball, GRAVITY);
      applyFriction(ball, FRICTION_X, FRICTION_Y);
      capVelocity(ball, MAX_VELOCITY);
      updatePosition(ball);
      handleWallCollisions(ball, width, height, BALL_RADIUS, 0.7);

      const bucketWindowPos = {
        x: bucketScreenPos.current.x - window.screenX,
        y: bucketScreenPos.current.y - window.screenY,
      };

      if (checkBucketCollision(ball, bucketWindowPos, BUCKET_WIDTH, BUCKET_HEIGHT)) {
        setScore(s => s + 1);
        setGameState("won");
        return;
      }

      drawBackground(ctx, width, height, darkMode);

      const bucketVisible =
        bucketWindowPos.x + BUCKET_WIDTH > 0 &&
        bucketWindowPos.x < width &&
        bucketWindowPos.y + BUCKET_HEIGHT > 0 &&
        bucketWindowPos.y < height;

      if (bucketVisible) {
        drawBucket(ctx, bucketWindowPos, BUCKET_WIDTH, BUCKET_HEIGHT, darkMode, "gray");
      } else {
        ctx.fillStyle = darkMode ? "#f6ad55" : "#dd6b20";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";

        let arrowX = width / 2, arrowY = height / 2;
        let arrowText = "Bucket is ";

        if (bucketWindowPos.x + BUCKET_WIDTH < 0) { arrowX = 50; arrowText += "\u2190 left"; }
        else if (bucketWindowPos.x > width) { arrowX = width - 50; arrowText += "right \u2192"; }
        if (bucketWindowPos.y + BUCKET_HEIGHT < 0) { arrowY = 50; arrowText = "Bucket is \u2191 above"; }
        else if (bucketWindowPos.y > height) { arrowY = height - 80; arrowText = "Bucket is \u2193 below"; }

        ctx.fillText(arrowText, arrowX, arrowY);
      }

      drawBall(ctx, ball, BALL_RADIUS, darkMode);
      drawGameText(ctx, [
        "Resize window edges to bounce the ball!",
        "Move the window to shift the ball!",
        `Score: ${score}`,
      ], darkMode);

      prevDimensions.current = { width, height, screenX: window.screenX, screenY: window.screenY };
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [gameState, darkMode, score, isMobile]);

  if (isMobile) {
    return (
      <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
        <Head>
          <title>Window Ball | Joe Powers</title>
          <meta name="description" content="A game where you control a ball by resizing your browser window!" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/confused-emote-no-bkgd.png" />
        </Head>
        <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main style={{ padding: "2rem", textAlign: "center" }}>
          <h1 className={styles.title}>Window Ball</h1>
          <div style={{ padding: "2rem", backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderRadius: "10px", maxWidth: "500px", margin: "2rem auto" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Desktop Only!</p>
            <p style={{ opacity: 0.8 }}>This game requires you to resize and move your browser window. Come back on a desktop browser to play!</p>
          </div>
          <Link href="/games" className={styles.card} style={{ display: "inline-block", marginTop: "2rem" }}>
            <h3>&larr; Back to Games</h3>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${darkMode ? "dark" : ""}`}>
      <Head>
        <title>Window Ball | Joe Powers</title>
        <meta name="description" content="A game where you control a ball by resizing your browser window!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/confused-emote-no-bkgd.png" />
      </Head>

      <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {gameState === "intro" && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: darkMode ? "#1a1a2e" : "#e8f4f8", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "1rem", textAlign: "center" }}>Window Ball</h1>
          <div style={{ maxWidth: "500px", textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "1rem", opacity: 0.9 }}>Get the ball into the bucket...</p>
            <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.9 }}>but the only way to control it is by <strong>resizing</strong> and <strong>moving</strong> your browser window!</p>
            <div style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", padding: "1.5rem", borderRadius: "10px", textAlign: "left" }}>
              <p style={{ marginBottom: "0.5rem" }}><strong>How to play:</strong></p>
              <ul style={{ listStyle: "disc", paddingLeft: "1.5rem", opacity: 0.8 }}>
                <li>Drag the bottom edge UP to bounce the ball upward</li>
                <li>Drag the right edge LEFT to bounce the ball left</li>
                <li>Move the entire window to shift the ball around</li>
                <li>The bucket stays fixed on your screen!</li>
              </ul>
            </div>
          </div>
          <GameButton onClick={startGame} variant="primary" size="large">Start Game</GameButton>
          <Link href="/games" style={{ marginTop: "2rem", opacity: 0.7, textDecoration: "underline" }}>&larr; Back to Games</Link>
        </div>
      )}

      {gameState === "playing" && (
        <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }} />
      )}

      <ResultOverlay
        show={gameState === "won"}
        success={true}
        title="Nice!"
        stats={`Score: ${score}`}
        primaryAction={nextRound}
        primaryLabel="Next Round"
        darkMode={darkMode}
      />

      {gameState === "playing" && <BackToGamesLink darkMode={darkMode} />}
    </div>
  );
}
