(function () {
  const cfg = window.ELAYON_CONFIG || {};
  const page = document.body.dataset.page || "index";
  const storageKey = cfg.storage?.userKey || "elayon_user";

  if (!window.supabase || !window.supabase.createClient) {
    console.error("SDK do Supabase não carregado.");
    return;
  }
  const supabase = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);

  function $(id) { return document.getElementById(id); }

  function clearAllData() {
    localStorage.clear();
    sessionStorage.clear();
  }

  // Validação em tempo real com o servidor
  async function getUserSafe() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        await supabase.auth.signOut();
        clearAllData();
        return null;
      }
      return user;
    } catch (e) {
      clearAllData();
      return null;
    }
  }

  async function handlePainel() {
    // Passo 1: Esconde o conteúdo imediatamente para evitar "flash" de informação
    document.body.style.display = "none";

    const user = await getUserSafe();

    // Passo 2: Se não houver usuário real, redireciona para o login do cadastro
    if (!user) {
      window.location.href = cfg.routes.login;
      return;
    }

    // Passo 3: Se o usuário é válido, mostra a página e preenche os dados
    document.body.style.display = "block";

    const nome = user.user_metadata?.nome || "Usuário";
    const email = user.email;

    if ($("welcomeTitle")) $("welcomeTitle").textContent = `Bem-vindo, ${nome}`;
    if ($("userInfo")) $("userInfo").textContent = `Sessão ativa: ${email}`;

    // Configura botões
    const btnSair = $("btnLogoutLink");
    if (btnSair) {
      btnSair.onclick = async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        clearAllData();
        window.location.href = cfg.routes.login;
      };
    }

    const btnStart = $("btnStart");
    if (btnStart) {
      btnStart.onclick = () => {
        window.location.href = cfg.routes.presenca;
      };
    }
  }

  async function handleLogin() {
    const form = $("loginForm");
    if (!form) return;

    // Se já estiver logado, não precisa ver tela de login
    const user = await getUserSafe();
    if (user) { window.location.href = cfg.routes.painel; return; }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("email")?.value.trim();
      const password = $("password")?.value.trim();
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("Erro no acesso: " + error.message);
        return;
      }
      window.location.href = cfg.routes.painel;
    });
  }

  // Inicialização por página
  document.addEventListener("DOMContentLoaded", () => {
    if (page === "painel") handlePainel();
    else if (page === "login") handleLogin();
    else if (page === "cadastro") { /* lógica de cadastro se houver */ }
  });
})();
