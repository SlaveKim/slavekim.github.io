const LS_KEY = "todo_random-bg-v1";
const BG_IMG = "/assets/paper-set.png";

const getBgQuery = () => {
  const params = new URLSearchParams(location.search);
  const raw = params.get("bg");
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 6) return null;
  return n;
};

const getNextMonday = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  const nextMon = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + diff,
    0,
    0,
    0,
    0,
  );
  return nextMon.getTime();
};

const getWeeklyBgPick = () => {
  try {
    const bgQuery = getBgQuery();
    if (bgQuery !== null) return bgQuery;

    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        typeof parsed.pick === "number" &&
        parsed.pick >= 1 &&
        parsed.pick <= 6 &&
        typeof parsed.expire === "number" &&
        Date.now() < parsed.expire
      ) {
        return parsed.pick;
      }
    }
  } catch (e) {}
  const pick = Math.floor(Math.random() * 6) + 1;
  const expire = getNextMonday();

  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ pick, expire }));
  } catch (e) {}

  return pick;
};

export const applyBg = () => {
  const POS_X = ["10%", "50%", "90%"];
  const POS_Y = ["10%", "90%"];

  /*
  원래는 픽을 1주일에 한번 선택, 이미지 변경시에도 반영되게 하려고 했는데
  그냥 챌린지에 맞춰 매번 랜덤로딩으로 변경!
  */
  // const pick = getWeeklyBgPick();
  const pick = Math.floor(Math.random() * 6) + 1;

  const idx = pick - 1;
  const c = idx % 3;
  const r = Math.floor(idx / 3);

  const x = POS_X[c];
  const y = POS_Y[r];

  const style = document.body.style;

  style.backgroundImage = `url("${BG_IMG}")`;
  style.backgroundRepeat = "no-repeat";
  style.backgroundSize = "400% 240%";
  style.backgroundPosition = `${x} ${y}`;
  style.backgroundAttachment = "fixed";
};
