async function getUserSafe() {
  try {
    const { data, error } = await window.supabase.auth.getUser();

    if (error) {
      console.warn("Sessão inválida → limpando");
      await window.supabase.auth.signOut();
      localStorage.clear();
      return null;
    }

    return data?.user || null;

  } catch (e) {
    console.error("Erro crítico sessão:", e);
    return null;
  }
}