/**
 * Virtual on-screen touch joystick and arcade buttons for mobile & responsive play.
 */

import React, { useRef } from 'react';
import { GameEngine } from '../game/engine';

interface VirtualControlsProps {
  engine: GameEngine;
  virtualInputRef: React.MutableRefObject<{ x: number; y: number }>;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({ engine, virtualInputRef }) => {
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const activeTouchId = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch || !joystickRef.current) return;
    activeTouchId.current = touch.identifier;
    updateStick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        updateStick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = () => {
    activeTouchId.current = null;
    virtualInputRef.current = { x: 0, y: 0 };
  };

  const updateStick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    virtualInputRef.current = {
      x: dx / maxRadius,
      y: dy / maxRadius
    };
  };

  return (
    <div className="md:hidden pointer-events-auto absolute inset-x-0 bottom-16 flex justify-between px-6 z-30 select-none">
      {/* Virtual D-pad / Joystick */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-28 h-28 rounded-full bg-black/60 border-3 border-gray-400 flex items-center justify-center shadow-xl backdrop-blur-xs cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-amber-400 border-2 border-black shadow" />
      </div>

      {/* Arcade Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* Pass / Switch Button */}
        <button
          onTouchStart={() => engine.passBall()}
          onClick={() => engine.passBall()}
          className="w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-400 border-2 border-black text-black font-extrabold text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center cursor-pointer"
        >
          <span>PASS</span>
          <span className="text-[9px] opacity-75">SWITCH</span>
        </button>

        {/* Shoot / Dunk Button (Hold & Release) */}
        <button
          onTouchStart={() => engine.startShotCharge()}
          onTouchEnd={() => engine.releaseShot()}
          onMouseDown={() => engine.startShotCharge()}
          onMouseUp={() => engine.releaseShot()}
          className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 border-2 border-black text-black font-extrabold text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center cursor-pointer"
        >
          <span>SHOOT</span>
          <span className="text-[9px] opacity-75">DUNK</span>
        </button>

        {/* Crossover Button */}
        <button
          onTouchStart={() => engine.performCrossover()}
          onClick={() => engine.performCrossover()}
          className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-300 border-2 border-black text-black font-extrabold text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center cursor-pointer"
        >
          <span>CROSS</span>
          <span className="text-[9px] opacity-75">ANKLE</span>
        </button>

        {/* Brawl / Shove Button */}
        <button
          onTouchStart={() => engine.performShove()}
          onClick={() => engine.performShove()}
          className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-400 border-2 border-black text-white font-extrabold text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center cursor-pointer"
        >
          <span>BRAWL</span>
          <span className="text-[9px] opacity-75">SHOVE</span>
        </button>
      </div>
    </div>
  );
};
