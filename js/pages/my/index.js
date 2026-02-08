import { injectLayout } from "/js/include.js";
import { setActiveMenu } from "/js/common.js";

const KEY = "todo.my_note.v1";

const DUMMY_TEXT = `* openAI API로 작성내용과 이를 분석요구하는 프롬프트를 보내서, 요약 / 보상 등을 받아오려고 했는데 API서버를 따로 써야해서 목업만 만들었다는데 의의를 두려고 합니다 

* NextJS에서 생각만 하고 미루고 미뤄왔는데 chatGPT를 열심히 괴롭히면서 디자인만 잡아본 것 같습니다. 
* 주단위로 스탯들을 계산하고, ToDO를 조회하고, 이미지를 생성하려고 했는데 너무 많아지네요..
* 그냥 만들어기를 시작했다는 점에 의의를 뒀고, NextJS로 완성해서 돌아오겠습니다! 

* 원래는 이름 생성시에 자기소개를 받아서 성격을 분석시켜 저장해두고, TodO와 스탯들을 종합해서 이미지를 생성하려고 했습니다. 역시나 db를 써서 API 접근제한, 이미지 주소 관리도 해야하고 이미지 생성 보내고 기다리고 파일처리하는 worker도 따로 돌려야해서 이번 프로젝트는 여기까지...



* 리액트로 뚝딱하면 오히려 더 금방 끝나지 않았을까 고민했습니다.
* 사실 JS를 직접짜다가 나중에는 시간부족+귀찮음을 핑게로 chatGPT를 너무많이 시킨게 아닐까... 고민했습니다. 
* 목표가 안잡혀서 재미삼아 vanillaJS 챌린지를 신청했는데 이렇게 LLM 잔뜩쓴 졸업작품냈다고 혼내시진 않겠죠.. 하하.. 
* 주말은 짧고, 하고싶은건 많았고, 결국 챗지피티 열심히 시키고 수정하고 확인하고 수정하고 반복...


* 사실 저 status idle창에 사진, 이름이 왔어야했고...
* 원래는 API 연동 시키고 -> STATUS에서 스탯합계들 대충 보여주고 -> 이미지생성해서 사진업뎃하고 
* ARCHIVES로 만든 사진들 저장해두려고 했고... 
* SETTINGS에 이것저것 넣으려고 했고
* HISTORY로 최소 2주정도 ToDO list는 보여주려고 했는데 
* 생각보다 오래걸려서 정말 ToDO까지만 만들고 이제는 진짜 사이드프로젝트로 갑니다! :)

* 이거 만들고나면 방치형 웹게임이 목표였는데 아무튼 챌린지 덕분에 현생으로 몇달 묵혀둔 프로젝트 목업이라도 간단히 잡아봤습니다. ㅎㅎ
`;

const qs = (root, sel) => root.querySelector(sel);

const nowYYYYMMDD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTS = (ts) => {
  if (!ts) return "-";
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
};

const safeParse = (s, fallback) => {
  try {
    const v = JSON.parse(s);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const loadDoc = () => {
  const raw = localStorage.getItem(KEY);
  const doc = safeParse(raw, null);

  // shape normalize
  if (!doc || typeof doc !== "object") return null;
  if (typeof doc.text !== "string") doc.text = "";
  if (typeof doc.updatedAt !== "number") doc.updatedAt = 0;
  return doc;
};

const saveDoc = (doc) => {
  localStorage.setItem(KEY, JSON.stringify(doc));
};

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

const closeAlert = (content) => {
  const modal = qs(content, "#dqModal");
  if (modal) modal.classList.remove("is-open");
};

(async () => {
  const app = document.getElementById("app");
  const { content } = await injectLayout(app);

  setActiveMenu("MY");

  const tpl = document.getElementById("page-content");
  content.innerHTML = tpl.innerHTML;

  // header
  qs(content, "#my-date").innerText = nowYYYYMMDD();

  // modal events
  qs(content, "#dqModalOkBtn")?.addEventListener("click", () => closeAlert(content));
  qs(content, "#dqModal")?.addEventListener("click", (e) => {
    if (e.target?.classList?.contains("alert-modal__backdrop")) closeAlert(content);
  });
  window.addEventListener("keydown", (e) => {
    const modal = qs(content, "#dqModal");
    if (e.key === "Escape" && modal?.classList?.contains("is-open")) closeAlert(content);
  });

  const ta = qs(content, "#myText");
  const count = qs(content, "#count");
  const lastSaved = qs(content, "#last-saved");
  const btnSave = qs(content, "#btnSave");
  const btnClear = qs(content, "#btnClear");
  const btnResetDummy = qs(content, "#btnResetDummy");

  const updateCount = () => {
    const n = String(ta?.value || "").length;
    if (count) count.innerText = String(n);
  };

  const refreshLastSaved = () => {
    const doc = loadDoc();
    if (!lastSaved) return;
    lastSaved.innerText = `last saved: ${formatTS(doc?.updatedAt)}`;
  };

  // init content
  const doc = loadDoc();
  if (ta) {
    ta.value = doc?.text?.trim() ? doc.text : DUMMY_TEXT; // ✅ 처음엔 더미 자동 채움
    ta.addEventListener("input", updateCount);
    updateCount();
  }
  refreshLastSaved();

  btnClear?.addEventListener("click", () => {
    if (!ta) return;
    ta.value = "";
    updateCount();
    ta.focus();
  });

  btnResetDummy?.addEventListener("click", () => {
    if (!ta) return;
    ta.value = DUMMY_TEXT;
    updateCount();
    ta.focus();
    openAlert(content, "더미 텍스트로 되돌렸어. (저장을 누르면 확정)");
  });

  btnSave?.addEventListener("click", () => {
    if (!ta) return;
    const text = String(ta.value || "").trim();
    if (!text) {
      openAlert(content, "내용이 비어있어. (최소 1글자)");
      ta.focus();
      return;
    }

    saveDoc({
      text,
      updatedAt: Date.now(),
      ver: 1,
    });

    refreshLastSaved();
    openAlert(content, "저장했어!");
  });
})();
