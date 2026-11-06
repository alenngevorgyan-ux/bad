/**
 * Canvas Court Viewport Component
 * Renders the full 5v5 court, runs the 60fps game loop, and handles keyboard inputs.
 */

import React, { useEffect, useRef } from 'react';
import { GameEngine } from './engine';
import { renderCourt, renderPlayer, renderBall, renderParticles } from './doodleRenderer';
import { COURT_WIDTH, COURT_HEIGHT } from './rules';

interface CourtCanvasProps {
  engine: GameEngine;
  onPause: () => void;
  virtualInputRef: React.MutableRefObject<{ x: number; y: number }>;
}

export const CourtCanvas: React.FC<CourtCanvasProps> = ({ engine, onPause, virtualInputRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    // Input handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling with Space / Arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      keysPressed.current.add(e.code);

      if (e.code === 'KeyP' || e.code === 'Escape') {
        onPause();
        return;
      }

      // Shoot / Dunk Charge (Space or KeyJ)
      if ((e.code === 'Space' || e.code === 'KeyJ') && !e.repeat) {
        engine.startShotCharge();
      }

      // Pass / Switch player (KeyK or Enter)
      if ((e.code === 'KeyK' || e.code === 'Enter') && !e.repeat) {
        // Calculate pass vector from currently held movement keys
        let px = 0;
        let py = 0;
        if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) px -= 1;
        if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) px += 1;
        if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) py -= 1;
        if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) py += 1;

        engine.passBall(px !== 0 || py !== 0 ? { x: px, y: py } : undefined);
      }

      // Crossover / Ankle Breaker (KeyL or KeyC)
      if ((e.code === 'KeyL' || e.code === 'KeyC') && !e.repeat) {
        engine.performCrossover();
      }

      // Shove / Brawl / Steal (KeyI or ShiftLeft or ShiftRight or KeyX)
      if ((e.code === 'KeyI' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyX') && !e.repeat) {
        engine.performShove();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);

      // Release Shoot (Space or KeyJ)
      if (e.code === 'Space' || e.code === 'KeyJ') {
        engine.releaseShot();
      }
    };

    const handleBlur = () => {
      keysPressed.current.clear();
      if (engine.isChargingShot) {
        engine.releaseShot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Responsive Canvas Resizing with fixed aspect ratio scale
    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scale = Math.min(rect.width / COURT_WIDTH, rect.height / COURT_HEIGHT);

      canvas.width = COURT_WIDTH;
      canvas.height = COURT_HEIGHT;
      canvas.style.width = `${COURT_WIDTH * scale}px`;
      canvas.style.height = `${COURT_HEIGHT * scale}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Main 60 FPS Render Loop
    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Combine physical keyboard input and touch virtual joystick input
      let moveX = virtualInputRef.current.x;
      let moveY = virtualInputRef.current.y;

      if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) moveX -= 1;
      if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) moveX += 1;
      if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) moveY -= 1;
      if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) moveY += 1;

      // Normalize diagonal vector
      const len = Math.hypot(moveX, moveY);
      if (len > 1) {
        moveX /= len;
        moveY /= len;
      }

      // Update simulation
      engine.update(dt, { x: moveX, y: moveY });

      // Clear & Render Court
      ctx.clearRect(0, 0, COURT_WIDTH, COURT_HEIGHT);
      renderCourt(ctx, COURT_WIDTH, COURT_HEIGHT, engine.rimShake);

      // Sort players by Y coordinate for natural depth layering
      const sortedPlayers = [...engine.players].sort((a, b) => a.y - b.y);

      // Render players
      for (const p of sortedPlayers) {
        const isUser = p.def.id === engine.userPlayerId;
        const jersey = p.isHome ? engine.homeTeam.jerseyColor : engine.awayTeam.jerseyColor;
        const secondary = p.isHome ? engine.homeTeam.secondaryColor : engine.awayTeam.secondaryColor;

        renderPlayer(ctx, p, isUser, jersey, secondary, p.dunkProgress);
      }

      // Render loose ball or passing ball
      if (!engine.ball.carrierId) {
        const isHeated = engine.ball.isShot && engine.ball.shotQuality >= 0.85;
        renderBall(ctx, engine.ball.x, engine.ball.y, engine.ball.z, 1.0, isHeated);
      }

      // Render particles & comic popups
      renderParticles(ctx, engine.particles);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
    };
  }, [engine, onPause, virtualInputRef]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-[#0d121f] overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        className="doodle-border rounded-xl shadow-2xl cursor-crosshair"
      />
    </div>
  );
};
