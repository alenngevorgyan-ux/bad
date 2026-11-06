/**
 * Doodle Basketball 5v5 - Main Application Entry
 * Full-court 5v5 arcade basketball with brawling, no fouls,
 * timing jump shots, crossovers, and unique flashy dunks.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TEAMS } from './game/teams';
import { TeamDef } from './game/types';
import { GameEngine } from './game/engine';
import { CourtCanvas } from './game/CourtCanvas';
import { GameHUD } from './components/GameHUD';
import { VirtualControls } from './components/VirtualControls';
import { TitleScreen } from './components/TitleScreen';
import { TeamSelectScreen } from './components/TeamSelectScreen';
import { DunkShowcaseScreen } from './components/DunkShowcaseScreen';
import { TournamentModal } from './components/TournamentModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';

type AppScreen = 'title' | 'team_select' | 'dunk_showcase' | 'playing';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title');
  const [showTournament, setShowTournament] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Teams & Match Settings
  const [homeTeam, setHomeTeam] = useState<TeamDef>(TEAMS[0]); // Lakers (Lebronyan)
  const [awayTeam, setAwayTeam] = useState<TeamDef>(TEAMS[1]); // Warriors (Steph Chef)
  const [quarterLength, setQuarterLength] = useState(90);

  // Scores & Notifications
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [eventNotification, setEventNotification] = useState<{
    text: string;
    type?: 'green' | 'red' | 'gold';
  } | null>(null);

  // Virtual touch input vector for mobile
  const virtualInputRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize Game Engine instance in a ref
  const engineRef = useRef<GameEngine | null>(null);

  // Auto-start query parameter check (?autostart=1)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      startMatch(TEAMS[0], TEAMS[1], 90);
    }
  }, []);

  // Sync state machine to document.body.dataset.state
  useEffect(() => {
    if (isGameOver) {
      document.body.dataset.state = 'gameover';
    } else if (isPaused) {
      document.body.dataset.state = 'paused';
    } else if (screen === 'playing') {
      document.body.dataset.state = 'playing';
    } else {
      document.body.dataset.state = 'title';
    }
  }, [screen, isPaused, isGameOver]);

  const notifyEvent = (text: string, type?: 'green' | 'red' | 'gold') => {
    setEventNotification({ text, type });
    setTimeout(() => {
      setEventNotification(null);
    }, 1800);
  };

  const startMatch = (home: TeamDef, away: TeamDef, qLength: number = 90) => {
    setHomeTeam(home);
    setAwayTeam(away);
    setQuarterLength(qLength);
    setIsPaused(false);
    setIsGameOver(false);
    setShowTournament(false);
    setScore({ home: 0, away: 0 });

    const newEngine = new GameEngine({
      homeTeam: home,
      awayTeam: away,
      quarterLengthSeconds: qLength,
      difficulty: 'all_star',
      onScoreUpdate: (h, a) => setScore({ home: h, away: a }),
      onPeriodEnd: period => notifyEvent(`END OF QUARTER ${period}!`, 'gold'),
      onGameOver: () => setIsGameOver(true),
      onEventNotification: (text, type) => notifyEvent(text, type)
    });

    engineRef.current = newEngine;
    setScreen('playing');
  };

  const handleRematch = () => {
    startMatch(homeTeam, awayTeam, quarterLength);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0d121f] text-white select-none">
      {/* 1. TITLE SCREEN */}
      {screen === 'title' && (
        <TitleScreen
          onStartGame={() => startMatch(homeTeam, awayTeam, quarterLength)}
          onOpenTeamSelect={() => setScreen('team_select')}
          onOpenDunkShowcase={() => setScreen('dunk_showcase')}
          onOpenTournament={() => setShowTournament(true)}
        />
      )}

      {/* 2. TEAM & ROSTER SELECT SCREEN */}
      {screen === 'team_select' && (
        <TeamSelectScreen
          defaultHomeTeamId={homeTeam.id}
          defaultAwayTeamId={awayTeam.id}
          onSelectTeams={(h, a, q) => startMatch(h, a, q)}
          onBack={() => setScreen('title')}
        />
      )}

      {/* 3. DUNK CONTEST SHOWCASE */}
      {screen === 'dunk_showcase' && (
        <DunkShowcaseScreen onBack={() => setScreen('title')} />
      )}

      {/* 4. ACTIVE 5v5 PLAYING GAMEPLAY */}
      {screen === 'playing' && engineRef.current && (
        <div className="relative w-full h-full">
          {/* 60fps Canvas Court Viewport */}
          <CourtCanvas
            engine={engineRef.current}
            onPause={() => setIsPaused(true)}
            virtualInputRef={virtualInputRef}
          />

          {/* Playing HUD Overlay */}
          <GameHUD
            engine={engineRef.current}
            onPause={() => setIsPaused(true)}
            eventNotification={eventNotification}
          />

          {/* Virtual Mobile Joystick & Arcade Buttons */}
          <VirtualControls
            engine={engineRef.current}
            virtualInputRef={virtualInputRef}
          />

          {/* Pause Modal */}
          {isPaused && (
            <PauseModal
              onResume={() => setIsPaused(false)}
              onRestart={handleRematch}
              onQuitToMenu={() => {
                setIsPaused(false);
                setScreen('title');
              }}
            />
          )}

          {/* Game Over / Victory Modal */}
          {isGameOver && (
            <GameOverModal
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              homeScore={score.home}
              awayScore={score.away}
              players={engineRef.current.players}
              onRematch={handleRematch}
              onReturnToMenu={() => {
                setIsGameOver(false);
                setScreen('title');
              }}
            />
          )}
        </div>
      )}

      {/* TOURNAMENT MODAL OVERLAY */}
      {showTournament && (
        <TournamentModal
          onStartMatch={(h, a) => startMatch(h, a, quarterLength)}
          onClose={() => setShowTournament(false)}
        />
      )}
    </main>
  );
}
