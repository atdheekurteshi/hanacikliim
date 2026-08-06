import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Volume2,
  Image as ImageIcon,
  Loader2,
  Utensils,
  Dumbbell,
  Palette,
  FileSearch,
  Zap,
  Heart,
  Lightbulb,
  X,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  AppSettings,
  ChatMessage,
  DailyInsightData,
  AiRecommendationData,
  AiSymptomAnalysisData,
  PeriodDay
} from '../types';
import { getCycleState, getTodayISO } from '../utils/cycle';

interface HenaAiViewProps {
  settings: AppSettings;
  selectedDateStr: string;
  periodDays: PeriodDay[];
}

export const HenaAiView: React.FC<HenaAiViewProps> = ({
  settings,
  selectedDateStr,
  periodDays
}) => {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'INSIGHTS' | 'RECIPES' | 'ART' | 'ANALYSIS'>('CHAT');

  // Context calculations
  const cycleState = getCycleState(selectedDateStr, settings);
  const todayISO = getTodayISO();
  const todayLog = periodDays.find(d => d.dateString === selectedDateStr);

  const userContext = {
    username: settings.username || 'Vajzë',
    cycleDay: cycleState.cycleDay,
    phaseName: cycleState.phaseName,
    phaseDescription: cycleState.phaseDescription,
    recentSymptoms: todayLog?.symptoms || 'Normale',
    mood: todayLog?.mood || 'E qetë',
    waterMl: settings[`water_ml_${selectedDateStr}`] || 0,
    targetWaterMl: settings.dailyWaterGoal || 2000
  };

  // --- 1. CHAT STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Përshëndetje ${settings.username || 'e dashur'}! 🌙 Unë jam Hëna AI. Sot je në ditën ${cycleState.cycleDay} (${cycleState.phaseName}). Si po ndihesh sot? Mund të më pyesësh çdo gjë rreth simptomave, ushqimit, humorit apo hormoneve tua! ✨`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mime: string; previewUrl: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setAttachedImage({
        base64,
        mime: file.type || 'image/jpeg',
        previewUrl: result
      });
    };
    reader.readAsDataURL(file);
  };

  // Send Chat Message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if ((!textToSend.trim() && !attachedImage) || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      imageUrl: attachedImage?.previewUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    const currentAttached = attachedImage;
    setAttachedImage(null);
    setChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, text: m.text })),
          userContext,
          imageBase64: currentAttached?.base64,
          imageMime: currentAttached?.mime
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Dështoi komunikimi me Hëna AI.');

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.text || 'Më falni, dështoi marrja e përgjigjes.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `⚠️ Më falni, pati një problem: ${err.message || 'Provo përsëri.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // TTS Audio Playback
  const handlePlayTTS = async (messageId: string, textToSpeech: string) => {
    try {
      setTtsLoadingId(messageId);
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeech })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dështoi gjenerimi i zërit.');

      // Decode base64 audio and play
      const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
      setPlayingAudioId(messageId);
      audio.play();
      audio.onended = () => setPlayingAudioId(null);
    } catch (err: any) {
      alert(`Audio nuk mund të luhej: ${err.message}`);
    } finally {
      setTtsLoadingId(null);
    }
  };

  // --- 2. DAILY INSIGHT STATE ---
  const [insight, setInsight] = useState<DailyInsightData | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchDailyInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await fetch('/api/ai/daily-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userContext })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInsight(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'INSIGHTS' && !insight && !insightLoading) {
      fetchDailyInsight();
    }
  }, [activeTab]);

  // --- 3. RECOMMENDATIONS STATE ---
  const [recommendations, setRecommendations] = useState<AiRecommendationData | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  const fetchRecommendations = async () => {
    setRecLoading(true);
    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseName: cycleState.phaseName,
          cycleDay: cycleState.cycleDay
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecommendations(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'RECIPES' && !recommendations && !recLoading) {
      fetchRecommendations();
    }
  }, [activeTab]);

  // --- 4. ART GENERATION STATE ---
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [artLoading, setArtLoading] = useState(false);

  const handleGenerateArt = async () => {
    setArtLoading(true);
    try {
      const res = await fetch('/api/ai/generate-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseName: cycleState.phaseName,
          moodPrompt: todayLog?.mood || 'harmony and grace'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setArtUrl(data.imageUrl);
    } catch (err: any) {
      alert(`Pati një problem me gjenerimin e artit: ${err.message}`);
    } finally {
      setArtLoading(false);
    }
  };

  // --- 5. SYMPTOM ANALYSIS STATE ---
  const [analysis, setAnalysis] = useState<AiSymptomAnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const handleAnalyzeSymptoms = async () => {
    setAnalysisLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodDaysLogs: periodDays })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data);
    } catch (err: any) {
      alert(`Pati një problem me analizën: ${err.message}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ANALYSIS' && !analysis && !analysisLoading) {
      handleAnalyzeSymptoms();
    }
  }, [activeTab]);

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-4 pb-28 flex flex-col items-center">
      {/* Top AI Header */}
      <div className="w-full glass-card rounded-3xl p-5 mb-4 border border-[#A88BFF]/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#A88BFF]/20 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF3366] via-[#A88BFF] to-[#FFB800] p-[2px] shadow-lg">
              <div className="w-full h-full bg-[#0D0A1A] rounded-2xl flex items-center justify-center text-xl">
                ✨
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white">Hëna AI</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#A88BFF]/20 text-[#A88BFF] border border-[#A88BFF]/40">
                  GEMINI 3.6
                </span>
              </div>
              <p className="text-xs text-[#AFA7CD]">
                Ekspertja e mendshme e ciklit & shëndetit femëror
              </p>
            </div>
          </div>
        </div>

        {/* Feature Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-4 pt-3 border-t border-white/10">
          {[
            { id: 'CHAT', label: 'Biseda AI', icon: Bot },
            { id: 'INSIGHTS', label: 'Analiza Ditore', icon: Lightbulb },
            { id: 'RECIPES', label: 'Ushqimi & Ushtrime', icon: Utensils },
            { id: 'ART', label: 'Arti i Ciklit', icon: Palette },
            { id: 'ANALYSIS', label: 'Historiku & Trendet', icon: FileSearch }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-[#A88BFF] text-white shadow-md'
                    : 'bg-white/5 text-[#AFA7CD] hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- TAB 1: AI CHAT --- */}
      {activeTab === 'CHAT' && (
        <div className="w-full flex flex-col h-[520px] glass-card rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Quick Prompts */}
          <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-[#AFA7CD] uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Zap className="w-3 h-3 text-[#FFB800]" /> Pyetje të shpejta:
            </span>
            {[
              '💬 Cilat ushqime të ha sot?',
              '🧘‍♀️ Ushtrime të përshtatshme për sot',
              '🌸 Si të menaxhoj luhatjet e humorit?',
              '💧 Sa ujë duhet të pi?'
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#F3F0FF] hover:bg-[#A88BFF]/20 hover:border-[#A88BFF]/40 transition whitespace-nowrap cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[88%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-md ${
                    msg.role === 'user'
                      ? 'bg-[#FF3366] text-white'
                      : 'bg-gradient-to-tr from-[#A88BFF] to-[#FF3366] text-white'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`rounded-2xl p-3.5 text-xs leading-relaxed border shadow-md relative group ${
                    msg.role === 'user'
                      ? 'bg-[#FF3366]/20 border-[#FF3366]/40 text-white rounded-tr-none'
                      : 'bg-[#18122B]/90 border-white/15 text-[#F3F0FF] rounded-tl-none'
                  }`}
                >
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Upload"
                      className="w-full max-h-40 object-cover rounded-xl mb-2 border border-white/20"
                    />
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#AFA7CD]">
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handlePlayTTS(msg.id, msg.text)}
                        disabled={ttsLoadingId === msg.id}
                        className="flex items-center gap-1 text-[#A88BFF] hover:text-white transition cursor-pointer"
                        title="Dëgjo me zë AI"
                      >
                        {ttsLoadingId === msg.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#FFB800]" />
                        ) : playingAudioId === msg.id ? (
                          <span className="text-[#FFB800] font-bold animate-pulse">E flet... 🔊</span>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Dëgjo</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2.5 mr-auto items-center text-xs text-[#AFA7CD]">
                <div className="w-8 h-8 rounded-full bg-[#A88BFF]/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#A88BFF]" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-[#18122B] border border-white/10 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#A88BFF]" />
                  <span>Hëna po mendon përgjigjen...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Image Preview */}
          {attachedImage && (
            <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={attachedImage.previewUrl}
                  alt="Attachment"
                  className="w-10 h-10 object-cover rounded-lg border border-white/20"
                />
                <span className="text-xs text-[#AFA7CD]">Imazhi u bashkangjit</span>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="text-rose-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2">
            <label className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[#AFA7CD] hover:text-white transition cursor-pointer shrink-0">
              <ImageIcon className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Shkruaj një pyetje për Hëna AI..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-[#AFA7CD] focus:outline-none focus:border-[#A88BFF]"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={chatLoading || (!inputText.trim() && !attachedImage)}
              className="w-10 h-10 rounded-2xl bg-[#A88BFF] hover:bg-[#A88BFF]/90 disabled:opacity-40 text-white flex items-center justify-center transition shadow-lg shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 2: DAILY INSIGHT --- */}
      {activeTab === 'INSIGHTS' && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#FFB800]" />
              <span>Këshilla & Analiza e Ditës</span>
            </h2>
            <button
              onClick={fetchDailyInsight}
              disabled={insightLoading}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-[#A88BFF] font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {insightLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Rifresko Analizën</span>
            </button>
          </div>

          {insightLoading ? (
            <div className="glass-card rounded-3xl p-8 text-center border border-white/10 flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-[#A88BFF] animate-spin mb-2" />
              <p className="text-xs text-[#AFA7CD]">Hëna po analizon nivelin tënd të hormoneve sot...</p>
            </div>
          ) : insight ? (
            <div className="space-y-3">
              <div className="glass-card rounded-3xl p-5 border border-[#A88BFF]/40 shadow-xl bg-gradient-to-br from-[#A88BFF]/10 to-transparent">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/30 inline-block mb-2">
                  ENERGJIA: {insight.energyLevel}
                </span>
                <h3 className="font-bold text-base text-white mb-2">{insight.title}</h3>
                <p className="text-xs text-[#F3F0FF] leading-relaxed mb-4">{insight.dailyTip}</p>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-3">
                  <span className="text-[10px] font-bold text-[#A88BFF] uppercase tracking-wider block mb-1">
                    🩸 Gjendja Hormonale
                  </span>
                  <p className="text-xs text-[#AFA7CD]">{insight.hormoneStatus}</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#FF3366]/10 border border-[#FF3366]/30 flex items-start gap-2.5">
                  <Heart className="w-4 h-4 text-[#FF3366] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-[#FF3366] uppercase tracking-wider block">
                      Afirmacioni Ditor
                    </span>
                    <p className="text-xs font-semibold text-white italic">"{insight.affirmation}"</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-6 text-center border border-white/10">
              <p className="text-xs text-[#AFA7CD]">Kliko butonin më sipër për të marrë analizën ditore.</p>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: RECIPES & EXERCISES --- */}
      {activeTab === 'RECIPES' && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#FF3366]" />
              <span>Plani i Personalizuar AI (Faza: {cycleState.phaseName})</span>
            </h2>
            <button
              onClick={fetchRecommendations}
              disabled={recLoading}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-[#A88BFF] font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {recLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Gjenero Sërish</span>
            </button>
          </div>

          {recLoading ? (
            <div className="glass-card rounded-3xl p-8 text-center border border-white/10 flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-[#FF3366] animate-spin mb-2" />
              <p className="text-xs text-[#AFA7CD]">Po përpunohen recetat & ushtrimet më të mira...</p>
            </div>
          ) : recommendations ? (
            <div className="space-y-4">
              {/* Recipes */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-[#FFB800] uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5" /> Recetë e Rekomanduar
                </h3>
                {recommendations.recipes.map((rec, idx) => (
                  <div key={idx} className="glass-card rounded-3xl p-5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white">{rec.name}</h4>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-[#AFA7CD]">
                        ⏱️ {rec.prepTime}
                      </span>
                    </div>
                    <p className="text-xs text-[#FFB800] font-medium">{rec.benefits}</p>

                    <div>
                      <span className="text-[10px] font-bold text-[#AFA7CD] uppercase block mb-1">
                        Përbërësit:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-[#F3F0FF]"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#AFA7CD] bg-black/20 p-3 rounded-2xl leading-relaxed mt-2">
                      💡 {rec.instructions}
                    </p>
                  </div>
                ))}
              </div>

              {/* Exercises */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-xs text-[#A88BFF] uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" /> Ushtrimi i Përshtatur
                </h3>
                {recommendations.exercises.map((ex, idx) => (
                  <div key={idx} className="glass-card rounded-3xl p-5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white">{ex.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#A88BFF]/20 text-[#A88BFF] font-bold">
                          {ex.intensity}
                        </span>
                        <span className="text-[10px] text-[#AFA7CD]">{ex.duration}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#AFA7CD] leading-relaxed">{ex.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-6 text-center border border-white/10">
              <p className="text-xs text-[#AFA7CD]">Kliko për të gjeneruar ushqime e stërvitje.</p>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: CYCLE ART --- */}
      {activeTab === 'ART' && (
        <div className="w-full space-y-4">
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3 text-center">
            <Palette className="w-8 h-8 text-[#A88BFF] mx-auto" />
            <h2 className="font-bold text-base text-white">Arti i Energjisë tuaj të Ciklit</h2>
            <p className="text-xs text-[#AFA7CD] leading-relaxed">
              Gemini Image AI do të kornizojë vizualisht gjendjen e hënës, energjisë dhe humorit tënd sot.
            </p>

            <button
              onClick={handleGenerateArt}
              disabled={artLoading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#A88BFF] to-[#FF3366] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg luminous-glow-rose cursor-pointer"
            >
              {artLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Po pikturohet arti...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Krijo Art Visual AI</span>
                </>
              )}
            </button>
          </div>

          {artUrl && (
            <div className="glass-card rounded-3xl p-4 border border-[#A88BFF]/40 shadow-2xl flex flex-col items-center">
              <img
                src={artUrl}
                alt="Cycle Art"
                className="w-full aspect-square object-cover rounded-2xl shadow-xl border border-white/10 mb-3"
              />
              <span className="text-xs text-[#AFA7CD] italic">
                🌸 Aura & Arti Visual i ditës {cycleState.cycleDay} ({cycleState.phaseName})
              </span>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 5: SYMPTOM PATTERN ANALYSIS --- */}
      {activeTab === 'ANALYSIS' && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-[#A88BFF]" />
              <span>Analiza e Trendeve të Historikut</span>
            </h2>
            <button
              onClick={handleAnalyzeSymptoms}
              disabled={analysisLoading}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-[#A88BFF] font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {analysisLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Rianalizo</span>
            </button>
          </div>

          {analysisLoading ? (
            <div className="glass-card rounded-3xl p-8 text-center border border-white/10 flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-[#A88BFF] animate-spin mb-2" />
              <p className="text-xs text-[#AFA7CD]">Po analizohen të gjitha logimet e ditari-t tënd...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-3">
              <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
                <h3 className="font-bold text-xs text-[#FF3366] uppercase tracking-wider">
                  📊 Përmbledhje e Vëzhguar
                </h3>
                <p className="text-xs text-[#F3F0FF] leading-relaxed">{analysis.summary}</p>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-bold text-[#FFB800] uppercase block mb-1">
                    🔍 Trendi Kryesor:
                  </span>
                  <p className="text-xs text-[#AFA7CD]">{analysis.patternObserved}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#A88BFF] uppercase block mb-2">
                    💡 Rekomandime për ciklin e ardhshëm:
                  </span>
                  <ul className="space-y-1.5">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs text-[#F3F0FF] flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {analysis.medicalAlert && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200">{analysis.medicalAlert}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-6 text-center border border-white/10">
              <p className="text-xs text-[#AFA7CD]">Kliko më sipër për të marrë analizën e ditarit.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
