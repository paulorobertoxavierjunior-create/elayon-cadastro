(function () {
  "use strict";

  const cfg = window.ELAYON_CONFIG || {};
  const page = (document.body?.dataset?.page || "index").toLowerCase();

  const routes = {
    login: cfg.routes?.login || "login.html",
    cadastro: cfg.routes?.cadastro || "cadastro.html",
    painel: cfg.routes?.painel || "painel.html",
    presenca: cfg.routes?.presenca || "https://paulorobertoxavierjunior-create.github.io/elayon-presenca/",
    obrigado: cfg.routes?.obrigado || "obrigado.html",
    // opcional no config.js:
    // painelProfissional: "painel-profissional.html"
  };

  if (!window.supabase?.createClient) {
    console.error("[ELAYON] Supabase JS não carregado.");
    return;
  }
  if (!cfg.supabase?.url || !cfg.supabase?.anonKey) {
    console.error("[ELAYON] Config Supabase ausente em window.ELAYON_CONFIG.");
    return;
  }

  const supabase = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const $ = (id) => document.getElementById(id);

  // Limpeza seletiva (não limpa tudo do navegador)
  function clearAppStorage() {
    const whitelist = new Set([
      cfg.storage?.userKey || "elayon_user",
      "elayon_user",
      "elayon:last_role",
      "elayon:last_login"
    ]);

    // remove chaves explícitas
    whitelist.forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
      try { sessionStorage.removeItem(k); } catch {}
    });

    // remove namespace "elayon:"
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("elayon:")) localStorage.removeItem(k);
      });
    } catch {}
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith("elayon:")) sessionStorage.removeItem(k);
      });
    } catch {}
  }

  function showMessage(text, type = "error", elId = "message") {
    const box = $(elId) || $("signupMessage");
    if (!box) {
      // fallback
      alert(text);
      return;
    }
    box.classList.remove("hide", "error", "success");
    box.textContent = text;
    box.style.display = "block";
    if (type === "error") box.classList.add("error");
    if (type === "success") box.classList.add("success");
  }

  function setLoading(button, loading = true, loadingText = "Processando...") {
    if (!button) return;
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = loadingText;
      button.style.opacity = "0.8";
      button.style.cursor = "not-allowed";
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
      button.style.opacity = "1";
      button.style.cursor = "pointer";
    }
  }

  function normalizeRole(user) {
    return (
      user?.user_metadata?.role ||
      user?.app_metadata?.role ||
      localStorage.getItem("elayon:last_role") ||
      "usuario"
    );
  }

  function redirectByRole(user) {
    const role = normalizeRole(user);

    // guarda para UX
    try {
      localStorage.setItem("elayon:last_role", role);
      localStorage.setItem("elayon:last_login", new Date().toISOString());
    } catch {}

    // Se no futuro quiser separar painel por role:
    // if (role === "profissional" && routes.painelProfissional) {
    //   window.location.href = routes.painelProfissional;
    //   return;
    // }

    window.location.href = routes.painel;
  }

  async function getUserSafe() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        await supabase.auth.signOut();
        clearAppStorage();
        return null;
      }
      return user;
    } catch (e) {
      console.error("[ELAYON] Erro de sessão:", e);
      clearAppStorage();
      return null;
    }
  }

  async function handlePainel() {
    // bloqueia até validar auth
    document.body.style.display = "none";

    const user = await getUserSafe();
    if (!user) {
      window.location.href = routes.login;
      return;
    }

    // libera painel
    document.body.style.display = "block";

    if ($("welcomeTitle")) {
      $("welcomeTitle").textContent = `Acesso Liberado, ${user.user_metadata?.nome || "Usuário"}`;
    }
    if ($("userInfo")) {
      $("userInfo").textContent = `Sessão ativa como ${user.email}`;
    }

    $("btnLogoutLink")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      clearAppStorage();
      window.location.href = routes.login;
    });

    $("btnStart")?.addEventListener("click", () => {
      window.location.href = routes.presenca;
    });
  }

  async function handleAuthPages() {
    // se já está logado e caiu em login/cadastro -> painel
    const currentUser = await getUserSafe();
    if (currentUser) {
      redirectByRole(currentUser);
      return;
    }

    // LOGIN
    const loginForm = $("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = $("email")?.value?.trim();
        const password = $("password")?.value || "";
        const loginBtn = $("loginBtn") || loginForm.querySelector('button[type="submit"]');

        if (!email || !password) {
          showMessage("Preencha e-mail e senha.", "error", "message");
          return;
        }

        setLoading(loginBtn, true, "Entrando...");
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });

          if (error) {
            showMessage(`Erro no login: ${error.message}`, "error", "message");
            return;
          }

          showMessage("Login realizado com sucesso.", "success", "message");
          redirectByRole(data?.user || null);
        } catch (err) {
          showMessage(`Falha inesperada: ${err.message}`, "error", "message");
        } finally {
          setLoading(loginBtn, false);
        }
      });
    }

    // CADASTRO
    const signupForm = $("signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nome = $("signupName")?.value?.trim();
        const email = $("signupEmail")?.value?.trim();
        const password = $("signupPassword")?.value || "";
        const role = $("signupRole")?.value || "usuario";
        const signupBtn = $("btnCreate") || signupForm.querySelector('button[type="submit"]');

        if (!nome || !email || !password) {
          showMessage("Preencha nome, e-mail e senha.", "error", "signupMessage");
          return;
        }

        setLoading(signupBtn, true, "Criando conta...");
        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                nome,
                role // usuario | piloto | profissional | empresa
              },
              emailRedirectTo: "https://paulorobertoxavierjunior-create.github.io/elayon-cadastro/login.html"
            }
          });

          if (error) {
            showMessage(`Erro no cadastro: ${error.message}`, "error", "signupMessage");
            return;
          }

          showMessage("Conta criada. Verifique seu e-mail para ativar.", "success", "signupMessage");
          setTimeout(() => { window.location.href = routes.obrigado; }, 900);
        } catch (err) {
          showMessage(`Falha inesperada: ${err.message}`, "error", "signupMessage");
        } finally {
          setLoading(signupBtn, false);
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // escuta mudanças de auth (útil após confirmação por link)
    supabase.auth.onAuthStateChange((event, session) => {
      if ((page === "login" || page === "cadastro") && session?.user) {
        redirectByRole(session.user);
      }
    });

    if (page === "painel") {
      await handlePainel();
    } else {
      await handleAuthPages();
    }
  });
})();