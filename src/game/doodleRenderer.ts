/**
 * Canvas 2D Doodle Renderer
 * Renders characters, court, ball, and flashy dunk visual fx
 * in the distinctive bold-outline doodle cartoon art style.
 */

import { PlayerState, BallState, ParticleEffect, DunkType, PlayerDef } from './types';
import { COURT_WIDTH, COURT_HEIGHT, LEFT_RIM_X, RIGHT_RIM_X, RIM_Y, RIM_HEIGHT_Z, THREE_POINT_RADIUS } from './rules';

export function renderCourt(ctx: CanvasRenderingContext2D, width: number, height: number, rimShake: number = 0) {
  ctx.save();

  // Court wooden floor
  ctx.fillStyle = '#dfaa69';
  ctx.fillRect(0, 0, width, height);

  // Doodle plank lines
  ctx.strokeStyle = '#c69253';
  ctx.lineWidth = 1.5;
  for (let y = 30; y < height; y += 35) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Occasional wood grain knot
    if (y % 70 === 0) {
      ctx.beginPath();
      ctx.ellipse((y * 7) % width, y - 10, 16, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Bleachers / Top crowd backdrop
  ctx.fillStyle = '#22283e';
  ctx.fillRect(0, 0, width, 55);
  ctx.fillStyle = '#171c2d';
  ctx.fillRect(0, 50, width, 5);

  // Doodle crowd heads in stands
  for (let x = 25; x < width; x += 40) {
    ctx.fillStyle = (x % 80 === 0) ? '#ffb088' : '#e0a96d';
    ctx.beginPath();
    ctx.arc(x, 32, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0d111d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Little doodle cap or hair
    if (x % 60 === 0) {
      ctx.fillStyle = '#f54242';
      ctx.fillRect(x - 9, 23, 18, 5);
    }
  }

  // Court Boundary Line - Thick doodle sketch stroke
  ctx.strokeStyle = '#1b233a';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 65, width - 60, height - 85);

  // Half-court line
  ctx.beginPath();
  ctx.moveTo(width / 2, 65);
  ctx.lineTo(width / 2, height - 20);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(width / 2, RIM_Y, 80, 0, Math.PI * 2);
  ctx.stroke();

  // Center Doodle Basketball Logo
  ctx.fillStyle = '#ff7a29';
  ctx.beginPath();
  ctx.arc(width / 2, RIM_Y, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Basketball seams
  ctx.beginPath();
  ctx.arc(width / 2 - 20, RIM_Y, 25, -Math.PI / 3, Math.PI / 3);
  ctx.arc(width / 2 + 20, RIM_Y, 25, (2 * Math.PI) / 3, (4 * Math.PI) / 3);
  ctx.stroke();

  // Left Paint / Key
  ctx.fillStyle = 'rgba(85, 37, 131, 0.12)';
  ctx.fillRect(30, RIM_Y - 95, 170, 190);
  ctx.strokeRect(30, RIM_Y - 95, 170, 190);
  ctx.beginPath();
  ctx.arc(200, RIM_Y, 60, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Left 3-point Arc
  ctx.beginPath();
  ctx.arc(LEFT_RIM_X, RIM_Y, THREE_POINT_RADIUS, -Math.PI * 0.44, Math.PI * 0.44);
  ctx.stroke();

  // Right Paint / Key
  ctx.fillStyle = 'rgba(29, 66, 138, 0.12)';
  ctx.fillRect(width - 200, RIM_Y - 95, 170, 190);
  ctx.strokeRect(width - 200, RIM_Y - 95, 170, 190);
  ctx.beginPath();
  ctx.arc(width - 200, RIM_Y, 60, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.stroke();

  // Right 3-point Arc
  ctx.beginPath();
  ctx.arc(RIGHT_RIM_X, RIM_Y, THREE_POINT_RADIUS, Math.PI * 0.56, Math.PI * 1.44);
  ctx.stroke();

  // Left Rim & Backboard
  renderRim(ctx, LEFT_RIM_X, RIM_Y, -1, rimShake);

  // Right Rim & Backboard
  renderRim(ctx, RIGHT_RIM_X, RIM_Y, 1, rimShake);

  ctx.restore();
}

function renderRim(ctx: CanvasRenderingContext2D, rimX: number, rimY: number, facing: number, rimShake: number) {
  const shakeOffset = rimShake > 0 ? (Math.random() - 0.5) * rimShake * 8 : 0;
  const boardX = facing === 1 ? rimX + 35 : rimX - 35;
  const rimDrawX = rimX + (facing === 1 ? shakeOffset : -shakeOffset);

  // Pole & Support
  ctx.strokeStyle = '#1d2232';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(facing === 1 ? boardX + 25 : boardX - 25, rimY + 80);
  ctx.lineTo(boardX, rimY - 35);
  ctx.stroke();

  // Backboard
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(facing === 1 ? boardX : boardX - 8, rimY - 80, 8, 90);
  ctx.fillRect(facing === 1 ? boardX : boardX - 8, rimY - 80, 8, 90);

  // Inner backboard target square
  ctx.strokeStyle = '#ff3333';
  ctx.lineWidth = 3;
  ctx.strokeRect(facing === 1 ? boardX - 3 : boardX + 3, rimY - 50, 2, 35);

  // Orange Rim
  ctx.strokeStyle = '#ff5500';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(boardX, rimY - 15);
  ctx.lineTo(rimDrawX, rimY - 15);
  ctx.stroke();

  // Net - Woven doodle pattern
  ctx.strokeStyle = '#f3f4f6';
  ctx.lineWidth = 2.5;
  const netTopY = rimY - 15;
  const netBottomY = rimY + 25;
  const netSpan = 22;

  ctx.beginPath();
  // zig zag net strands
  ctx.moveTo(rimDrawX - netSpan * facing, netTopY);
  ctx.lineTo(rimDrawX - (netSpan * 0.6) * facing, netBottomY);
  ctx.lineTo(rimDrawX, netTopY);
  ctx.lineTo(rimDrawX - (netSpan * 0.2) * facing, netBottomY);
  ctx.stroke();
}

/**
 * Renders a player character matching the user's reference doodle image!
 */
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  isUserControlled: boolean,
  jerseyColor: string,
  secondaryColor: string,
  dunkProgress: number = 0,
  showNameTag: boolean = true
) {
  const { def, x, y, facing, state, animFrame, knockedTimer } = player;
  const isKnocked = state === 'knocked_down';

  ctx.save();
  ctx.translate(x, y);

  // Selection ring for player currently controlled by user
  if (isUserControlled) {
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 18, 26, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Yellow indicator arrow over head
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(0, -68);
    ctx.lineTo(-8, -80);
    ctx.lineTo(8, -80);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Subtle shadow beneath feet
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scale based on height
  ctx.scale(facing * def.heightScale, def.heightScale);

  // If knocked down: draw comic knocked flat/tilted state with dizzy stars
  if (isKnocked) {
    renderKnockedDoodle(ctx, def, jerseyColor, secondaryColor, knockedTimer);
    ctx.restore();
    return;
  }

  // Animation cycle bobs
  const isRunning = state === 'running';
  const legAngle = isRunning ? Math.sin(animFrame * 0.3) * 0.6 : 0;
  const torsoBob = isRunning ? Math.abs(Math.sin(animFrame * 0.3)) * 4 : 0;

  // Dunk specific aerial transformation
  if (state === 'dunking') {
    renderDunkingDoodle(ctx, player, def, jerseyColor, secondaryColor, dunkProgress);
    ctx.restore();
    return;
  }

  // Jumping during jump shot
  const jumpOffset = state === 'shooting' ? -25 : -torsoBob;

  // LEGS & SOCKS & SNEAKERS
  renderLegs(ctx, def, secondaryColor, legAngle, jumpOffset);

  // TORSO / JERSEY
  ctx.save();
  ctx.translate(0, jumpOffset);

  // Shorts
  ctx.fillStyle = secondaryColor;
  ctx.strokeStyle = '#181e2b';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(-14, -6, 28, 18, [2, 2, 5, 5]);
  ctx.fill();
  ctx.stroke();

  // Jersey Top
  ctx.fillStyle = jerseyColor;
  ctx.beginPath();
  ctx.moveTo(-13, -6);
  ctx.lineTo(-11, -38);
  ctx.lineTo(13, -38);
  ctx.lineTo(13, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Jersey Trim / Collar & Number
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(def.number.toString(), 0, -18);

  // HEAD & FACE
  renderHead(ctx, def, state);

  // ARMS & HANDS
  renderArms(ctx, def, state, animFrame, player.hasBall);

  ctx.restore(); // torso save
  ctx.restore(); // root save

  // Name tag above head
  if (showNameTag) {
    ctx.save();
    ctx.translate(x, y - 72);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.font = 'bold 12px "Patrick Hand", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText(def.name, 0, 0);
    ctx.fillText(def.name, 0, 0);
    ctx.restore();
  }
}

/**
 * Head, headband, eyes, nose, blush cheek, beard matching reference image!
 */
function renderHead(ctx: CanvasRenderingContext2D, def: PlayerDef, state: string) {
  ctx.save();
  ctx.translate(0, -42);

  // Neck
  ctx.fillStyle = def.skinTone;
  ctx.strokeStyle = '#181e2b';
  ctx.lineWidth = 3;
  ctx.fillRect(-5, 0, 10, 6);
  ctx.strokeRect(-5, 0, 10, 6);

  // Hair back / afro if any
  if (def.hairStyle === 'afro' || def.hairStyle === 'dreads' || def.hairStyle === 'curls') {
    ctx.fillStyle = def.hairColor;
    ctx.beginPath();
    ctx.arc(-4, -14, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Head base oval
  ctx.fillStyle = def.skinTone;
  ctx.strokeStyle = '#181e2b';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(0, -14, 16, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Headband (like Lebronyan in the user reference image!)
  if (def.hasHeadband) {
    ctx.fillStyle = def.headbandColor || '#ffffff';
    ctx.strokeStyle = '#181e2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-15, -26, 31, 8, 4);
    ctx.fill();
    ctx.stroke();
  }

  // Hair style on top
  if (def.hairStyle === 'fade' || def.hairStyle === 'spiky') {
    ctx.fillStyle = def.hairColor;
    ctx.beginPath();
    ctx.arc(0, -26, 14, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Beard (like Lebronyan in the user reference image!)
  if (def.hasBeard) {
    ctx.fillStyle = def.beardColor || '#1c1c1c';
    ctx.strokeStyle = '#181e2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(3, -11);
    ctx.quadraticCurveTo(15, -4, 12, 1);
    ctx.quadraticCurveTo(0, 5, -12, 0);
    ctx.quadraticCurveTo(-15, -6, -8, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Cute pointed doodle nose
  ctx.strokeStyle = '#181e2b';
  ctx.lineWidth = 3;
  ctx.fillStyle = def.skinTone;
  ctx.beginPath();
  ctx.moveTo(9, -15);
  ctx.lineTo(16, -11);
  ctx.lineTo(9, -8);
  ctx.fill();
  ctx.stroke();

  // Cartoon eye
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#181e2b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(7, -16, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupil looking right
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(8.5, -16, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Pink blush cheek (from user image!)
  ctx.fillStyle = 'rgba(235, 100, 100, 0.55)';
  ctx.beginPath();
  ctx.ellipse(4, -8, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sweat drop if defending or shooting
  if (state === 'defending' || state === 'shooting') {
    ctx.fillStyle = '#64d2ff';
    ctx.beginPath();
    ctx.arc(-10, -22, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Legs, striped socks, sneakers
 */
function renderLegs(
  ctx: CanvasRenderingContext2D,
  def: PlayerDef,
  secondaryColor: string,
  legAngle: number,
  jumpOffset: number
) {
  ctx.save();
  ctx.translate(0, jumpOffset);
  ctx.strokeStyle = '#181e2b';
  ctx.lineWidth = 3.5;

  // Left Leg (Back)
  ctx.save();
  ctx.translate(-5, 10);
  ctx.rotate(-legAngle);
  renderSingleLeg(ctx, def);
  ctx.restore();

  // Right Leg (Front)
  ctx.save();
  ctx.translate(5, 10);
  ctx.rotate(legAngle);
  renderSingleLeg(ctx, def);
  ctx.restore();

  ctx.restore();
}

function renderSingleLeg(ctx: CanvasRenderingContext2D, def: PlayerDef) {
  // Thigh & Shin
  ctx.fillStyle = def.skinTone;
  ctx.fillRect(-3, 0, 6, 15);
  ctx.strokeRect(-3, 0, 6, 15);

  // Striped Crew Sock
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-3.5, 9, 7, 10);
  ctx.strokeRect(-3.5, 9, 7, 10);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(-3.5, 12, 7, 2.5);

  // Sneaker (rounded doodle shoe with thick sole)
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.roundRect(-4, 18, 16, 8, [2, 6, 3, 3]);
  ctx.fill();
  ctx.stroke();

  // White shoe sole
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-4, 23, 16, 3.5);
  ctx.strokeRect(-4, 23, 16, 3.5);
}

/**
 * Arms & Hands - changes based on state (dribble, shoot, shove, crossover)
 */
function renderArms(
  ctx: CanvasRenderingContext2D,
  def: PlayerDef,
  state: string,
  animFrame: number,
  hasBall: boolean
) {
  ctx.strokeStyle = '#181e2b';
  ctx.lineWidth = 3.5;
  ctx.fillStyle = def.skinTone;

  if (state === 'shooting') {
    // Both arms raised high releasing ball
    ctx.beginPath();
    ctx.moveTo(8, -34);
    ctx.lineTo(16, -58);
    ctx.lineTo(24, -62);
    ctx.stroke();
    // Hand
    ctx.beginPath();
    ctx.arc(24, -62, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (state === 'shoving') {
    // Two arms thrusting forward with comic force
    ctx.beginPath();
    ctx.moveTo(6, -30);
    ctx.lineTo(28, -25);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(28, -25, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return;
  }

  // Dribbling or idle arms
  const dribbleAngle = hasBall ? Math.sin(animFrame * 0.4) * 0.3 : 0;
  ctx.save();
  ctx.translate(6, -30);
  ctx.rotate(dribbleAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(12, 16);
  ctx.stroke();
  // Hand
  ctx.beginPath();
  ctx.arc(12, 16, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Flashy unique dunks with bespoke animations per player star!
 */
function renderDunkingDoodle(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  def: PlayerDef,
  jerseyColor: string,
  secondaryColor: string,
  progress: number
) {
  const dunkType: DunkType = def.dunkType;
  // Parabolic leap height
  const leapHeight = Math.sin(progress * Math.PI) * 75;
  ctx.translate(0, -leapHeight);

  // Flashy signature poses
  switch (dunkType) {
    case 'tomahawk': {
      // Lebronyan: Cock-back meteor tomahawk! Body tilted, one hand holding ball way back behind head
      ctx.rotate(0.25);
      renderLegs(ctx, def, secondaryColor, -0.6, 0);
      renderHead(ctx, def, 'dunking');

      // Cocked back arm holding flaming ball
      ctx.strokeStyle = '#181e2b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(-24, -58);
      ctx.stroke();

      // Ball in hand behind head
      renderBall(ctx, -24, -58, 0, 1.2);
      break;
    }

    case 'chef_360': {
      // Steph Chef: 360 degree spin in mid-air with star sparks
      const spinAngle = progress * Math.PI * 2;
      ctx.rotate(spinAngle);
      renderLegs(ctx, def, secondaryColor, 0.4, 0);
      renderHead(ctx, def, 'dunking');
      renderBall(ctx, 18, -48, 0, 1.1);
      break;
    }

    case 'rim_breaker': {
      // Shaq: Two-handed monster hang, legs pulled up to chest!
      renderLegs(ctx, def, secondaryColor, 1.1, 0);
      renderHead(ctx, def, 'dunking');

      // Two arms clutching ball high above
      ctx.strokeStyle = '#181e2b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-8, -32);
      ctx.lineTo(-2, -62);
      ctx.moveTo(8, -32);
      ctx.lineTo(4, -62);
      ctx.stroke();
      renderBall(ctx, 2, -64, 0, 1.3);
      break;
    }

    case 'space_glide': {
      // Air Jordan: Legs splayed wide in classic Jumpman silhouette, floating tongue out!
      renderLegs(ctx, def, secondaryColor, 1.4, 0);
      renderHead(ctx, def, 'dunking');

      ctx.strokeStyle = '#181e2b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(6, -32);
      ctx.lineTo(28, -55);
      ctx.stroke();
      renderBall(ctx, 28, -55, 0, 1.15);
      break;
    }

    case 'alien_stretch': {
      // Wemby: Comically elongated elastic noodle arm reaching 70px towards the basket!
      renderLegs(ctx, def, secondaryColor, 0.2, 0);
      renderHead(ctx, def, 'dunking');

      ctx.strokeStyle = '#181e2b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(6, -32);
      // Noodle wiggle curve
      ctx.quadraticCurveTo(25, -60, 55, -70);
      ctx.stroke();
      renderBall(ctx, 55, -70, 0, 1.15);
      break;
    }

    default: {
      // Standard dynamic windmill or two-handed jam
      ctx.rotate(0.15);
      renderLegs(ctx, def, secondaryColor, 0.8, 0);
      renderHead(ctx, def, 'dunking');
      renderBall(ctx, 16, -55, 0, 1.1);
      break;
    }
  }
}

/**
 * Knocked down doodle player (from brawl / hard tackle)
 */
function renderKnockedDoodle(
  ctx: CanvasRenderingContext2D,
  def: PlayerDef,
  jerseyColor: string,
  secondaryColor: string,
  knockedTimer: number
) {
  // Flat on ground rotated 80 degrees
  ctx.rotate(Math.PI * 0.45);
  ctx.translate(10, 0);

  // Flattened body
  ctx.fillStyle = jerseyColor;
  ctx.strokeStyle = '#181e2b';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(-10, -30, 20, 26, 4);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = def.skinTone;
  ctx.beginPath();
  ctx.arc(0, -42, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Spiral dizzy eyes!
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-4, -44, 4, 0, Math.PI * 1.5);
  ctx.arc(4, -44, 4, 0, Math.PI * 1.5);
  ctx.stroke();

  // Spinning cartoon stars orbiting the head
  const spin = (Date.now() / 150);
  for (let i = 0; i < 3; i++) {
    const angle = spin + (i * Math.PI * 2) / 3;
    const sx = Math.cos(angle) * 22;
    const sy = -42 + Math.sin(angle) * 8;
    ctx.fillStyle = '#ffdf00';
    ctx.strokeStyle = '#181e2b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * Doodle Basketball Ball with bold outlines and curved seams
 */
export function renderBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  z: number = 0,
  scale: number = 1.0,
  hasFireTrail: boolean = false
) {
  ctx.save();
  ctx.translate(x, y - z);
  ctx.scale(scale, scale);

  // Ball shadow on ground
  if (z > 4) {
    ctx.save();
    ctx.translate(0, z);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    const shadowScale = Math.max(0.4, 1.0 - z / 220);
    ctx.beginPath();
    ctx.ellipse(0, 14, 14 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Fire trail if heated or dunking
  if (hasFireTrail) {
    ctx.fillStyle = 'rgba(255, 90, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(-16, 0, 12, 0, Math.PI * 2);
    ctx.arc(-28, 4, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ball circle
  ctx.fillStyle = '#ff7315';
  ctx.strokeStyle = '#181e2b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Seams
  ctx.strokeStyle = '#181e2b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-4, 0, 8, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(4, 0, 8, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders particles: comic action words ("POW!", "SWISH!", "ANKLE BROKEN!"), stars, sweat drops, sparks
 */
export function renderParticles(ctx: CanvasRenderingContext2D, particles: ParticleEffect[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);

    if (p.type === 'comic_text' && p.text) {
      ctx.translate(p.x, p.y);
      ctx.scale(p.scale || 1.0, p.scale || 1.0);

      const isShortWord = p.text.length <= 6;
      if (isShortWord) {
        // Starburst bubble for short impact words (POW!, BAM!, SWISH!)
        ctx.fillStyle = p.color || '#ffe600';
        ctx.strokeStyle = '#181e2b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        const points = 10;
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? 34 : 20;
          const angle = (i * Math.PI) / points;
          const bx = Math.cos(angle) * radius;
          const by = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(bx, by);
          else ctx.lineTo(bx, by);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#181e2b';
        ctx.font = '800 15px "Permanent Marker", Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.text, 0, 1);
      } else {
        // Pill comic badge for signature moves
        ctx.font = '800 13px "Permanent Marker", Fredoka, sans-serif';
        const textMetrics = ctx.measureText(p.text);
        const padX = 14;
        const boxWidth = textMetrics.width + padX * 2;
        const boxHeight = 28;

        ctx.fillStyle = p.color || '#ffcc00';
        ctx.strokeStyle = '#181e2b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#181e2b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.text, 0, 1);
      }
    } else if (p.type === 'star') {
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#181e2b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Standard spark / fire puff
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
