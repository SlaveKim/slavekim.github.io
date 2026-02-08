/**
 * LocalStorage Todo Store
 *
 * KEY: todo.todos.v1
 *
 * 구조:
 * {
 *   days: {
 *     "YYYY-MM-DD": [
 *       {
 *         summary: string,
 *         text: string, // 사용자가 입력한 full text 저장
 *         reward: [{ stat: string, val: number }, ...],
 *         done: boolean,
 *         createdAt: number,   // unix ms
 *         doneAt: number|null, // unix ms
 *         stampText?: string|null // 완료 도장 멘트(랜덤 1회 결정 후 저장/고정)
 *       }
 *     ]
 *   }
 * }
 */

const KEY = "todo.todos.v1";
const ERRPAGE = "/pages/404/";

const DEFAULT = { days: {} };

// ✅ 도장 멘트는 "완료 시점 1회" 뽑아서 저장/고정하는게 핵심
const STAMP_MESSAGES = [
  "GOOD!",
  "NICE!",
  "DONE!",
  "GREAT!",
  "QUEST CLEAR!",
  "PERFECT!",
  "S++",
  "GG",
  "MISSION COMPLETE!",
  "오늘도 성공!",
  "CLEAR!",
];

const pickStampText = () => {
  const i = Math.floor(Math.random() * STAMP_MESSAGES.length);
  return STAMP_MESSAGES[i];
};

/* =========================
   public API
========================= */

/**
 * 특정 날짜 todo 목록 반환
 */
export const getTodosByDate = (dateKey) => {
  const store = readStore();
  const list = store.days?.[dateKey];
  return Array.isArray(list) ? list : [];
};

/**
 * 특정 날짜 todo 목록 저장
 * - 저장 시 shape 정규화(normalize) 책임은 store가 가진다.
 */
export const setTodosByDate = (dateKey, list) => {
  try {
    if (!isDateKey(dateKey)) throw new Error("BAD_DATEKEY");
    if (!Array.isArray(list)) throw new Error("BAD_LIST");
    if (list.length > 5) throw new Error("MAX_5_TODOS");

    const nextList = list.map((t) => {
      const done = !!t?.done;
      const doneAt = done
        ? (isNum(t?.doneAt) ? t.doneAt : Date.now())
        : null;

      return {
        summary: String(t?.summary ?? "").slice(0, 80),
        text: String(t?.text ?? ""),
        reward: Array.isArray(t?.reward) ? t.reward : [],
        done,
        createdAt: isNum(t?.createdAt) ? t.createdAt : Date.now(),
        doneAt,

        // ✅ 완료된 상태인데 stampText가 없으면 안전하게 생성
        stampText:
          done
            ? (typeof t?.stampText === "string" && t.stampText.trim()
                ? t.stampText
                : pickStampText())
            : (t?.stampText ?? null),
      };
    });

    const store = readStore();
    store.days[dateKey] = nextList;
    writeStore(store);
    return true;
  } catch (e) {
    console.error("setTodosByDate failed:", e);
    return false;
  }
};

/**
 * todo 완료 처리 (false → true)
 * - stampText는 완료되는 순간 1회만 생성해서 저장/고정
 */
export const completeTodo = (dateKey, idx) => {
  try {
    if (!isDateKey(dateKey)) throw new Error("BAD_DATEKEY");

    const list = getTodosByDate(dateKey);
    if (idx < 0 || idx >= list.length) throw new Error("BAD_INDEX");

    const t = list[idx];
    if (!t) throw new Error("TODO_NOT_FOUND");

    if (!t.done) {
      t.done = true;
      t.doneAt = Date.now();
      if (!t.stampText) t.stampText = pickStampText();
    }

    return setTodosByDate(dateKey, list);
  } catch (e) {
    console.error("completeTodo failed:", e);
    return false;
  }
};

/* =========================
   internal helpers
========================= */

const readStore = () => {
  const raw = localStorage.getItem(KEY);

  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(DEFAULT));
    return clone(DEFAULT);
  }

  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object" || !obj.days) {
      throw new Error("CORRUPTED_SHAPE");
    }
    return obj;
  } catch (e) {
    console.error("Todo store corrupted", e);
    location.href = ERRPAGE;
    throw e;
  }
};

const writeStore = (obj) => {
  localStorage.setItem(KEY, JSON.stringify(obj));
};

const isDateKey = (s) =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

const isNum = (x) =>
  typeof x === "number" && Number.isFinite(x);

const clone = (obj) =>
  JSON.parse(JSON.stringify(obj));
