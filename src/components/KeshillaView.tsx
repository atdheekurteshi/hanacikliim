import React, { useState } from 'react';
import { HeartPulse, Utensils, Dumbbell, Sparkles, ShieldCheck, Search } from 'lucide-react';

interface AdviceCardData {
  phaseKey: string;
  phaseTitle: string;
  phaseEmoji: string;
  colorHex: string;
  overview: string;
  nutrition: string[];
  exercise: string[];
  selfCare: string[];
  hygiene: string[];
}

const ADVICE_DATA: AdviceCardData[] = [
  {
    phaseKey: 'MENSTRUALE',
    phaseTitle: 'Faza Menstruale (Ditët 1 - 5)',
    phaseEmoji: '🩸',
    colorHex: '#FF3366',
    overview: 'Nivelet e estrogjenit dhe progesteronit janë në pikën më të ulët. Trupi juaj po harxhon energji për pastrimin e mitrës. Është kohë për t\'i dhënë vetes pushim fizik dhe emocional.',
    nutrition: [
      'Ushqime të pasura me hekur: mish i kuq, spinaq, thjerrëza, bizele',
      'Pini çaj të ngrohtë me kamomil ose xhenxhefil për zbutjen e krrampeve',
      'Pini ujë me bollëk për të shmangur mbajtjen e lëngjeve',
      'Çokollatë e zezë (>70% kakao) për magnez dhe përmirësim humori'
    ],
    exercise: [
      'Joga e lehtë dhe shtrirje trupore',
      'Ecja e ngadaltë në natyrë',
      'Shmangni ushtrimet e rënda kardio ose ngritjen e peshave'
    ],
    selfCare: [
      'Vendosni jastëk të ngrohtë te barku',
      'Bëni dush të ngrohtë çdo mbrëmje',
      'Flini 8-9 orë gjumë çdo natë'
    ],
    hygiene: [
      'Ndërroni pecetat ose tamponët çdo 3-4 orë',
      'Përdorni larës intim me pH neutral',
      'Lani duart gjithmonë para dhe pas ndërrimit'
    ]
  },
  {
    phaseKey: 'FOLIKULARE',
    phaseTitle: 'Faza Folikulare (Ditët 6 - 11)',
    phaseEmoji: '🌸',
    colorHex: '#A88BFF',
    overview: 'Estrogjeni nis të rritet shpejt. Energjia, fokusimi mendor dhe motivimi tuaj shtohen çdo ditë. Faza më e mirë për të nisur projekte të reja!',
    nutrition: [
      'Ushqime të fermentuara (kos, kfir, turshi) për shëndetin e zorrëve',
      'Zarzavate me gjethe jeshile dhe perime krucifere (brokoli, lulelakër)',
      'Proteina pa yndyrë: pulë, peshk, vezë',
      'Fara liri dhe kungulli'
    ],
    exercise: [
      'Stërvitje kardio me ritëm të mesëm',
      'Vrap, çiklistikë ose kërcim',
      'Ushtrime forca me pesha të lehta'
    ],
    selfCare: [
      'Vendosni synime të reja për muajin',
      'Socializohuni me shoqërinë dhe organizoni dalja',
      'Vendosni maska hidratuese për fytyrën'
    ],
    hygiene: [
      'Mbani lëkurën të pastruar pasi sekrecionet nisin të jenë më të lëngshme',
      'Vidhni rroba pambuku të frymëmarrshme'
    ]
  },
  {
    phaseKey: 'OVULUESE',
    phaseTitle: 'Faza Ovuluese (Ditët 12 - 16)',
    phaseEmoji: '✨',
    colorHex: '#FFB800',
    overview: 'Piku i fertilitetit, estrogjenit dhe testosteronit! Keni vetëbesim maksimal, lëkurë rrezatuese dhe energji të lartë. Ditët më pjellore të ciklit.',
    nutrition: [
      'Perime me fibra të larta për eliminimin e estrogjenit të tepërt',
      'Peshk i pasur me Omega-3 (salmon, sardele)',
      'Fruta të freskëta si luleshtrydhe, boronica dhe portokall',
      'Avokado dhe arra'
    ],
    exercise: [
      'Stërvitje HIIT me intensitet të lartë',
      'Ushtrime force me pesha më të rënda',
      'Lojëra sportive me grupe'
    ],
    selfCare: [
      'Përdorni energjinë për prezantime ose takime me rëndësi',
      'Eksploroni hobit tuaja kreative',
      'Dëgjoni muzikë ritmike'
    ],
    hygiene: [
      'Prania e sekretimit transparente si bardha e vezës është tërësisht normale dhe tregues shëndeti',
      'Lani zonën intime vetëm me ujë të vakët'
    ]
  },
  {
    phaseKey: 'LUTEALE',
    phaseTitle: 'Faza Luteale (Ditët 17 - 28)',
    phaseEmoji: '🌙',
    colorHex: '#FF66B2',
    overview: 'Nivel i lartë i progesteronit. Metabolizmi shpejtohet paksa, ndërsa energjia zbret gradualisht. Mund të shfaqen shenjat e PMS.',
    nutrition: [
      'Karboidrate kompleksive: tërshërë, patate e ëmbël, oriz i brun',
      'Ushqime të pasura me magnez për zbutjen e dëshirës për ëmbëlsira',
      'Ulni konsumin e kripës për të shmangur enjtjen e barkut',
      'Shmangni kafeinën e tepërt që rrit ankthin'
    ],
    exercise: [
      'Pilates dhe ecje e lehtë',
      'Ngarje biçiklete me ritëm të qetë',
      'Shtrirje muskulore'
    ],
    selfCare: [
      'Praktikoni meditim ose frymëmarrje të thellë',
      'Lexoni libër dhe krijoni mjedis të ngrohtë në shtëpi',
      'Vendosni kufij të qartë dhe shmangni stresin e panevojshëm'
    ],
    hygiene: [
      'Përdorni peceta ditore pambuku nëse keni nevojë',
      'Vishni rroba të gjerë e komode'
    ]
  }
];

export const KeshillaView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('TGJITHA');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAdvice = ADVICE_DATA.filter(item => {
    const matchesCategory = selectedCategory === 'TGJITHA' || item.phaseKey === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const matchOverview = item.overview.toLowerCase().includes(q);
    const matchTitle = item.phaseTitle.toLowerCase().includes(q);
    const matchNutrition = item.nutrition.some(n => n.toLowerCase().includes(q));
    const matchExercise = item.exercise.some(e => e.toLowerCase().includes(q));
    const matchSelfCare = item.selfCare.some(s => s.toLowerCase().includes(q));
    const matchHygiene = item.hygiene.some(h => h.toLowerCase().includes(q));

    return matchOverview || matchTitle || matchNutrition || matchExercise || matchSelfCare || matchHygiene;
  });

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-4 pb-24">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-[#FFB800]" />
        <h1 className="text-xl font-bold text-white">Këshilla & Shëndeti</h1>
      </div>

      <p className="text-xs text-[#AFA7CD] mb-4">
        Udhëzime të personalizuara për ushqimin, stërvitjen dhe vetëkujdesin gjatë çdo faze të ciklit tuaj.
      </p>

      {/* Search Input Bar */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-[#AFA7CD] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Kërko këshilla (p.sh. dhimbje, joga, çaj, magnez)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-card bg-white/5 border border-white/10 text-white text-xs placeholder-[#AFA7CD]/70 focus:outline-none focus:border-[#FF3366] transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#AFA7CD] hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Categories Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        {[
          { key: 'TGJITHA', label: 'Të gjitha 🌟' },
          { key: 'MENSTRUALE', label: 'Menstruale 🩸' },
          { key: 'FOLIKULARE', label: 'Folikulare 🌸' },
          { key: 'OVULUESE', label: 'Ovuluese ✨' },
          { key: 'LUTEALE', label: 'Luteale 🌙' }
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat.key
                ? 'bg-[#FF3366] text-white shadow-md'
                : 'glass-card border-white/10 text-[#AFA7CD] hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Advice Cards List */}
      <div className="space-y-5">
        {filteredAdvice.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center border border-white/10">
            <span className="text-3xl block mb-2">🔍</span>
            <h3 className="font-bold text-white text-sm mb-1">Nuk u gjet asnjë këshillë</h3>
            <p className="text-xs text-[#AFA7CD]">
              Përshkrimi apo termi "{searchQuery}" nuk përputhet me këshillat aktuale. Provojini me fjalë të tjera.
            </p>
          </div>
        ) : (
          filteredAdvice.map(card => (
          <div
            key={card.phaseKey}
            className="glass-card rounded-3xl p-5 border shadow-xl transition-all"
            style={{ borderColor: `${card.colorHex}40` }}
          >
            {/* Title */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-md"
                style={{ backgroundColor: `${card.colorHex}25` }}
              >
                {card.phaseEmoji}
              </span>
              <h2 className="font-bold text-base text-white">
                {card.phaseTitle}
              </h2>
            </div>

            {/* Overview */}
            <p className="text-xs text-[#AFA7CD] leading-relaxed mb-4 bg-white/5 p-3 rounded-2xl">
              {card.overview}
            </p>

            {/* Sections Grid */}
            <div className="space-y-4">
              {/* Nutrition */}
              <div>
                <h3 className="font-bold text-xs text-white mb-2 flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span>Ushqimi i Rekomanduar</span>
                </h3>
                <ul className="space-y-1.5 pl-2">
                  {card.nutrition.map((item, idx) => (
                    <li key={idx} className="text-xs text-[#F3F0FF] flex items-start gap-2">
                      <span className="text-[#FFB800]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exercise */}
              <div>
                <h3 className="font-bold text-xs text-white mb-2 flex items-center gap-2">
                  <Dumbbell className="w-3.5 h-3.5 text-[#A88BFF]" />
                  <span>Aktiviteti Fizik</span>
                </h3>
                <ul className="space-y-1.5 pl-2">
                  {card.exercise.map((item, idx) => (
                    <li key={idx} className="text-xs text-[#F3F0FF] flex items-start gap-2">
                      <span className="text-[#A88BFF]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Self-care */}
              <div>
                <h3 className="font-bold text-xs text-white mb-2 flex items-center gap-2">
                  <HeartPulse className="w-3.5 h-3.5 text-[#FF3366]" />
                  <span>Vetëkujdesi & Mirëqenia</span>
                </h3>
                <ul className="space-y-1.5 pl-2">
                  {card.selfCare.map((item, idx) => (
                    <li key={idx} className="text-xs text-[#F3F0FF] flex items-start gap-2">
                      <span className="text-[#FF3366]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hygiene */}
              <div>
                <h3 className="font-bold text-xs text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Higjiena Intime</span>
                </h3>
                <ul className="space-y-1.5 pl-2">
                  {card.hygiene.map((item, idx) => (
                    <li key={idx} className="text-xs text-[#F3F0FF] flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
};
