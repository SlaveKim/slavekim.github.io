import { injectLayout } from "/js/include.js";
import { setActiveMenu } from "/js/common.js";

import { getTodayKey } from "/js/lib/getTodayKey/index.js";
import { getTodosByDate, setTodosByDate } from "/js/lib/ls/todos/index.js";

/**
 * NEW QUEST (single-button flow)
 * - idle: 입력 + [확인하기]만
 * - loading: overlay + ticker
 * - done: 결과(요약/내용/보상) 표시 + [돌아가기]만
 *
 * 저장: done 상태에서 결과를 localStorage에 기록하고 바로 todo로 이동.
 * (지금은 API 대신 local 분석으로 대체)
 */

const STAT_ORDER = ["FOCUS", "HEALTH", "CRAFT", "ORDER", "SOCIAL"];
const STAT_TIPS = {
  FOCUS: "집중력: 몰입/작업 유지",
  HEALTH: "건강: 체력/컨디션",
  CRAFT: "창작: 기술/제작",
  ORDER: "정리: 루틴/정돈",
  SOCIAL: "사회성: 소통/관계",
};

// 로딩 멘트(예시 50개, 원하는 방향으로 더 늘려도 됨)
const LOADING_LINES = [
  "인과율을 확인하는 중",
  "도망간 신을 잡아와서 분석시키는 중",
  "퀘스트를 두루마리에 필사하는 중",
  "잉크를 말리는 중",
  "시간선이 흔들리는 걸 조정하는 중",
  "오늘의 운세를 갈아 넣는 중",
  "레벨 디자이너를 소환하는 중",
  "검은 화면을 강제로 로딩하는 중",
  "픽셀을 한 땀씩 정렬하는 중",
  "스탬프 잉크를 리필하는 중",
  "룬문자를 해독하는 중",
  "버그를 고대 봉인으로 묶는 중",
  "퀘스트 보상을 주머니에 담는 중",
  "손가락 관절을 스트레칭하는 중",
  "알고리즘에게 커피를 주는 중",
  "정신력을 1 회복하는 중",
  "당신의 의지를 측정하는 중",
  "NPC에게 승인 도장을 받는 중",
  "오늘의 ‘가능성’을 압축하는 중",
  "세계선에 저장 슬롯을 만드는 중",
  "데이터 정령과 협상하는 중",
  "현실감을 2 낮추는 중",
  "가벼운 착시를 추가하는 중",
  "모험일지를 펼치는 중",
  "작은 결심을 장비칸에 넣는 중",
  "퀘스트를 카드로 재단하는 중",
  "완료 플래그를 예열하는 중",
  "내일의 나를 설득하는 중",
  "중요한 건 꾸준함이라고 속삭이는 중",
  "텍스트를 80자로 깎는 중",
  "보상 분배기를 두드리는 중",
  "랜덤 씨앗을 흔드는 중",
  "픽셀 구름을 정리하는 중",
  "미세한 드라마틱 효과를 추가하는 중",
  "레트로 감성을 한 스푼 넣는 중",
  "작업 큐를 줄 세우는 중",
  "동기부여를 패치하는 중",
  "작은 승리를 포장하는 중",
  "오늘의 기분을 정규화하는 중",
  "에너지를 5포인트로 환산하는 중",
  "말줄임표를 그럴싸하게 만드는 중",
  "이벤트 플래그를 체크하는 중",
  "현실의 마찰을 줄이는 중",
  "노이즈를 예쁘게 다듬는 중",
  "한 번 더 할 수 있다고 기록하는 중",
  "장난감을 진지하게 만드는 중",
  "되게 사소한데 중요한 걸 저장하는 중",
  "퀘스트 로그를 새로 파는 중",
  "성공 확률을 살짝 올리는 중",
  "인과율을 확인하는 중",
  "도망간 신을 잡아와서 분석시키는 중",
  "퀘스트를 두루마리에 필사하는 중",
  "잉크를 말리는 중",
  "시간선이 흔들리는 걸 조정하는 중",
  "오늘의 운세를 갈아 넣는 중",
  "레벨 디자이너를 소환하는 중",
  "픽셀을 한 땀씩 정렬하는 중",
  "스탬프 잉크를 리필하는 중",
  "룬문자를 해독하는 중",
  "버그를 고대 봉인으로 묶는 중",
  "퀘스트 보상을 주머니에 담는 중",
  "당신의 의지를 측정하는 중",
  "NPC에게 승인 도장을 받는 중",
  "오늘의 ‘가능성’을 압축하는 중",
  "데이터 정령과 협상하는 중",
  "현실감을 2 낮추는 중",
  "퀘스트를 카드로 재단하는 중",
  "작은 승리를 포장하는 중",
  "에너지를 5포인트로 환산하는 중",
  "이벤트 플래그를 체크하는 중",
  "현실의 마찰을 줄이는 중",
  "노이즈를 예쁘게 다듬는 중",
  "되게 사소한데 중요한 걸 저장하는 중",
];

const qs = (root, sel) => root.querySelector(sel);
const qsa = (root, sel) => Array.from(root.querySelectorAll(sel));

const openAlert = (content, msg) => {
  const modal = qs(content, "#dqModal");
  const msgEl = qs(content, "#dqModalMessage");
  const ok = qs(content, "#dqModalOkBtn");
  if (!modal || !msgEl || !ok) {
    alert(msg);
    return;
  }
  msgEl.innerText = msg;
  modal.classList.add("is-open");
  ok.focus();
};
const closeAlert = (content) =>
  qs(content, "#dqModal")?.classList.remove("is-open");

const openLoading = (content, yes) =>
  qs(content, "#dqLoading")?.classList.toggle("is-open", !!yes);

const normalizeText = (s) => String(s ?? "").replace(/\r\n/g, "\n");

const makeSummaryLocal = (text) => {
  const t = normalizeText(text).trim();
  if (!t) return "";
  const firstLine = t
    .split("\n")
    .map((x) => x.trim())
    .find(Boolean);
  const base = (firstLine || t).replace(/\s+/g, " ").trim();
  return base.length <= 80 ? base : base.slice(0, 80);
};

const rollRewardLocal = () => {
  const total = 5;
  const buckets = STAT_ORDER.map(() => 0);
  for (let i = 0; i < total; i += 1) {
    buckets[Math.floor(Math.random() * buckets.length)] += 1;
  }
  return STAT_ORDER.map((stat, i) => ({ stat, val: buckets[i] })).filter(
    (r) => r.val > 0,
  );
};

const renderRewardBadges = (content, reward) => {
  const wrap = qs(content, "#rewardPreview");
  if (!wrap) return;

  const badges = qsa(wrap, "[data-stat]");
  const map = { FOCUS: 0, HEALTH: 0, CRAFT: 0, ORDER: 0, SOCIAL: 0 };

  if (Array.isArray(reward)) {
    reward.forEach((r) => {
      const k = String(r?.stat || "").toUpperCase();
      if (k in map) map[k] += Number(r?.val) || 0;
    });
  }

  badges.forEach((b) => {
    const k = b.getAttribute("data-stat");
    const val = map[k] || 0;

    if (STAT_TIPS[k]) b.setAttribute("data-tip", STAT_TIPS[k]);
    b.style.display = val ? "" : "none";

    const short =
      k === "FOCUS"
        ? "F"
        : k === "HEALTH"
          ? "H"
          : k === "CRAFT"
            ? "C"
            : k === "ORDER"
              ? "O"
              : k === "SOCIAL"
                ? "S"
                : "?";

    b.innerText = `${short} +${val}`;
  });
};

/** 로딩 티커: 우르르 바뀌다가 멈추고 반복 */
const createLoadingTicker = (content) => {
  const lineEl = qs(content, "#loadingLine");
  const tickerEl = qs(content, "#loadingTicker");

  let running = false;
  let timer = null;

  const pick = () =>
    LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)];

  const start = () => {
    if (running) return;
    running = true;

    const loop = () => {
      if (!running) return;

      const spinCount = 10 + Math.floor(Math.random() * 14); // 10~23
      let i = 0;

      const spin = () => {
        if (!running) return;
        i += 1;

        const msg = pick();
        if (tickerEl) tickerEl.innerText = msg;
        if (lineEl && Math.random() < 0.3) lineEl.innerText = msg;

        if (i < spinCount) {
          timer = setTimeout(spin, 65 + Math.floor(Math.random() * 55));
        } else {
          // pause
          timer = setTimeout(loop, 420 + Math.floor(Math.random() * 900));
        }
      };

      spin();
    };

    // init
    if (lineEl) lineEl.innerText = pick();
    if (tickerEl) tickerEl.innerText = pick();
    loop();
  };

  const stop = () => {
    running = false;
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return { start, stop };
};

/** typed 효과: 글자 단위로 채우기 */
const typeInto = async (el, text, { minDelay = 6, maxDelay = 18 } = {}) => {
  if (!el) return;
  el.innerText = "";
  const s = String(text ?? "");
  for (let i = 0; i < s.length; i += 1) {
    el.innerText += s[i];
    const d = minDelay + Math.floor(Math.random() * (maxDelay - minDelay + 1));
    // 너무 길면 가속
    const fast = s.length > 200 ? Math.max(2, Math.floor(d * 0.5)) : d;
    await new Promise((r) => setTimeout(r, fast));
  }
};

(async () => {
  const app = document.getElementById("app");
  const { content } = await injectLayout(app);
  setActiveMenu("TODO");

  const tpl = document.getElementById("page-content");
  content.innerHTML = tpl.innerHTML;

  const dateKey = getTodayKey();
  qs(content, "#new-date").innerText = dateKey;

  const metaEl = qs(content, "#new-meta");
  const refreshMeta = () => {
    const list = getTodosByDate(dateKey);
    if (list.length >= 5) {
      location.href = "/pages/todo/";
      return;
    }
    if (metaEl) metaEl.innerText = `TODAY ${list.length}/5`;
    return list.length;
  };
  refreshMeta();

  // modal
  qs(content, "#dqModalOkBtn")?.addEventListener("click", () =>
    closeAlert(content),
  );
  qs(content, "#dqModal")?.addEventListener("click", (e) => {
    if (e.target?.classList?.contains("alert-modal__backdrop"))
      closeAlert(content);
  });

  const page = qs(content, ".todo-new-page");
  const form = qs(content, "#new-quest-form");
  const textArea = qs(content, "#questText");
  const countEl = qs(content, "#textCount");

  const btnCheck = qs(content, "#btn-check");
  const btnBack = qs(content, "#btn-back");

  const topActions = qs(content, '[data-role="top-actions"]');
  const inputPanel = qs(content, '[data-role="input-panel"]');
  const resultPanel = qs(content, '[data-role="result-panel"]');

  const outSummary = qs(content, "#resultSummary");
  const outText = qs(content, "#resultText");

  const ticker = createLoadingTicker(content);

  let analyzed = null; // { summary, reward, text }

  const setUI = (state) => {
    // state: idle | loading | done
    page.setAttribute("data-ui", state);

    if (state === "idle") {
      if (topActions) topActions.style.display = "";
      if (btnCheck) btnCheck.style.display = "";
      if (btnBack) btnBack.style.display = "none";
      if (resultPanel) resultPanel.style.display = "none";
      if (inputPanel) inputPanel.style.display = "";
      if (textArea) textArea.disabled = false;
    }

    if (state === "loading") {
      if (textArea) textArea.disabled = true;
      if (btnCheck) btnCheck.disabled = true;
    }

    if (state === "done") {
      if (topActions) topActions.style.display = "none";
      if (btnCheck) btnCheck.style.display = "none";
      if (btnBack) btnBack.style.display = "";
      if (inputPanel) inputPanel.style.display = "none";
      if (resultPanel) resultPanel.style.display = "";
      if (textArea) textArea.disabled = true;
    }
  };

  setUI("idle");

  // textarea count
  const onTextChange = () => {
    const t = normalizeText(textArea?.value || "");
    if (countEl) countEl.innerText = String(t.length);
  };
  textArea?.addEventListener("input", onTextChange);
  onTextChange();

  // confirm flow
  btnCheck?.addEventListener("click", async () => {
    const currentCount = refreshMeta();
    if (currentCount >= 5) {
      openAlert(content, "오늘 퀘스트는 이미 5개가 꽉 찼어.\n(TODAY 5/5)");
      return;
    }

    const text = normalizeText(textArea?.value || "").trim();
    if (!text) {
      openAlert(content, "퀘스트 내용을 입력해줘.");
      textArea?.focus();
      return;
    }

    // LOADING
    setUI("loading");
    openLoading(content, true);
    ticker.start();

    try {
      // ✅ 여기서 OpenAI API 서버 호출 예정
      // const res = await fetch("/api/quest/analyze", { method:"POST", headers:{...}, body: JSON.stringify({ text }) })
      // const data = await res.json()
      // analyzed = { summary: data.summary, reward: data.reward, text }

      // 임시 로컬 분석 + 랜덤 지연
      await new Promise((r) =>
        setTimeout(r, 1200 + Math.floor(Math.random() * 900)),
      );

      analyzed = {
        text,
        summary: makeSummaryLocal(text),
        reward: rollRewardLocal(),
      };

      // 저장(확정) → localStorage에 바로 기록 (요구: 완료되면 돌아가기만 남김)
      const list = getTodosByDate(dateKey);
      const next = [
        ...list,
        {
          summary: analyzed.summary,
          text: analyzed.text,
          reward: analyzed.reward,
          done: false,
          createdAt: Date.now(),
          doneAt: null,
          stampText: null,
        },
      ];

      const ok = setTodosByDate(dateKey, next);
      if (!ok) throw new Error("localStorage save failed");

      // DONE UI + 타이핑 렌더
      ticker.stop();
      openLoading(content, false);
      setUI("done");

      renderRewardBadges(content, analyzed.reward);

      // typed reveal
      await typeInto(outSummary, analyzed.summary);
      await typeInto(outText, analyzed.text);
    } catch (err) {
      console.error(err);
      ticker.stop();
      openLoading(content, false);
      setUI("idle");
      if (btnCheck) btnCheck.disabled = false;
      if (textArea) textArea.disabled = false;
      openAlert(content, "분석/저장에 실패했어.\n잠시 후 다시 시도해줘.");
    }
  });

  // form submit 방지(버튼 하나라 submit 없음)
  form?.addEventListener("submit", (e) => e.preventDefault());
})();
