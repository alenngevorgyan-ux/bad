/**
 * Game Over & Victory Modal Card with Box Score and MVP Award
 */

import React from 'react';
import { TeamDef, PlayerState } from '../game/types';
import { Trophy, RotateCcw, Home, Award, Flame, Zap, Shield } from 'lucide-react';

interface GameOverModalProps {
  homeTeam: TeamDef;
  awayTeam: TeamDef;
  homeScore: number;
  awayScore: number;
  players: PlayerState[];
  onRematch: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  players,
  onRematch,
  onReturnToMenu
}) => {
  const isVictory = homeScore >= awayScore;

  // Determine Game MVP
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = a.points * 2 + a.dunks * 3 + a.steals * 2 + a.knockouts * 1.5;
    const scoreB = b.points * 2 + b.dunks * 3 + b.steals * 2 + b.knockouts * 1.5;
    return scoreB - scoreA;
  });
  const mvp = sortedPlayers[0] || players[0];

  // Aggregate user team stats
  const homePlayers = players.filter(p => p.isHome);
  const totalDunks = homePlayers.reduce((sum, p) => sum + p.dunks, 0);
  const totalSteals = homePlayers.reduce((sum, p) => sum + p.steals, 0);
  const totalCrossovers = homePlayers.reduce((sum, p) => sum + p.crossovers, 0);
  const totalKnockouts = homePlayers.reduce((sum, p) => sum + p.knockouts, 0);

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 select-none overflow-y-auto">
      <div className="bg-[#17203b] border-4 border-[#10162a] rounded-3xl w-full max-w-lg p-6 md:p-8 doodle-border shadow-2xl flex flex-col gap-6 text-white text-center my-auto">
        {/* Victory / Defeat Header */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 border-3 border-black flex items-center justify-center mb-3 shadow-lg">
            <Trophy className="w-9 h-9 text-black fill-black" />
          </div>

          <h3 className={`text-4xl md:text-5xl font-marker uppercase drop-shadow ${
            isVictory ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {isVictory ? 'VICTORY!' : 'DEFEAT!'}
          </h3>
          <p className="text-gray-300 text-sm font-doodle mt-1">
            {isVictory ? 'Dominating doodle 5v5 masterclass!' : 'Tough brawl on the hardwood. Rematch!'}
          </p>
        </div>

        {/* Final Scoreboard Tile */}
        <div className="flex items-center justify-around bg-[#10162a] p-4 rounded-2xl border-2 border-[#2b3a67]">
          {/* Home */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-gray-400 uppercase">{homeTeam.shortName}</span>
            <span className="text-4xl font-black font-mono text-amber-400 tabular-nums">{homeScore}</span>
            <span className="text-[11px] text-gray-400">{homeTeam.name}</span>
          </div>

          <span className="text-2xl font-marker text-gray-500">FINAL</span>

          {/* Away */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-gray-400 uppercase">{awayTeam.shortName}</span>
            <span className="text-4xl font-black font-mono text-gray-200 tabular-nums">{awayScore}</span>
            <span className="text-[11px] text-gray-400">{awayTeam.name}</span>
          </div>
        </div>

        {/* Game MVP Award */}
        {mvp && (
          <div className="flex items-center gap-4 bg-[#1f2d52] p-4 rounded-xl border-2 border-amber-400/70 text-left shadow-md">
            <div className="w-12 h-12 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-300">
                MATCH MVP
              </span>
              <span className="text-lg font-black text-white">{mvp.def.name} (#{mvp.def.number})</span>
              <span className="text-xs text-gray-300 font-doodle">
                {mvp.points} PTS · {mvp.dunks} Dunks · {mvp.steals} Steals
              </span>
            </div>
          </div>
        )}

        {/* Box Score Stat Tiles */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[#121931] p-2.5 rounded-xl border border-gray-700">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <span className="block text-xl font-black text-white font-mono tabular-nums">{totalDunks}</span>
            <span className="text-[10px] uppercase font-bold text-gray-400">Dunks</span>
          </div>

          <div className="bg-[#121931] p-2.5 rounded-xl border border-gray-700">
            <Zap className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="block text-xl font-black text-white font-mono tabular-nums">{totalCrossovers}</span>
            <span className="text-[10px] uppercase font-bold text-gray-400">Ankles</span>
          </div>

          <div className="bg-[#121931] p-2.5 rounded-xl border border-gray-700">
            <Shield className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="block text-xl font-black text-white font-mono tabular-nums">{totalSteals}</span>
            <span className="text-[10px] uppercase font-bold text-gray-400">Steals</span>
          </div>

          <div className="bg-[#121931] p-2.5 rounded-xl border border-gray-700">
            <Award className="w-4 h-4 text-rose-400 mx-auto mb-1" />
            <span className="block text-xl font-black text-white font-mono tabular-nums">{totalKnockouts}</span>
            <span className="text-[10px] uppercase font-bold text-gray-400">Brawls</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            data-start="true"
            onClick={onRematch}
            className="w-full sm:flex-1 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-lg rounded-xl doodle-border doodle-btn flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            <RotateCcw className="w-5 h-5" /> PLAY AGAIN
          </button>

          <button
            onClick={onReturnToMenu}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#24335c] hover:bg-[#30447a] text-white font-bold text-base rounded-xl doodle-border flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-5 h-5" /> MENU
          </button>
        </div>
      </div>
    </div>
  );
};
