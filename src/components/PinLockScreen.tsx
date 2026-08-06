import React, { useState } from 'react';
import { Lock, Delete, RotateCcw } from 'lucide-react';

interface PinLockScreenProps {
  correctPin: string;
  onUnlockSuccess: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  correctPin,
  onUnlockSuccess
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleKeyPress = (digit: string) => {
    if (pinDigits.length >= 4) return;
    const updated = [...pinDigits, digit];
    setPinDigits(updated);
    setErrorMsg('');

    if (updated.length === 4) {
      const entered = updated.join('');
      if (entered === correctPin) {
        onUnlockSuccess();
      } else {
        setErrorMsg('Kodi PIN është i pasaktë. Provoni përsëri.');
        setTimeout(() => setPinDigits([]), 600);
      }
    }
  };

  const handleDelete = () => {
    setPinDigits(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPinDigits([]);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0A1A] flex flex-col items-center justify-center p-6 text-white">
      <div className="flex flex-col items-center max-w-sm w-full">
        {/* Logo Icon */}
        <div className="w-16 h-16 rounded-3xl bg-[#FF3366]/20 border border-[#FF3366]/40 flex items-center justify-center text-3xl mb-4 luminous-glow-rose">
          🌙
        </div>

        <h1 className="font-bold text-2xl mb-1 text-white">Hëna i Mbrojtur</h1>
        <p className="text-xs text-[#AFA7CD] text-center mb-8">
          Të dhënat tuaja intime janë të sigurta. Vendosni PIN-in 4-shifror.
        </p>

        {/* 4 PIN Dots */}
        <div className="flex items-center gap-4 mb-8">
          {[0, 1, 2, 3].map(idx => {
            const isFilled = idx < pinDigits.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-[#FF3366] scale-125 shadow-lg luminous-glow-rose'
                    : 'bg-white/10 border border-white/20'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-bold mb-6 animate-bounce">
            {errorMsg}
          </p>
        )}

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-2xl glass-card font-bold text-xl text-white flex items-center justify-center hover:bg-white/15 active:scale-95 transition mx-auto cursor-pointer"
            >
              {num}
            </button>
          ))}

          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-2xl glass-card font-bold text-xs text-[#AFA7CD] flex items-center justify-center hover:bg-white/15 active:scale-95 transition mx-auto cursor-pointer"
            title="Pastro"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-2xl glass-card font-bold text-xl text-white flex items-center justify-center hover:bg-white/15 active:scale-95 transition mx-auto cursor-pointer"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl glass-card font-bold text-xs text-rose-400 flex items-center justify-center hover:bg-white/15 active:scale-95 transition mx-auto cursor-pointer"
            title="Fshij"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
