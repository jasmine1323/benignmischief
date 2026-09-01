/* =========================================================================
   Shared leaderboard for benign://mischief arcade.

   Backed by Supabase when configured; falls back to this browser's
   localStorage otherwise (so the games are fully playable right away).

   >>> TO GO LIVE: paste your Supabase project URL + public anon key below. <<<
   Both values are safe to embed in client code — the anon key is public and
   your table's Row Level Security controls what it can do (insert + read).
   ========================================================================= */
const LEADERBOARD_CONFIG = {
  supabaseUrl: "",       // e.g. "https://abcdefgh.supabase.co"
  supabaseAnonKey: "",   // e.g. "eyJhbGciOi..." (the public 'anon' key)
  table: "scores",
};

const Leaderboard = (() => {
  const cfg = LEADERBOARD_CONFIG;
  const remote = () => Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);

  const GAMES = [
    { id: "snake", name: "Snake", unit: "" },
    { id: "typing", name: "Typing", unit: "wpm" },
    { id: "2048", name: "2048", unit: "" },
    { id: "tetris", name: "Tetris", unit: "" },
  ];

  function cleanName(name) {
    return String(name || "")
      .replace(/[\u0000-\u001f\u007f]/g, "") // strip control chars, keep spaces
      .replace(/\s+/g, " ")                  // collapse whitespace runs
      .trim()
      .slice(0, 20) || "anon";
  }

  function headers() {
    return {
      apikey: cfg.supabaseAnonKey,
      Authorization: `Bearer ${cfg.supabaseAnonKey}`,
      "Content-Type": "application/json",
    };
  }

  // ----- localStorage fallback ---------------------------------------------
  const lsKey = (game) => `lb:${game}`;
  function lsRead(game) {
    try { return JSON.parse(localStorage.getItem(lsKey(game))) || []; } catch (_) { return []; }
  }
  function lsTop(game, limit) {
    return lsRead(game).sort((a, b) => b.score - a.score).slice(0, limit);
  }
  function lsSubmit(game, name, score) {
    let rows = lsRead(game);
    rows.push({ name, score, created_at: new Date().toISOString() });
    rows.sort((a, b) => b.score - a.score);
    rows = rows.slice(0, 50);
    try { localStorage.setItem(lsKey(game), JSON.stringify(rows)); } catch (_) {}
    return rows.slice(0, 10);
  }

  // ----- public API ---------------------------------------------------------
  async function top(game, limit = 10) {
    if (!remote()) return lsTop(game, limit);
    const url = `${cfg.supabaseUrl}/rest/v1/${cfg.table}` +
      `?select=name,score&game=eq.${encodeURIComponent(game)}` +
      `&order=score.desc&limit=${limit}`;
    try {
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("leaderboard: remote read failed, using local", e);
      return lsTop(game, limit);
    }
  }

  async function submit(game, name, score) {
    name = cleanName(name);
    score = Math.max(0, Math.floor(Number(score) || 0));
    if (!remote()) return lsSubmit(game, name, score);
    const url = `${cfg.supabaseUrl}/rest/v1/${cfg.table}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { ...headers(), Prefer: "return=minimal" },
        body: JSON.stringify({ game, name, score }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.warn("leaderboard: remote write failed, saving locally", e);
      lsSubmit(game, name, score);
    }
    return top(game, 10);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  async function render(game, ulEl, { limit = 10 } = {}) {
    ulEl.innerHTML = `<li class="lb-empty">loading…</li>`;
    const rows = await top(game, limit);
    if (!rows.length) {
      ulEl.innerHTML = `<li class="lb-empty">no scores yet — be the first</li>`;
      return;
    }
    ulEl.innerHTML = rows.map((r, i) => `
      <li>
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${escapeHtml(r.name)}</span>
        <span class="lb-score">${r.score}</span>
      </li>`).join("");
  }

  function isRemote() { return remote(); }

  return { GAMES, top, submit, render, cleanName, isRemote };
})();
