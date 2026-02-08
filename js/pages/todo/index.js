import { injectLayout } from "/js/include.js";
import { setActiveMenu } from "/js/common.js";

import { getTodayKey } from "/js/lib/getTodayKey/index.js";
import {
  getTodosByDate,
  setTodosByDate,
  completeTodo,
} from "/js/lib/ls/todos/index.js";

/**
 * Todo 페이지 컨셉
 * - "+ 열기" / "- 닫기" 버튼이 있으므로 OPEN/CLOSE 배지는 제거(숨김)
 * - reward(스탯) 배지에 hover 시 옆에 팝업 tooltip 표시
 * - stampText(도장 멘트) 생성/고정은 store에서 책임진다 (UI에서 랜덤 뽑지 않음)
 */

const pad2 = (n) => String(n).padStart(2, "0");
const formatHMS = (ts) => {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const setText = (el, txt) => {
  if (!el) return;
  el.innerText = txt ?? "";
};

const show = (el, yes) => {
  if (!el) return;
  el.style.display = yes ? "" : "none";
};

/**
 * ✅ 스탯 tooltip 문구 (배지 hover 시 옆에 뜨는 설명)
 * - 길게 쓰면 UI가 지저분해지니 "짧고 직관적으로"
 */
const STAT_TIPS = {
  FOCUS: "집중력: 몰입/작업 유지",
  HEALTH: "건강: 체력/컨디션",
  CRAFT: "창작: 기술/제작",
  ORDER: "정리: 루틴/정돈",
  SOCIAL: "사회성: 소통/관계",
};

/* reward를 5개 badge에 매핑 + 0이면 숨김 + tooltip 세팅 */
const fillRewardBadges = (slot, reward) => {
  const wrap = slot.querySelector('[data-role="reward"]');
  const badges = slot.querySelectorAll('[data-role="reward"] [data-stat]');

  const map = { FOCUS: 0, HEALTH: 0, CRAFT: 0, ORDER: 0, SOCIAL: 0 };

  if (Array.isArray(reward)) {
    reward.forEach((r) => {
      const k = String(r?.stat || "").toUpperCase();
      if (k in map) map[k] += Number(r?.val) || 0;
    });
  }

  let anyVisible = false;

  badges.forEach((b) => {
    const k = b.getAttribute("data-stat");
    const val = map[k] || 0;

    // tooltip 문구 박아두기 (CSS가 data-tip을 읽어서 팝업)
    if (STAT_TIPS[k]) b.setAttribute("data-tip", STAT_TIPS[k]);

    b.style.display = val ? "" : "none";
    if (val) anyVisible = true;

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

  if (wrap) wrap.style.display = anyVisible ? "" : "none";
};

const setSlotEmpty = (slot, idx) => {
  slot.dataset.state = "empty";
  slot.classList.remove("is-done", "is-open");

  setText(slot.querySelector('[data-role="summary"]'), "EMPTY SLOT");

  // detail
  const detailBtn = slot.querySelector(
    `[data-action="toggle-detail"][data-idx="${idx}"]`,
  );
  show(detailBtn, false);
  setText(detailBtn, "+ 열기");
  if (detailBtn) detailBtn.dataset.open = "0";

  show(slot.querySelector('[data-role="detail"]'), false);
  setText(slot.querySelector('[data-role="text"]'), "");

  // reward
  fillRewardBadges(slot, []);

  // stamp
  show(slot.querySelector('[data-role="stamp"]'), false);

  // complete
  const btn = slot.querySelector(`[data-action="complete"][data-idx="${idx}"]`);
  if (btn) btn.disabled = true;
};

const setSlotTodo = (slot, idx, todo, dateKey) => {
  slot.dataset.state = todo.done ? "done" : "active";
  slot.classList.toggle("is-done", !!todo.done);

  setText(slot.querySelector('[data-role="summary"]'), todo.summary || "");

  // detail
  const detailBtn = slot.querySelector(
    `[data-action="toggle-detail"][data-idx="${idx}"]`,
  );
  const detailBox = slot.querySelector('[data-role="detail"]');
  const textEl = slot.querySelector('[data-role="text"]');

  if (todo.text && String(todo.text).trim()) {
    show(detailBtn, true);
    setText(textEl, todo.text);

    // 렌더 시 기본은 닫힘
    show(detailBox, false);
    slot.classList.remove("is-open");
    setText(detailBtn, "+ 열기");
    if (detailBtn) detailBtn.dataset.open = "0";
  } else {
    show(detailBtn, false);
    show(detailBox, false);
    slot.classList.remove("is-open");
    setText(textEl, "");
  }

  // reward badges
  fillRewardBadges(slot, todo.reward);

  // complete 버튼 (완료면 disabled)
  const completeBtn = slot.querySelector(
    `[data-action="complete"][data-idx="${idx}"]`,
  );
  if (completeBtn) completeBtn.disabled = !!todo.done;

  // stamp
  const stamp = slot.querySelector('[data-role="stamp"]');
  const stampTitle = slot.querySelector('[data-role="stamp-title"]');
  const stampDate = slot.querySelector('[data-role="stamp-date"]');
  const stampTime = slot.querySelector('[data-role="stamp-time"]');

  if (todo.done && todo.doneAt) {
    show(stamp, true);
    // stampText는 store에서 '완료되는 순간' 1회만 결정해서 저장(고정)
    setText(stampTitle, todo.stampText || "CLEAR!");
    setText(stampDate, dateKey);
    setText(stampTime, formatHMS(todo.doneAt));
  } else {
    show(stamp, false);
    setText(stampTitle, "");
    setText(stampDate, "");
    setText(stampTime, "");
  }
};

const renderPage = (root, dateKey) => {
  const todos = getTodosByDate(dateKey) || [];

  setText(root.querySelector("#todo-date"), dateKey);

  // ✅ TODAY = 등록된 퀘스트 개수
  setText(root.querySelector("#todo-meta"), `TODAY ${todos.length}/5`);

  for (let i = 0; i < 5; i++) {
    const slot = root.querySelector(`#todo-slot-${i}`);
    if (!slot) continue;

    const todo = todos[i];
    if (!todo) setSlotEmpty(slot, i);
    else setSlotTodo(slot, i, todo, dateKey);
  }
};

/* ---------- confirm modal ---------- */
const openConfirm = (root, idx, summary) => {
  const modal = root.querySelector("#dq-confirm");
  if (!modal) return;

  modal.dataset.pendingIdx = String(idx);
  setText(root.querySelector("#dq-confirm-summary"), `"${summary}"`);
  modal.style.display = "flex";
};

const closeConfirm = (root) => {
  const modal = root.querySelector("#dq-confirm");
  if (!modal) return;

  modal.style.display = "none";
  delete modal.dataset.pendingIdx;
};

/* ---------- alert modal (JS로 생성) ---------- */
const ensureAlertModal = (root) => {
  let modal = root.querySelector("#dq-alert");
  if (modal) return modal;

  // ✅ todo 페이지는 confirm 모달 스타일(dq-modal)을 이미 쓰고 있으니 그대로 재사용
  modal = document.createElement("div");
  modal.id = "dq-alert";
  modal.className = "dq-modal-backdrop";
  modal.style.display = "none";

  modal.innerHTML = `
    <div class="dq-modal" role="dialog" aria-modal="true">
      <div class="dq-modal-title">알림</div>
      <div class="dq-modal-desc">
        <span id="dq-alert-message"></span>
      </div>
      <div class="dq-modal-actions">
        <button class="btn btn-sm btn-dark" data-action="alert-ok">확인</button>
      </div>
    </div>
  `;

  root.appendChild(modal);

  // backdrop 클릭 닫기
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAlert(root);
  });

  return modal;
};

const openAlert = (root, msg) => {
  const modal = ensureAlertModal(root);
  const msgEl = modal.querySelector("#dq-alert-message");
  if (msgEl) msgEl.innerText = msg ?? "";
  modal.style.display = "flex";

  const okBtn = modal.querySelector('[data-action="alert-ok"]');
  okBtn?.focus?.();
};

const closeAlert = (root) => {
  const modal = root.querySelector("#dq-alert");
  if (!modal) return;
  modal.style.display = "none";
};

/* ---------- dummy seed ---------- */
const ensureDummyToday = (dateKey) => {
  const list = getTodosByDate(dateKey);
  if (Array.isArray(list) && list.length) return;

  setTodosByDate(dateKey, [
    {
      summary: "테스트 퀘스트 1: 물 1L 마시기",
      text: "오늘 물 1L 마시기.\n중간중간 나눠서 마셔도 OK.\n\n(완료하면 도장이 찍힙니다!)",
      reward: [
        { stat: "HEALTH", val: 8 },
        { stat: "ORDER", val: 4 },
        { stat: "FOCUS", val: 2 },
      ],
      done: false,
      createdAt: Date.now(),
      doneAt: null,
      stampText: null,
    },
    {
      summary: "테스트 퀘스트 2: 물 1L 마시기",
      text: "오늘 물 1L 마시기.\n중간중간 나눠서 마셔도 OK.\n\n(완료하면 도장이 찍힙니다!)",
      reward: [
        { stat: "HEALTH", val: 8 },
        { stat: "ORDER", val: 4 },
        { stat: "FOCUS", val: 2 },
      ],
      done: false,
      createdAt: Date.now(),
      doneAt: null,
      stampText: null,
    },
    {
      summary: "테스트 퀘스트 3: 물 1L 마시기",
      text: "오늘 물 1L 마시기.\n중간중간 나눠서 마셔도 OK.\n\n(완료하면 도장이 찍힙니다!)",
      reward: [
        { stat: "HEALTH", val: 8 },
        { stat: "ORDER", val: 4 },
        { stat: "FOCUS", val: 2 },
      ],
      done: false,
      createdAt: Date.now(),
      doneAt: null,
      stampText: null,
    },
    {
      summary: "테스트 퀘스트 4: 물 1L 마시기",
      text: "오늘 물 1L 마시기.\n중간중간 나눠서 마셔도 OK.\n\n(완료하면 도장이 찍힙니다!)",
      reward: [
        { stat: "HEALTH", val: 8 },
        { stat: "ORDER", val: 4 },
        { stat: "FOCUS", val: 2 },
      ],
      done: false,
      createdAt: Date.now(),
      doneAt: null,
      stampText: null,
    },
  ]);
};

(async () => {
  const app = document.getElementById("app");
  const { content } = await injectLayout(app);

  setActiveMenu("TODO");

  const tpl = document.getElementById("page-content");
  content.appendChild(tpl.content.cloneNode(true));

  const todayKey = getTodayKey();

  // 1) 더미 생성
  // DEV ONLY: 초기 화면 테스트용 (실사용이면 제거)
  // ensureDummyToday(todayKey);

  // 2) 렌더
  renderPage(content, todayKey);

  // 이벤트 delegation
  content.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");

    if (action === "toggle-detail") {
      const idx = Number(btn.getAttribute("data-idx"));
      const slot = content.querySelector(`#todo-slot-${idx}`);
      if (!slot) return;

      const box = slot.querySelector('[data-role="detail"]');
      if (!box) return;

      const isOpen = btn.dataset.open === "1";
      show(box, !isOpen);

      btn.dataset.open = isOpen ? "0" : "1";
      setText(btn, isOpen ? "+ 열기" : "- 닫기");

      slot.classList.toggle("is-open", !isOpen);
      return;
    }

    if (action === "complete") {
      const idx = Number(btn.getAttribute("data-idx"));
      const todo = getTodosByDate(todayKey)?.[idx];
      if (!todo || todo.done) return;
      openConfirm(content, idx, todo.summary);
      return;
    }

    if (action === "confirm-cancel") {
      closeConfirm(content);
      return;
    }

    if (action === "confirm-ok") {
      const modal = content.querySelector("#dq-confirm");
      const idx = Number(modal?.dataset?.pendingIdx);
      closeConfirm(content);

      // ✅ 완료 처리
      // - doneAt / stampText 고정 생성은 store(completeTodo/setTodosByDate)가 보장
      completeTodo(todayKey, idx);

      renderPage(content, todayKey);
      return;
    }

    // ✅ alert 확인 버튼
    if (action === "alert-ok") {
      closeAlert(content);
      return;
    }
  });

  // confirm: backdrop 클릭 닫기
  const modal = content.querySelector("#dq-confirm");
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeConfirm(content);
  });

  // ESC 닫기 (confirm + alert)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeConfirm(content);
      closeAlert(content);
    }
  });

  // 새 퀘스트 버튼: ✅ 5개면 이동 차단 + 모달
  const btnNew = content.querySelector("#btn-new-quest");
  btnNew?.addEventListener("click", (e) => {
    const todos = getTodosByDate(todayKey) || [];
    if (todos.length >= 5) {
      e.preventDefault();
      e.stopPropagation();
      openAlert(content, "오늘 퀘스트는 이미 5개가 꽉 찼어.\n(TODAY 5/5)");
      return;
    }
    location.href = "/pages/todo/new/";
  });
})();
