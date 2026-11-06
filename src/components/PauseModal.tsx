/**
 * Pause Menu Modal Card
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onQuitToMenu }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-[#17203b] border-4 border-[#10162a] rounded-2xl w-full max-w-md p-6 doodle-border shadow-2xl flex flex-col gap-5 text-white text-center">
        <h3 className="text-3xl font-marker text-amber-400">GAME PAUSED</h3>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-lg rounded-xl doodle-border doodle-btn flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95"
          >
            <Play className="w-5 h-5 fill-black" /> RESUME MATCH
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-[#24335c] hover:bg-[#30447a] text-white font-bold text-base rounded-xl doodle-border flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-5 h-5" /> RESTART MATCH
          </button>

          <button
            onClick={onQuitToMenu}
            className="w-full py-3 bg-[#17203d] hover:bg-[#202c54] text-gray-300 font-bold text-base rounded-xl border border-gray-600 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-5 h-5" /> MAIN MENU
          </button>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-center pt-2 border-t border-gray-700">
          <button
            onClick={() => sounds.toggleMute()}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer"
          >
            {sounds.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            Toggle Sound Effects
          </button>
        </div>
      </div>
    </div>
  );
};
