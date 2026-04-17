// ======================================
// ELAYON — TUNNEL TEST RUNNER
// ======================================

async function runTunnelTests() {

  const log = (msg) => {
    console.log("[TEST]", msg);
    const box = document.getElementById("logTech");
    if (box) box.textContent += msg + "\n";
  };

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  try {

    log("🚀 Iniciando diagnóstico do túnel...");
    await wait(1000);

    // =========================
    // 1. HEALTHCHECK
    // =========================
    log("🔎 Teste 1: Healthcheck...");
    const health = await window.ELAYON_TUNNEL.healthcheck();
    log(JSON.stringify(health, null, 2));
    await wait(1500);

    // =========================
    // 2. MICROFONE
    // =========================
    log("🎤 Teste 2: Microfone...");
    const mic = await window.ELAYON_TUNNEL.mic.open();
    log("Microfone OK: " + JSON.stringify(mic));
    await wait(1500);

    // =========================
    // 3. TTS
    // =========================
    log("🔊 Teste 3: TTS...");
    await window.ELAYON_TUNNEL.tts.speak("Teste de voz do sistema Elayon.");
    await wait(1000);

    // =========================
    // 4. STT LIVRE
    // =========================
    log("🧠 Teste 4: STT livre (fale algo)...");
    
    const stt1 = await window.ELAYON_TUNNEL.stt.listenOnce({
      silenceMs: 8000,
      onPartial: (d) => {
        log("Parcial: " + d.text);
      }
    });

    log("Final STT: " + stt1.text);
    await wait(1500);

    // =========================
    // 5. STT COM STOP
    // =========================
    log("🛑 Teste 5: STT com OK OK (fale e finalize)...");

    const stt2 = await window.ELAYON_TUNNEL.stt.listenForPhrase({
      stopPhrases: ["ok ok"],
      silenceFailsafeMs: 20000,
      onPartial: (d) => {
        log("Parcial: " + d.text);
      }
    });

    log("Final com stop: " + stt2.text);
    await wait(1500);

    // =========================
    // 6. CRS (OPCIONAL)
    // =========================
    if (health.authenticated && health.crs) {
      log("📊 Teste 6: CRS...");
      
      const payload = window.ELAYON_TUNNEL.crs.buildPayload(stt2.text);
      const crs = await window.ELAYON_TUNNEL.crs.analyze(payload);
      
      log("CRS OK: " + JSON.stringify(crs, null, 2));
    } else {
      log("⚠️ CRS ignorado (sem auth ou offline)");
    }

    await wait(1500);

    // =========================
    // FINAL
    // =========================
    log("✅ TESTE FINALIZADO COM SUCESSO");

    await window.ELAYON_TUNNEL.tts.speak("Todos os testes foram concluídos com sucesso.");

  } catch (err) {
    console.error(err);
    log("❌ ERRO: " + err.message);

    try {
      await window.ELAYON_TUNNEL.tts.speak("Erro detectado no sistema.");
    } catch {}
  } finally {
    try { await window.ELAYON_TUNNEL.mic.close(); } catch {}
    try { await window.ELAYON_TUNNEL.stt.stop(); } catch {}
  }
}