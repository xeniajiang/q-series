import { lib, _status, game, ui } from "noname";
const BATCH_STATE_KEY = "q_series_batch_state";
const XIONG_NAME = "q_xiong_mumu";
const XIONG_YUAN = "q_xiong_yuan";
const XIONG_KU = "q_xiong_ku";
const ANFA_OCCURRED = "q_xiong_anfa_occurred";
const BATCH_AI_EXCLUSIONS = ["zuoci"];
const Q_CHARACTER_NAMES = ["q_agnes", "q_la_maupin", XIONG_NAME];
let runtime = null;
function updateDebug(stage, extra = {}) {
  globalThis.__qBatchDebug = {
    stage,
    at: Date.now(),
    gameIndex: runtime?.gameIndex ?? null,
    metrics: runtime ? { ...runtime.metrics } : {},
    status: {
      auto: _status.auto,
      paused: _status.paused,
      over: _status.over,
      round: game.roundNumber || 0,
      event: _status.event?.name || null
    },
    ...extra
  };
}
function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 1831565813;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
function restrictBatchCharacterPool() {
  const allowed = new Set(Q_CHARACTER_NAMES);
  for (const packName of ["standard", "shenhua"]) {
    for (const name of Object.keys(lib.characterPack[packName] || {})) allowed.add(name);
  }
  const excluded = Object.keys(lib.character).filter((name) => !allowed.has(name));
  lib.config.forbidai.addArray(excluded);
  lib.config.forbidai.addArray(BATCH_AI_EXCLUSIONS);
  lib.config.forbidai.removeArray(Q_CHARACTER_NAMES);
  if (runtime) runtime.metrics.characterPoolSize = [...allowed].filter((name) => Boolean(lib.character[name])).length;
}
function loadState(runId, requestedGames) {
  try {
    const saved = JSON.parse(localStorage.getItem(BATCH_STATE_KEY) || "null");
    if (saved?.runId === runId && saved.requestedGames === requestedGames) {
      return saved;
    }
  } catch {
  }
  return { runId, requestedGames, completedGames: 0, startedAt: Date.now(), results: [] };
}
function saveState(state) {
  localStorage.setItem(BATCH_STATE_KEY, JSON.stringify(state));
}
function aggregateResults(results) {
  const byIdentity = {};
  let wins = 0;
  let anfaGames = 0;
  let totalAnfaRound = 0;
  let totalKuAtAnfa = 0;
  for (const result of results) {
    if (result.targetWon) wins++;
    const identity = result.target?.identity || "unknown";
    byIdentity[identity] ??= { games: 0, wins: 0, winRate: 0 };
    byIdentity[identity].games++;
    if (result.targetWon) byIdentity[identity].wins++;
    if (result.anfaOccurred && typeof result.metrics?.anfaRound === "number") {
      anfaGames++;
      totalAnfaRound += result.metrics.anfaRound;
      totalKuAtAnfa += Number(result.metrics.anfaKu || 0);
    }
  }
  for (const identity of Object.keys(byIdentity)) {
    byIdentity[identity].winRate = byIdentity[identity].games ? byIdentity[identity].wins / byIdentity[identity].games : 0;
  }
  return {
    games: results.length,
    wins,
    winRate: results.length ? wins / results.length : 0,
    byIdentity,
    anfaGames,
    anfaRate: results.length ? anfaGames / results.length : 0,
    avgAnfaRound: anfaGames ? totalAnfaRound / anfaGames : null,
    avgKuAtAnfa: anfaGames ? totalKuAtAnfa / anfaGames : null
  };
}
function makeSummary(state) {
  return {
    runId: state.runId,
    requestedGames: state.requestedGames,
    completedGames: state.completedGames,
    totalDurationMs: Date.now() - state.startedAt,
    xiongMumu: aggregateResults(state.results),
    results: state.results
  };
}
function renderSummary(summary) {
  document.getElementById("q-series-batch-summary")?.remove();
  const panel = document.createElement("div");
  panel.id = "q-series-batch-summary";
  panel.style.cssText = "position:fixed;z-index:100000;left:50%;top:50%;transform:translate(-50%,-50%);width:min(720px,90vw);max-height:85vh;overflow:auto;padding:24px;background:rgba(25,22,32,.97);color:#fff;border:2px solid #d68cff;border-radius:12px;box-shadow:0 10px 40px #000;font:16px/1.6 sans-serif;";
  const stats = summary.xiongMumu || {};
  panel.innerHTML = `<h2 style="margin-top:0">Q-series Batch 完成</h2>
		<p>完成：${summary.completedGames}/${summary.requestedGames}局<br>总耗时：${(summary.totalDurationMs / 1e3).toFixed(1)}秒<br>熊姆姆胜率：${stats.games ? `${stats.wins}/${stats.games}（${(stats.winRate * 100).toFixed(1)}%）` : "无数据"}<br>案发率：${stats.games ? `${stats.anfaGames}/${stats.games}（${(stats.anfaRate * 100).toFixed(1)}%）` : "无数据"}</p>
		<pre style="white-space:pre-wrap;font-size:12px;background:#111;padding:12px;border-radius:6px">${JSON.stringify(stats.byIdentity || {}, null, 2)}</pre>`;
  const download = document.createElement("button");
  download.textContent = "下载 JSON";
  download.style.cssText = "margin-right:12px;padding:8px 14px";
  download.onclick = () => {
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(summary, null, 2)}
`], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${summary.runId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const close = document.createElement("button");
  close.textContent = "关闭";
  close.style.cssText = "padding:8px 14px";
  close.onclick = () => panel.remove();
  panel.append(download, close);
  document.body.appendChild(panel);
}
function renderSummaryWhenReady(summary) {
  const render = () => {
    if (document.body) renderSummary(summary);
    else setTimeout(render, 50);
  };
  setTimeout(render, 0);
}
function renderProgress(state) {
  document.getElementById("q-series-batch-progress")?.remove();
  const badge = document.createElement("div");
  badge.id = "q-series-batch-progress";
  badge.textContent = `Batch ${state.completedGames + 1}/${state.requestedGames}`;
  badge.style.cssText = "position:fixed;z-index:99999;right:12px;top:48px;padding:7px 12px;background:rgba(20,16,28,.9);color:#f1c6ff;border:1px solid #c879f2;border-radius:6px;font:14px sans-serif;";
  document.body.appendChild(badge);
}
function allPlayers() {
  return [...game.players, ...game.dead];
}
function isNamed(player, name) {
  return [player?.name, player?.name1, player?.name2].includes(name);
}
function findTarget() {
  if (!runtime) return void 0;
  return allPlayers().find((player) => isNamed(player, runtime.target));
}
function markCount(player, mark) {
  return player?.countMark?.(mark) || 0;
}
function playerSnapshot(player, target) {
  return {
    name: player?.name1 || player?.name,
    name2: player?.name2 || null,
    identity: player?.identity || null,
    seat: Number.parseInt(player?.dataset?.position ?? "-1", 10),
    alive: player?.isAlive?.() ?? false,
    hp: player?.hp ?? null,
    maxHp: player?.maxHp ?? null,
    yuan: player === target ? 0 : markCount(player, XIONG_YUAN)
  };
}
function finishBatchGame(resultForLocalPlayer) {
  if (!runtime?.active) return;
  const state = loadState(runtime.runId, runtime.requestedGames);
  if (state.completedGames > runtime.gameIndex) return;
  const target = findTarget();
  const players = allPlayers();
  let targetWon = null;
  try {
    targetWon = target && typeof game.checkOnlineResult === "function" ? Boolean(game.checkOnlineResult(target)) : null;
  } catch {
  }
  const result = {
    runId: runtime.runId,
    gameIndex: runtime.gameIndex,
    seed: runtime.seed + runtime.gameIndex,
    mode: lib.config.mode,
    allowedCharacterPacks: ["standard", "shenhua", "Q-series"],
    playerCount: players.length,
    durationMs: Date.now() - runtime.startedAt,
    rounds: game.roundNumber || 0,
    localPlayerWon: Boolean(resultForLocalPlayer),
    target: target ? playerSnapshot(target, target) : null,
    targetWon,
    targetSex: target?.sex === "unknown" ? "X" : target?.sex || null,
    targetKu: markCount(target, XIONG_KU),
    anfaOccurred: Boolean(target?.storage?.[ANFA_OCCURRED]),
    finalYuanDistribution: players.filter((player) => player !== target).map((player) => playerSnapshot(player, target)),
    players: players.map((player) => playerSnapshot(player, target)),
    metrics: { ...runtime.metrics }
  };
  state.completedGames++;
  state.results.push(result);
  saveState(state);
  const summary = makeSummary(state);
  globalThis.__qBatchSummary = summary;
  updateDebug("complete", { completedGames: state.completedGames });
  document.documentElement.dataset.qBatchComplete = String(state.completedGames >= state.requestedGames);
  console.log("Q_BATCH_RESULT", JSON.stringify(summary));
  if (state.completedGames >= state.requestedGames) {
    renderSummaryWhenReady(summary);
  }
}
function setupBatchPrecontent() {
  const params = new URLSearchParams(location.search);
  if (params.get("qBatch") !== "1") return;
  const requestedGames = positiveInteger(params.get("qBatchGames"), 1);
  const runId = params.get("qBatchRun") || `run-${Date.now()}`;
  const seed = positiveInteger(params.get("qBatchSeed"), 20260815);
  const playerCount = Math.max(2, Math.min(8, positiveInteger(params.get("qBatchPlayers"), 5)));
  const state = loadState(runId, requestedGames);
  runtime = {
    active: state.completedGames < requestedGames,
    runId,
    requestedGames,
    seed,
    gameIndex: state.completedGames,
    playerCount,
    target: params.get("qBatchTarget") || XIONG_NAME,
    startedAt: Date.now(),
    metrics: {}
  };
  updateDebug("precontent");
  if (!runtime.active) {
    const summary = makeSummary(state);
    globalThis.__qBatchSummary = summary;
    renderSummaryWhenReady(summary);
    return;
  }
  Math.random = createSeededRandom(seed + state.completedGames);
  lib.config.mode = "identity";
  lib.config.show_splash = "off";
  lib.config.new_tutorial = true;
  lib.config.test_game = runtime.target;
  lib.config.animation = false;
  lib.config.low_performance = true;
  lib.config.background_audio = false;
  lib.config.background_music = "music_off";
  lib.config.game_speed = "vfast";
  lib.config.characters = ["standard", "shenhua"];
  lib.config.all.characters = ["standard", "shenhua"];
  restrictBatchCharacterPool();
  lib.config.forbidai.add(runtime.target);
  lib.config.mode_config.identity ??= {};
  lib.config.mode_config.identity.player_number = String(playerCount);
  lib.config.mode_config.identity.double_character = false;
  localStorage.setItem(`${lib.configprefix}directstart`, "true");
}
function setupBatchContent() {
  if (!runtime?.active) return;
  updateDebug("content");
  lib.onover.push(finishBatchGame);
}
function setupBatchArenaReady() {
  if (!runtime?.active) {
    const params = new URLSearchParams(location.search);
    const runId = params.get("qBatchRun");
    const games = positiveInteger(params.get("qBatchGames"), 0);
    if (runId && games) {
      const state = loadState(runId, games);
      if (state.completedGames >= state.requestedGames) renderSummaryWhenReady(makeSummary(state));
    }
    return;
  }
  updateDebug("arenaReady");
  renderProgress(loadState(runtime.runId, runtime.requestedGames));
  setTimeout(() => {
    lib.config.game_speed = "vfast";
    lib.config.animation = false;
    _status.auto = true;
    uiAutoGlow();
    updateDebug("arenaReady:configured");
  }, 0);
}
function uiAutoGlow() {
  ui.auto?.classList?.add("glow");
}
function recordBatchMetric(name, amount = 1) {
  if (!runtime?.active) return;
  const previous = typeof runtime.metrics[name] === "number" ? runtime.metrics[name] : 0;
  runtime.metrics[name] = previous + amount;
}
function setBatchMetric(name, value) {
  if (!runtime?.active) return;
  runtime.metrics[name] = value;
}
export {
  recordBatchMetric,
  setBatchMetric,
  setupBatchArenaReady,
  setupBatchContent,
  setupBatchPrecontent
};
//# sourceMappingURL=batch-mode.js.map
