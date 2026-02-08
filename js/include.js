import { applyBg } from "/js/lib/random-bg/index.js";
import { authGuard } from "/js/lib/auth/index.js";
import { startClock, startGeoWeather } from "/js/common.js";

/**
 * AuthGuard()로 로그인 체크
 * users class는 페이지가 로드되고 마지막에 시행예정
 */
authGuard();

/**
 * HTML partial loader
 */
async function loadHTML(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load ${path} (${res.status})`);
  }
  return res.text();
}

/**
 * CSS injector (중복 방지 + Promise)
 */
function injectCSS(href) {
  const existing = document.querySelector(
    `link[rel="stylesheet"][href="${href}"]`,
  );
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;

    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));

    document.head.appendChild(link);
  });
}

/**
 * 여러 CSS를 한 번에 로드
 */
async function injectCSSMany(hrefs = []) {
  const uniq = [...new Set(hrefs)].filter(Boolean);
  await Promise.allSettled(uniq.map(injectCSS));
}

/**
 * Layout injector
 * - layout HTML + layout CSS를 한 번에 보장
 */
export async function injectLayout(appEl) {
  if (!appEl) {
    throw new Error("injectLayout: appEl is required");
  }

  applyBg();

  /* 1️⃣ layout CSS 보장 */
  await injectCSSMany([
    "/css/shell.css",
    "/css/topbar.css",
    "/css/sidebar.css",
    "/css/footbar.css",
  ]);

  /* 2️⃣ shell HTML */
  const shellHTML = await loadHTML("/partials/layout/shell.html");
  appEl.innerHTML = shellHTML;

  /* 3️⃣ sub-partials */
  const [topbar, sidebar, footbar] = await Promise.all([
    loadHTML("/partials/layout/topbar.html"),
    loadHTML("/partials/layout/sidebar.html"),
    loadHTML("/partials/layout/footbar.html"),
  ]);

  appEl.querySelector('[data-slot="topbar"]').innerHTML = topbar;
  appEl.querySelector('[data-slot="sidebar"]').innerHTML = sidebar;
  appEl.querySelector('[data-slot="footbar"]').innerHTML = footbar;

  /**
   * chatGPT의 도움으로 Partial 로 Component처럼 작성하기 완료
   * 이제 하나씩 공통페이지 기능들도 하단에 넣기
   * 1) Clock
   * 2) Geolocation
   */
  const clockEl = appEl.querySelector('[data-ui="clock"]');
  if (clockEl) startClock(clockEl);

  const geoEl = appEl.querySelector('[data-ui="geo"]');
  if (geoEl) startGeoWeather(geoEl);

  /* 4️⃣ content slot 반환 */
  return {
    content: appEl.querySelector('[data-slot="content"]'),
  };
}
