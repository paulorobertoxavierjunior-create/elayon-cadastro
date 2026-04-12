// ==========================
// SEGURANÇA + USUÁRIO
// ==========================

function getUser() {
  const raw = localStorage.getItem("elayon_user");

  if (!raw) {
    // BLOQUEIO TOTAL
    window.location.href = "login.html";
    return null;
  }

  return JSON.parse(raw);
}

// ==========================
// PREENCHER PAINEL
// ==========================

function preencherPainel(user) {
  const nome = user.nome || "Usuário";

  document.getElementById("welcomeTitle").textContent =
    `Bem-vindo, ${nome}.`;

  document.getElementById("userInfo").textContent =
    `Sessão iniciada como ${user.email}`;
}

// ==========================
// BOTÃO PRINCIPAL
// ==========================

function iniciar() {
  window.location.href =
    "https://paulorobertoxavierjunior-create.github.io/elayon-presenca/index.html";
}

// ==========================
// LOGOUT (AJUSTE)
// ==========================

function logout() {
  localStorage.removeItem("elayon_user");
  window.location.href = "login.html";
}

// ==========================
// START
// ==========================

document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();

  if (!user) return;

  preencherPainel(user);

  document.getElementById("btnStart")
    .addEventListener("click", iniciar);

  // botão sair do header
  const sairBtn = document.querySelector('[href="login.html"]');
  if (sairBtn) {
    sairBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
});