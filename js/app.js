(function() {
    const cfg = window.ELAYON_CONFIG;
    if (!cfg) {
        console.error("Configuração ELAYON não encontrada!");
        return;
    }

    const supabase = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);
    const page = document.body.dataset.page;

    // Helper para mensagens
    const notify = (id, text, isErr) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
            el.style.color = isErr ? "#ff4444" : "#00f2ff"; // Ciano para sucesso seguindo sua nova identidade
        }
    };

    // --- CADASTRO ---
    if (page === "cadastro") {
        document.getElementById("signupForm").onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById("signupEmail").value;
            const password = document.getElementById("signupPassword").value;
            const nome = document.getElementById("signupName").value;

            // Ajuste aqui: Usando a URL de login do config para o redirecionamento do e-mail
            const { error } = await supabase.auth.signUp({
                email, 
                password, 
                options: { 
                    data: { nome }, 
                    emailRedirectTo: window.location.origin + "/elayon-cadastro/login.html" 
                }
            });

            if (error) {
                notify("signupMessage", "Erro: " + error.message, true);
            } else {
                // Redireciona para a página de agradecimento/instruções
                window.location.href = "obrigado.html";
            }
        };
    }

    // --- LOGIN ---
    if (page === "login") {
        document.getElementById("loginForm").onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                notify("loginMessage", "Dados incorretos ou e-mail não confirmado.", true);
            } else {
                // Vai para o painel configurado no config.js
                window.location.href = cfg.routes.painel;
            }
        };
    }

    // Toggle Senha (Olhinho)
    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.onclick = () => {
            const targetId = btn.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (input) {
                input.type = input.type === "password" ? "text" : "password";
                btn.textContent = input.type === "password" ? "👁" : "🙈";
            }
        };
    });
})();
