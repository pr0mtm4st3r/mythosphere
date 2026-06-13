import { useState, useEffect } from "react";
import { Link2, Play, ExternalLink, Gamepad2, Sparkles, Search, X } from "lucide-react";
import { supabase } from "./supabaseClient";

function formatPlays(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return (n || 0).toString();
}

function getHost(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// Deterministic accent color per game, based on title
const COLORS = ["#D97757", "#6B7FD7", "#5FAE6E", "#C75D5D", "#9C7FD9", "#D9A35F"];
function colorFor(title = "") {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) % COLORS.length;
  return COLORS[Math.abs(hash)];
}

function GameCard({ game, onOpen }) {
  const color = colorFor(game.title);
  return (
    <button
      onClick={() => onOpen(game)}
      className="group text-left bg-[#1C1B1A] border border-[#2E2C2A] rounded-lg overflow-hidden hover:border-[#D97757] transition-colors duration-200 flex flex-col"
    >
      <div
        className="h-32 w-full relative flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}33, #15140F)` }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, ${color}55 0%, transparent 40%), radial-gradient(circle at 80% 70%, ${color}33 0%, transparent 45%)`
          }}
        />
        <Gamepad2 className="relative z-10 w-8 h-8 transition-transform duration-300 group-hover:scale-110" style={{ color }} strokeWidth={1.5} />
        <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-[#15140F]/80 text-[#A8A29B] border border-[#2E2C2A]">
          {game.embeddable ? "Play here" : "Opens externally"}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="font-serif text-lg text-[#F4F1EA] leading-tight">{game.title}</h3>
        <p className="text-sm text-[#A8A29B] leading-snug">{game.tagline}</p>
        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-[#6E6A64]">
          <span>by {game.creator}</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {formatPlays(game.plays)} plays
          </span>
        </div>
      </div>
    </button>
  );
}

function GameDetail({ game, onClose }) {
  const [playing, setPlaying] = useState(false);
  const color = colorFor(game.title);

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
                src={game.url}
                sandbox="allow-scripts allow-pointer-lock allow-same-origin"
                className="w-full h-full border-0"
                title={game.title}
              />
            </div>
            <button onClick={() => setPlaying(false)} className="absolute top-3 right-3 p-1.5 rounded-full bg-[#15140F]/70 text-[#A8A29B] hover:text-[#F4F1EA] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className="h-40 relative flex items-end p-5"
            style={{ background: `linear-gradient(135deg, ${color}44, #15140F)` }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{ backgroundImage: `radial-gradient(circle at 25% 25%, ${color}66 0%, transparent 45%)` }}
            />
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
            <span>{formatPlays(game.plays)} plays</span>
            <span className="flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              {getHost(game.url)}
            </span>
          </div>

          {game.embeddable ? (
            <button
              onClick={() => setPlaying(true)}
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
    title: "",
    tagline: "",
    description: "",
    url: "",
    prompt: "",
    creator: "",
    model: "Mythos"
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title || !form.url) {
      setError("Title and URL are required.");
      return;
    }
    setSaving(true);
    setError(null);

    let embeddable = false;
    try {
      const checkRes = await fetch("/api/check-embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url })
      });
      const checkData = await checkRes.json();
      embeddable = !!checkData.embeddable;
    } catch {
      // If the check itself fails, default to not embeddable
      embeddable = false;
    }

    const { error: insertError } = await supabase.from("games").insert([
      {
        title: form.title,
        tagline: form.tagline,
        description: form.description,
        url: form.url,
        prompt: form.prompt,
        creator: form.creator || "anonymous",
        model: form.model,
        embeddable,
        plays: 0
      }
    ]);

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onSubmitted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1C1B1A] border border-[#2E2C2A] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#F4F1EA]">Submit a game</h2>
          <button onClick={onClose} className="text-[#6E6A64] hover:text-[#F4F1EA] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[#A8A29B] leading-relaxed">
          Link to a game that's already playable somewhere — GitHub Pages, itch.io, your own site.
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#6E6A64]">Game URL *</label>
          <div className="relative">
            <Link2 className="w-4 h-4 text-[#6E6A64] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={form.url}
              onChange={update("url")}
              placeholder="https://yourname.GitHub.io/your-game"
              className="w-full bg-[#15140F] border border-[#2E2C2A] rounded-md pl-9 pr-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#6E6A64] focus:outline-none focus:border-[#D97757]"
            />
          </div>
        </div>

        <input
          value={form.title}
          onChange={update("title")}
          placeholder="Game title *"
          className="bg-[#15140F] border border-[#2E2C2A] rounded-md px-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#6E6A64] focus:outline-none focus:border-[#D97757]"
        />
        <input
          value={form.tagline}
          onChange={update("tagline")}
          placeholder="One-line tagline"
          className="bg-[#15140F] border border-[#2E2C2A] rounded-md px-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#6E6A64] focus:outline-none focus:border-[#D97757]"
        />
        <textarea
          value={form.description}
          onChange={update("description")}
          placeholder="Short description"
          rows={2}
          className="bg-[#15140F] border border-[#2E2C2A] rounded-md px-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#6E6A64] focus:outline-none focus:border-[#D97757] resize-none"
        />
        <textarea
          value={form.prompt}
          onChange={update("prompt")}
          placeholder="The prompt you used to generate it (optional)"
          rows={2}
          className="bg-[#15140F] border border-[#2E2C2A] rounded-md px-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#6E6A64] focus:outline-none focus:border-[#D97757] resize-none"
        />
        <input
          value={form.creator}
          onChange={update("creator")}
          placeholder="Your name / handle"
          className="bg-[#15140F] border border-[#2E2C2A] rounded-md px-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#6E6A64] focus:outline-none focus:border-[#D97757]"
        />

        <select
          value={form.model}
          onChange={update("model")}
          className="bg-[#15140F] border border-[#2E2C2A] rounded-md px-3 py-2 text-sm text-[#A8A29B] focus:outline-none focus:border-[#D97757]"
        >
          <option>Mythos</option>
          <option>Claude</option>
          <option>GPT</option>
          <option>Gemini</option>
          <option>Other</option>
        </select>

        {error && <p className="text-sm text-[#C75D5D]">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full rounded-md py-2.5 text-sm font-medium bg-[#D97757] text-[#15140F] disabled:opacity-60"
        >
          {saving ? "Checking & submitting..." : "Submit"}
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
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const fetchGames = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setGames(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const filtered = games.filter((g) => {
    if (filter !== "all" && g.model !== filter) return false;
    if (query) {
      const q = query.toLowerCase();
      const inTitle = g.title?.toLowerCase().includes(q);
      const inTagline = g.tagline?.toLowerCase().includes(q);
      if (!inTitle && !inTagline) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#15140F] text-[#F4F1EA]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
        .font-serif { font-family: 'Fraunces', serif; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#15140F]/90 backdrop-blur-md border-b border-[#2E2C2A]">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#D97757] flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-[#15140F]" strokeWidth={2.5} />
            </div>
            <span className="font-serif text-lg tracking-tight">Mythosphere</span>
          </div>
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-1.5 text-sm font-medium bg-[#D97757] text-[#15140F] rounded-md px-3.5 py-2 hover:bg-[#E08B6F] transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Submit a link
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#D97757] mb-3">One prompt. A whole world.</p>
        <h1 className="font-serif text-3xl sm:text-4xl leading-tight max-w-md">
          Where AI-generated games go to be played.
        </h1>
        <p className="text-sm text-[#A8A29B] mt-3 max-w-md leading-relaxed">
          A catalog of games generated from a single prompt, hosted wherever their creators put them. Find something to play, or add your own — just paste the link.
        </p>
      </section>

      {/* Search + filters */}
      <section className="max-w-5xl mx-auto px-4 pb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-[#6E6A64] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games"
            className="w-full bg-[#1C1B1A] border border-[#2E2C2A] rounded-md pl-9 pr-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#6E6A64] focus:outline-none focus:border-[#D97757]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "Mythos", "Claude", "GPT", "Gemini"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                filter === f
                  ? "border-[#D97757] text-[#D97757]"
                  : "border-[#2E2C2A] text-[#A8A29B] hover:text-[#F4F1EA]"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <main className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="py-20 text-center text-[#6E6A64] text-sm">Loading games...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-[#6E6A64] text-sm">
            No games match that search. Try something else, or be the first to submit one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((g) => (
              <GameCard key={g.id} game={g} onOpen={setSelectedGame} />
            ))}
          </div>
        )}
      </main>

      {/* Footer note */}
      <footer className="max-w-5xl mx-auto px-4 pb-10">
        <div className="border-t border-[#2E2C2A] pt-5 flex items-center gap-2 text-xs text-[#6E6A64]">
          <Link2 className="w-3.5 h-3.5" />
          <span>Games are hosted by their creators. We just link to them.</span>
        </div>
      </footer>

      {selectedGame && <GameDetail game={selectedGame} onClose={() => setSelectedGame(null)} />}
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} onSubmitted={fetchGames} />}
    </div>
  );
}
