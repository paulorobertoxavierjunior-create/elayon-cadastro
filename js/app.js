(function () {
  const cfg = window.ELAYON_CONFIG || {};
  const page = document.body.dataset.page || "index";
  const storageKey = cfg.storage?.userKey || "elayon_user";

  // Inicialização do Supabase
  if (!window.supabase || !window.supabase.createClient) {
    console.error("SDK do Supabase não carregado.");
    return;
  }
  const supabase = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);

  // Auxiliares
  function $(id) { return document.getElementById(id); }

  function setMessage(id, text, isError = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = text || "";
    el.style.color = isError ? "#ff7a7a" : "inherit";
    el.style.display = text ? "block" : "none";
  }

  function clearAllData() {
    localStorage.removeItem(storageKey);
    localStorage.clear(); // Limpa resíduos de sessões antigas
    sessionStorage.clear();
  }

  // FUNÇÃO CRÍTICA: Validação Real do Usuário
  async function getUserSafe() {
    try {
      // 1. Tenta pegar a sessão atual (rápido)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        clearAllData();
        return null;
      }

      // 2. Valida se o usuário ainda existe no banco (Segurança contra Deleção)
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.warn("Sessão inválida ou usuário inexistente no banco. Expulsando...");
        await supabase.auth.signOut();
        clearAllData();
        return null;
      }

      return user;
    } catch (e) {
      console.error("Erro na verificação de segurança:", e);
      clearAllData();
      return null;
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    clearAllData();
    window.location.href = cfg.routes.login;
  }

  // --- COMPORTAMENTOS POR PÁGINA ---

  async function handleIndex() {
    const user = await getUserSafe();
    if (user) window.location.href = cfg.routes.painel;
  }

  async function handleLogin() {
    const form = $("loginForm");
    if (!form) return;

    // Se já estiver logado, pula pro painel
    const user = await getUserSafe();
    if (user) {
      window.location.href = cfg.routes.painel;
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("email")?.value.trim();
      const password = $("password")?.value.trim();

      setMessage("message", "Conectando ao núcleo...");

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage("message", "Falha na conexão: " + error.message, true);
        return;
      }

      window.location.href = cfg.routes.painel;
    });
  }

  async function handleCadastro() {
    const form = $("signupForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = $("signupName")?.value.trim();
      const email = $("signupEmail")?.value.trim();
      const password = $("signupPassword")?.value.trim();

      setMessage("signupMessage", "Criando identidade...");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome }, emailRedirectTo: cfg.routes.painel }
      });

      if (error) {
        setMessage("signupMessage", error.message, true);
        return;
      }

      setMessage("signupMessage", "Conta criada! Verifique seu e-mail para ativar.");
    });
  }

  async function handlePainel() {
    // PROTEÇÃO ABSOLUTA
    const user = await getUserSafe();

    if (!user) {
      window.location.href = cfg.routes.login;
      return;
    }

    // Preenchimento dos dados
    const nome = user.user_metadata?.nome || "Viajante";
    const email = user.email;

    if ($("welcomeTitle")) $("welcomeTitle").textContent = `Bem-vindo, ${nome}`;
    if ($("userInfo")) $("userInfo").textContent = `Sessão ativa: ${email}`;

    // Ações
    const btnSair = $("btnLogoutLink");
    if (btnSair) {
      btnSair.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    }

    const btnStart = $("btnStart");
    if (btnStart) {
      btnStart.addEventListener("click", () => {
        window.location.href = cfg.routes.presenca;
      });
    }
  }

  // Inicialização
  document.addEventListener("DOMContentLoaded", () => {
    switch (page) {
      case "index": handleIndex(); break;
      case "login": handleLogin(); break;
      case "cadastro": handleCadastro(); break;
      case "painel": handlePainel(); break;
    }
  });
})();
