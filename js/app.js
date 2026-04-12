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

// --- LÓGICA DE ACESSO E PROTEÇÃO ---
const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (page === "painel") {
        if (!session) {
            // Se tentar entrar no painel sem estar logado, volta pro login
            window.location.href = "login.html";
        } else {
            // Se estiver logado, mostra o conteúdo
            document.getElementById("protected-content").style.display = "block";
        }
    }
};

checkSession();

// Botão de Sair
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        await supabase.auth.signOut();
        window.location.href = "login.html";
    };
}


   // --- CADASTRO BLINDADO ---
if (page === "cadastro") {
    document.getElementById("signupForm").onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;
        const nome = document.getElementById("signupName").value;

        // Criamos a URL de redirecionamento completa manualmente para não ter erro
        const redeirectUrl = "https://paulorobertoxavierjunior-create.github.io/elayon-cadastro/login.html";

const { data, error } = await supabase.auth.signUp({
    email, 
    password, 
    options: { 
        data: { nome }, 
        // Forçamos o caminho completo do novo repositório
        emailRedirectTo: "https://paulorobertoxavierjunior-create.github.io/elayon-cadastro/login.html"
    }
});

        if (error) {
            console.error("Erro Supabase:", error.message);
            notify("signupMessage", "Erro: " + error.message, true);
        } else {
            console.log("Sucesso:", data);
            // Se o usuário foi criado mas precisa confirmar e-mail:
            notify("signupMessage", "Verifique seu e-mail para confirmar!", false);
            setTimeout(() => { window.location.href = "obrigado.html"; }, 2000);
        }
    };
}



// --- LÓGICA DE LOGIN ---
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const messageDiv = document.getElementById('message');

        loginBtn.disabled = true;
        loginBtn.innerText = "Autenticando...";

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            messageDiv.innerText = "Erro: " + error.message;
            messageDiv.style.color = "#ff4b2b";
            loginBtn.disabled = false;
            loginBtn.innerText = "Entrar no Sistema";
        } else {
            messageDiv.innerText = "Acesso autorizado! Redirecionando...";
            messageDiv.style.color = "#00ff41";
            
            // Pequeno delay para o usuário ler a mensagem
            setTimeout(() => {
                window.location.href = "painel.html";
            }, 1500);
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
