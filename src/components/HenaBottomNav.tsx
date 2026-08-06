import React from 'react';
import { Calendar, BookOpen, Sparkles, HeartPulse, Bot } from 'lucide-react';
import { HenaTab } from '../types';

interface HenaBottomNavProps {
  currentTab: HenaTab;
  onTabChange: (tab: HenaTab) => void;
}

export const HenaBottomNav: React.FC<HenaBottomNavProps> = ({
  currentTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'SOT' as HenaTab, label: 'Sot', icon: Sparkles },
    { id: 'HENA_AI' as HenaTab, label: 'Hëna AI', icon: Bot },
    { id: 'KALENDARI' as HenaTab, label: 'Kalendari', icon: Calendar },
    { id: 'DITARI' as HenaTab, label: 'Ditari', icon: BookOpen },
    { id: 'KESHILLA' as HenaTab, label: 'Këshilla', icon: HeartPulse }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-4 pt-1 pointer-events-none">
      <div className="max-w-md mx-auto glass-card rounded-3xl p-1.5 shadow-2xl border border-white/15 flex items-center justify-around pointer-events-auto backdrop-blur-xl">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isAi = tab.id === 'HENA_AI';

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? isAi
                    ? 'bg-gradient-to-tr from-[#A88BFF] to-[#FF3366] text-white shadow-lg font-bold scale-105'
                    : 'bg-[#FF3366] text-white shadow-lg luminous-glow-rose font-bold scale-105'
                  : isAi
                  ? 'text-[#A88BFF] font-semibold hover:bg-white/5'
                  : 'text-[#AFA7CD] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isAi && !isActive ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

