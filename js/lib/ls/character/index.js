// /js/lib/ls/character/index.js

const KEY = "todo.character.v1";
const ERRPAGE = "/pages/404/"

const DEFAULT = {
  stats: {
    FOCUS: 0,
    HEALTH: 0,
    CRAFT: 0,
    ORDER: 0,
    SOCIAL: 0,
  },
  count: {
    totalQuest: 0,
    completedQuest: 0,
    activeDays: 0,
  },
};

/**
 * character 가져오기
 * - 없으면 생성
 * - 파싱 오류 등 발생 시 → error page로 이동
 */
export function getCharacter() {
  const raw = localStorage.getItem(KEY);

  // 없으면 생성
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(DEFAULT));
    return clone(DEFAULT);
  }

  // 있으면 그대로 파싱 (깨지면 바로 죽음)
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Character data corrupted", e);
    location.href = ERRPAGE; // 또는 /error/
    throw e; // 혹시 모를 실행 중단
  }
}

/**
 * stat 하나 업데이트
 * updateStat("FOCUS", +3)
 */
export function updateStat(stat, val = 0) {
  const ch = getCharacter();
  if (!(stat in ch.stats)) return ch;

  const prev = Number(ch.stats[stat]) || 0;
  const next = prev + (Number(val) || 0);

  ch.stats[stat] = next;
  localStorage.setItem(KEY, JSON.stringify(ch));
  return ch;
}

/**
 * count 하나 업데이트
 * updateCount("completedQuest", +1)
 */
export function updateCount(key, delta = 1) {
  const ch = getCharacter();
  if (!(key in ch.count)) return ch;

  const prev = Number(ch.count[key]) || 0;
  const next = prev + (Number(delta) || 0);

  ch.count[key] = next;
  localStorage.setItem(KEY, JSON.stringify(ch));
  return ch;
}

/* utils */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
