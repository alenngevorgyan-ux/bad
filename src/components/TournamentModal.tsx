/**
 * Tournament Mode / Playoff Bracket
 */

import React, { useState } from 'react';
import { TEAMS } from '../game/teams';
import { TeamDef } from '../game/types';
import { Trophy, ArrowLeft, Play, Award } from 'lucide-react';

interface TournamentModalProps {
  onStartMatch: (homeTeam: TeamDef, awayTeam: TeamDef) => void;
  onClose: () => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({ onStartMatch, onClose }) => {
  const [userTeamIndex, setUserTeamIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<'Quarter-Finals' | 'Semi-Finals' | 'Championship'>('Quarter-Finals');

  const userTeam = TEAMS[userTeamIndex];
  // Opponent for round
  const opponentTeam = TEAMS[(userTeamIndex + 1) % TEAMS.length];

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-[#17203b] border-4 border-[#10162a] rounded-2xl w-full max-w-2xl p-6 doodle-border shadow-2xl flex flex-col gap-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-700">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1f2d52] hover:bg-[#2c3f73] rounded-lg text-sm font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> BACK
          </button>

          <h3 className="text-2xl font-marker text-amber-400 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" /> DOODLE PLAYOFF TOURNAMENT
          </h3>

          <div className="w-16" />
        </div>

        {/* Bracket Rounds visual */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-amber-500/20 border-2 border-amber-400 rounded-xl">
            <span className="text-xs uppercase font-extrabold text-amber-400">Round 1</span>
            <h4 className="text-sm font-black mt-1">Quarter-Finals</h4>
            <span className="text-[11px] text-emerald-400 font-bold">NEXT UP</span>
          </div>

          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl opacity-60">
            <span className="text-xs uppercase font-bold text-gray-400">Round 2</span>
            <h4 className="text-sm font-black mt-1">Semi-Finals</h4>
            <span className="text-[11px] text-gray-500">LOCKED</span>
          </div>

          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl opacity-60">
            <span className="text-xs uppercase font-bold text-gray-400">Round 3</span>
            <h4 className="text-sm font-black mt-1">The Finals</h4>
            <span className="text-[11px] text-amber-500 flex items-center justify-center gap-1">
              <Award className="w-3 h-3" /> TROPHY
            </span>
          </div>
        </div>

        {/* Selected Matchup */}
        <div className="bg-[#121931] p-5 rounded-2xl border-2 border-[#2b3a67] flex items-center justify-around text-center">
          {/* User Team */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-14 h-14 rounded-2xl border-3 border-black flex items-center justify-center font-black text-xl shadow"
              style={{ backgroundColor: userTeam.primaryColor, color: userTeam.textColor }}
            >
              {userTeam.shortName}
            </div>
            <span className="text-base font-extrabold">{userTeam.name}</span>
            <span className="text-xs text-amber-300 font-bold">Your Squad</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-3xl font-marker text-rose-500">VS</span>
            <span className="text-xs text-gray-400 font-mono mt-1">No Fouls</span>
          </div>

          {/* Opponent Team */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-14 h-14 rounded-2xl border-3 border-black flex items-center justify-center font-black text-xl shadow"
              style={{ backgroundColor: opponentTeam.primaryColor, color: opponentTeam.textColor }}
            >
              {opponentTeam.shortName}
            </div>
            <span className="text-base font-extrabold">{opponentTeam.name}</span>
            <span className="text-xs text-gray-400">Rival</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onStartMatch(userTeam, opponentTeam)}
          className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-black font-marker text-xl rounded-xl doodle-border doodle-btn shadow-xl active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-black" />
          PLAY TOURNAMENT MATCH
        </button>
      </div>
    </div>
  );
};
