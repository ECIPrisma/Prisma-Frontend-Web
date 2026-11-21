/**
 * Utilidades de audio ligero vía Web Audio API nativa ($0 dependencias).
 */

export function playOrderNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Tono 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.2);

    // Tono 2 (armónico superior)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (err) {
    // Si el navegador bloquea audio sin interacción previa
  }
}
