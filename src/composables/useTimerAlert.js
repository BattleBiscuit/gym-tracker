import { hapticSuccess } from '@/composables/useNative.js'

export function triggerTimerAlert() {
  hapticSuccess() // native haptics on Android, falls back to navigator.vibrate
  beep()
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const tones = [
      { freq: 880,  start: 0,    duration: 0.12 },
      { freq: 1100, start: 0.15, duration: 0.12 },
    ]
    for (const { freq, start, duration } of tones) {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + start + 0.01)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration + 0.05)
    }
    setTimeout(() => ctx.close(), 600)
  } catch {}
}
