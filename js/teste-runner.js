// ======================================
// ELAYON — TEST RUNNER OFICIAL
// ======================================

(function () {

  function log(msg) {
    console.log("[TEST]", msg);

    const box = document.getElementById("logTech");
    if (box) {
      box.textContent += msg + "\n";
      box.scrollTop = box.scrollHeight;
    }
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runTunnelTests() {

    if (!window.ELAYON_TUNNEL) {
      alert("ELAYON_TUNNEL não carregado.");
      return;
    }

    try {

      log("🚀 Iniciando diagnóstico do túnel...");
      await wait(800);

      // =========================
      // 1. HEALTHCHECK
      // =========================
      log("🔎 Teste 1: Healthcheck");
      const health = await window.ELAYON_TUNNEL.healthcheck();
      log(JSON.stringify(health, null, 2));
      await wait(1200);

      // =========================
      // 2. MICROFONE
      // =========================
      log("🎤 Teste 2: Abrindo microfone...");
      const mic = await window.ELAYON_TUNNEL.mic.open();
      log("Microfone OK");
      await wait(1200);

      // =========================
      // 3. TTS
      // =========================
      log("🔊 Teste 3: TTS...");
      await window.ELAYON_TUNNEL.tts.speak(
        "Teste de voz do sistema Elayon."
      );
      await wait(800);

      // =========================
      // 4. STT LIVRE
      // =========================
      log("🧠 Teste 4: Fale algo livremente...");
      await wait(500);

      const stt1 = await window.ELAYON_TUNNEL.stt.listenOnce({
        silenceMs: 8000,
        onPartial: (d) => {
          log("Parcial: " + d.text);
        }
      });

      log("Final: " + stt1.text);
      await wait(1200);

      // =========================
      // 5. STT COM OK OK
      // =========================
      log("🛑 Teste 5: Fale e finalize com OK OK");
      await wait(500);

      const stt2 = await window.ELAYON_TUNNEL.stt.listenForPhrase({
        stopPhrases: ["ok ok"],
        silenceFailsafeMs: 20000,
        onPartial: (d) => {
          log("Parcial: " + d.text);
        }
      });

      log("Final com OK OK: " + stt2.text);
      await wait(1200);

      // =========================
      // 6. CRS (OPCIONAL)
      // =========================
      if (health.authenticated && health.crs) {

        log("📊 Teste 6: CRS...");

        const payload = window.ELAYON_TUNNEL.crs.buildPayload(stt2.text);
        const crs = await window.ELAYON_TUNNEL.crs.analyze(payload);

        log("CRS OK");
        log(JSON.stringify(crs, null, 2));

      } else {
        log("⚠️ CRS ignorado (sem login ou offline)");
      }

      await wait(1000);

      // =========================
      // FINAL
      // =========================
      log("✅ TESTE FINALIZADO");

      await window.ELAYON_TUNNEL.tts.speak(
        "Todos os testes foram concluídos com sucesso."
      );

    } catch (err) {

      console.error(err);
      log("❌ ERRO: " + err.message);

      try {
        await window.ELAYON_TUNNEL.tts.speak(
          "Erro detectado no sistema."
        );
      } catch {}

    } finally {

      try { await window.ELAYON_TUNNEL.mic.close(); } catch {}
      try { await window.ELAYON_TUNNEL.stt.stop(); } catch {}

      log("🔚 Recursos encerrados");

    }
  }

  function resetLog() {
    const box = document.getElementById("logTech");
    if (box) box.textContent = "";
  }

  // =========================
  // INIT
  // =========================
  document.addEventListener("DOMContentLoaded", () => {

    const btnRun = document.getElementById("btnTestarTunnel");
    const btnReset = document.getElementById("btnResetLog");

    if (btnRun) {
      btnRun.addEventListener("click", runTunnelTests);
    }

    if (btnReset) {
      btnReset.addEventListener("click", resetLog);
    }

  });

})();