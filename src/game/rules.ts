/**
 * Pure basketball rules, scoring, physics calculations, and brawling logic
 * Decoupled from UI components for deterministic testing.
 */

import { Vector2D } from './types';

export const COURT_WIDTH = 1200;
export const COURT_HEIGHT = 650;
export const LEFT_RIM_X = 85;
export const RIGHT_RIM_X = 1115;
export const RIM_Y = 325;
export const RIM_HEIGHT_Z = 120; // 3D height of rim
export const THREE_POINT_RADIUS = 250;
export const PAINT_RADIUS = 160;

/**
 * Checks if a shot originated from beyond the 3-point line
 */
export function isThreePointer(shooterX: number, shooterY: number, targetRimX: number, targetRimY: number = RIM_Y): boolean {
  const dx = shooterX - targetRimX;
  const dy = shooterY - targetRimY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist >= THREE_POINT_RADIUS;
}

/**
 * Evaluates shot quality from 0.0 to 1.0 based on timing, contest, distance, and shooter stats
 * - timingOffset: 0.0 is perfect release, 1.0 is totally mistimed
 * - defenderDistance: distance to nearest contesting defender in pixels
 * - shotStat: player's shooting stat (1 to 5)
 */
export function calculateShotQuality(
  timingOffset: number,
  distanceToRim: number,
  defenderDistance: number,
  shotStat: number,
  isOnFire: boolean = false
): number {
  // Timing score: 1.0 at offset 0, dropping to 0 at offset 0.4
  const timingScore = Math.max(0, 1 - Math.abs(timingOffset) / 0.35);
  
  // Contest penalty: defenders closer than 90px contest the shot
  let contestFactor = 1.0;
  if (defenderDistance < 90) {
    contestFactor = Math.max(0.3, defenderDistance / 90);
  }

  // Distance factor: optimal inside 350px, drops off beyond
  const distFactor = distanceToRim < 360 ? 1.0 : Math.max(0.4, 1.0 - (distanceToRim - 360) / 450);

  // Player stat bonus: stat 1 = 0.7x, stat 5 = 1.3x
  const statFactor = 0.6 + (shotStat / 5) * 0.7;

  // On fire bonus
  const fireBonus = isOnFire ? 1.25 : 1.0;

  // Weighted combo
  const rawQuality = (timingScore * 0.6 + distFactor * 0.2 + contestFactor * 0.2) * statFactor * fireBonus;
  return Math.min(1.0, Math.max(0.05, rawQuality));
}

/**
 * Determines whether a shot will convert into a basket
 */
export function willShotGoIn(shotQuality: number, shotStat: number): boolean {
  // Perfect green release (> 0.82) always goes in
  if (shotQuality >= 0.82) return true;
  
  // Minimum quality threshold
  const threshold = 0.48 - (shotStat * 0.04);
  return shotQuality >= threshold;
}

/**
 * Checks if player is in position and condition to execute a flashy dunk
 */
export function canTriggerDunk(
  playerX: number,
  playerY: number,
  playerVx: number,
  targetRimX: number,
  targetRimY: number = RIM_Y,
  strengthStat: number = 3
): boolean {
  const dx = targetRimX - playerX;
  const dy = targetRimY - playerY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Must be in dunk range (between 40px and 175px from rim)
  const maxRange = 140 + strengthStat * 12;
  if (dist < 30 || dist > maxRange) return false;

  // Must have momentum heading towards the rim
  const dot = (dx * playerVx);
  return dot >= 0; // positive velocity towards rim side
}

/**
 * Resolves a no-foul shove / aggressive brawling tackle
 */
export function resolveShove(
  attackerStrength: number,
  defenderStrength: number,
  hasBall: boolean
): {
  success: boolean;
  knockbackVx: number;
  knockbackVy: number;
  stunDuration: number;
  causedTurnover: boolean;
} {
  // Attacker strength vs defender strength
  const strengthDiff = attackerStrength - defenderStrength;
  const baseChance = 0.55 + strengthDiff * 0.12;
  const success = Math.random() < Math.min(0.9, Math.max(0.2, baseChance));

  if (!success) {
    return {
      success: false,
      knockbackVx: 0,
      knockbackVy: 0,
      stunDuration: 0,
      causedTurnover: false
    };
  }

  // Knockback force scaled by strength
  const force = 8 + attackerStrength * 2.5;
  const stun = 1.0 + attackerStrength * 0.2; // in seconds
  const causedTurnover = hasBall;

  return {
    success: true,
    knockbackVx: force,
    knockbackVy: (Math.random() - 0.5) * 4,
    stunDuration: stun,
    causedTurnover
  };
}

/**
 * Resolves a crossover / ankle breaker move against a nearby defender
 */
export function resolveCrossover(
  carrierSpeed: number,
  defenderSpeed: number,
  distance: number
): {
  brokenAnkle: boolean;
  stunDuration: number;
} {
  // Must be within ankle-breaker proximity (40 to 110 px)
  if (distance < 30 || distance > 110) {
    return { brokenAnkle: false, stunDuration: 0 };
  }

  const speedAdvantage = carrierSpeed - defenderSpeed;
  const ankleBreakChance = 0.35 + (speedAdvantage * 0.12);

  if (Math.random() < ankleBreakChance) {
    return { brokenAnkle: true, stunDuration: 1.2 };
  }

  return { brokenAnkle: false, stunDuration: 0 };
}

/**
 * Finds the best open teammate to pass to based on input vector or nearest forward teammate
 */
export function findBestPassTarget(
  carrierId: string,
  carrierPos: Vector2D,
  targetRimX: number,
  inputDir: Vector2D | null,
  teammates: { id: string; x: number; y: number }[],
  opponents: { x: number; y: number }[]
): string | null {
  const candidates = teammates.filter(t => t.id !== carrierId);
  if (candidates.length === 0) return null;

  let bestId: string | null = null;
  let bestScore = -Infinity;

  for (const mate of candidates) {
    const dx = mate.x - carrierPos.x;
    const dy = mate.y - carrierPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 30) continue; // too close

    let score = 100 - dist * 0.1; // closer is generally safer

    // Forward progression towards basket
    const distToRimBefore = Math.abs(carrierPos.x - targetRimX);
    const distToRimAfter = Math.abs(mate.x - targetRimX);
    if (distToRimAfter < distToRimBefore) {
      score += 40; // forward pass bonus
    }

    // Directional alignment with user stick/arrow keys if pressed
    if (inputDir && (inputDir.x !== 0 || inputDir.y !== 0)) {
      const len = Math.sqrt(inputDir.x * inputDir.x + inputDir.y * inputDir.y);
      const ndx = inputDir.x / len;
      const ndy = inputDir.y / len;
      const mdx = dx / dist;
      const mdy = dy / dist;
      const dot = ndx * mdx + ndy * mdy; // 1 = exact match
      score += dot * 80;
    }

    // Check for intercepting defenders
    let interceptRisk = 0;
    for (const opp of opponents) {
      // Proximity to pass ray
      const lineDist = pointToSegmentDistance(opp.x, opp.y, carrierPos.x, carrierPos.y, mate.x, mate.y);
      if (lineDist < 45) {
        interceptRisk += (45 - lineDist) * 2;
      }
    }
    score -= interceptRisk;

    if (score > bestScore) {
      bestScore = score;
      bestId = mate.id;
    }
  }

  return bestId || (candidates[0] ? candidates[0].id : null);
}

/**
 * Distance from point P to line segment AB
 */
export function pointToSegmentDistance(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const l2 = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
  if (l2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
}
