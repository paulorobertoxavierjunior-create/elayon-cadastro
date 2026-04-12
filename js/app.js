(function () {
  const cfg = window.ELAYON_CONFIG || {};
  const page = document.body.dataset.page || "index";

  const supabaseUrl = cfg.supabase?.url;
  const supabaseKey = cfg.supabase?.anonKey;
  const storageKey = cfg.storage?.userKey || "elayon_user";

  if (!window.supabase || !window.supabase.createClient) {
    console.error("SDK do Supabase não carregado.");
    return;
  }

  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  function $(id) {
    return document.getElementById(id);
  }

  function setMessage(id, text, isError = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = text || "";
    el.classList.remove("error");
    if (isError) el.classList.add("error");
    el.style.display = text ? "block" : "none";
  }

  function saveUserLocal(user) {
    if (!user) return;
    const payload = {
      id: user.id,
      nome: user.user_metadata?.nome || "Usuário",
      email: user.email || ""
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }

  function getUserLocal() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "null");
    } catch {
      return null;
    }
  }

  function clearUserLocal() {
    localStorage.removeItem(storageKey);
  }

  async function getUserSafe() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.warn("Sessão inválida. Limpando.");
        await supabase.auth.signOut();
        clearUserLocal();
        return null;
      }

      return data?.user || null;
    } catch (e) {
      console.error("Erro ao verificar usuário:", e);
      return null;
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Falha ao sair do Supabase:", e);
    }

    clearUserLocal();
    window.location.href = cfg.routes.login;
  }

  async function bindIndexRedirect() {
    const user = await getUserSafe();

    if (user) {
      saveUserLocal(user);
      window.location.href = cfg.routes.painel;
    }
  }

  async function bindCadastro() {
    const form = $("signupForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = $("signupName")?.value.trim();
      const email = $("signupEmail")?.value.trim();
      const password = $("signupPassword")?.value.trim();

      if (!nome || !email || !password) {
        setMessage("signupMessage", "Preencha todos os campos.", true);
        return;
      }

      setMessage("signupMessage", "Ativando conexão...");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: cfg.routes.painel,
          data: { nome }
        }
      });

      if (error) {
        setMessage("signupMessage", error.message, true);
        return;
      }

      if (data?.user) {
        saveUserLocal(data.user);
      }

      setMessage(
        "signupMessage",
        "Conta criada. Verifique seu e-mail para concluir a ativação."
      );
    });
  }

  async function bindLogin() {
    const form = $("loginForm");
    if (!form) return;

    const user = await getUserSafe();
    if (user) {
      saveUserLocal(user);
      window.location.href = cfg.routes.painel;
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = $("email")?.value.trim();
      const password = $("password")?.value.trim();

      if (!email || !password) {
        setMessage("message", "Informe e-mail e senha.", true);
        return;
      }

      setMessage("message", "Conectando ao núcleo...");

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setMessage("message", error.message, true);
        return;
      }

      if (data?.user) {
        saveUserLocal(data.user);
      }

      window.location.href = cfg.routes.painel;
    });
  }

  async function protectPainel() {
    const user = await getUserSafe();

    if (!user) {
      clearUserLocal();
      window.location.href = cfg.routes.login;
      return;
    }

    saveUserLocal(user);
    preencherPainel(user);
    bindPainelActions();
  }

  function preencherPainel(user) {
    const nome = user.user_metadata?.nome || "Usuário";
    const email = user.email || "Sem e-mail";

    const welcomeTitle = $("welcomeTitle");
    const userInfo = $("userInfo");

    if (welcomeTitle) {
      welcomeTitle.textContent = `Acesso Liberado, ${nome}`;
    }

    if (userInfo) {
      userInfo.textContent = `Sessão ativa como ${email}`;
    }
  }

  function bindPainelActions() {
    const sairLink = $("btnLogoutLink");
    const startBtn = $("btnStart");

    if (sairLink) {
      sairLink.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    }

    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = cfg.routes.presenca;
      });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (page === "index") {
      await bindIndexRedirect();
      return;
    }

    if (page === "cadastro") {
      await bindCadastro();
      return;
    }

    if (page === "login") {
      await bindLogin();
      return;
    }

    if (page === "painel") {
      await protectPainel();
    }
  });
})();