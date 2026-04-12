(function() {
    const cfg = window.ELAYON_CONFIG;
    const supabase = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);
    const page = document.body.dataset.page;

    // Helper para mensagens
    const notify = (id, text, isErr) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
            el.style.color = isErr ? "#ff4444" : "#00ff41";
        }
    };

    // --- CADASTRO ---
    if (page === "cadastro") {
        document.getElementById("signupForm").onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById("signupEmail").value;
            const password = document.getElementById("signupPassword").value;
            const nome = document.getElementById("signupName").value;

            const { error } = await supabase.auth.signUp({
                email, password, options: { data: { nome }, emailRedirectTo: window.location.origin + "/login.html" }
            });
            if (error) notify("signupMessage", error.message, true);
            else window.location.href = "obrigado.html";
        };
    }

    // --- LOGIN ---
    if (page === "login") {
        document.getElementById("loginForm").onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) notify("loginMessage", "Dados incorretos ou e-mail não confirmado.", true);
            else window.location.href = cfg.routes.painel;
        };
    }

    // Olho da senha
    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.onclick = () => {
            const input = document.getElementById(btn.dataset.target);
            input.type = input.type === "password" ? "text" : "password";
            btn.textContent = input.type === "password" ? "👁" : "🙈";
        };
    });
})();
