/**
 * Dunk Contest & Signature Dunk Showcase
 * Allows testing and experiencing all unique flashy signature dunks.
 */

import React, { useState, useEffect, useRef } from 'react';
import { TEAMS } from '../game/teams';
import { PlayerDef } from '../game/types';
import { renderPlayer, renderCourt, renderBall } from '../game/doodleRenderer';
import { sounds } from '../game/audio';
import { COURT_WIDTH, COURT_HEIGHT, RIGHT_RIM_X, RIM_Y } from '../game/rules';
import { ArrowLeft, Play, Sparkles, Flame, Volume2, VolumeX } from 'lucide-react';

interface DunkShowcaseScreenProps {
  onBack: () => void;
}

export const DunkShowcaseScreen: React.FC<DunkShowcaseScreenProps> = ({ onBack }) => {
  const allPlayers = TEAMS.flatMap(t => t.players);
  const [selectedPlayerId, setSelectedPlayerId] = useState(allPlayers[0].id);
  const [isDunking, setIsDunking] = useState(false);
  const [dunkProgress, setDunkProgress] = useState(0);
  const [scoreGrade, setScoreGrade] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedPlayer = allPlayers.find(p => p.id === selectedPlayerId) || allPlayers[0];
  const playerTeam = TEAMS.find(t => t.players.some(p => p.id === selectedPlayer.id)) || TEAMS[0];

  const triggerDunk = () => {
    if (isDunking) return;
    setIsDunking(true);
    setDunkProgress(0);
    setScoreGrade(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let progress = 0;
    let rimShake = 0;

    const loop = () => {
      ctx.clearRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

      if (isDunking) {
        progress += 0.018; // smooth cinematic dunk
        setDunkProgress(progress);

        if (progress >= 1.0) {
          progress = 1.0;
          setIsDunking(false);
          rimShake = 1.2;
          sounds.playDunk();
          // Grade the dunk
          const grades = ['50 PERFECT SCORE!!', '49 INSANE AIR!!', '50 OFF THE ROOF!!'];
          setScoreGrade(grades[Math.floor(Math.random() * grades.length)]);
        }
      }

      if (rimShake > 0) {
        rimShake = Math.max(0, rimShake - 0.03);
      }

      // Render Court
      renderCourt(ctx, COURT_WIDTH, COURT_HEIGHT, rimShake);

      // Player Position during dunk
      const startX = RIGHT_RIM_X - 180;
      const targetX = RIGHT_RIM_X - 15;
      const currentX = startX + (targetX - startX) * progress;

      const mockPlayerState = {
        def: selectedPlayer,
        teamId: playerTeam.id,
        isHome: true,
        x: currentX,
        y: RIM_Y,
        vx: 4,
        vy: 0,
        facing: 1 as const,
        hasBall: true,
        stamina: 100,
        heat: 100,
        state: isDunking ? ('dunking' as const) : ('idle' as const),
        stateTimer: 0,
        animFrame: Math.floor(progress * 60),
        crossoverTimer: 0,
        knockedTimer: 0,
        knockedVx: 0,
        knockedVy: 0,
        dunkProgress: progress,
        dunkStartX: startX,
        dunkStartY: RIM_Y,
        dunkTargetX: targetX,
        dunkTargetY: RIM_Y,
        points: 0,
        dunks: 0,
        steals: 0,
        knockouts: 0,
        crossovers: 0
      };

      // Draw Player
      renderPlayer(
        ctx,
        mockPlayerState,
        true,
        playerTeam.jerseyColor,
        playerTeam.secondaryColor,
        progress
      );

      // If finished dunk, ball goes through net
      if (!isDunking && scoreGrade) {
        renderBall(ctx, RIGHT_RIM_X, RIM_Y + 20, 20, 1.0);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isDunking, selectedPlayer, playerTeam, scoreGrade]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 bg-[#12182b] text-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto pb-2 border-b border-gray-700">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-[#1c2642] hover:bg-[#28375e] doodle-border rounded-xl text-sm font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> BACK TO MENU
        </button>

        <h2 className="text-2xl font-marker text-amber-400 flex items-center gap-2">
          <Sparkles className="w-6 h-6" /> SIGNATURE DUNK SHOWCASE
        </h2>

        <button
          onClick={() => sounds.toggleMute()}
          className="p-2 bg-[#1c2642] doodle-border rounded-xl cursor-pointer"
          aria-label="Toggle Mute"
        >
          {sounds.isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Main Dunk Stage Canvas */}
      <div className="relative flex-1 flex items-center justify-center my-2">
        <canvas
          ref={canvasRef}
          width={COURT_WIDTH}
          height={COURT_HEIGHT}
          className="doodle-border rounded-xl shadow-2xl max-w-full max-h-[58vh]"
        />

        {/* Big Scorecard Banner Popup */}
        {scoreGrade && (
          <div className="absolute top-8 px-6 py-3 bg-amber-400 text-black font-marker text-3xl rounded-2xl border-4 border-black shadow-2xl animate-bounce">
            {scoreGrade}
          </div>
        )}
      </div>

      {/* Bottom Player Selector & Slam Trigger */}
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 bg-[#171f34] p-4 rounded-2xl doodle-border">
        {/* Player Dropdown & Info */}
        <div className="flex items-center gap-4">
          <select
            aria-label="Select Player Dunk"
            value={selectedPlayerId}
            onChange={e => {
              setSelectedPlayerId(e.target.value);
              setScoreGrade(null);
            }}
            className="bg-[#101626] border-2 border-[#2b3a64] rounded-xl px-4 py-2 text-base font-bold text-white cursor-pointer"
          >
            {allPlayers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.position} · {p.dunkName})
              </option>
            ))}
          </select>

          <div className="hidden sm:flex flex-col">
            <span className="text-xs text-amber-400 font-bold uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> {selectedPlayer.dunkName}
            </span>
            <span className="text-xs text-gray-300">{selectedPlayer.dunkDescription}</span>
          </div>
        </div>

        {/* Slam Button */}
        <button
          onClick={triggerDunk}
          disabled={isDunking}
          className="w-full md:w-auto px-8 py-3 bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-lg rounded-xl doodle-border doodle-btn shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-white" />
          SLAM DUNK!
        </button>
      </div>
    </div>
  );
};
