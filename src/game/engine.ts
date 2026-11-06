/**
 * 5v5 Basketball Game Engine & Physics Simulation
 * Controls player AI, user input, ball flight physics, dunks, crossovers, tackles, and scoring.
 */

import { TeamDef, PlayerState, BallState, ParticleEffect, Vector2D } from './types';
import {
  COURT_WIDTH,
  COURT_HEIGHT,
  LEFT_RIM_X,
  RIGHT_RIM_X,
  RIM_Y,
  RIM_HEIGHT_Z,
  isThreePointer,
  calculateShotQuality,
  willShotGoIn,
  canTriggerDunk,
  resolveShove,
  resolveCrossover,
  findBestPassTarget,
  THREE_POINT_RADIUS
} from './rules';
import { sounds } from './audio';

export interface GameEngineOptions {
  homeTeam: TeamDef;
  awayTeam: TeamDef;
  quarterLengthSeconds: number;
  difficulty: 'rookie' | 'all_star' | 'hall_of_brawl';
  onScoreUpdate: (home: number, away: number) => void;
  onPeriodEnd: (period: number) => void;
  onGameOver: (homeScore: number, awayScore: number) => void;
  onEventNotification: (text: string, type?: 'green' | 'red' | 'gold') => void;
}

export class GameEngine {
  public homeTeam: TeamDef;
  public awayTeam: TeamDef;
  public players: PlayerState[] = [];
  public ball: BallState;
  public particles: ParticleEffect[] = [];

  // Match State
  public homeScore: number = 0;
  public awayScore: number = 0;
  public currentPeriod: number = 1;
  public gameClock: number = 90; // seconds left in quarter
  public quarterLength: number = 90;
  public shotClock: number = 24.0;
  public isPaused: boolean = false;
  public isGameOver: boolean = false;

  // Controlled Player
  public userPlayerId: string = '';
  public rimShake: number = 0;
  public cameraOffset: Vector2D = { x: 0, y: 0 };

  // Shot Meter Tracking
  public isChargingShot: boolean = false;
  public shotMeterValue: number = 0; // 0 to 1
  public shotMeterDirection: number = 1;

  // Options callbacks
  private options: GameEngineOptions;

  constructor(options: GameEngineOptions) {
    this.options = options;
    this.homeTeam = options.homeTeam;
    this.awayTeam = options.awayTeam;
    this.quarterLength = options.quarterLengthSeconds;
    this.gameClock = options.quarterLengthSeconds;

    this.ball = {
      x: COURT_WIDTH / 2,
      y: RIM_Y,
      z: 15,
      vx: 0,
      vy: 0,
      vz: 0,
      carrierId: null,
      targetPlayerId: null,
      isShot: false,
      isPass: false,
      shotTargetRim: 1,
      shotDistance: 0,
      shotQuality: 0,
      isDunk: false,
      rimBounceCount: 0
    };

    this.initPlayers();
  }

  /**
   * Spawns 5 home players and 5 away players in realistic starting 5v5 formations
   */
  public initPlayers() {
    this.players = [];

    // Home positions (defending left rim, attacking right rim)
    const homeFormations: Record<string, { x: number; y: number }> = {
      PG: { x: 480, y: 325 },
      SG: { x: 420, y: 170 },
      SF: { x: 420, y: 480 },
      PF: { x: 300, y: 220 },
      C: { x: 260, y: 325 }
    };

    // Away positions (defending right rim, attacking left rim)
    const awayFormations: Record<string, { x: number; y: number }> = {
      PG: { x: 720, y: 325 },
      SG: { x: 780, y: 170 },
      SF: { x: 780, y: 480 },
      PF: { x: 900, y: 220 },
      C: { x: 940, y: 325 }
    };

    // Create home players
    this.homeTeam.players.forEach((def, idx) => {
      const slot = homeFormations[def.position] || { x: 350 + idx * 30, y: 325 };
      const isStarterBallHandler = idx === 0;
      const p: PlayerState = {
        def,
        teamId: this.homeTeam.id,
        isHome: true,
        x: slot.x,
        y: slot.y,
        vx: 0,
        vy: 0,
        facing: 1,
        hasBall: isStarterBallHandler,
        stamina: 100,
        heat: 0,
        state: 'idle',
        stateTimer: 0,
        animFrame: 0,
        crossoverTimer: 0,
        knockedTimer: 0,
        knockedVx: 0,
        knockedVy: 0,
        dunkProgress: 0,
        dunkStartX: 0,
        dunkStartY: 0,
        dunkTargetX: 0,
        dunkTargetY: 0,
        points: 0,
        dunks: 0,
        steals: 0,
        knockouts: 0,
        crossovers: 0
      };
      this.players.push(p);
      if (idx === 0) {
        this.userPlayerId = def.id;
        this.ball.carrierId = def.id;
        this.ball.x = p.x + 12;
        this.ball.y = p.y;
      }
    });

    // Create away players
    this.awayTeam.players.forEach((def, idx) => {
      const slot = awayFormations[def.position] || { x: 800 + idx * 30, y: 325 };
      const p: PlayerState = {
        def,
        teamId: this.awayTeam.id,
        isHome: false,
        x: slot.x,
        y: slot.y,
        vx: 0,
        vy: 0,
        facing: -1,
        hasBall: false,
        stamina: 100,
        heat: 0,
        state: 'idle',
        stateTimer: 0,
        animFrame: 0,
        crossoverTimer: 0,
        knockedTimer: 0,
        knockedVx: 0,
        knockedVy: 0,
        dunkProgress: 0,
        dunkStartX: 0,
        dunkStartY: 0,
        dunkTargetX: 0,
        dunkTargetY: 0,
        points: 0,
        dunks: 0,
        steals: 0,
        knockouts: 0,
        crossovers: 0
      };
      this.players.push(p);
    });
  }

  public getUserPlayer(): PlayerState | undefined {
    return this.players.find(p => p.def.id === this.userPlayerId);
  }

  public getBallCarrier(): PlayerState | undefined {
    if (!this.ball.carrierId) return undefined;
    return this.players.find(p => p.def.id === this.ball.carrierId);
  }

  /**
   * Main simulation step (60 FPS)
   */
  public update(dt: number, input: { x: number; y: number }) {
    if (this.isPaused || this.isGameOver) return;
    const clampedDt = Math.min(dt, 0.05);

    // Update game & shot clocks
    this.gameClock -= clampedDt;
    this.shotClock -= clampedDt;
    if (this.shotClock <= 0) {
      this.handleShotClockViolation();
    }
    if (this.gameClock <= 0) {
      this.handleQuarterEnd();
    }

    // Decay rim shake
    if (this.rimShake > 0) {
      this.rimShake = Math.max(0, this.rimShake - clampedDt * 2.5);
    }

    // Update Shot Meter charging if user holds shoot button
    if (this.isChargingShot) {
      this.shotMeterValue += this.shotMeterDirection * clampedDt * 2.2;
      if (this.shotMeterValue >= 1) {
        this.shotMeterValue = 1;
        this.shotMeterDirection = -1;
      } else if (this.shotMeterValue <= 0) {
        this.shotMeterValue = 0;
        this.shotMeterDirection = 1;
      }
    }

    // Update all 10 players
    const carrier = this.getBallCarrier();
    for (const player of this.players) {
      this.updatePlayer(player, clampedDt, input, carrier);
    }

    // Update Ball Physics
    this.updateBall(clampedDt);

    // Update Particles
    this.updateParticles(clampedDt);
  }

  /**
   * Updates an individual player: movement, state machine, AI logic
   */
  private updatePlayer(
    player: PlayerState,
    dt: number,
    userInput: { x: number; y: number },
    carrier: PlayerState | undefined
  ) {
    player.animFrame++;

    // Knocked down state recovery
    if (player.state === 'knocked_down') {
      player.knockedTimer -= dt;
      player.x += player.knockedVx;
      player.y += player.knockedVy;
      player.knockedVx *= 0.88;
      player.knockedVy *= 0.88;
      if (player.knockedTimer <= 0) {
        player.state = 'idle';
      }
      this.clampPlayerBounds(player);
      return;
    }

    // Crossover dash cooldown
    if (player.crossoverTimer > 0) {
      player.crossoverTimer -= dt;
      if (player.crossoverTimer <= 0 && player.state === 'crossover') {
        player.state = 'running';
      }
    }

    // Dunking animation progress
    if (player.state === 'dunking') {
      player.dunkProgress += dt * 1.55; // ~0.65s dunk
      const t = Math.min(1.0, player.dunkProgress);
      // Smooth interpolation to rim
      player.x = player.dunkStartX + (player.dunkTargetX - player.dunkStartX) * t;
      player.y = player.dunkStartY + (player.dunkTargetY - player.dunkStartY) * t;

      if (t >= 1.0) {
        // Slam dunk completed!
        this.completeDunk(player);
      }
      return;
    }

    // If controlled by user
    const isUser = player.def.id === this.userPlayerId;
    if (isUser) {
      this.handleUserPlayerMovement(player, userInput, dt);
    } else {
      // AI driven teammate or opponent
      this.handleAIPlayer(player, carrier, dt);
    }

    // Apply velocity
    player.x += player.vx * dt * 60;
    player.y += player.vy * dt * 60;
    player.vx *= 0.85;
    player.vy *= 0.85;

    // Set state & facing
    if (Math.abs(player.vx) > 0.2 || Math.abs(player.vy) > 0.2) {
      if (player.state !== 'shooting' && player.state !== 'shoving' && player.state !== 'crossover') {
        player.state = 'running';
      }
      if (Math.abs(player.vx) > 0.3) {
        player.facing = player.vx > 0 ? 1 : -1;
      }
    } else if (player.state === 'running') {
      player.state = 'idle';
    }

    this.clampPlayerBounds(player);
  }

  private handleUserPlayerMovement(player: PlayerState, input: { x: number; y: number }, dt: number) {
    if (player.state === 'shooting') return; // stationary when gathering jump shot

    const baseSpeed = 3.6 + player.def.stats.speed * 0.45;
    const speed = player.state === 'crossover' ? baseSpeed * 1.6 : baseSpeed;

    player.vx = input.x * speed;
    player.vy = input.y * speed;

    if (input.x !== 0) {
      player.facing = input.x > 0 ? 1 : -1;
    }

    // Dribble sound pulse
    if (player.hasBall && (input.x !== 0 || input.y !== 0) && player.animFrame % 22 === 0) {
      sounds.playDribble();
    }
  }

  /**
   * Smart basketball AI for other 9 players: spacing, cutting, contesting, rebounding, and brawling!
   */
  private handleAIPlayer(player: PlayerState, carrier: PlayerState | undefined, dt: number) {
    const isSameTeamAsCarrier = carrier ? carrier.teamId === player.teamId : player.isHome;
    const targetRimX = player.isHome ? RIGHT_RIM_X : LEFT_RIM_X;
    const defendRimX = player.isHome ? LEFT_RIM_X : RIGHT_RIM_X;
    const baseSpeed = 2.8 + player.def.stats.speed * 0.4;

    // If this AI player HAS THE BALL
    if (player.hasBall) {
      const distToRim = Math.hypot(targetRimX - player.x, RIM_Y - player.y);

      // AI Dunk attempt if in paint!
      if (canTriggerDunk(player.x, player.y, player.facing * 3, targetRimX, RIM_Y, player.def.stats.strength)) {
        this.triggerDunk(player);
        return;
      }

      // AI Shoot if open inside 3-point range
      if (distToRim < 300 && Math.random() < 0.02) {
        this.triggerAIShot(player, targetRimX, distToRim);
        return;
      }

      // Drive toward rim or pass
      const targetX = targetRimX + (player.isHome ? -120 : 120);
      const dx = targetX - player.x;
      const dy = RIM_Y - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 20) {
        player.vx = (dx / dist) * baseSpeed;
        player.vy = (dy / dist) * baseSpeed * 0.5;
      }

      // AI Crossover if defender is very close
      const nearbyOpp = this.findNearestOpponent(player);
      if (nearbyOpp && nearbyOpp.dist < 65 && Math.random() < 0.04) {
        this.triggerCrossover(player);
      }

      // AI Pass to open cutter occasionally
      if (Math.random() < 0.015) {
        this.triggerAIPass(player, targetRimX);
      }

      if (player.animFrame % 24 === 0) {
        sounds.playDribble();
      }
      return;
    }

    // If loose ball (rebound or loose pass)
    if (!this.ball.carrierId && !this.ball.isShot) {
      const dx = this.ball.x - player.x;
      const dy = this.ball.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 15) {
        player.vx = (dx / dist) * baseSpeed * 1.1;
        player.vy = (dy / dist) * baseSpeed * 1.1;
      }
      return;
    }

    // If On Offense (teammate has ball)
    if (isSameTeamAsCarrier) {
      // Space the floor according to position
      let targetX = targetRimX + (player.isHome ? -220 : 220);
      let targetY = RIM_Y;

      if (player.def.position === 'PG') {
        targetX = targetRimX + (player.isHome ? -360 : 360);
        targetY = RIM_Y;
      } else if (player.def.position === 'SG') {
        targetX = targetRimX + (player.isHome ? -280 : 280);
        targetY = 160;
      } else if (player.def.position === 'SF') {
        targetX = targetRimX + (player.isHome ? -280 : 280);
        targetY = 490;
      } else if (player.def.position === 'PF') {
        targetX = targetRimX + (player.isHome ? -160 : 160);
        targetY = 220;
      } else {
        // Center: cuts into paint for alley-oop or putback
        targetX = targetRimX + (player.isHome ? -100 : 100);
        targetY = RIM_Y + (Math.sin(player.animFrame * 0.05) * 40);
      }

      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 25) {
        player.vx = (dx / dist) * baseSpeed * 0.7;
        player.vy = (dy / dist) * baseSpeed * 0.7;
      }
      return;
    }

    // If On Defense (opponent has ball)
    if (carrier) {
      const distToCarrier = Math.hypot(carrier.x - player.x, carrier.y - player.y);

      // Aggressive Brawl / Tackle attempt if close to carrier!
      if (distToCarrier < 45 && Math.random() < 0.05) {
        this.triggerShove(player);
        return;
      }

      // Check if this defender is assigned to the carrier (matching position or closest)
      const isPrimaryGuard = player.def.position === carrier.def.position;

      let targetX = carrier.x;
      let targetY = carrier.y;

      if (isPrimaryGuard || distToCarrier < 90) {
        // Guard carrier directly, positioned between carrier and defended basket
        const toBasketX = defendRimX - carrier.x;
        const toBasketY = RIM_Y - carrier.y;
        const toBasketDist = Math.hypot(toBasketX, toBasketY);
        if (toBasketDist > 0) {
          targetX = carrier.x + (toBasketX / toBasketDist) * 45;
          targetY = carrier.y + (toBasketY / toBasketDist) * 45;
        }
      } else {
        // Man-to-man coverage on matching opponent position
        const matchedOpponent = this.players.find(
          p => p.teamId === carrier.teamId && p.def.position === player.def.position
        );
        if (matchedOpponent) {
          // Shadow matching opponent between them and basket
          const toBasketX = defendRimX - matchedOpponent.x;
          const toBasketY = RIM_Y - matchedOpponent.y;
          const toBasketDist = Math.hypot(toBasketX, toBasketY);
          targetX = matchedOpponent.x + (toBasketDist > 0 ? (toBasketX / toBasketDist) * 40 : (player.isHome ? -35 : 35));
          targetY = matchedOpponent.y + (toBasketDist > 0 ? (toBasketY / toBasketDist) * 40 : 0);
        } else {
          targetX = defendRimX + (player.isHome ? 120 : -120);
          targetY = RIM_Y;
        }
      }

      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 18) {
        player.vx = (dx / dist) * baseSpeed * 0.85;
        player.vy = (dy / dist) * baseSpeed * 0.85;
      }
    }
  }

  private findNearestOpponent(player: PlayerState): { opponent: PlayerState; dist: number } | null {
    let nearest: PlayerState | null = null;
    let minDist = Infinity;
    for (const other of this.players) {
      if (other.teamId !== player.teamId && other.state !== 'knocked_down') {
        const d = Math.hypot(other.x - player.x, other.y - player.y);
        if (d < minDist) {
          minDist = d;
          nearest = other;
        }
      }
    }
    return nearest ? { opponent: nearest, dist: minDist } : null;
  }

  /**
   * Clamp player inside court borders
   */
  private clampPlayerBounds(player: PlayerState) {
    player.x = Math.max(50, Math.min(COURT_WIDTH - 50, player.x));
    player.y = Math.max(85, Math.min(COURT_HEIGHT - 35, player.y));
  }

  /**
   * Updates ball in flight (shooting arcs, passes, dribbles, rim rebounds)
   */
  private updateBall(dt: number) {
    const carrier = this.getBallCarrier();

    // 1. Attached to dribbling player
    if (carrier) {
      const dribbleOffset = Math.sin(carrier.animFrame * 0.4) * 8;
      this.ball.x = carrier.x + carrier.facing * 14;
      this.ball.y = carrier.y - 12;
      this.ball.z = Math.max(0, 8 + dribbleOffset);
      this.ball.vx = carrier.vx;
      this.ball.vy = carrier.vy;
      this.ball.vz = 0;
      return;
    }

    // 2. Ball is in flight (Pass or Shot)
    this.ball.x += this.ball.vx * dt * 60;
    this.ball.y += this.ball.vy * dt * 60;
    this.ball.z += this.ball.vz * dt * 60;
    this.ball.vz -= 0.65; // Gravity

    // Floor collision
    if (this.ball.z <= 0) {
      this.ball.z = 0;
      this.ball.vz = -this.ball.vz * 0.6; // bounce
      this.ball.vx *= 0.85;
      this.ball.vy *= 0.85;
      if (Math.abs(this.ball.vz) < 1) {
        this.ball.vz = 0;
        this.ball.isShot = false;
        this.ball.isPass = false;
      }
    }

    // If ball is a shot, check rim target collision
    if (this.ball.isShot) {
      const targetRimX = this.ball.shotTargetRim === 1 ? RIGHT_RIM_X : LEFT_RIM_X;
      const dx = targetRimX - this.ball.x;
      const dy = RIM_Y - this.ball.y;
      const dist = Math.hypot(dx, dy);

      // Check if entering rim cylinder
      if (dist < 18 && Math.abs(this.ball.z - RIM_HEIGHT_Z) < 22 && this.ball.vz < 0) {
        const willScore = willShotGoIn(this.ball.shotQuality, 4);
        if (willScore) {
          this.scoreBasket(this.ball.shotTargetRim, this.ball.shotDistance >= THREE_POINT_RADIUS);
        } else {
          // Clank off rim!
          this.ball.vx = (Math.random() - 0.5) * 8;
          this.ball.vy = (Math.random() - 0.5) * 8;
          this.ball.vz = 7;
          this.ball.rimBounceCount++;
          this.rimShake = 0.5;
          sounds.playRimClank();
          this.spawnComicText('CLANK!', targetRimX, RIM_Y - 40, '#ff4444');
        }
        this.ball.isShot = false;
      }
    }

    // Check player pickup if loose
    if (!this.ball.isShot && this.ball.z < 25) {
      for (const p of this.players) {
        if (p.state !== 'knocked_down') {
          const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
          if (d < 28) {
            this.ball.carrierId = p.def.id;
            p.hasBall = true;
            this.ball.isPass = false;
            this.shotClock = 24.0;
            // If user's team picked up ball, automatically focus user on that player!
            if (p.isHome) {
              this.userPlayerId = p.def.id;
            }
            break;
          }
        }
      }
    }
  }

  /**
   * USER ACTION: Start Charging Jump Shot
   */
  public startShotCharge() {
    const user = this.getUserPlayer();
    if (!user || !user.hasBall || user.state === 'shooting' || user.state === 'knocked_down') return;

    const targetRimX = user.isHome ? RIGHT_RIM_X : LEFT_RIM_X;

    // Check if close enough for a FLASHY DUNK instead of jump shot!
    if (canTriggerDunk(user.x, user.y, user.facing * 4, targetRimX, RIM_Y, user.def.stats.strength)) {
      this.triggerDunk(user);
      return;
    }

    // Otherwise, initiate jump shot
    user.state = 'shooting';
    this.isChargingShot = true;
    this.shotMeterValue = 0;
    this.shotMeterDirection = 1;
  }

  /**
   * USER ACTION: Release Jump Shot
   */
  public releaseShot() {
    if (!this.isChargingShot) return;
    this.isChargingShot = false;

    const user = this.getUserPlayer();
    if (!user || !user.hasBall) return;

    const targetRimX = user.isHome ? RIGHT_RIM_X : LEFT_RIM_X;
    const distToRim = Math.hypot(targetRimX - user.x, RIM_Y - user.y);

    // Sweet spot is centered around 0.88 - 0.94
    const timingOffset = Math.abs(this.shotMeterValue - 0.90);
    const nearbyOpp = this.findNearestOpponent(user);
    const contestDist = nearbyOpp ? nearbyOpp.dist : 200;

    const quality = calculateShotQuality(
      timingOffset,
      distToRim,
      contestDist,
      user.def.stats.shot,
      user.heat >= 100
    );

    // Visual feedback for release quality
    if (quality >= 0.85) {
      this.spawnComicText('EXCELLENT!', user.x, user.y - 75, '#22c55e');
      this.options.onEventNotification('EXCELLENT GREEN RELEASE!', 'green');
    } else if (quality >= 0.65) {
      this.spawnComicText('GOOD!', user.x, user.y - 75, '#eab308');
    } else {
      this.spawnComicText('OFF!', user.x, user.y - 75, '#ef4444');
    }

    sounds.playShotRelease(quality);

    // Launch ball into 3D arc
    this.launchBallShot(user, targetRimX, distToRim, quality);
    user.hasBall = false;
    this.ball.carrierId = null;

    setTimeout(() => {
      if (user.state === 'shooting') user.state = 'idle';
    }, 450);
  }

  private launchBallShot(shooter: PlayerState, targetRimX: number, dist: number, quality: number) {
    this.ball.isShot = true;
    this.ball.isPass = false;
    this.ball.shotTargetRim = shooter.isHome ? 1 : -1;
    this.ball.shotDistance = dist;
    this.ball.shotQuality = quality;

    const flightTime = 0.95; // seconds
    const dx = targetRimX - shooter.x;
    const dy = RIM_Y - shooter.y;

    this.ball.vx = (dx / (flightTime * 60));
    this.ball.vy = (dy / (flightTime * 60));
    this.ball.vz = 17.5; // arc height
  }

  /**
   * USER ACTION: Pass Ball to Teammate
   */
  public passBall(inputDir?: Vector2D) {
    const user = this.getUserPlayer();
    if (!user || !user.hasBall) {
      // If user DOES NOT have ball, switch control to nearest teammate!
      this.switchControlledPlayer();
      return;
    }

    const targetRimX = user.isHome ? RIGHT_RIM_X : LEFT_RIM_X;
    const teammates = this.players
      .filter(p => p.teamId === user.teamId)
      .map(p => ({ id: p.def.id, x: p.x, y: p.y }));
    const opponents = this.players
      .filter(p => p.teamId !== user.teamId)
      .map(p => ({ x: p.x, y: p.y }));

    const targetId = findBestPassTarget(
      user.def.id,
      { x: user.x, y: user.y },
      targetRimX,
      inputDir || { x: user.facing, y: 0 },
      teammates,
      opponents
    );

    if (!targetId) return;
    const targetPlayer = this.players.find(p => p.def.id === targetId);
    if (!targetPlayer) return;

    sounds.playPass();
    user.hasBall = false;
    this.ball.carrierId = null;
    this.ball.isPass = true;
    this.ball.isShot = false;

    // Fast pass trajectory
    const dx = targetPlayer.x - user.x;
    const dy = targetPlayer.y - user.y;
    const dist = Math.hypot(dx, dy);
    const speed = 14;

    this.ball.vx = (dx / dist) * speed;
    this.ball.vy = (dy / dist) * speed;
    this.ball.vz = 2.5;

    // Transfer control immediately to receiver
    this.userPlayerId = targetPlayer.def.id;
    this.spawnComicText('PASS!', user.x, user.y - 45, '#38bdf8');
  }

  /**
   * USER ACTION: Crossover / Ankle Breaker Move
   */
  public performCrossover() {
    const user = this.getUserPlayer();
    if (!user || user.state === 'knocked_down' || user.crossoverTimer > 0) return;

    user.state = 'crossover';
    user.crossoverTimer = 0.55;
    sounds.playCrossover();

    // Burst speed in facing direction
    user.vx = user.facing * 7;

    // Check for nearby defender ankle breaker!
    const nearbyOpp = this.findNearestOpponent(user);
    if (nearbyOpp) {
      const result = resolveCrossover(user.def.stats.speed, nearbyOpp.opponent.def.stats.speed, nearbyOpp.dist);
      if (result.brokenAnkle) {
        nearbyOpp.opponent.state = 'knocked_down';
        nearbyOpp.opponent.knockedTimer = result.stunDuration;
        nearbyOpp.opponent.knockedVx = -nearbyOpp.opponent.facing * 3;
        nearbyOpp.opponent.knockedVy = (Math.random() - 0.5) * 4;
        user.crossovers++;
        this.spawnComicText('ANKLE BROKEN!', nearbyOpp.opponent.x, nearbyOpp.opponent.y - 50, '#f43f5e');
        this.options.onEventNotification('ANKLE BREAKER! Defender dropped!', 'gold');
      }
    }
  }

  /**
   * USER ACTION: Shove / Brawl Tackle (NO FOULS!)
   */
  public performShove() {
    const user = this.getUserPlayer();
    if (!user || user.state === 'knocked_down') return;

    user.state = 'shoving';
    sounds.playPunch();

    setTimeout(() => {
      if (user.state === 'shoving') user.state = 'idle';
    }, 280);

    const nearbyOpp = this.findNearestOpponent(user);
    if (!nearbyOpp || nearbyOpp.dist > 55) return;

    const opp = nearbyOpp.opponent;
    const result = resolveShove(user.def.stats.strength, opp.def.stats.strength, opp.hasBall);

    if (result.success) {
      opp.state = 'knocked_down';
      opp.knockedTimer = result.stunDuration;
      opp.knockedVx = user.facing * result.knockbackVx * 0.5;
      opp.knockedVy = result.knockbackVy;
      user.knockouts++;

      this.spawnComicText('POW!', opp.x, opp.y - 45, '#fbbf24');
      this.options.onEventNotification(`${user.def.name} brawled ${opp.def.name}!`, 'red');

      // If opponent had ball, steal it!
      if (result.causedTurnover) {
        opp.hasBall = false;
        user.hasBall = true;
        this.ball.carrierId = user.def.id;
        user.steals++;
        user.heat = Math.min(100, user.heat + 35);
        this.spawnComicText('STRIP STEAL!', user.x, user.y - 65, '#22c55e');
      }
    }
  }

  /**
   * Triggers Flashy Dunk Animation
   */
  public triggerDunk(player: PlayerState) {
    const targetRimX = player.isHome ? RIGHT_RIM_X : LEFT_RIM_X;
    player.state = 'dunking';
    player.dunkProgress = 0;
    player.dunkStartX = player.x;
    player.dunkStartY = player.y;
    player.dunkTargetX = targetRimX + (player.isHome ? -12 : 12);
    player.dunkTargetY = RIM_Y;

    this.spawnComicText(player.def.dunkName.toUpperCase(), player.x, player.y - 60, '#f59e0b');
    this.options.onEventNotification(`${player.def.name}: ${player.def.dunkName}!`, 'gold');
  }

  private completeDunk(player: PlayerState) {
    player.state = 'idle';
    player.dunks++;
    player.heat = 100; // "ON FIRE!"
    this.rimShake = 1.0;
    sounds.playDunk();
    this.scoreBasket(player.isHome ? 1 : -1, false);

    // Fire sparks burst
    this.spawnSparks(player.x, player.y, 16, '#ff6600');
    this.spawnComicText('SLAM DUNK!!', player.x, RIM_Y - 50, '#ef4444');
  }

  private triggerAIShot(player: PlayerState, targetRimX: number, dist: number) {
    player.state = 'shooting';
    const quality = 0.5 + Math.random() * 0.45;
    sounds.playShotRelease(quality);
    this.launchBallShot(player, targetRimX, dist, quality);
    player.hasBall = false;
    this.ball.carrierId = null;
    setTimeout(() => {
      if (player.state === 'shooting') player.state = 'idle';
    }, 450);
  }

  private triggerAIPass(player: PlayerState, targetRimX: number) {
    const teammates = this.players.filter(p => p.teamId === player.teamId && p.def.id !== player.def.id);
    if (teammates.length === 0) return;
    const target = teammates[Math.floor(Math.random() * teammates.length)];

    sounds.playPass();
    player.hasBall = false;
    this.ball.carrierId = null;
    this.ball.isPass = true;

    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy);
    this.ball.vx = (dx / dist) * 13;
    this.ball.vy = (dy / dist) * 13;
    this.ball.vz = 2;
  }

  private triggerCrossover(player: PlayerState) {
    player.state = 'crossover';
    player.crossoverTimer = 0.5;
    player.vx = player.facing * 5.5;
    sounds.playCrossover();
  }

  private triggerShove(player: PlayerState) {
    player.state = 'shoving';
    sounds.playPunch();
    setTimeout(() => {
      if (player.state === 'shoving') player.state = 'idle';
    }, 280);

    const opp = this.findNearestOpponent(player);
    if (opp && opp.dist < 50) {
      const result = resolveShove(player.def.stats.strength, opp.opponent.def.stats.strength, opp.opponent.hasBall);
      if (result.success) {
        opp.opponent.state = 'knocked_down';
        opp.opponent.knockedTimer = result.stunDuration;
        opp.opponent.knockedVx = player.facing * 4;
        if (result.causedTurnover) {
          opp.opponent.hasBall = false;
          player.hasBall = true;
          this.ball.carrierId = player.def.id;
        }
      }
    }
  }

  private switchControlledPlayer() {
    // Find nearest teammate to the ball
    let nearest: PlayerState | null = null;
    let minDist = Infinity;
    for (const p of this.players) {
      if (p.isHome && p.def.id !== this.userPlayerId) {
        const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
        if (d < minDist) {
          minDist = d;
          nearest = p;
        }
      }
    }
    if (nearest) {
      this.userPlayerId = nearest.def.id;
    }
  }

  /**
   * Handles basket scored
   */
  private scoreBasket(rimSide: 1 | -1, isThree: boolean) {
    const points = isThree ? 3 : 2;
    sounds.playSwish();
    sounds.playCrowdCheer();

    if (rimSide === 1) {
      this.homeScore += points;
      this.options.onEventNotification(`HOME SCORES ${points} PTS!`, 'green');
    } else {
      this.awayScore += points;
      this.options.onEventNotification(`AWAY SCORES ${points} PTS!`, 'red');
    }

    this.options.onScoreUpdate(this.homeScore, this.awayScore);

    // Inbound reset after brief celebration
    setTimeout(() => {
      this.resetPossession(rimSide === 1 ? false : true);
    }, 1100);
  }

  private handleShotClockViolation() {
    this.shotClock = 24.0;
    this.options.onEventNotification('SHOT CLOCK VIOLATION!', 'red');
    sounds.playBuzzer();
    this.resetPossession(true);
  }

  private handleQuarterEnd() {
    sounds.playBuzzer();
    if (this.currentPeriod < 4) {
      this.options.onPeriodEnd(this.currentPeriod);
      this.currentPeriod++;
      this.gameClock = this.quarterLength;
      this.shotClock = 24.0;
      this.resetPossession(this.currentPeriod % 2 === 1);
    } else {
      this.isGameOver = true;
      this.options.onGameOver(this.homeScore, this.awayScore);
    }
  }

  private resetPossession(homeInbound: boolean) {
    this.shotClock = 24.0;
    this.ball.isShot = false;
    this.ball.isPass = false;

    // Place players on their court halves
    const inboundTeam = homeInbound ? this.homeTeam : this.awayTeam;
    const pg = this.players.find(p => p.teamId === inboundTeam.id && p.def.position === 'PG');
    if (pg) {
      pg.x = homeInbound ? 120 : COURT_WIDTH - 120;
      pg.y = RIM_Y;
      pg.hasBall = true;
      this.ball.carrierId = pg.def.id;
      this.ball.x = pg.x;
      this.ball.y = pg.y;
      this.ball.z = 10;
      if (homeInbound) {
        this.userPlayerId = pg.def.id;
      }
    }
  }

  // Visual text and particle helpers
  public spawnComicText(text: string, x: number, y: number, color: string = '#ffe600') {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -1.2,
      color,
      size: 16,
      alpha: 1.0,
      life: 0,
      maxLife: 0.9,
      text,
      scale: 1.2,
      type: 'comic_text'
    });
  }

  public spawnSparks(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 3,
        alpha: 1.0,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        type: 'spark'
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = 1.0 - (p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }
}
