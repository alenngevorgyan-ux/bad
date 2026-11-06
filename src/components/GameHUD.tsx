/**
 * In-game HUD overlay: Scoreboard, Period, Shot Clock, Active Player Card,
 * Shot Timing Meter, and Action Notifications.
 */

import React, { useEffect, useState } from 'react';
import { GameEngine } from '../game/engine';
import { sounds } from '../game/audio';
import { Volume2, VolumeX, Pause, Play, Flame } from 'lucide-react';

interface GameHUDProps {
  engine: GameEngine;
  onPause: () => void;
  eventNotification: { text: string; type?: 'green' | 'red' | 'gold' } | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({ engine, onPause, eventNotification }) => {
  const [, setTick] = useState(0);
  const [isMuted, setIsMuted] = useState(sounds.isMuted);

  // Poll lightweight HUD stats at 15Hz to keep React reconciliation decouple from 60fps canvas
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => (t + 1) % 1000);
    }, 66);
    return () => clearInterval(timer);
  }, []);

  const userPlayer = engine.getUserPlayer();
  const formatTime = (secs: number) => {
    const m = Math.floor(Math.max(0, secs) / 60);
    const s = Math.floor(Math.max(0, secs) % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleSound = () => {
    setIsMuted(sounds.toggleMute());
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 z-20">
      {/* TOP BAR: Scoreboard & Controls */}
      <div className="flex items-start justify-between w-full max-w-5xl mx-auto">
        {/* Away Team Badge */}
        <div className="flex items-center gap-2 bg-[#171f34]/95 px-3 py-1.5 rounded-lg border-2 border-[#2b3756] shadow-md">
          <div
            className="w-4 h-4 rounded-full border border-black"
            style={{ backgroundColor: engine.awayTeam.primaryColor }}
          />
          <span className="font-bold text-sm text-gray-200">{engine.awayTeam.shortName}</span>
          <span className="font-extrabold text-2xl tabular-nums text-white ml-2">{engine.awayScore}</span>
        </div>

        {/* Center Game Clock & Period */}
        <div className="flex flex-col items-center bg-[#171f34]/95 px-6 py-2 rounded-xl border-3 border-[#2b3756] shadow-xl">
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Q{engine.currentPeriod}</span>
            <span className="text-gray-500">|</span>
            <span className="text-white text-base tabular-nums font-mono">
              {formatTime(engine.gameClock)}
            </span>
            <span className="text-gray-500">|</span>
            <span
              className={`tabular-nums font-mono font-bold ${
                engine.shotClock <= 5 ? 'text-red-500 animate-pulse' : 'text-amber-400'
              }`}
            >
              SHOT {Math.ceil(engine.shotClock)}s
            </span>
          </div>
        </div>

        {/* Home Team Badge */}
        <div className="flex items-center gap-2 bg-[#171f34]/95 px-3 py-1.5 rounded-lg border-2 border-[#2b3756] shadow-md">
          <span className="font-extrabold text-2xl tabular-nums text-white mr-2">{engine.homeScore}</span>
          <span className="font-bold text-sm text-gray-200">{engine.homeTeam.shortName}</span>
          <div
            className="w-4 h-4 rounded-full border border-black"
            style={{ backgroundColor: engine.homeTeam.primaryColor }}
          />
        </div>

        {/* Right Utility Buttons */}
        <div className="pointer-events-auto flex items-center gap-2 ml-4">
          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="p-2 bg-[#1f2942] hover:bg-[#2b3859] border-2 border-[#37466d] rounded-lg text-white shadow active:translate-y-0.5 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
          <button
            onClick={onPause}
            aria-label="Pause"
            className="p-2 bg-[#1f2942] hover:bg-[#2b3859] border-2 border-[#37466d] rounded-lg text-white shadow active:translate-y-0.5 cursor-pointer"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* EVENT NOTIFICATION BANNER */}
      {eventNotification && (
        <div className="flex justify-center w-full animate-bounce">
          <div
            className={`px-5 py-2 rounded-xl font-extrabold text-lg tracking-wide uppercase shadow-2xl border-3 border-black ${
              eventNotification.type === 'green'
                ? 'bg-emerald-500 text-black'
                : eventNotification.type === 'red'
                ? 'bg-rose-500 text-white'
                : 'bg-amber-400 text-black'
            }`}
          >
            {eventNotification.text}
          </div>
        </div>
      )}

      {/* SHOT METER OVERLAY (Appears during shoot charge) */}
      {engine.isChargingShot && (
        <div className="flex flex-col items-center justify-center w-full mb-8">
          <div className="relative w-64 h-8 bg-[#101420] border-3 border-black rounded-full overflow-hidden shadow-2xl">
            {/* Green Sweet Spot Zone (0.85 to 0.95) */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/80 border-x-2 border-emerald-300"
              style={{ left: '85%', width: '10%' }}
            />
            {/* Slightly early yellow zone */}
            <div
              className="absolute top-0 bottom-0 bg-amber-400/50"
              style={{ left: '70%', width: '15%' }}
            />
            {/* Current Fill needle */}
            <div
              className="h-full bg-linear-to-r from-blue-500 via-amber-400 to-emerald-400 transition-none"
              style={{ width: `${engine.shotMeterValue * 100}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-2.5 bg-white border border-black shadow"
              style={{ left: `calc(${engine.shotMeterValue * 100}% - 5px)` }}
            />
          </div>
          <span className="text-xs font-extrabold tracking-widest text-amber-300 mt-1 uppercase drop-shadow">
            RELEASE IN GREEN ZONE!
          </span>
        </div>
      )}

      {/* BOTTOM BAR: Active Controlled Player HUD */}
      <div className="flex items-end justify-between w-full max-w-5xl mx-auto">
        {userPlayer && (
          <div className="flex items-center gap-3 bg-[#171f34]/95 p-3 rounded-xl border-3 border-[#2b3756] shadow-xl">
            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-[#0e1424] border-2 border-gray-600">
              <span className="text-xs font-bold text-gray-400">{userPlayer.def.position}</span>
              <span className="text-lg font-extrabold text-amber-400 font-mono">
                #{userPlayer.def.number}
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white">{userPlayer.def.name}</span>
                {userPlayer.heat >= 100 && (
                  <span className="flex items-center gap-0.5 text-xs font-black bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse border border-black">
                    <Flame className="w-3.5 h-3.5 fill-current" /> ON FIRE!
                  </span>
                )}
              </div>

              {/* Stat & Signature Dunk clue */}
              <div className="flex items-center gap-3 text-xs text-gray-300 mt-0.5 font-doodle">
                <span>Dunk: <strong className="text-amber-400">{userPlayer.def.dunkName}</strong></span>
                <span>•</span>
                <span>Speed: <strong className="text-cyan-400">{userPlayer.def.stats.speed}/5</strong></span>
                <span>•</span>
                <span>Shot: <strong className="text-amber-400">{userPlayer.def.stats.shot}/5</strong></span>
                <span>•</span>
                <span>Str: <strong className="text-rose-400">{userPlayer.def.stats.strength}/5</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Controls Quick Hint */}
        <div className="hidden md:flex items-center gap-3 bg-[#111726]/90 px-4 py-2 rounded-lg border-2 border-gray-700 text-xs text-gray-300">
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 text-white font-mono">WASD</kbd> Move</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 text-white font-mono">Space/J</kbd> Shoot/Dunk</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 text-white font-mono">K</kbd> Pass/Switch</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 text-white font-mono">L</kbd> Crossover</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 text-white font-mono">I/Shift</kbd> Brawl Tackle</span>
        </div>
      </div>
    </div>
  );
};
