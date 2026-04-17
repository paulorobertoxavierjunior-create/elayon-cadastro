(function () {
  const cfg = window.ELAYON_CONFIG || {};
  const page = document.body.dataset.page || "index";
  const storageKey = cfg.storage?.userKey || "elayon_user";

  if (!window.supabase || !window.supabase.createClient) return;
  const supabase = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);

  const $ = (id) => document.getElementById(id);

  function clearSession() {
    localStorage.clear();
    sessionStorage.clear();
  }

  async function getUserSafe() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        await supabase.auth.signOut();
        clearSession();
        return null;
      }
      return user;
    } catch (e) {
      clearSession();
      return null;
    }
  }

  async function handlePainel() {
    // Bloqueia visualmente até validar
    document.body.style.display = "none";
    
    const user = await getUserSafe();
    if (!user) {
      window.location.href = cfg.routes.login;
      return;
    }

    // Libera o painel
    document.body.style.display = "block";
    if ($("welcomeTitle")) $("welcomeTitle").textContent = `Acesso Liberado, ${user.user_metadata?.nome || 'Usuário'}`;
    if ($("userInfo")) $("userInfo").textContent = `Sessão ativa como ${user.email}`;

    $("btnLogoutLink")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      clearSession();
      window.location.href = cfg.routes.login;
    });

    $("btnStart")?.addEventListener("click", () => {
      window.location.href = cfg.routes.presenca;
    });
  }

  async function handleAuthPages() {
    const user = await getUserSafe();
    if (user) window.location.href = cfg.routes.painel;

    // Lógica de Login
    $("loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: $("email").value,
        password: $("password").value
      });
      if (error) alert("Erro: " + error.message);
      else window.location.href = cfg.routes.painel;
    });

    // Lógica de Cadastro
    $("signupForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const { error } = await supabase.auth.signUp({
        email: $("signupEmail").value,
        password: $("signupPassword").value,
        options: { 
  data: { nome: $("signupName").value },
  // 👇 ESSA LINHA É A QUE FALTA 👇
  emailRedirectTo: 'https://paulorobertoxavierjunior-create.github.io/elayon-cadastro/login.html'
}

      });
      if (error) alert(error.message);
      else alert("Verifique seu e-mail para ativar a conta!");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (page === "painel") handlePainel();
    else handleAuthPages();
  });
})();
