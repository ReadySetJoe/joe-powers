/**
 * Shared ball physics utilities for the "ball in bucket" game series
 */

// ============================================
// CONSTANTS
// ============================================

export const COLORS = {
  ball: {
    light: { inner: "#ed8936", outer: "#c05621" },
    dark: { inner: "#f6ad55", outer: "#dd6b20" },
  },
  bucket: {
    gray: {
      light: { fill: "#718096", rim: "#4a5568" },
      dark: { fill: "#4a5568", rim: "#718096" },
    },
    green: {
      light: { fill: "#38a169", rim: "#48bb78" },
      dark: { fill: "#48bb78", rim: "#68d391" },
    },
  },
  background: {
    light: "#e8f4f8",
    dark: "#1a1a2e",
  },
};

// ============================================
// PHYSICS FUNCTIONS
// ============================================

/**
 * Apply gravity to ball velocity
 */
export function applyGravity(ball, gravity, gravityX = 0) {
  ball.vx += gravityX;
  ball.vy += gravity;
}

/**
 * Apply friction to ball velocity
 * Can use separate X/Y friction values
 */
export function applyFriction(ball, frictionX, frictionY = frictionX) {
  ball.vx *= frictionX;
  ball.vy *= frictionY;
}

/**
 * Cap ball velocity to a maximum speed
 */
export function capVelocity(ball, maxVelocity) {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (speed > maxVelocity) {
    ball.vx = (ball.vx / speed) * maxVelocity;
    ball.vy = (ball.vy / speed) * maxVelocity;
  }
}

/**
 * Update ball position based on velocity
 */
export function updatePosition(ball) {
  ball.x += ball.vx;
  ball.y += ball.vy;
}

/**
 * Full physics step: gravity, friction, velocity cap, position update
 */
export function physicsStep(ball, options = {}) {
  const {
    gravity = 0.3,
    gravityX = 0,
    frictionX = 0.99,
    frictionY = frictionX,
    maxVelocity = null,
  } = options;

  applyGravity(ball, gravity, gravityX);
  applyFriction(ball, frictionX, frictionY);
  if (maxVelocity) {
    capVelocity(ball, maxVelocity);
  }
  updatePosition(ball);
}

// ============================================
// WALL COLLISION
// ============================================

/**
 * Check and resolve wall collisions
 * Returns which walls were hit: { left, right, top, bottom }
 */
export function handleWallCollisions(ball, width, height, ballRadius, dampening = 0.7) {
  const hits = { left: false, right: false, top: false, bottom: false };

  if (ball.x - ballRadius < 0) {
    ball.x = ballRadius;
    ball.vx = -ball.vx * dampening;
    hits.left = true;
  }
  if (ball.x + ballRadius > width) {
    ball.x = width - ballRadius;
    ball.vx = -ball.vx * dampening;
    hits.right = true;
  }
  if (ball.y - ballRadius < 0) {
    ball.y = ballRadius;
    ball.vy = -ball.vy * dampening;
    hits.top = true;
  }
  if (ball.y + ballRadius > height) {
    ball.y = height - ballRadius;
    ball.vy = -ball.vy * dampening;
    hits.bottom = true;
  }

  return hits;
}

// ============================================
// LINE SEGMENT COLLISION
// ============================================

/**
 * Check collision between ball and line segment
 * Returns collision info or null if no collision
 */
export function checkLineCollision(ball, x1, y1, x2, y2, ballRadius, padding = 0) {
  const lineVecX = x2 - x1;
  const lineVecY = y2 - y1;
  const lineLen = Math.sqrt(lineVecX * lineVecX + lineVecY * lineVecY);

  if (lineLen === 0) return null;

  const lineNormX = lineVecX / lineLen;
  const lineNormY = lineVecY / lineLen;

  const toBallX = ball.x - x1;
  const toBallY = ball.y - y1;

  const projection = toBallX * lineNormX + toBallY * lineNormY;
  const clampedProj = Math.max(0, Math.min(lineLen, projection));

  const closestX = x1 + lineNormX * clampedProj;
  const closestY = y1 + lineNormY * clampedProj;

  const distX = ball.x - closestX;
  const distY = ball.y - closestY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  const collisionThreshold = ballRadius + padding;

  if (distance < collisionThreshold) {
    return { closestX, closestY, distance, distX, distY, nx: 0, ny: 0 };
  }

  return null;
}

/**
 * Resolve collision with a line segment
 * Bounces the ball off the line with optional multiplier
 */
export function resolveLineCollision(ball, collision, ballRadius, multiplier = 1.0, padding = 0) {
  const { closestX, closestY, distance, distX, distY } = collision;

  if (distance > 0) {
    const nx = distX / distance;
    const ny = distY / distance;

    // Push ball out of collision
    ball.x = closestX + nx * (ballRadius + padding);
    ball.y = closestY + ny * (ballRadius + padding);

    // Reflect velocity
    const dotProduct = ball.vx * nx + ball.vy * ny;

    // Only bounce if moving toward line
    if (dotProduct < 0) {
      ball.vx = (ball.vx - 2 * dotProduct * nx) * multiplier;
      ball.vy = (ball.vy - 2 * dotProduct * ny) * multiplier;
    }
  }
}

/**
 * Check and resolve collision with a line segment in one call
 */
export function handleLineCollision(ball, x1, y1, x2, y2, ballRadius, options = {}) {
  const { multiplier = 1.0, padding = 0 } = options;

  const collision = checkLineCollision(ball, x1, y1, x2, y2, ballRadius, padding);
  if (collision) {
    resolveLineCollision(ball, collision, ballRadius, multiplier, padding);
    return true;
  }
  return false;
}

/**
 * Check and resolve collisions with multiple line segments
 */
export function handleMultipleLineCollisions(ball, lines, ballRadius, options = {}) {
  let hitCount = 0;
  for (const line of lines) {
    // Support both {x1,y1,x2,y2} format and array of points format
    if (line.x1 !== undefined) {
      if (handleLineCollision(ball, line.x1, line.y1, line.x2, line.y2, ballRadius, options)) {
        hitCount++;
      }
    }
  }
  return hitCount;
}

/**
 * Check and resolve collisions with path points (array of {x, y})
 */
export function handlePathCollisions(ball, pathPoints, ballRadius, options = {}) {
  let hitCount = 0;
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const p1 = pathPoints[i];
    const p2 = pathPoints[i + 1];
    if (handleLineCollision(ball, p1.x, p1.y, p2.x, p2.y, ballRadius, options)) {
      hitCount++;
    }
  }
  return hitCount;
}

// ============================================
// BUCKET COLLISION
// ============================================

/**
 * Check if ball is inside bucket
 */
export function checkBucketCollision(ball, bucket, bucketWidth, bucketHeight, edgeOffset = 10) {
  return (
    ball.x > bucket.x + edgeOffset &&
    ball.x < bucket.x + bucketWidth - edgeOffset &&
    ball.y > bucket.y &&
    ball.y < bucket.y + bucketHeight
  );
}

// ============================================
// RECTANGLE/OBSTACLE COLLISION
// ============================================

/**
 * Check collision between ball and rectangle (AABB)
 */
export function checkRectCollision(ball, rect, ballRadius) {
  const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.height));

  const distX = ball.x - closestX;
  const distY = ball.y - closestY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  if (distance < ballRadius) {
    return { closestX, closestY, distance, distX, distY };
  }
  return null;
}

/**
 * Resolve collision with rectangle
 */
export function resolveRectCollision(ball, collision, ballRadius, dampening = 0.5) {
  const { distance, distX, distY } = collision;

  if (distance > 0) {
    const overlap = ballRadius - distance;
    const nx = distX / distance;
    const ny = distY / distance;

    ball.x += nx * overlap;
    ball.y += ny * overlap;

    const dotProduct = ball.vx * nx + ball.vy * ny;
    ball.vx = (ball.vx - 2 * dotProduct * nx) * dampening;
    ball.vy = (ball.vy - 2 * dotProduct * ny) * dampening;
  }
}

/**
 * Check and resolve rectangle collision in one call
 */
export function handleRectCollision(ball, rect, ballRadius, dampening = 0.5) {
  const collision = checkRectCollision(ball, rect, ballRadius);
  if (collision) {
    resolveRectCollision(ball, collision, ballRadius, dampening);
    return true;
  }
  return false;
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

/**
 * Draw the standard gradient ball with shine effect
 */
export function drawBall(ctx, ball, ballRadius, darkMode, options = {}) {
  const { highlightOffset = 4, shineRadius = 4 } = options;

  const colors = darkMode ? COLORS.ball.dark : COLORS.ball.light;

  // Gradient
  const gradient = ctx.createRadialGradient(
    ball.x - highlightOffset,
    ball.y - highlightOffset,
    0,
    ball.x,
    ball.y,
    ballRadius
  );
  gradient.addColorStop(0, colors.inner);
  gradient.addColorStop(1, colors.outer);

  // Ball body
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Shine highlight
  ctx.beginPath();
  ctx.arc(ball.x - highlightOffset, ball.y - highlightOffset, shineRadius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fill();
}

/**
 * Draw bucket (trapezoid shape with rim)
 */
export function drawBucket(ctx, bucket, bucketWidth, bucketHeight, darkMode, variant = "gray") {
  const colors = darkMode ? COLORS.bucket[variant].dark : COLORS.bucket[variant].light;
  const sideOffset = 8;
  const rimOffset = 4;

  // Bucket body
  ctx.fillStyle = colors.fill;
  ctx.beginPath();
  ctx.moveTo(bucket.x, bucket.y);
  ctx.lineTo(bucket.x + sideOffset, bucket.y + bucketHeight);
  ctx.lineTo(bucket.x + bucketWidth - sideOffset, bucket.y + bucketHeight);
  ctx.lineTo(bucket.x + bucketWidth, bucket.y);
  ctx.closePath();
  ctx.fill();

  // Rim
  ctx.strokeStyle = colors.rim;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(bucket.x - rimOffset, bucket.y);
  ctx.lineTo(bucket.x + bucketWidth + rimOffset, bucket.y);
  ctx.stroke();
}

/**
 * Draw game background
 */
export function drawBackground(ctx, width, height, darkMode) {
  ctx.fillStyle = darkMode ? COLORS.background.dark : COLORS.background.light;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw a line/trampoline with glow effect
 */
export function drawLine(ctx, x1, y1, x2, y2, darkMode, options = {}) {
  const {
    color = darkMode ? "#9f7aea" : "#805ad5",
    glowColor = darkMode ? "rgba(159,122,234,0.3)" : "rgba(128,90,213,0.3)",
    lineWidth = 6,
    glowWidth = 12,
  } = options;

  // Glow
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = glowWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Main line
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/**
 * Draw a path (array of points) with glow effect
 */
export function drawPath(ctx, points, darkMode, options = {}) {
  if (points.length < 2) return;

  const {
    color = darkMode ? "#4fd1c5" : "#319795",
    glowColor = darkMode ? "rgba(79,209,197,0.3)" : "rgba(49,151,149,0.3)",
    lineWidth = 8,
    glowWidth = 16,
  } = options;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Glow layer
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = glowWidth;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // Main line
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

// ============================================
// UI DRAWING FUNCTIONS
// ============================================

/**
 * Draw ball start position marker (dashed circle with label)
 */
export function drawBallStartMarker(ctx, x, y, ballRadius, darkMode, label = "Start") {
  ctx.strokeStyle = darkMode ? "rgba(246,173,85,0.5)" : "rgba(237,137,54,0.5)";
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, ballRadius + 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + ballRadius + 25);
}

/**
 * Draw drag indicator line with arrow
 */
export function drawDragIndicator(ctx, startX, startY, endX, endY, darkMode, options = {}) {
  const {
    showOrigin = true,
    originRadius = 20,
    dashed = true,
    lineWidth = 3,
    headLength = 12,
  } = options;

  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 5) return;

  // Draw origin point
  if (showOrigin) {
    ctx.fillStyle = darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.arc(startX, startY, originRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw drag line
  ctx.strokeStyle = darkMode ? "rgba(246,173,85,0.6)" : "rgba(237,137,54,0.6)";
  ctx.lineWidth = lineWidth;
  if (dashed) ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  if (dashed) ctx.setLineDash([]);

  // Draw arrow head
  if (dist > 20) {
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - 0.4),
      endY - headLength * Math.sin(angle - 0.4)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle + 0.4),
      endY - headLength * Math.sin(angle + 0.4)
    );
    ctx.stroke();
  }
}

/**
 * Draw game status text
 */
export function drawGameText(ctx, lines, darkMode, options = {}) {
  const { x = 20, startY = 30, lineHeight = 25, fontSize = "16px" } = options;

  ctx.fillStyle = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
  ctx.font = `${fontSize} sans-serif`;
  ctx.textAlign = "left";

  lines.forEach((text, i) => {
    ctx.fillText(text, x, startY + i * lineHeight);
  });
}

/**
 * Draw tilt/gravity direction indicator
 */
export function drawTiltIndicator(ctx, x, y, gravityX, gravityY, darkMode, radius = 30) {
  // Outer circle
  ctx.strokeStyle = darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner indicator dot
  ctx.fillStyle = darkMode ? "#f6ad55" : "#ed8936";
  ctx.beginPath();
  ctx.arc(x + gravityX * (radius - 5), y + gravityY * (radius - 5), 8, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw obstacles (rectangles, optionally deadly)
 */
export function drawObstacles(ctx, obstacles, darkMode) {
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
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a new ball object
 */
export function createBall(x, y, vx = 0, vy = 0) {
  return { x, y, vx, vy };
}

/**
 * Reset ball to a position
 */
export function resetBall(ball, x, y, vx = 0, vy = 0) {
  ball.x = x;
  ball.y = y;
  ball.vx = vx;
  ball.vy = vy;
}

/**
 * Get ball speed
 */
export function getBallSpeed(ball) {
  return Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
}

/**
 * Check if ball has settled (low velocity near ground)
 */
export function hasBallSettled(ball, height, ballRadius, threshold = 0.5) {
  const speed = getBallSpeed(ball);
  const nearGround = ball.y > height - ballRadius - 5;
  return speed < threshold && nearGround;
}

/**
 * Check if ball is off screen (fell off bottom)
 */
export function isBallOffScreen(ball, height, ballRadius) {
  return ball.y > height + ballRadius;
}
