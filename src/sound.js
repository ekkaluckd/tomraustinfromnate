// Tiny chiptune engine: all sounds are synthesized with WebAudio, no files needed.
let ctx = null
let master = null
let musicGain = null
let musicTimer = null
let muted = false

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
    musicGain = ctx.createGain()
    musicGain.gain.value = 0.18
    musicGain.connect(master)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

const freq = (n) => 440 * Math.pow(2, (n - 69) / 12) // MIDI note -> Hz

function tone(note, start, dur, { type = 'square', vol = 0.3, dest = master, slide = 0 } = {}) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq(note), start)
  if (slide) o.frequency.exponentialRampToValueAtTime(freq(note + slide), start + dur)
  g.gain.setValueAtTime(vol, start)
  g.gain.exponentialRampToValueAtTime(0.001, start + dur)
  o.connect(g).connect(dest)
  o.start(start)
  o.stop(start + dur + 0.02)
}

const SFX = {
  tap: () => tone(84, ctx.currentTime, 0.08, { vol: 0.2, slide: 5 }),
  select: () => {
    const t = ctx.currentTime
    tone(76, t, 0.06, { vol: 0.18 })
    tone(83, t + 0.06, 0.08, { vol: 0.18 })
  },
  next: () => {
    const t = ctx.currentTime
    ;[72, 76, 79, 84].forEach((n, i) => tone(n, t + i * 0.07, 0.12, { vol: 0.2 }))
  },
  photo: () => {
    const t = ctx.currentTime
    tone(96, t, 0.05, { type: 'triangle', vol: 0.3 })
    tone(91, t + 0.06, 0.1, { type: 'triangle', vol: 0.3 })
  },
  win: () => {
    const t = ctx.currentTime
    const notes = [72, 76, 79, 84, 79, 84, 88]
    notes.forEach((n, i) => tone(n, t + i * 0.1, i === notes.length - 1 ? 0.5 : 0.14, { vol: 0.22 }))
    notes.forEach((n, i) => tone(n - 12, t + i * 0.1, 0.12, { type: 'triangle', vol: 0.2 }))
  },
}

export function sfx(name) {
  if (muted) return
  ensure()
  SFX[name]?.()
}

// Cute looping melody in C major, 8th notes. 0 = rest.
const MELODY = [
  76, 79, 84, 79, 81, 79, 76, 0, 74, 76, 77, 76, 74, 72, 74, 0,
  76, 79, 84, 86, 84, 81, 79, 0, 77, 76, 74, 76, 72, 0, 72, 0,
]
const BASS = [48, 55, 45, 52, 41, 48, 43, 50]
const STEP = 0.2 // seconds per 8th note

function scheduleBar(start) {
  MELODY.forEach((n, i) => {
    if (n) tone(n, start + i * STEP, STEP * 0.9, { vol: 0.22, dest: musicGain })
  })
  BASS.forEach((n, i) => tone(n, start + i * STEP * 4, STEP * 3.5, { type: 'triangle', vol: 0.5, dest: musicGain }))
}

export function startMusic() {
  if (muted || musicTimer) return
  ensure()
  const loopLen = MELODY.length * STEP
  let next = ctx.currentTime + 0.05
  const tick = () => {
    while (next < ctx.currentTime + loopLen) {
      scheduleBar(next)
      next += loopLen
    }
  }
  tick()
  musicTimer = setInterval(tick, 1000)
}

export function stopMusic() {
  clearInterval(musicTimer)
  musicTimer = null
  if (musicGain) {
    // Swap in a fresh gain node so already-scheduled notes go silent.
    musicGain.disconnect()
    musicGain = ctx.createGain()
    musicGain.gain.value = 0.18
    musicGain.connect(master)
  }
}

export function setMuted(m) {
  muted = m
  if (m) stopMusic()
  else startMusic()
}
