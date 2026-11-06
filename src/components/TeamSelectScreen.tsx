/**
 * Team & Roster Selection Screen
 * Faithful to the user's attached doodle mockup:
 * Side profile doodle character viewer, left/right nav arrows,
 * hand-drawn typography, 5-pip stat indicators (Speed, Shot, Strength),
 * signature dunk showcase, and full 5-player team rosters!
 */

import React, { useState, useRef, useEffect } from 'react';
import { TeamDef, PlayerDef } from '../game/types';
import { TEAMS } from '../game/teams';
import { renderPlayer } from '../game/doodleRenderer';
import { ChevronLeft, ChevronRight, Zap, Target, BicepsFlexed, Play, ArrowLeft, Flame } from 'lucide-react';

interface TeamSelectScreenProps {
  onSelectTeams: (homeTeam: TeamDef, awayTeam: TeamDef, quarterLength: number) => void;
  onBack: () => void;
  defaultHomeTeamId?: string;
  defaultAwayTeamId?: string;
}

export const TeamSelectScreen: React.FC<TeamSelectScreenProps> = ({
  onSelectTeams,
  onBack,
  defaultHomeTeamId = 'lakers',
  defaultAwayTeamId = 'warriors'
}) => {
  const [homeTeamIndex, setHomeTeamIndex] = useState(
    Math.max(0, TEAMS.findIndex(t => t.id === defaultHomeTeamId))
  );
  const [awayTeamIndex, setAwayTeamIndex] = useState(
    Math.max(0, TEAMS.findIndex(t => t.id === defaultAwayTeamId))
  );
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [quarterLength, setQuarterLength] = useState(90); // 1.5 min default
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const homeTeam = TEAMS[homeTeamIndex];
  const awayTeam = TEAMS[awayTeamIndex];
  const currentPlayer = homeTeam.players[selectedPlayerIndex] || homeTeam.players[0];

  // Draw the doodle character in the viewer canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Soft shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(120, 195, 45, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dummy player state to render with the doodle renderer
      const mockPlayerState = {
        def: currentPlayer,
        teamId: homeTeam.id,
        isHome: true,
        x: 120,
        y: 175,
        vx: 0,
        vy: 0,
        facing: 1 as const,
        hasBall: false,
        stamina: 100,
        heat: 0,
        state: 'idle' as const,
        stateTimer: 0,
        animFrame: frame,
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

      // Draw with 1.65x scale in center for prominent doodle visibility
      ctx.save();
      ctx.translate(120, 180);
      ctx.scale(1.65, 1.65);
      ctx.translate(-120, -180);
      renderPlayer(
        ctx,
        mockPlayerState,
        false,
        homeTeam.jerseyColor,
        homeTeam.secondaryColor,
        0,
        false
      );
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentPlayer, homeTeam]);

  // Navigate players within current team
  const prevPlayer = () => {
    setSelectedPlayerIndex(i => (i === 0 ? homeTeam.players.length - 1 : i - 1));
  };

  const nextPlayer = () => {
    setSelectedPlayerIndex(i => (i === homeTeam.players.length - 1 ? 0 : i + 1));
  };

  // 5-Pip Stat Bar Generator (matches the user's reference!)
  const renderStatPips = (val: number, filledColor: string) => {
    return (
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map(pip => (
          <div
            key={pip}
            className={`w-6 h-3 rounded-full border-2 border-[#161f36] shadow-inner transition-colors ${
              pip <= val ? filledColor : 'bg-[#18233c]'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 bg-[#162044] text-white select-none overflow-y-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto pb-2 border-b border-[#283863]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-[#1f2d52] hover:bg-[#283a69] doodle-border rounded-xl text-sm font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> BACK
        </button>

        <h2 className="text-2xl md:text-3xl font-extrabold font-marker text-amber-400 tracking-wide">
          SELECT YOUR 5v5 TEAM
        </h2>

        <button
          data-start="true"
          onClick={() => onSelectTeams(homeTeam, awayTeam, quarterLength)}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-base rounded-xl doodle-border doodle-btn cursor-pointer shadow-lg active:scale-95"
        >
          <Play className="w-5 h-5 fill-black" />
          START MATCH
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-5xl mx-auto my-auto items-center">
        {/* LEFT / CENTER COLUMN: Character Viewer (Mockup Match!) */}
        <div className="lg:col-span-6 flex flex-col items-center bg-[#1a254c] p-6 rounded-2xl doodle-border shadow-2xl">
          {/* Team Switcher Carousel */}
          <div className="flex items-center justify-between w-full mb-3 px-2">
            <button
              onClick={() => {
                setHomeTeamIndex(i => (i === 0 ? TEAMS.length - 1 : i - 1));
                setSelectedPlayerIndex(0);
              }}
              aria-label="Previous Team"
              className="p-1.5 bg-[#23325c] hover:bg-[#2e4075] rounded-lg border-2 border-gray-600 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Your Team</span>
              <h3 className="text-xl font-black">{homeTeam.name}</h3>
            </div>
            <button
              onClick={() => {
                setHomeTeamIndex(i => (i === TEAMS.length - 1 ? 0 : i + 1));
                setSelectedPlayerIndex(0);
              }}
              aria-label="Next Team"
              className="p-1.5 bg-[#23325c] hover:bg-[#2e4075] rounded-lg border-2 border-gray-600 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* DOODLE CHARACTER STAGE WITH ARROWS (EXACT MOCKUP STYLE) */}
          <div className="relative flex items-center justify-center w-full my-2">
            {/* Left Nav Arrow (rounded dark square with white arrow) */}
            <button
              onClick={prevPlayer}
              aria-label="Previous Player"
              className="p-3 bg-[#24335f] hover:bg-[#31447d] border-3 border-[#10172c] rounded-2xl shadow-xl text-white cursor-pointer active:scale-90 transition transform"
            >
              <ChevronLeft className="w-7 h-7 stroke-[3]" />
            </button>

            {/* Doodle Canvas Preview */}
            <div className="mx-4 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={240}
                height={220}
                className="w-[200px] h-[190px]"
              />
            </div>

            {/* Right Nav Arrow */}
            <button
              onClick={nextPlayer}
              aria-label="Next Player"
              className="p-3 bg-[#24335f] hover:bg-[#31447d] border-3 border-[#10172c] rounded-2xl shadow-xl text-white cursor-pointer active:scale-90 transition transform"
            >
              <ChevronRight className="w-7 h-7 stroke-[3]" />
            </button>
          </div>

          {/* Player Name in White Cursive (like "Lebronyan" in attachment!) */}
          <div className="text-center mt-1">
            <h4 className="text-3xl font-bold font-doodle text-white tracking-wide">
              {currentPlayer.name}
            </h4>
            <span className="inline-block px-2.5 py-0.5 mt-1 bg-[#131c36] text-amber-300 text-xs font-bold rounded-md border border-[#2b3a67]">
              {currentPlayer.position} · #{currentPlayer.number}
            </span>
          </div>

          {/* 3 STATS WITH ICONS & 5 PIPS (EXACT REPLICA OF USER ATTACHMENT) */}
          <div className="flex flex-col gap-3 mt-4 w-full max-w-xs bg-[#141d3c] p-4 rounded-xl border-2 border-[#263765]">
            {/* Speed / Скорость */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-gray-200">SPEED</span>
              </div>
              {renderStatPips(currentPlayer.stats.speed, 'bg-[#40c4ff]')}
            </div>

            {/* Shot / Бросок */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span className="text-sm font-bold text-gray-200">SHOT</span>
              </div>
              {renderStatPips(currentPlayer.stats.shot, 'bg-[#ffcc00]')}
            </div>

            {/* Strength / Сила */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BicepsFlexed className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="text-sm font-bold text-gray-200">STRENGTH</span>
              </div>
              {renderStatPips(currentPlayer.stats.strength, 'bg-[#ff5252]')}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Roster Picker, Signature Dunk Clue & Match Settings */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Signature Dunk Highlight Card */}
          <div className="bg-[#1a254c] p-4 rounded-xl doodle-border">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4 fill-amber-400" /> Signature Flashy Dunk
            </div>
            <h5 className="text-lg font-black text-white">{currentPlayer.dunkName}</h5>
            <p className="text-xs text-gray-300 mt-1">{currentPlayer.dunkDescription}</p>
            <p className="text-xs italic text-amber-200/70 mt-2">"{currentPlayer.quote}"</p>
          </div>

          {/* Full 5-Player Starting Lineup */}
          <div className="bg-[#1a254c] p-4 rounded-xl doodle-border">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {homeTeam.shortName} Starting Five (Click to inspect)
            </span>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {homeTeam.players.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerIndex(idx)}
                  className={`flex flex-col items-center p-2 rounded-lg border-2 text-center transition cursor-pointer ${
                    selectedPlayerIndex === idx
                      ? 'bg-amber-400 text-black border-black font-extrabold shadow-md'
                      : 'bg-[#151e39] text-gray-300 border-[#293a68] hover:bg-[#1e2a50]'
                  }`}
                >
                  <span className="text-[10px] opacity-80">{p.position}</span>
                  <span className="text-xs truncate w-full font-bold">{p.name.split(' ')[0]}</span>
                  <span className="text-[10px] font-mono opacity-75">#{p.number}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Opponent Selection & Quarter Duration */}
          <div className="bg-[#1a254c] p-4 rounded-xl doodle-border flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase">Opponent Team</span>
              <select
                aria-label="Opponent Team"
                value={awayTeamIndex}
                onChange={e => setAwayTeamIndex(Number(e.target.value))}
                className="bg-[#121931] border-2 border-[#2d3d6b] rounded-lg px-3 py-1.5 text-sm font-bold text-white cursor-pointer"
              >
                {TEAMS.map((t, idx) => (
                  <option key={t.id} value={idx} disabled={idx === homeTeamIndex}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase">Quarter Time</span>
              <div className="flex items-center gap-2">
                {[60, 90, 120].map(sec => (
                  <button
                    key={sec}
                    onClick={() => setQuarterLength(sec)}
                    className={`px-3 py-1 rounded-md text-xs font-bold border cursor-pointer ${
                      quarterLength === sec
                        ? 'bg-amber-400 text-black border-black font-black'
                        : 'bg-[#131b33] text-gray-300 border-gray-600'
                    }`}
                  >
                    {sec / 60}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Safe Space Note */}
      <div className="w-full text-center text-xs text-gray-400 pt-2">
        Pick your stars · Hit the court for 5v5 action without fouls!
      </div>
    </div>
  );
};
