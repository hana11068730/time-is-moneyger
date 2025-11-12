"use client";
import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

type Activity = {
  id: number;
  name: string;
  hour: number;
  min: number;
  category: string;
};

const categories = ["仕事", "勉強", "家事", "休憩", "その他"];

type View = "home" | "input" | "result" | "history" | "personality";

// AIモードの命令テンプレート（コンポーネント外に出して再生成を防ぐ）
const MODE_INSTRUCTIONS: Record<string, { advice: string; prediction: string }> = {
  gal: {
    advice: `語尾やテンションはギャル語で、ただし一人称で「ギャル」や「うち」などは使わず、生活バランスや改善点について日本語でかわいくアドバイスしてください。絶対に自分をギャルと名乗らないこと。`,
    prediction: `語尾やテンションはギャル語で、ただし一人称で「ギャル」や「うち」などは使わず、1ヶ月後の変化を日本語でかわいく予測してください。`
  },
  healing: {
    advice: `語調は穏やかでヒーリング系（優しく落ち着いた口調）にしてください。リラックスや回復を促す表現を用いて、優しくアドバイスしてください。`,
    prediction: `語調は穏やかでヒーリング系（優しく落ち着いた口調）で、1ヶ月後にどのような変化があるかを優しく予測してください。`
  },
  cool: {
    advice: `語調はクールで落ち着いたトーンにし、簡潔で洗練された表現でアドバイスしてください。感情表現は抑えめに。`,
    prediction: `語調はクールで落ち着いたトーンで、1ヶ月後の影響を簡潔に予測してください。`
  },
  tsundere: {
    advice: `語調はツンデレ風（照れ隠し・素直でないけど内心は気にかけている）にしてください。ただし攻撃的や傷つける表現は避けてください。`,
    prediction: `語調はツンデレ風で、1ヶ月後の変化を少し照れた感じで述べてください。`
  },
  business: {
    advice: `語調はビジネスライクでプロフェッショナルに、具体的かつ実行可能な改善案を簡潔に提示してください。`,
    prediction: `語調はビジネスライクでプロフェッショナルに、1ヶ月後に予想される業務上や生活面の影響を簡潔に予測してください。`
  }
};

// モードごとのスタイル定義（Tailwind クラス）
const MODE_STYLES: Record<string, { bg: string; btnPrimary: string; btnAccent: string; heading: string; font?: string; cardBg?: string; cardBorder?: string; labelText?: string; inputBg?: string; inputBorder?: string; inputText?: string; btnBorder?: string; whiteBtnBorder?: string; pieColors?: string[] }> = {
  gal: {
    bg: "bg-gradient-to-br from-pink-300 via-purple-200 to-yellow-100",
    btnPrimary: "bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-300",
    btnAccent: "bg-gradient-to-r from-yellow-400 to-orange-400",
    heading: "text-pink-600",
    font: "font-gal",
    cardBg: "bg-white",
    cardBorder: "border-pink-300",
    labelText: "text-pink-400",
    inputBg: "bg-pink-50",
    inputBorder: "border-pink-300",
    inputText: "text-pink-700",
    btnBorder: "border-pink-300",
    whiteBtnBorder: "border-pink-400",
    pieColors: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
  },
  healing: {
    bg: "bg-gradient-to-br from-green-100 via-teal-100 to-white",
    btnPrimary: "bg-gradient-to-r from-green-300 to-teal-300",
    btnAccent: "bg-gradient-to-r from-teal-300 to-green-300",
    heading: "text-teal-700",
    font: "font-serif",
    cardBg: "bg-white",
    cardBorder: "border-teal-200",
    labelText: "text-teal-600",
    inputBg: "bg-white",
    inputBorder: "border-teal-200",
    inputText: "text-teal-800",
    btnBorder: "border-teal-200",
    whiteBtnBorder: "border-teal-300",
    pieColors: ["#CFFAFE", "#BAF7D6", "#FEF3C7", "#BBF7D0", "#E9D5FF"],
  },
  cool: {
    bg: "bg-gradient-to-br from-gray-100 via-slate-100 to-blue-100",
    btnPrimary: "bg-gradient-to-r from-sky-400 to-indigo-400",
    btnAccent: "bg-gradient-to-r from-indigo-400 to-sky-400",
    heading: "text-sky-700",
    font: "font-sans",
    cardBg: "bg-white",
    cardBorder: "border-sky-200",
    labelText: "text-sky-600",
    inputBg: "bg-white",
    inputBorder: "border-sky-200",
    inputText: "text-sky-800",
    btnBorder: "border-sky-200",
    whiteBtnBorder: "border-sky-300",
    pieColors: ["#60A5FA", "#38BDF8", "#7DD3FC", "#93C5FD", "#A5B4FC"],
  },
  tsundere: {
    bg: "bg-gradient-to-br from-pink-50 via-red-50 to-purple-50",
    btnPrimary: "bg-gradient-to-r from-red-400 to-pink-400",
    btnAccent: "bg-gradient-to-r from-purple-400 to-pink-300",
    heading: "text-red-600",
    font: "font-serif italic",
    cardBg: "bg-white",
    cardBorder: "border-red-200",
    labelText: "text-red-600",
    inputBg: "bg-white",
    inputBorder: "border-red-200",
    inputText: "text-red-800",
    btnBorder: "border-red-200",
    whiteBtnBorder: "border-red-300",
    pieColors: ["#FB7185", "#F472B6", "#FCA5A5", "#FDE68A", "#FBCFE8"],
  },
  business: {
    bg: "bg-gradient-to-br from-gray-50 via-gray-100 to-white",
    btnPrimary: "bg-gradient-to-r from-gray-700 to-gray-900",
    btnAccent: "bg-gradient-to-r from-blue-600 to-slate-700",
    heading: "text-gray-800",
    font: "font-sans tracking-wide",
    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    labelText: "text-gray-700",
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    inputText: "text-gray-800",
    btnBorder: "border-gray-300",
    whiteBtnBorder: "border-gray-300",
    pieColors: ["#6B7280", "#9CA3AF", "#D1D5DB", "#60A5FA", "#93C5FD"],
  },
};

// モードごとのテキスト（タイトルやサブテキスト）
const MODE_TEXTS: Record<string, { homeTitle: string; homeSubtitle: string; resultHeading: string }> = {
  gal: {
    homeTitle: 'じぶんタイマー💖',
    homeSubtitle: '健康マジ大事っしょ？！キラキラしてこ☆',
    resultHeading: '💖 あなたの1日の配分 💖',
  },
  healing: {
    homeTitle: 'じぶんタイマー — ゆったりケア💧',
    homeSubtitle: '無理せず、毎日をやさしく整えよう',
    resultHeading: '🌿 あなたの1日の配分 🌿',
  },
  cool: {
    homeTitle: 'Jibun Timer — Focus Mode',
    homeSubtitle: 'シンプルに時間を可視化して効率化',
    resultHeading: '📊 Your Daily Breakdown',
  },
  tsundere: {
    homeTitle: 'じぶんタイマー（べ、別に見てやってもいいけど）',
    homeSubtitle: 'ちゃんと入力しなさいよね…（心配なんだから）',
    resultHeading: '💢 あなたの1日の配分（見てやるわ）',
  },
  business: {
    homeTitle: 'Productivity Timer',
    homeSubtitle: '効率的な時間配分で成果を最大化する',
    resultHeading: '📈 あなたの1日の配分',
  },
};

// モードごとの「履歴がないときのメッセージ」と追加クラス
const MODE_EMPTY_MESSAGES: Record<string, string> = {
  gal: '記録がないよ💦 まずはちょっとだけでも活動を追加してみてね！',
  healing: 'まだ記録がありません。無理せず少しずつ始めましょう。',
  cool: 'No records yet. Add activities to visualize your day.',
  tsundere: '記録がないんだから…別に困ってないんだからね！でも入力しなさいよ！',
  business: '履歴がありません。まずは活動を登録してください。',
};

const MODE_EMPTY_EXTRA_CLASS: Record<string, string> = {
  gal: 'text-pink-400',
  healing: 'text-teal-600 italic',
  cool: 'text-sky-600',
  tsundere: 'text-red-600 italic',
  business: 'text-gray-700',
};

// 性格タイプ定義（簡易）
const PERSONA_DISPLAY: Record<string, string> = {
  planner: '計画型',
  creative: 'クリエイティブ型',
  social: '社交型',
  calm: '安定型',
};

const PERSONA_DESCRIPTIONS: Record<string, string> = {
  planner: '予定を立ててコツコツこなすのが得意。時間管理と優先順位の提案を重視します。',
  creative: '自由な発想で取り組むタイプ。柔軟なスケジュールの工夫を提案します。',
  social: '人との交流やイベントを大事にする傾向があります。休憩と交流のバランスを提案します。',
  calm: '落ち着いて持続するタイプ。無理のないリズムと回復の時間を重視します。',
};

// 性格ごとのプロンプト付加（AIに渡す際の挙動指示）
const PERSONA_PROMPTS: Record<string, string> = {
  planner: 'このユーザーは計画型です。具体的なToDoや時間割、優先順位付けを含む実行可能な提案を出してください。',
  creative: 'このユーザーはクリエイティブ型です。柔軟で創造的な代替案やバッファを取り入れたスケジュール提案を優先してください。',
  social: 'このユーザーは社交型です。交流やチーム作業を取り入れた提案、他者との予定調整を考慮してください。',
  calm: 'このユーザーは安定型です。疲労回復や持続可能性を重視したゆったりした提案を心がけてください。',
};

// モードごとのアイコン（絵文字）
const MODE_EMOJIS: Record<string, { title?: string; subtitle?: string; name?: string; hour?: string; min?: string; category?: string; advice?: string; predict?: string; homeStar?: string; btnPrimary?: string; btnSecondary?: string; btnHome?: string; btnAgain?: string }> = {
  gal: { title: '✨', subtitle: '🌟', name: '💅', hour: '🕒', min: '✨', category: '🌈', advice: '💕', predict: '🔮', homeStar: '🌟', btnPrimary: '📝', btnSecondary: '📒', btnHome: '🏠', btnAgain: '🔄' },
  healing: { title: '💧', subtitle: '🍃', name: '🫧', hour: '🕯️', min: '☁️', category: '🌿', advice: '🌸', predict: '🔮', btnPrimary: '📝', btnSecondary: '📘', btnHome: '🏠', btnAgain: '🔁' },
  cool: { title: '❄️', subtitle: '🧊', name: '🗂️', hour: '⏱️', min: '•', category: '📘', advice: '⚡', predict: '🔍', btnPrimary: '📝', btnSecondary: '📚', btnHome: '🏠', btnAgain: '🔄' },
  tsundere: { title: '💢', subtitle: '😳', name: '🙄', hour: '⌚', min: '✧', category: '🔥', advice: '…', predict: '🔮', btnPrimary: '📝', btnSecondary: '📕', btnHome: '🏠', btnAgain: '🔁' },
  business: { title: '📈', subtitle: '💼', name: '📝', hour: '⏰', min: '⏱️', category: '📂', advice: '✅', predict: '📊', btnPrimary: '📝', btnSecondary: '📒', btnHome: '🏠', btnAgain: '🔄' },
};

export default function JibunTimer() {
  const [view, setView] = useState<View>("home");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [name, setName] = useState("");
  const [hour, setHour] = useState<number | null>(null);
  const [min, setMin] = useState<number | null>(null);
  const [category, setCategory] = useState(categories[0]);
  type HistoryRecord = { activities: Activity[]; date: string };
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // localStorageから履歴を読み込む（初回マウント時）
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jibun_timer_history");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed as HistoryRecord[]);
        }
      }
    } catch (e) {
      console.error("履歴の読み込みに失敗しました", e);
    }
  }, []);

  // historyが変わったらlocalStorageへ保存
  useEffect(() => {
    try {
      localStorage.setItem("jibun_timer_history", JSON.stringify(history));
    } catch (e) {
      console.error("履歴の保存に失敗しました", e);
    }
  }, [history]);

  // Geminiアドバイス用
  const [advice, setAdvice] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  // 1ヶ月予測用
  const [prediction, setPrediction] = useState("");
  const [predictionLoading, setPredictionLoading] = useState(false);
  // 履歴分析用
  const [historyAdvice, setHistoryAdvice] = useState("");
  const [historyAdviceLoading, setHistoryAdviceLoading] = useState(false);
  // AI出力モード
  const [aiMode, setAiMode] = useState<"gal"|"healing"|"cool"|"tsundere"|"business">("gal");
  const styles = MODE_STYLES[aiMode] || MODE_STYLES['gal'];

  // AIモードをlocalStorageから読み込む（初回マウント時）
  useEffect(() => {
    try {
      const m = localStorage.getItem('jibun_timer_ai_mode');
      if (m && ['gal', 'healing', 'cool', 'tsundere', 'business'].includes(m)) {
        setAiMode(m as "gal"|"healing"|"cool"|"tsundere"|"business");
      }
    } catch (e) {
      console.error('aiModeの読み込みに失敗しました', e);
    }
  }, []);

  // aiModeが変わったらlocalStorageへ保存
  useEffect(() => {
    try {
      localStorage.setItem('jibun_timer_ai_mode', aiMode);
    } catch (e) {
      console.error('aiModeの保存に失敗しました', e);
    }
  }, [aiMode]);

  // 性格診断（personality）状態
  const [personality, setPersonality] = useState<string | null>(null);

  // 性格診断用の回答状態（簡易クイズ）
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');

  const computePersona = (a1: string, a2: string, a3: string) => {
    const counts: Record<string, number> = { planner: 0, creative: 0, social: 0, calm: 0 };
    [a1, a2, a3].forEach(a => {
      if (!a) return;
      if (a === 'a') counts.planner++;
      if (a === 'b') counts.creative++;
      if (a === 'c') counts.social++;
      if (a === 'd') counts.calm++;
    });
    // find max
    let best = 'calm';
    let bestScore = -1;
    Object.keys(counts).forEach(k => {
      if (counts[k] > bestScore) { best = k; bestScore = counts[k]; }
    });
    return best;
  };

  // personality を localStorage から読み込む
  useEffect(() => {
    try {
      const p = localStorage.getItem('jibun_timer_personality');
      if (p) setPersonality(p);
    } catch (e) {
      console.error('personality の読み込みに失敗しました', e);
    }
  }, []);

  // personality を保存
  useEffect(() => {
    try {
      if (personality) localStorage.setItem('jibun_timer_personality', personality);
      else localStorage.removeItem('jibun_timer_personality');
    } catch (e) {
      console.error('personality の保存に失敗しました', e);
    }
  }, [personality]);

  // ユーザー名の状態と永続化
  const [userName, setUserName] = useState<string | null>(null);
  const [userNameInput, setUserNameInput] = useState<string>('');

  useEffect(() => {
    try {
      const u = localStorage.getItem('jibun_timer_user_name');
      if (u) {
        setUserName(u);
        setUserNameInput(u);
      }
    } catch (e) {
      console.error('userName の読み込みに失敗しました', e);
    }
  }, []);

  useEffect(() => {
    try {
      if (userName) localStorage.setItem('jibun_timer_user_name', userName);
      else localStorage.removeItem('jibun_timer_user_name');
    } catch (e) {
      console.error('userName の保存に失敗しました', e);
    }
  }, [userName]);

  // ✅ useEffect を return より前に移動
  useEffect(() => {
    if (view === "result" && activities.length > 0) {
      setAdviceLoading(true);
      setAdvice("");
  const modeInstr = MODE_INSTRUCTIONS[aiMode]?.advice || MODE_INSTRUCTIONS['gal'].advice;
      const personaNote = personality ? `ユーザーの性格: ${PERSONA_DISPLAY[personality] || personality}\n${PERSONA_PROMPTS[personality as string] || '性格に寄り添ったアドバイスを行ってください。'}` : '';
      const prompt = `${modeInstr}\n${personaNote}\n以下の1日の活動配分をもとに、生活バランスや改善点について日本語でアドバイスしてください。活動一覧:\n${activities.map((a) => `${a.name}(${a.category}): ${a.hour}時間${a.min}分`).join("\n")}`;
      fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
        .then((res) => res.json())
        .then((data) => setAdvice(data.result || "アドバイス取得に失敗しました"))
        .catch((e) => { console.error(e); setAdvice("アドバイス取得に失敗しました"); })
        .finally(() => setAdviceLoading(false));
    } else if (view !== "result") {
      setAdvice("");
    }
  }, [view, activities, aiMode, personality]);
  // (history 用の棒グラフデータは未使用のため一旦省略)

  // Pie chart data for current activities (colors follow selected mode)
  const pieData = {
    labels: categories,
    datasets: [
      {
        data: categories.map((cat) =>
          activities.filter((a) => a.category === cat).reduce((sum, a) => sum + a.hour * 60 + a.min, 0)
        ),
        backgroundColor: styles.pieColors || ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };

  // --- 画面ごとのUI ---
  if (view === "home") {
    return (
  <div className={`min-h-screen flex flex-col items-center justify-center ${styles.bg} p-4 ${styles.font || ''} pop-shadow`}>
    <h1 className={`text-4xl font-extrabold mb-2 ${styles.heading} tracking-widest drop-shadow-lg flex items-center gap-2`}>{MODE_EMOJIS[aiMode]?.title || ''} {MODE_TEXTS[aiMode]?.homeTitle || MODE_TEXTS['gal'].homeTitle}</h1>
  <p className="mb-2 text-center text-lg text-purple-600 font-bold flex items-center gap-1">{MODE_TEXTS[aiMode]?.homeSubtitle || MODE_TEXTS['gal'].homeSubtitle} {MODE_EMOJIS[aiMode]?.subtitle || MODE_EMOJIS['gal'].subtitle}</p>
  <div className="mb-4 w-full max-w-xs">
    {userName ? (
      <div className={`w-full p-3 rounded-xl border-2 ${styles.cardBorder} ${styles.cardBg} text-center font-bold`}>{userName}さん、ようこそ</div>
    ) : (
      <div className="flex gap-2">
        <input value={userNameInput} onChange={e => setUserNameInput(e.target.value)} placeholder="あなたの名前を入力" className={`flex-1 p-2 rounded-full border-2 ${styles.inputBorder} ${styles.inputText} ${styles.inputBg}`} />
        <button className={`px-4 py-2 rounded-full ${styles.btnPrimary} text-white`} onClick={() => { if (userNameInput.trim()) { setUserName(userNameInput.trim()); } }}>保存</button>
      </div>
    )}
  </div>
        <div className="mb-4 w-full max-w-xs">
              <label className="block text-sm font-bold text-gray-600 mb-1">AIモードを選択</label>
              <select value={aiMode} onChange={e => setAiMode(e.target.value as "gal"|"healing"|"cool"|"tsundere"|"business")} className={`w-full p-2 rounded-full border-2 ${styles.inputBorder} bg-white font-bold`}>
            <option value="gal">ギャル</option>
            <option value="healing">ヒーリング</option>
            <option value="cool">クール</option>
            <option value="tsundere">ツンデレ</option>
            <option value="business">ビジネス</option>
          </select>
        </div>
        <div className="mb-4 w-full max-w-xs text-center">
          {personality ? (
            <div className={`p-3 rounded-xl border-2 ${styles.cardBorder} ${styles.cardBg}`}>
              <div className="font-bold mb-1">あなたの性格: {PERSONA_DISPLAY[personality] || personality}</div>
              <div className="text-sm mb-2">{PERSONA_DESCRIPTIONS[personality] || ''}</div>
              <button className={`px-4 py-2 rounded-full bg-white border-2 ${styles.whiteBtnBorder} font-bold`} onClick={() => setView('personality')}>診断をやり直す</button>
            </div>
          ) : (
            <button className={`${styles.btnAccent} text-white rounded-full px-4 py-2 text-lg font-bold shadow mb-2`} onClick={() => setView('personality')}>性格診断を受ける</button>
          )}
        </div>
  <button className={`${styles.btnPrimary} text-white rounded-full px-6 py-3 mb-3 text-lg font-bold shadow-lg hover:scale-105 transition-all border-2 ${styles.btnBorder} flex items-center gap-2`} onClick={() => setView("input")}><span className="mr-2">{MODE_EMOJIS[aiMode]?.btnPrimary || '📝'}</span>1日の時間入力スタート！</button>
  <button className={`bg-white ${styles.heading} border-2 ${styles.whiteBtnBorder} rounded-full px-6 py-3 text-lg font-bold shadow hover:bg-pink-50 flex items-center gap-2`} onClick={() => setView("history")}><span className="mr-2">{MODE_EMOJIS[aiMode]?.btnSecondary || '📒'}</span>過去の記録をみる</button>
      </div>
    );
  }

  if (view === "input") {
    return (
  <div className={`min-h-screen flex flex-col items-center justify-center ${styles.bg} p-4 ${styles.font || ''} pop-shadow`}>
        <h2 className={`text-2xl font-extrabold mb-4 ${styles.heading} flex items-center gap-2`}>🦋 1日の時間配分入力 🦋</h2>
        <div className={`${styles.cardBg} rounded-2xl shadow-xl p-6 w-full max-w-xs mb-6 border-2 ${styles.cardBorder}`}>
          <div className="mb-3">
            <label className={`block text-lg font-bold ${styles.labelText} mb-1`}>活動名 {MODE_EMOJIS[aiMode]?.name || MODE_EMOJIS['gal'].name}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={`border-2 ${styles.inputBorder} rounded-full px-4 py-2 w-full ${styles.inputText} font-bold ${styles.inputBg}`} />
          </div>
          <div className="mb-3 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-lg font-bold text-purple-400 mb-1">時間 {MODE_EMOJIS[aiMode]?.hour || MODE_EMOJIS['gal'].hour}</label>
              <div className="flex gap-2 items-center">
                <select
                  value={hour ?? ''}
                  onChange={e => setHour(e.target.value === '' ? null : Number(e.target.value))}
                  className={`border-2 ${styles.inputBorder} rounded-full px-4 py-2 w-24 ${styles.inputText} font-bold ${styles.inputBg}`}
                >
                  <option value="">時間</option>
                  {[...Array(24).keys()].map(h => (
                    <option key={h+1} value={h+1}>{h+1} 時間</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-lg font-bold text-yellow-400 mb-1">分 {MODE_EMOJIS[aiMode]?.min || MODE_EMOJIS['gal'].min}</label>
              <div className="flex gap-2 items-center">
                <select
                  value={min ?? ''}
                  onChange={e => setMin(e.target.value === '' ? null : Number(e.target.value))}
                  className={`border-2 ${styles.inputBorder} rounded-full px-4 py-2 w-24 ${styles.inputText} font-bold ${styles.inputBg}`}
                >
                  <option value="">分</option>
                  {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m}>{m} 分</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className={`block text-lg font-bold ${styles.labelText} mb-1`}>カテゴリ {MODE_EMOJIS[aiMode]?.category || MODE_EMOJIS['gal'].category}</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={`border-2 ${styles.inputBorder} rounded-full px-4 py-2 w-full ${styles.inputText} font-bold ${styles.inputBg}`}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button className={`${styles.btnPrimary} text-white rounded-full px-6 py-3 w-full mt-2 text-lg font-bold shadow-lg hover:scale-105 transition-all border-2 ${styles.btnBorder} flex items-center gap-2`} onClick={() => {
            if (!name || (hour === null && min === null)) return;
            setActivities([...activities, { id: Date.now(), name, hour: hour ?? 0, min: min ?? 0, category }]);
            setName(""); setHour(null); setMin(null); setCategory(categories[0]);
          }}><span className="mr-2">{MODE_EMOJIS[aiMode]?.btnPrimary || '💖'}</span>活動を追加する！</button>
        </div>
  <button className={`bg-white ${styles.heading} border-2 ${styles.whiteBtnBorder} rounded-full px-6 py-3 mb-2 text-lg font-bold shadow hover:bg-pink-50 flex items-center gap-2`} onClick={() => setView("home")}><span className="mr-2">{MODE_EMOJIS[aiMode]?.btnHome || '🏠'}</span>ホームに戻る</button>
  <button className={`${styles.btnPrimary} text-white rounded-full px-6 py-3 text-lg font-bold shadow-lg hover:scale-105 transition-all border-2 ${styles.btnBorder} flex items-center gap-2`} onClick={() => { if (activities.length > 0) setView("result"); }}><span className="mr-2">{MODE_EMOJIS[aiMode]?.btnPrimary || '🌟'}</span>完了して結果みる</button>
      </div>
    );
  }

  if (view === "personality") {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${styles.bg} p-4 ${styles.font || ''}`}>
        <h2 className={`text-2xl font-extrabold mb-4 ${styles.heading}`}>性格診断 — あなたに合ったアドバイスのために</h2>
        <div className={`w-full max-w-md ${styles.cardBg} rounded-2xl p-6 border-2 ${styles.cardBorder} shadow`}>
          <div className="mb-4">
            <div className="font-bold mb-2">質問1: 予定を立てる時、あなたは？</div>
            <div className="flex flex-col gap-2">
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q1 === 'a' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ1('a')}
                aria-pressed={q1 === 'a'}
              >
                <span>A: しっかり計画を立てる</span>
                {q1 === 'a' && <span className="ml-2">✅</span>}
              </button>
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q1 === 'b' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ1('b')}
                aria-pressed={q1 === 'b'}
              >
                <span>B: アイデアや気分で決める</span>
                {q1 === 'b' && <span className="ml-2">✅</span>}
              </button>
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q1 === 'c' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ1('c')}
                aria-pressed={q1 === 'c'}
              >
                <span>C: 友達や同僚と合わせる</span>
                {q1 === 'c' && <span className="ml-2">✅</span>}
              </button>
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q1 === 'd' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ1('d')}
                aria-pressed={q1 === 'd'}
              >
                <span>D: 無理せずゆるく</span>
                {q1 === 'd' && <span className="ml-2">✅</span>}
              </button>
            </div>
          </div>
          <div className="mb-4">
            <div className="font-bold mb-2">質問2: 仕事や勉強の進め方は？</div>
            <div className="flex flex-col gap-2">
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q2 === 'a' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ2('a')}
                aria-pressed={q2 === 'a'}
              >
                <span>A: リストや締切で管理する</span>
                {q2 === 'a' && <span className="ml-2">✅</span>}
              </button>
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q2 === 'b' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ2('b')}
                aria-pressed={q2 === 'b'}
              >
                <span>B: アイデアを優先して動く</span>
                {q2 === 'b' && <span className="ml-2">✅</span>}
              </button>
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q2 === 'c' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ2('c')}
                aria-pressed={q2 === 'c'}
              >
                <span>C: 誰かと一緒に進めるのが好き</span>
                {q2 === 'c' && <span className="ml-2">✅</span>}
              </button>
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q2 === 'd' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ2('d')}
                aria-pressed={q2 === 'd'}
              >
                <span>D: 着実に続ける</span>
                {q2 === 'd' && <span className="ml-2">✅</span>}
              </button>
            </div>
          </div>
          <div className="mb-4">
            <div className="font-bold mb-2">質問3: 休日の過ごし方は？</div>
            <div className="flex flex-col gap-2">
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q3 === 'a' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ3('a')}
                aria-pressed={q3 === 'a'}
              >
                <span>A: 予定を作って動く</span>
                {q3 === 'a' && <span className="ml-2">✅</span>}
              </button>
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q3 === 'b' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ3('b')}
                aria-pressed={q3 === 'b'}
              >
                <span>B: 創作や趣味に没頭する</span>
                {q3 === 'b' && <span className="ml-2">✅</span>}
              </button>
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q3 === 'c' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ3('c')}
                aria-pressed={q3 === 'c'}
              >
                <span>C: 友達と会う</span>
                {q3 === 'c' && <span className="ml-2">✅</span>}
              </button>
              <button
                className={`text-left p-2 rounded border ${styles.inputBorder} flex items-center justify-between transition-transform ${q3 === 'd' ? `${styles.btnPrimary} text-white transform scale-105` : `${styles.inputBg} ${styles.inputText}`}`}
                onClick={() => setQ3('d')}
                aria-pressed={q3 === 'd'}
              >
                <span>D: 家でゆっくり過ごす</span>
                {q3 === 'd' && <span className="ml-2">✅</span>}
              </button>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button className={`px-4 py-2 rounded-full ${styles.btnPrimary} text-white`} onClick={() => { setQ1(''); setQ2(''); setQ3(''); }}>リセット</button>
            <button className={`px-4 py-2 rounded-full ${styles.btnAccent} text-white`} onClick={() => {
              const persona = computePersona(q1, q2, q3);
              setPersonality(persona);
              setQ1(''); setQ2(''); setQ3('');
              setView('home');
            }}>診断を完了して保存</button>
          </div>
        </div>
        <button className={`mt-6 ${styles.btnPrimary} text-white rounded-full px-6 py-3`} onClick={() => setView('home')}>戻る</button>
      </div>
    );
  }

  if (view === "result") {
    return (
  <div className={`min-h-screen flex flex-col items-center justify-center ${styles.bg} p-4 ${styles.font || ''} pop-shadow`}>
  <h2 className={`text-3xl font-extrabold mb-4 ${styles.heading} flex items-center gap-2`}>{MODE_TEXTS[aiMode]?.resultHeading || MODE_TEXTS['gal'].resultHeading}</h2>
        
        <div className={`w-56 h-56 mb-4 ${styles.cardBg} rounded-full shadow-xl border-4 ${styles.cardBorder} flex items-center justify-center`}>
          <Pie data={pieData} />
        </div>
        <div className={`mb-4 text-lg font-bold ${styles.inputText} ${styles.cardBg} rounded-xl p-4 border-2 ${styles.cardBorder} shadow`}>
          <div className="mb-2 flex items-center gap-2"><span>{MODE_EMOJIS[aiMode]?.advice || MODE_EMOJIS['gal'].advice} アドバイス:</span></div>
          <div>
            {adviceLoading ? "AIが考え中..." : Array.isArray(advice) ? (
              <ul className="list-disc pl-6 mt-2">
                {advice.map((msg: string, idx: number) => <li key={idx}>{msg}</li>)}
              </ul>
            ) : <div className="mt-2">{advice}</div>}
          </div>
        </div>
        {/* 1ヶ月後予測 */}
        <div className="mb-4 w-full max-w-xs">
          <button
            className={`${styles.btnAccent} text-white rounded-full px-4 py-2 mb-2 text-md font-bold shadow hover:scale-105 transition-all`}
            onClick={async () => {
              if (activities.length === 0) return alert('まずは活動を追加してください');
              setPredictionLoading(true);
              setPrediction("");
              try {
                const modeInstrPred = MODE_INSTRUCTIONS[aiMode]?.prediction || MODE_INSTRUCTIONS['gal'].prediction;
                const personaNotePred = personality ? `ユーザーの性格: ${PERSONA_DISPLAY[personality] || personality}\n${PERSONA_PROMPTS[personality as string] || 'その性格を考慮して予測してください。'}` : '';
                const prompt = `${modeInstrPred}\n${personaNotePred}\n以下の活動配分を毎日このまま続けた場合、1ヶ月後にどのような生活や健康、作業効率の変化が起きるかを日本語で予測してください。箇条書きで「良くなる点」「悪くなる可能性」「短い対策（1〜2行）」をそれぞれ2〜3項目ずつ示してください。活動一覧:\n${activities.map(a => `${a.name}(${a.category}): ${a.hour}時間${a.min}分`).join('\n')}`;
                const res = await fetch('/api/gemini', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt }),
                });
                const data = await res.json();
                setPrediction(data.result || '予測の取得に失敗しました');
              } catch (e) {
                console.error(e);
                setPrediction('予測の取得に失敗しました');
              } finally {
                setPredictionLoading(false);
              }
            }}
          >{predictionLoading ? '予測中...' : `${MODE_EMOJIS[aiMode]?.predict || MODE_EMOJIS['gal'].predict} 1ヶ月後を予測する`}</button>

          {prediction && (
            <div className="bg-white rounded-xl p-3 border-2 border-yellow-100 shadow text-sm text-gray-800">
              <div className="font-bold text-yellow-700 mb-2">1ヶ月後の予測</div>
              <div className="whitespace-pre-line">{prediction}</div>
            </div>
          )}
        </div>
    <button className={`${styles.btnPrimary} text-white rounded-full px-6 py-3 mb-2 text-lg font-bold shadow-lg hover:scale-105 transition-all border-2 ${styles.btnBorder} flex items-center gap-2`} onClick={() => { setActivities([]); setView("input"); setAdvice(""); }}><span className="mr-2">{MODE_EMOJIS[aiMode]?.btnAgain || '🔄'}</span>もう一度入力</button>
  <button className={`bg-white ${styles.heading} border-2 ${styles.whiteBtnBorder} rounded-full px-6 py-3 text-lg font-bold shadow hover:bg-pink-50 flex items-center gap-2`} onClick={() => { const now = new Date(); const dateStr = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getDate().toString().padStart(2,"0")} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`; const activitiesCopy = activities.map(a => ({ ...a })); setHistory([...history, { activities: activitiesCopy, date: dateStr }]); setActivities([]); setView("home"); setAdvice(""); }}><span className="mr-2">{MODE_EMOJIS[aiMode]?.btnHome || '🏠'}</span>ホームに戻る</button>
      </div>
    );
  }

  if (view === "history") {
    return (
  <div className={`min-h-screen flex flex-col items-center justify-center ${styles.bg} p-4 ${styles.font || ''} pop-shadow`}>
        <h2 className="text-3xl font-extrabold mb-4 text-pink-500 flex items-center gap-2">{MODE_EMOJIS[aiMode]?.title || '🌟'} 過去の配分記録 {MODE_EMOJIS[aiMode]?.subtitle || ''}</h2>
        <div className="w-full max-w-xs mb-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <button className={`${styles.btnPrimary} text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg hover:scale-105 transition-all border-2 ${styles.btnBorder} flex items-center gap-2`} onClick={async () => {
              if (history.length === 0) return alert('履歴がありません');
              setHistoryAdviceLoading(true);
              setHistoryAdvice("");
              try {
                const modeInstr = MODE_INSTRUCTIONS[aiMode]?.advice || MODE_INSTRUCTIONS['gal'].advice;
                const personaNoteHist = personality ? `ユーザーの性格: ${PERSONA_DISPLAY[personality] || personality}\n${PERSONA_PROMPTS[personality as string] || '性格に合わせたアドバイスを重視してください。'}` : '';
                const prompt = `${modeInstr}\n${personaNoteHist}\n以下はあなたの過去の記録（日時ごとの活動一覧）です。各日の活動を参考に、全体の傾向、良い点、改善点、具体的な次のアクション（短く）をそれぞれ2〜3項目ずつ日本語で示してください。履歴:\n${history.map(h => `日付: ${h.date}\n${(h.activities as Activity[]).map(a=> `- ${a.name}(${a.category}): ${a.hour}時間${a.min}分`).join('\n')}`).join('\n\n')}`;
                const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
                const data = await res.json();
                setHistoryAdvice(data.result || '分析の取得に失敗しました');
              } catch (e) {
                console.error(e);
                setHistoryAdvice('分析の取得に失敗しました');
              } finally {
                setHistoryAdviceLoading(false);
              }
            }}><span className="mr-1">{MODE_EMOJIS[aiMode]?.predict || '🔮'}</span>履歴を分析してアドバイス</button>
            <button className={`bg-white ${styles.heading} rounded-full px-4 py-2 text-sm font-bold shadow hover:bg-gray-50 border-2 ${styles.whiteBtnBorder} flex items-center gap-2`} onClick={() => { setHistory([]); localStorage.removeItem('jibun_timer_history'); }}><span className="mr-1">🧹</span>履歴を消去</button>
          </div>
          {historyAdviceLoading ? <div className="text-sm text-gray-600">AIが分析中です...</div> : historyAdvice ? <div className={`bg-white rounded-xl p-3 border-2 ${styles.cardBorder} shadow text-sm text-gray-800`}><div className="font-bold mb-2">履歴からのアドバイス</div><div className="whitespace-pre-line">{historyAdvice}</div></div> : null}
        </div>
          {history.length === 0 ? (
            <div className={`text-center font-bold text-lg ${styles.labelText} ${MODE_EMPTY_EXTRA_CLASS[aiMode] || ''}`}>
              <span className="mr-2">{MODE_EMOJIS[aiMode]?.subtitle || ''}</span>
              {MODE_EMPTY_MESSAGES[aiMode] || '記録がありません'}
            </div>
          ) : (
            <div>
              {history.map((record, i) => (
                <div key={i} className={`mb-6 ${styles.cardBg} rounded-xl shadow-lg p-4 border-2 ${styles.cardBorder}`}>
                  <div className="text-lg font-bold text-pink-500 mb-2 flex items-center gap-2">🗓️ {record.date}</div>
                  <div className="flex gap-1">
                    {categories.map((cat, idx) => {
                      const min = (record.activities as Activity[])
                        .filter((a: Activity) => a.category === cat)
                        .reduce((sum: number, a: Activity) => sum + a.hour * 60 + a.min, 0);
                      return (
                        <div
                          key={cat}
                          className="h-4 rounded-full"
                          style={{
                            width: `${min / 14.4}%`,
                            background: [
                              "#FF6384",
                              "#36A2EB",
                              "#FFCE56",
                              "#4BC0C0",
                              "#9966FF",
                            ][idx],
                          }}
                          title={cat + ": " + min + "分"}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
  <button className={`${styles.btnPrimary} text-white rounded-full px-6 py-3 text-lg font-bold shadow-lg hover:scale-105 transition-all border-2 ${styles.btnBorder} flex items-center gap-2`} onClick={() => setView("home")}><span className="mr-2">{MODE_EMOJIS[aiMode]?.btnHome || '🏠'}</span>ホームに戻る</button>
      </div>
    );
  }
}