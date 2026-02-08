import { loginGuard } from "/js/lib/auth/";
import { setUser } from "/js/lib/ls/users";

const form = document.getElementById("loginForm");
const input = document.getElementById("username");

const modal = document.getElementById("nameAlertModal");
const alertMsg = document.getElementById("alertMessage");
const okBtn = document.getElementById("alertOkBtn");
const backdrop = modal?.querySelector(".alert-modal__backdrop");

loginGuard();

/* ===== modal helpers ===== */
const openModal = (msg) => {
  if (!modal) return;
  if (alertMsg && msg) alertMsg.textContent = msg;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");

  // 입력 강조
  input.classList.add("is-invalid");
};

const closeModal = () => {
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");

  input.classList.remove("is-invalid");
  input.focus();
  input.select?.();
};

/* ===== handlers ===== */
const onSubmit = (e) => {
  e.preventDefault();

  const ok = setUser(input.value);

  if (ok) {
    location.href = "/pages/todo/";
    return;
  }

  openModal("한글/영문/숫자 1~8자만 가능합니다.");
};

const onInput = () => {
  // 타이핑 시작하면 강조 해제 (모달이 열려있으면 닫아도 됨)
  input.classList.remove("is-invalid");
};

form.addEventListener("submit", onSubmit);
input.addEventListener("input", onInput);

/* modal close events */
okBtn?.addEventListener("click", closeModal);
backdrop?.addEventListener("click", closeModal);

// ESC로 닫기
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.classList.contains("is-open")) {
    closeModal();
  }
});
