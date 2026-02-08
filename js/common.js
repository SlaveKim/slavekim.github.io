export const setActiveMenu = (name) => {
  document.querySelectorAll("[data-menu]").forEach((a) => {
    a.classList.toggle("active", a.dataset.menu === name);
  });
};

export const startClock = () => {
  const el = document.getElementById("topbar-clock");
  if (!el) return;

  const tick = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    el.textContent = `${hh}:${mm}:${ss}`;
  };

  tick();
  setInterval(tick, 1000);
};


/* -----------------------------
   Helpers
------------------------------ */

function readCache(key, ttlMinutes) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.ts || !obj?.data) return null;
    const age = Date.now() - obj.ts;
    if (age > ttlMinutes * 60 * 1000) return null;
    return obj.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function getPositionSafe(geoOpts) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return resolve(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null), // 거부/실패면 null로
      geoOpts,
    );
  });
}

/**
 * BigDataCloud Free Client-side Reverse Geocode to City API
 * - 좌표 없으면 IP 기반 best-effort 응답도 가능하다고 안내됨
 */
async function reverseToCity({ lat, lon }) {
  const base = "https://api.bigdatacloud.net/data/reverse-geocode-client";
  const url =
    lat != null && lon != null
      ? `${base}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=ko`
      : `${base}?localityLanguage=ko`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("reverse geocode failed");
  const j = await res.json();

  // 가능한 필드들 중 “도시 느낌” 우선순위
  return (
    j.city ||
    j.locality ||
    j.principalSubdivision ||
    j.localityInfo?.administrative?.[0]?.name ||
    ""
  );
}

/**
 * Open-Meteo current weather
 * - current_weather=true 로 현재 온도/날씨코드 얻기
 */
async function fetchCurrentWeather({ lat, lon }) {
  if (lat == null || lon == null) {
    // 좌표가 없으면 날씨는 못 구함(원하면 IP→좌표 fallback 추가 가능)
    return { temperature: NaN, weathercode: -1 };
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    `&current_weather=true` +
    `&timezone=auto`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("weather fetch failed");
  const j = await res.json();

  return {
    temperature: j?.current_weather?.temperature,
    weathercode: j?.current_weather?.weathercode,
  };
}

/**
 * weathercode → 레트로 아이콘(이모지)
 * (원하면 나중에 픽셀 아이콘 png로 교체 가능)
 */
function weathercodeToIcon(code) {
  // Open-Meteo WMO interpretation codes 기반
  if (code === 0) return "☀";
  if (code === 1) return "🌤";
  if (code === 2) return "⛅";
  if (code === 3) return "☁";
  if (code === 45 || code === 48) return "🌫";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦";
  if ([61, 63, 65, 66, 67].includes(code)) return "🌧";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "🌨";
  if ([80, 81, 82].includes(code)) return "🌦";
  if ([95, 96, 99].includes(code)) return "⛈";
  return "？";
}


/**
 * Geo + Weather (City + icon + temp)
 * - 좌표: Geolocation 허용되면 사용
 * - 도시명: BigDataCloud reverse-geocode-client (브라우저 친화)
 * - 날씨: Open-Meteo current_weather
 */
export async function startGeoWeather(el, opts = {}) {
  if (!el) return;

  const cfg = {
    cacheMinutes: 30,
    ...opts,
  };

  const cacheKey = "dq.weather.v1";

  // 캐시 먼저

  const cached = readCache(cacheKey, cfg.cacheMinutes);
  if (cached) {
    el.textContent = formatWeather(cached);
    return;
  }
  el.textContent = "LOC ⌛ --°";

  try {
    const pos = await getPositionSafe({
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    });

    const lat = pos?.coords?.latitude;
    const lon = pos?.coords?.longitude;

    const city = await reverseToCity({ lat, lon });
    const weather = await fetchCurrentWeather({ lat, lon });
    console.log(weather)
    const data = {
      city: city || "—",
      temp: weather.temperature,
      icon: weathercodeToIcon(weather.weathercode),
    };

    el.textContent = formatWeather(data);
    writeCache(cacheKey, data);
  } catch (e) {
    console.log(e)
    el.textContent = "— ? --°";
  }
}


function formatWeather({ city, icon, temp }) {
  const t =
    typeof temp === "number"
      ? `${Math.round(temp)}°`
      : "--°";
  return `${city} ${icon} ${t}`;
}