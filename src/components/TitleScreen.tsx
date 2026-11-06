/**
 * Title Screen with custom doodle basketball emblem, mode selector, and start handshake.
 */

import React, { useEffect } from 'react';
import { Play, Users, Trophy, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../game/audio';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenTeamSelect: () => void;
  onOpenDunkShowcase: () => void;
  onOpenTournament: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenTeamSelect,
  onOpenDunkShowcase,
  onOpenTournament
}) => {
  // Support Space or Enter to start directly
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStartGame]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#101524] via-[#161f36] to-[#0e1322] select-none overflow-hidden">
      {/* Decorative doodle court lines in backdrop */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border-8 border-white" />
        <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-white -translate-x-1/2" />
      </div>

      {/* Top Header bar */}
      <div className="w-full flex items-center justify-between z-10 max-w-5xl">
        <div className="flex items-center gap-2 bg-[#1c2642] px-3 py-1.5 rounded-xl doodle-border">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
            Arcade 5v5 · No Fouls · Full Brawl
          </span>
        </div>

        <button
          onClick={() => sounds.toggleMute()}
          className="p-2 bg-[#1c2642] hover:bg-[#28375e] doodle-border rounded-xl text-white cursor-pointer"
          aria-label="Toggle Sound"
        >
          {sounds.isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Main Title Centerpiece */}
      <div className="flex flex-col items-center text-center z-10 max-w-2xl my-auto">
        {/* Bespoke SVG Title Lockup */}
        <div className="relative mb-3 flex items-center justify-center">
          {/* Doodle Basketball with Crown */}
          <svg className="w-28 h-28 drop-shadow-xl" viewBox="0 0 100 100" fill="none">
            {/* Orange Ball */}
            <circle cx="50" cy="54" r="38" fill="#FF7315" stroke="#141B2D" strokeWidth="5" />
            {/* Seams */}
            <path d="M 50 16 L 50 92" stroke="#141B2D" strokeWidth="4" />
            <path d="M 12 54 L 88 54" stroke="#141B2D" strokeWidth="4" />
            <path d="M 23 27 C 38 42, 38 66, 23 81" stroke="#141B2D" strokeWidth="3.5" fill="none" />
            <path d="M 77 27 C 62 42, 62 66, 77 81" stroke="#141B2D" strokeWidth="3.5" fill="none" />
            {/* Comic Gold Crown on top */}
            <polygon points="26,20 34,32 50,18 66,32 74,20 68,36 32,36" fill="#FBBF24" stroke="#141B2D" strokeWidth="3" />
            <circle cx="26" cy="18" r="3" fill="#EF4444" stroke="#141B2D" strokeWidth="1.5" />
            <circle cx="50" cy="16" r="3" fill="#3B82F6" stroke="#141B2D" strokeWidth="1.5" />
            <circle cx="74" cy="18" r="3" fill="#EF4444" stroke="#141B2D" strokeWidth="1.5" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white font-marker uppercase drop-shadow-md">
          DOODLE <span className="text-amber-400">BASKETBALL</span>
        </h1>
        <p className="text-lg md:text-xl text-amber-200/90 font-doodle font-bold mt-2">
          5 on 5 Street Brawl · Ankle Breakers · Flashy Signature Dunks
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full justify-center">
          <button
            data-start="true"
            onClick={onStartGame}
            className="w-full sm:w-auto px-8 py-4 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xl rounded-2xl doodle-border doodle-btn flex items-center justify-center gap-3 cursor-pointer shadow-xl transition transform active:scale-95"
          >
            <Play className="w-6 h-6 fill-black" />
            PLAY 5v5 NOW
          </button>

          <button
            onClick={onOpenTeamSelect}
            className="w-full sm:w-auto px-6 py-4 bg-[#233155] hover:bg-[#2d3e6c] text-white font-bold text-lg rounded-2xl doodle-border doodle-btn flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            <Users className="w-5 h-5 text-amber-400" />
            PICK TEAMS & ROSTER
          </button>
        </div>

        {/* Secondary Modes */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={onOpenDunkShowcase}
            className="px-4 py-2 bg-[#1a233b] hover:bg-[#243152] text-amber-300 rounded-xl border-2 border-[#334267] text-sm font-bold flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            DUNK CONTEST SHOWCASE
          </button>

          <button
            onClick={onOpenTournament}
            className="px-4 py-2 bg-[#1a233b] hover:bg-[#243152] text-emerald-300 rounded-xl border-2 border-[#334267] text-sm font-bold flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Trophy className="w-4 h-4 text-emerald-400" />
            TOURNAMENT BRACKET
          </button>
        </div>
      </div>

      {/* Bottom Control Hint bar */}
      <div className="w-full text-center text-xs text-gray-400 font-mono tracking-wide z-10 border-t border-gray-800 pt-3">
        <span>WASD Move</span> · <span>Space / J Shoot & Dunk</span> · <span>K Pass / Switch</span> · <span>L Crossover</span> · <span>I / Shift Brawl Shove</span> · <span>P Pause</span>
      </div>
    </div>
  );
};
