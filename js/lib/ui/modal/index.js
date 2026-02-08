// /js/lib/ui/modal.js
let invalidTarget = null;

const getEls = () => ({
  modal: document.getElementById("dqModal"),
  msg: document.getElementById("dqModalMessage"),
  ok: document.getElementById("dqModalOkBtn"),
});

export const setInvalidTarget = (el) => {
  invalidTarget = el;
};

export const openModal = (message = "알 수 없는 오류", title = "ALERT") => {
  const { modal, msg } = getEls();
  if (!modal) return;

  const titleEl = document.getElementById("dqModalTitle");
  if (titleEl) titleEl.textContent = title;

  if (msg) msg.textContent = message;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");

  if (invalidTarget) invalidTarget.classList.add("is-invalid");
};

export const closeModal = () => {
  const { modal } = getEls();
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");

  if (invalidTarget) invalidTarget.classList.remove("is-invalid");
};

export const bindModal = () => {
  const { modal, ok } = getEls();
  if (!modal || modal.dataset.bound === "1") return;
  modal.dataset.bound = "1";

  const backdrop = modal.querySelector(".alert-modal__backdrop");

  ok?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
};
