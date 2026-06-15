import { useState, useEffect, useRef } from "react";
import { Link2, Play, ExternalLink, Gamepad2, Sparkles, Search, X, ArrowUp, Share2, Maximize2, Info, Flame, Star } from "lucide-react";
import { supabase } from "./supabaseClient";

const CATEGORIES = ["Arcade", "Puzzle", "Exploration", "Platformer", "Strategy", "Idle", "Other"];
const CATEGORY_ICONS = {
  Arcade: "🕹️",
  Puzzle: "🧩",
  Exploration: "🧭",
  Platformer: "🏃",
  Strategy: "♟️",
  Idle: "⏳",
  Other: "✨",
};
const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "upvotes", label: "Most upvoted" },
  { key: "plays", label: "Most played" },
];

function hasVoted(gameId) { return localStorage.getItem(`voted_${gameId}`) === "1"; }
function markVoted(gameId) { localStorage.setItem(`voted_${gameId}`, "1"); }
function formatPlays(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return (n || 0).toString();
}
function getHost(url) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}
function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}
const COLORS = ["#D97757", "#6B7FD7", "#5FAE6E", "#C75D5D", "#9C7FD9", "#D9A35F"];
function colorFor(title = "") {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) % COLORS.length;
  return COLORS[Math.abs(hash)];
}

// Ambient floating particles for the hero
const HERO_PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: Math.round((i * 137) % 100),
  size: 3 + (i % 4) * 2,
  duration: 14 + (i % 5) * 4,
  delay: -(i * 2.3),
  color: COLORS[i % COLORS.length],
}));

function UpvoteButton({ game, onUpvote, size = "sm" }) {
  const voted = hasVoted(game.id);
  const [bursting, setBursting] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (voted) return;
    setBursting(true);
    onUpvote(game);
    setTimeout(() => setBursting(false), 700);
  };

  const sparkles = bursting
    ? Array.from({ length: 6 }, (_, i) => ({
        id: i,
        angle: (i / 6) * 360,
        delay: i * 30,
      }))
    : [];

  const baseClass = size === "lg"
    ? "flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium border transition-all"
    : "flex items-center gap-1 px-2 py-1 rounded-md border transition-all";

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={voted}
        className={`${baseClass} ${bursting ? "scale-110" : "scale-100"} ${voted ? "border-[#D97757] text-[#D97757]" : "border-[#2E2C2A] text-[#A8A29B] hover:text-[#F4F1EA] hover:border-[#D97757]"}`}
        style={{ transitionDuration: bursting ? "150ms" : "300ms" }}
      >
        <ArrowUp className={`${size === "lg" ? "w-4 h-4" : "w-3 h-3"} ${bursting ? "animate-bounce-once" : ""}`} />
        {size === "lg" ? `${voted ? "Upvoted" : "Upvote"} (${game.upvotes || 0})` : (game.upvotes || 0)}
      </button>
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="absolute left-1/2 top-1/2 text-xs pointer-events-none animate-sparkle"
          style={{
            "--angle": `${s.angle}deg`,
            animationDelay: `${s.delay}ms`,
            color: colorFor(game.title),
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

function AboutModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1C1B1A] border border-[#2E2C2A] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[#F4F1EA]">About PromtForge</h2>
            <button onClick={onClose} className="text-[#6E6A64] hover:text-[#F4F1EA] transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-col gap-4 text-sm text-[#C7C2B8] leading-relaxed">
            <div>
              <h3 className="font-serif text-base text-[#F4F1EA] mb-1">What is this?</h3>
              <p>PromtForge is a community catalog of games built entirely by AI — from a single prompt.</p>
              <p className="mt-2">With the arrival of powerful AI models like Claude Mythos, GPT, and Gemini, anyone can now generate a fully playable game in seconds. No coding experience needed. Just a prompt and an idea.</p>
              <p className="mt-2">The problem? These games are scattered across GitHub Pages, itch.io, personal sites, and Discord servers — with no central place to find them, play them, or appreciate them. That's what PromtForge is for.</p>
            </div>
            <div>
              <h3 className="font-serif text-base text-[#F4F1EA] mb-1">What kind of games are here?</h3>
              <p>Everything from tiny arcade games and puzzle experiments to full atmospheric experiences — all generated by AI from a text prompt. Some run directly in your browser. Others link out to where the creator hosted them.</p>
            </div>
            <div>
              <h3 className="font-serif text-base text-[#F4F1EA] mb-2">How do I submit a game?</h3>
              <div className="flex flex-col gap-2">
                {[
                  "Click \"Submit a link\" in the top right corner",
                  "Paste the URL where your game is playable (GitHub Pages, itch.io, Vercel — anything works)",
                  "Fill in a title, a short tagline, and optionally the prompt you used",
                  "Choose the AI model and a category",
                  "Hit Submit — your game appears immediately"
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-[#D97757] font-medium text-xs mt-0.5 w-4 shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#15140F] border border-[#2E2C2A] rounded-md p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6E6A64] mb-1">Free hosting options for HTML5 games</p>
              <p className="text-[#A8A29B]">GitHub Pages, Vercel, or itch.io — all free and work great with AI-generated HTML/JS games.</p>
            </div>
            <p className="text-[#6E6A64] text-xs">PromtForge was built by people who believe AI-generated games are about to become a massive creative movement — and wanted a home for them before the wave hits.</p>
          </div>
          <button onClick={onClose} className="w-full rounded-md py-2.5 text-sm font-medium bg-[#D97757] text-[#15140F]">
            Got it — let me explore
          </button>
        </div>
      </div>
    </div>
  );
}

function GameCard({ game, onOpen, onUpvote }) {
  const color = colorFor(game.title);
  return (
    <div
      className="group bg-[#1C1B1A] border border-[#2E2C2A] rounded-lg overflow-hidden hover:border-[#D97757] hover:scale-[1.02] hover:shadow-[0_0_24px_var(--glow)] transition-all duration-300 flex flex-col"
      style={{ "--glow": `${color}40` }}
    >
      <button onClick={() => onOpen(game)} className="text-left flex flex-col flex-1">
        <div
          className="h-36 w-full relative flex items-center justify-center overflow-hidden"
          style={game.thumbnail_url
            ? { backgroundImage: `url(${game.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: `linear-gradient(135deg, ${color}33, #15140F)` }
          }
        >
          {!game.thumbnail_url && (
            <>
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(circle at 20% 30%, ${color}55 0%, transparent 40%), radial-gradient(circle at 80% 70%, ${color}33 0%, transparent 45%)` }} />
              <Gamepad2 className="relative z-10 w-8 h-8 transition-transform duration-300 group-hover:scale-110" style={{ color }} strokeWidth={1.5} />
            </>
          )}
          {game.thumbnail_url && <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />}
          <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-[#15140F]/80 text-[#A8A29B] border border-[#2E2C2A]">
            {game.embeddable ? "Play here" : "Opens externally"}
          </span>
          {game.category && (
            <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-[#15140F]/80 border border-[#2E2C2A]" style={{ color }}>
              <span>{CATEGORY_ICONS[game.category] || "✨"}</span>
              {game.category}
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col gap-1.5 flex-1">
          <h3 className="font-serif text-lg text-[#F4F1EA] leading-tight">{game.title}</h3>
          <p className="text-sm text-[#A8A29B] leading-snug">{game.tagline}</p>
        </div>
      </button>
      <div className="px-4 pb-4 flex items-center justify-between text-xs text-[#6E6A64]">
        <span>by {game.creator}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{formatPlays(game.plays)} plays</span>
          <UpvoteButton game={game} onUpvote={onUpvote} />
        </div>
      </div>
    </div>
  );
}

function RecommendedSection({ games, onOpen, onUpvote }) {
  if (!games || games.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-[#D97757]" fill="#D97757" />
        <h2 className="font-serif text-lg text-[#F4F1EA]">Recommended</h2>
        <span className="text-xs text-[#6E6A64]">— hand-picked by the team</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {games.map((g) => (
          <div key={g.id} className="relative">
            <span className="absolute -top-2 -right-2 z-10 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D97757] text-[#15140F]">
              <Star className="w-2.5 h-2.5" fill="#15140F" />
              Pick
            </span>
            <GameCard game={g} onOpen={onOpen} onUpvote={onUpvote} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({ game, onOpen, onUpvote }) {
  const color = colorFor(game.title);
  const hasUpvotes = (game.upvotes || 0) > 0;

  return (
    <button
      onClick={() => onOpen(game)}
      className="group w-full text-left bg-[#1C1B1A] border border-[#2E2C2A] rounded-xl overflow-hidden hover:border-[#D97757] transition-all duration-300 flex flex-col sm:flex-row"
      style={{ "--glow": `${color}40` }}
    >
      <div
        className="h-40 sm:h-auto sm:w-64 shrink-0 relative flex items-center justify-center overflow-hidden"
        style={game.thumbnail_url
          ? { backgroundImage: `url(${game.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: `linear-gradient(135deg, ${color}44, #15140F)` }
        }
      >
        {!game.thumbnail_url && (
          <>
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `radial-gradient(circle at 30% 30%, ${color}66 0%, transparent 50%)` }} />
            <Gamepad2 className="relative z-10 w-10 h-10 transition-transform duration-300 group-hover:scale-110" style={{ color }} strokeWidth={1.5} />
          </>
        )}
        {game.thumbnail_url && <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />}
        <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-[#15140F]/85 border border-[#2E2C2A]" style={{ color: hasUpvotes ? "#D9A35F" : color }}>
          {hasUpvotes ? <Flame className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {hasUpvotes ? "Most loved" : "Featured"}
        </span>
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          {game.category && <span className="text-sm">{CATEGORY_ICONS[game.category] || "✨"}</span>}
          <h3 className="font-serif text-xl text-[#F4F1EA] leading-tight">{game.title}</h3>
        </div>
        <p className="text-sm text-[#A8A29B] leading-snug">{game.tagline}</p>
        {game.description && <p className="text-sm text-[#6E6A64] leading-relaxed line-clamp-2 mt-1">{game.description}</p>}
        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-[#6E6A64]">
          <span>by {game.creator}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{formatPlays(game.plays)} plays</span>
            <UpvoteButton game={game} onUpvote={onUpvote} />
          </div>
        </div>
      </div>
    </button>
  );
}

function GameDetail({ game, onClose, onUpvote, onPlay }) {
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);
  const color = colorFor(game.title);

  const handleShare = () => {
    const url = `${window.location.origin}?game=${game.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) iframeRef.current.requestFullscreen();
      else if (iframeRef.current.webkitRequestFullscreen) iframeRef.current.webkitRequestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1C1B1A] border border-[#2E2C2A] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {playing && game.embeddable ? (
          <div className="relative bg-black">
            <div className="aspect-video w-full">
              <iframe
                ref={iframeRef}
                src={game.url}
                sandbox="allow-scripts allow-pointer-lock allow-same-origin"
                className="w-full h-full border-0"
                title={game.title}
              />
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              <button onClick={handleFullscreen} className="p-1.5 rounded-full bg-[#15140F]/70 text-[#A8A29B] hover:text-[#F4F1EA] transition-colors" title="Fullscreen">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setPlaying(false)} className="p-1.5 rounded-full bg-[#15140F]/70 text-[#A8A29B] hover:text-[#F4F1EA] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="h-44 relative flex items-end p-5"
            style={game.thumbnail_url
              ? { backgroundImage: `url(${game.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: `linear-gradient(135deg, ${color}44, #15140F)` }
            }
          >
            {!game.thumbnail_url && <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, ${color}66 0%, transparent 45%)` }} />}
            {game.thumbnail_url && <div className="absolute inset-0 bg-black/50" />}
            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-[#15140F]/70 text-[#A8A29B] hover:text-[#F4F1EA] transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="relative z-10">
              <h2 className="font-serif text-2xl text-[#F4F1EA]">{game.title}</h2>
              <p className="text-sm text-[#D9D5CD] mt-1">{game.tagline}</p>
            </div>
          </div>
        )}

        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-[#C7C2B8] leading-relaxed">{game.description}</p>
          {game.prompt && (
            <div className="bg-[#15140F] border border-[#2E2C2A] rounded-md p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6E6A64] mb-1">Original prompt</p>
              <p className="text-sm text-[#A8A29B] italic leading-relaxed">"{game.prompt}"</p>
            </div>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#6E6A64]">
            <span>Creator: <span className="text-[#A8A29B]">{game.creator}</span></span>
            <span>Model: <span className="text-[#A8A29B]">{game.model}</span></span>
            {game.category && <span>Category: <span className="text-[#A8A29B]">{CATEGORY_ICONS[game.category] || ""} {game.category}</span></span>}
            <span>{formatPlays(game.plays)} plays</span>
            <span className="flex items-center gap-1"><Link2 className="w-3 h-3" />{getHost(game.url)}</span>
          </div>
          <div className="flex gap-2">
            <UpvoteButton game={game} onUpvote={onUpvote} size="lg" />
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 rounded-md py-2 text-sm border border-[#2E2C2A] text-[#A8A29B] hover:text-[#F4F1EA] hover:border-[#D97757] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
          {game.embeddable ? (
            <button
              onClick={() => { setPlaying(true); onPlay(game); }}
              className="w-full flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors"
              style={{ background: color, color: "#15140F" }}
            >
              <Play className="w-4 h-4" />
              Play here
            </button>
          ) : (
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onPlay(game)}
              className="w-full flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors"
              style={{ background: color, color: "#15140F" }}
            >
              <ExternalLink className="w-4 h-4" />
              Play on {getHost(game.url)}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmitModal({ onClose, onSubmitted }) {
  const [form, setForm] = useState({
    title: "", tagline: "", description: "", url: "",
    prompt: "", creator: "", model: "Mythos", category: "Other", thumbnail_url: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title || !form.url) { setError("Title and URL are required."); return; }
    setSaving(true);
    setError(null);

    const normalizedUrl = normalizeUrl(form.url);

    let embeddable = false;
    try {
      const checkRes = await fetch("/api/check-embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl })
      });
      const checkData = await checkRes.json();
      embeddable = !!checkData.embeddable;
    } catch { embeddable = false; }

    const { error: insertError } = await supabase.from("games").insert([{
      title: form.title, tagline: form.tagline, description: form.description,
      url: normalizedUrl, prompt: form.prompt, creator: form.creator || "anonymous",
      model: form.model, category: form.category,
      thumbnail_url: form.thumbnail_url ? normalizeUrl(form.thumbnail_url) : null,
      embeddable, plays: 0
    }]);
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    onSubmitted();
    onClose();
  };

  const inputClass = "bg-[#15140F] border border-[#2E2C2A] rounded-md px-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#6E6A64] focus:outline-none focus:border-[#D97757]";
  const selectClass = "bg-[#15140F] border border-[#2E2C2A] rounded-md px-3 py-2 text-sm text-[#A8A29B] focus:outline-none focus:border-[#D97757]";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1C1B1A] border border-[#2E2C2A] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 flex flex-col gap-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#F4F1EA]">Submit a game</h2>
          <button onClick={onClose} className="text-[#6E6A64] hover:text-[#F4F1EA] transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-[#A8A29B]">Link to a game that's already playable — GitHub Pages, itch.io, your own site.</p>
        <div className="relative">
          <Link2 className="w-4 h-4 text-[#6E6A64] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={form.url} onChange={update("url")} placeholder="Game URL *" className={`w-full ${inputClass} pl-9`} />
        </div>
        <input value={form.title} onChange={update("title")} placeholder="Game title *" className={inputClass} />
        <input value={form.tagline} onChange={update("tagline")} placeholder="One-line tagline" className={inputClass} />
        <textarea value={form.description} onChange={update("description")} placeholder="Short description" rows={2} className={`${inputClass} resize-none`} />
        <input value={form.thumbnail_url} onChange={update("thumbnail_url")} placeholder="Thumbnail image URL (optional)" className={inputClass} />
        <textarea value={form.prompt} onChange={update("prompt")} placeholder="The prompt you used (optional)" rows={2} className={`${inputClass} resize-none`} />
        <input value={form.creator} onChange={update("creator")} placeholder="Your name / handle" className={inputClass} />
        <div className="flex gap-2">
          <select value={form.model} onChange={update("model")} className={`flex-1 ${selectClass}`}>
            <option>Mythos</option><option>Claude</option><option>GPT</option><option>Gemini</option><option>Other</option>
          </select>
          <select value={form.category} onChange={update("category")} className={`flex-1 ${selectClass}`}>
            {CATEGORIES.map((c) => <option key={c}>{CATEGORY_ICONS[c]} {c}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-[#C75D5D]">{error}</p>}
        <button onClick={handleSubmit} disabled={saving} className="w-full rounded-md py-2.5 text-sm font-medium bg-[#D97757] text-[#15140F] disabled:opacity-60">
          {saving ? "Conjuring..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");

  const fetchGames = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("games").select("*").order("created_at", { ascending: false });
    if (!error && data) setGames(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("game");
    if (gameId) {
      supabase.from("games").select("*").eq("id", gameId).single().then(({ data }) => {
        if (data) setSelectedGame(data);
      });
    }
  }, []);

  const handleUpvote = async (game) => {
    if (hasVoted(game.id)) return;
    markVoted(game.id);
    setGames((prev) => prev.map((g) => g.id === game.id ? { ...g, upvotes: (g.upvotes || 0) + 1 } : g));
    if (selectedGame?.id === game.id) setSelectedGame((g) => ({ ...g, upvotes: (g.upvotes || 0) + 1 }));
    await supabase.from("games").update({ upvotes: (game.upvotes || 0) + 1 }).eq("id", game.id);
  };

  const handleOpen = (game) => {
    setSelectedGame(game);
    window.history.replaceState(null, "", `?game=${game.id}`);
  };

  const handleClose = () => {
    setSelectedGame(null);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const handlePlay = async (game) => {
    setGames((prev) => prev.map((g) => g.id === game.id ? { ...g, plays: (g.plays || 0) + 1 } : g));
    if (selectedGame?.id === game.id) setSelectedGame((g) => ({ ...g, plays: (g.plays || 0) + 1 }));
    await supabase.from("games").update({ plays: (game.plays || 0) + 1 }).eq("id", game.id);
  };

  const noFiltersActive = filter === "all" && categoryFilter === "all" && sort === "newest" && !query;

  const recommended = noFiltersActive
    ? games.filter((g) => g.recommended).slice(0, 4)
    : [];
  const recommendedIds = new Set(recommended.map((g) => g.id));

  const featured = noFiltersActive
    ? [...games].filter((g) => !recommendedIds.has(g.id)).sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))[0] || null
    : null;

  const filtered = games
    .filter((g) => {
      if (recommendedIds.has(g.id)) return false;
      if (featured && g.id === featured.id) return false;
      if (filter !== "all" && g.model !== filter) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!g.title?.toLowerCase().includes(q) && !g.tagline?.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "upvotes") return (b.upvotes || 0) - (a.upvotes || 0);
      if (sort === "plays") return (b.plays || 0) - (a.plays || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="min-h-screen bg-[#15140F] text-[#F4F1EA]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
        .font-serif { font-family: 'Fraunces', serif; }

        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-160px) scale(1.4); opacity: 0; }
        }
        .hero-particle {
          position: absolute;
          bottom: -10px;
          border-radius: 9999px;
          animation: float-up linear infinite;
          pointer-events: none;
        }

        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
          60% { transform: translateY(1px); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.5s ease;
        }

        @keyframes sparkle-burst {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0.6);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-26px) scale(1);
            opacity: 0;
          }
        }
        .animate-sparkle {
          animation: sparkle-burst 0.6s ease-out forwards;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <header className="sticky top-0 z-40 bg-[#15140F]/90 backdrop-blur-md border-b border-[#2E2C2A]">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#D97757] flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-[#15140F]" strokeWidth={2.5} />
              </div>
              <span className="font-serif text-lg tracking-tight">PromtForge</span>
            </div>
            <button onClick={() => setShowAbout(true)} className="text-[#6E6A64] hover:text-[#A8A29B] transition-colors" title="About">
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6E6A64] hidden sm:block">{games.length} worlds and counting</span>
            <button
              onClick={() => setShowSubmit(true)}
              className="flex items-center gap-1.5 text-sm font-medium bg-[#D97757] text-[#15140F] rounded-md px-3.5 py-2 hover:bg-[#E08B6F] transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Submit a link
            </button>
          </div>
        </div>
      </header>

      <section className="relative max-w-5xl mx-auto px-4 pt-10 pb-8 overflow-hidden">
        {HERO_PARTICLES.map((p) => (
          <span
            key={p.id}
            className="hero-particle"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D97757] mb-3">One prompt. A whole world.</p>
          <h1 className="font-serif text-3xl sm:text-4xl leading-tight max-w-md">Where AI-generated games go to be played.</h1>
          <p className="text-sm text-[#A8A29B] mt-3 max-w-md leading-relaxed">
            A catalog of games generated from a single prompt, hosted wherever their creators put them. Find something to play, or{" "}
            <button onClick={() => setShowSubmit(true)} className="text-[#D97757] underline underline-offset-2">add your own</button>.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-[#6E6A64] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search games"
            className="w-full bg-[#1C1B1A] border border-[#2E2C2A] rounded-md pl-9 pr-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#6E6A64] focus:outline-none focus:border-[#D97757]" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-[#6E6A64]">Sort:</span>
          {SORT_OPTIONS.map((s) => (
            <button key={s.key} onClick={() => setSort(s.key)}
              className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${sort === s.key ? "border-[#D97757] text-[#D97757]" : "border-[#2E2C2A] text-[#A8A29B] hover:text-[#F4F1EA]"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
        <span className="text-xs text-[#6E6A64] self-center">Model:</span>
        {["all", "Mythos", "Claude", "GPT", "Gemini"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${filter === f ? "border-[#D97757] text-[#D97757]" : "border-[#2E2C2A] text-[#6E6A64] hover:text-[#F4F1EA]"}`}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-4 flex gap-2 flex-wrap">
        <span className="text-xs text-[#6E6A64] self-center">Category:</span>
        {["all", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${categoryFilter === c ? "border-[#D97757] text-[#D97757]" : "border-[#2E2C2A] text-[#6E6A64] hover:text-[#F4F1EA]"}`}>
            {c === "all" ? "All" : `${CATEGORY_ICONS[c] || ""} ${c}`}
          </button>
        ))}
      </section>

      <main className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="py-20 text-center text-[#6E6A64] text-sm">Conjuring games...</div>
        ) : games.length === 0 ? (
          <div className="py-20 text-center text-[#6E6A64] text-sm">
            Nothing here yet... be the first to{" "}
            <button onClick={() => setShowSubmit(true)} className="text-[#D97757] underline underline-offset-2">summon a game</button>.
          </div>
        ) : (
          <>
            {recommended.length > 0 && (
              <RecommendedSection games={recommended} onOpen={handleOpen} onUpvote={handleUpvote} />
            )}
            {featured && (
              <div className="mb-4">
                <FeaturedCard game={featured} onOpen={handleOpen} onUpvote={handleUpvote} />
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-[#6E6A64] text-sm">
                Nothing matches that. Try a different search, or{" "}
                <button onClick={() => setShowSubmit(true)} className="text-[#D97757] underline underline-offset-2">be the first to submit one</button>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.map((g) => <GameCard key={g.id} game={g} onOpen={handleOpen} onUpvote={handleUpvote} />)}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 pb-10">
        <div className="border-t border-[#2E2C2A] pt-5 flex items-center justify-between text-xs text-[#6E6A64]">
          <div className="flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5" />
            <span>Games are hosted by their creators. We just link to them.</span>
          </div>
          <button onClick={() => setShowAbout(true)} className="hover:text-[#A8A29B] transition-colors">About</button>
        </div>
      </footer>

      {selectedGame && <GameDetail game={selectedGame} onClose={handleClose} onUpvote={handleUpvote} onPlay={handlePlay} />}
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} onSubmitted={fetchGames} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
