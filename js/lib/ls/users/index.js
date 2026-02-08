const LS_KEY = "todo.user.v1";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const NAME_REGEX = /^[가-힣a-zA-Z0-9]{1,8}$/;

/*
    원래는 UUID를 DB에 저장해두고, API 접근제한에 쓰려고 했으나
    local storage를 쓰고, 가능하면 API 접근을 안하고 처리하려고 하다보니 
    우선은 이렇게 처리. 

    졸업작품용 작동페이지가 아니라, 취미개발프로젝트로 작성하게 되면
    nextjs로 만들예정. 
*/

/**
 * 임시 dummy UUID 생성
 * 나중에는 UUID v4, pg unique 등으로 사용자별 unique한 UUID 보장 예정 이지만!
 * 여기서는 DB에 저장 안할거니까 우선은 이렇게 보여주기용으로 생성
 * @returns {string} uuid
 */
const generateUUID = () => {
  let result = "";
  for (let i = 0; i < 12; i++) {
    const idx = Math.floor(Math.random() * CHARS.length);
    result += CHARS[idx];
  }
  return result;
};

/**
 * 사용자 정보 조회
 * @returns {{uuid:string, name:string} | null}
 */
export const getUser = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.uuid === "string" &&
      typeof parsed.name === "string"
    ) {
      return parsed;
    }

    return null;
  } catch (e) {
    return null;
  }
};

/**
 * 사용자 저장 (신규 생성)
 * - 이름은 1~8자
 * - 한글 / 영문 / 숫자만 허용
 * @param {string} name
 * @returns {boolean}
 */
export const setUser = (name) => {
  if (!name || typeof name !== "string") return false;

  const trimmed = name.trim();
  if (!NAME_REGEX.test(trimmed)) return false;

  const user = {
    uuid: generateUUID(),
    name: trimmed,
  };

  try {
    localStorage.setItem(LS_KEY, JSON.stringify(user));
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 사용자 제거
 */
export const clearUser = () => {
  try {
    localStorage.removeItem(LS_KEY);
    return true;
  } catch (e) {
    return false;
  }
};
