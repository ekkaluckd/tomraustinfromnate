import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Stage from './Stage.jsx'
import { sendMessage, sendPhoto, compressImage } from './telegram.js'
import { sfx, startMusic, setMuted } from './sound.js'

const QUESTIONS = [
  {
    id: 'smile',
    mood: 'day',
    title: 'Level 1',
    text: "How are you today? 🌤️ Don't forget to look in the mirror and see your smile - see how cute it is! 🪞😊",
    chips: ['😄 Feeling great!', '🙂 Pretty good', '😴 A bit tired', '🪞 Okay I looked. Cute.'],
  },
  {
    id: 'water',
    mood: 'water',
    title: 'Level 2',
    text: 'Have you had enough water today? 💧 It is SO hot out there, haha! 🥵☀️',
    chips: ['💦 Yes, hydrated!', '🥤 Drinking now', '🙈 Oops... not yet'],
  },
  {
    id: 'travel',
    mood: 'dusk',
    title: 'Level 3',
    text: 'Are you tired from traveling today? 🚕 I hope you have had dinner already. 🍜',
    chips: ['🍽️ Ate already!', '⏳ Eating soon', '🥱 A little tired', '💪 Not tired at all'],
  },
]

const STEPS = ['intro', ...QUESTIONS.map((q) => q.id), 'selfie', 'thanks']
const SMILE_OPTIONS = ['😁 Yes, big smile!', '🙂 A little smile', '🤔 Hmm, not yet']

// Types text out like an RPG dialog box; tap it to show everything at once.
function Typer({ text }) {
  const chars = Array.from(text)
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    const id = setInterval(() => {
      setN((v) => {
        if (v >= chars.length) {
          clearInterval(id)
          return v
        }
        if (v % 3 === 0) sfx('blip')
        return v + 1
      })
    }, 28)
    return () => clearInterval(id)
  }, [text])
  const done = n >= chars.length
  return (
    <p className="typer" aria-label={text} onClick={() => setN(chars.length)}>
      <span aria-hidden="true">{chars.slice(0, n).join('')}</span>
      {!done && <span className="caret" aria-hidden="true">▌</span>}
    </p>
  )
}

// True while the panel has more content below the visible area.
function useMoreBelow(ref) {
  const [more, setMore] = useState(false)
  useEffect(() => {
    const el = ref.current
    const check = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 24)
    const ro = new ResizeObserver(check)
    ro.observe(el)
    for (const child of el.children) ro.observe(child)
    const mo = new MutationObserver(() => {
      for (const child of el.children) ro.observe(child)
      check()
    })
    mo.observe(el, { childList: true, subtree: true })
    el.addEventListener('scroll', check, { passive: true })
    el.addEventListener('load', check, true) // images finishing loading
    check()
    return () => {
      ro.disconnect()
      mo.disconnect()
      el.removeEventListener('scroll', check)
      el.removeEventListener('load', check, true)
    }
  }, [ref])
  return more
}

// Pixel-block screen wipe between steps.
const COLS = 8
const ROWS = 14
const WIPE_MS = 12 * (COLS + ROWS) + 120
function Wipe({ phase }) {
  if (!phase) return null
  return (
    <div className={`wipe ${phase}`} aria-hidden="true">
      {Array.from({ length: COLS * ROWS }, (_, i) => (
        <i key={i} style={{ animationDelay: `${((i % COLS) + Math.floor(i / COLS)) * 12}ms` }} />
      ))}
    </div>
  )
}

function useSender() {
  const [status, setStatus] = useState('')
  const send = async (fn) => {
    setStatus('sending')
    try {
      await fn()
      setStatus('sent')
      return true
    } catch (e) {
      console.error(e)
      setStatus('error')
      return false
    }
  }
  return [status, send]
}

export default function App() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [draft, setDraft] = useState('')
  const [pick, setPick] = useState('')
  const [smile, setSmile] = useState('')
  const [photo, setPhoto] = useState(null)
  const [cheer, setCheer] = useState(0)
  const [note, setNote] = useState('')
  const [wipe, setWipe] = useState(null)
  const [status, send] = useSender()
  const [muted, setMute] = useState(false)
  const panel = useRef(null)
  const moreBelow = useMoreBelow(panel)

  const toggleMute = () => {
    setMuted(!muted)
    setMute(!muted)
    if (muted) sfx('tap')
  }

  const name = STEPS[step]
  const q = QUESTIONS.find((x) => x.id === name)
  const mood = q?.mood || (name === 'thanks' ? 'night' : 'day')

  // Tell Nate when Austin opens the game (once per browser session).
  useEffect(() => {
    try {
      if (sessionStorage.getItem('opened')) return
      sessionStorage.setItem('opened', '1')
    } catch { }
    sendMessage('👀 Austin just opened the game!').catch(console.error)
  }, [])

  // Reset scroll after the new step has rendered, so no stale content lingers.
  useLayoutEffect(() => {
    panel.current?.scrollTo(0, 0)
  }, [step])

  const go = (n) => {
    sfx(n === STEPS.length - 1 ? 'win' : 'next')
    setWipe('in')
    setTimeout(() => {
      setStep(n)
      setDraft('')
      setPick('')
      setWipe('out')
      setCheer((c) => c + 1)
      setTimeout(() => setWipe(null), WIPE_MS)
    }, WIPE_MS)
  }

  const submitAnswer = () => {
    // Chip and typed text are independent; either one (or both) is enough.
    const text = [pick, draft.trim()].filter(Boolean).join(' - ')
    if (!text) return
    setAnswers((a) => ({ ...a, [q.id]: text }))
    send(() => sendMessage(`💌 Austin - ${q.title}\nQ: ${q.text}\nA: ${text}`))
    go(step + 1)
  }

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photo) URL.revokeObjectURL(photo.url)
    setPhoto({ file, url: URL.createObjectURL(file) })
    sfx('photo')
  }

  const finish = async () => {
    const summary =
      `🎉 Austin finished the game!\n\n` +
      QUESTIONS.map((x) => `${x.title}: ${answers[x.id] || '-'}`).join('\n') +
      `\n\nDid this make you smile? ${smile || '-'}`
    const ok = await send(async () => {
      if (photo) await sendPhoto(await compressImage(photo.file), summary)
      else await sendMessage(summary + '\n(no selfie this time)')
      if (note.trim()) await sendMessage(`💬 Austin says:\n${note.trim()}`)
    })
    if (ok) go(step + 1)
  }

  const restart = () => {
    if (photo) URL.revokeObjectURL(photo.url)
    setAnswers({})
    setSmile('')
    setNote('')
    setPhoto(null)
    go(0)
  }

  return (
    <div className="app">
      <div className="phone">
        <header className="hud">
          <span>AUSTIN</span>
          <span className="progress">
            {STEPS.slice(1, -1).map((s, i) => (
              <i key={s} className={i < step ? 'on' : ''} />
            ))}
          </span>
          <button className="mute" onClick={toggleMute} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
            {muted ? '♪ OFF' : '♪ ON'}
          </button>
        </header>

        <Stage mood={mood} cheer={cheer} />

        <main className="panel" ref={panel}>
          {name === 'intro' && (
            <section className="card">
              <h1>Hi Sweetie Austin! 👋</h1>
              <p>I made you a tiny game. 🎮💙</p>
              <small>Psst... try tapping the characters up there!</small>
              <p>3 little questions, 1 smile mission. Tap one step at a time.</p>
              <button className="btn red" onClick={() => {
                startMusic()
                go(1)
              }}>
                ▶ START
              </button>
            </section>
          )}

          {q && (
            <section className="card" key={q.id}>
              <h2>{q.title}</h2>
              <Typer text={q.text} />
              <div className="chips">
                {q.chips.map((c) => (
                  <button key={c} className={`chip ${pick === c ? 'picked' : ''}`} onClick={() => {
                    setPick(pick === c ? '' : c)
                    sfx('select')
                  }}>
                    {c}
                  </button>
                ))}
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Or type your answer..."
                rows={3}
                maxLength={500}
              />
              <button className="btn" disabled={!pick && !draft.trim()} onClick={submitAnswer}>
                NEXT ▶
              </button>
            </section>
          )}

          {name === 'selfie' && (
            <section className="card">
              <h2>⭐ Final Level ⭐</h2>
              <p>Did any of this make you smile?</p>
              <div className="chips">
                {SMILE_OPTIONS.map((c) => (
                  <button key={c} className={`chip ${smile === c ? 'picked' : ''}`} onClick={() => {
                    setSmile(smile === c ? '' : c)
                    sfx('select')
                  }}>
                    {c}
                  </button>
                ))}
              </div>
              <p>Mission: take a smiling selfie and send it to me!</p>
              <label className="btn ghost" onClick={() => sfx('tap')}>
                {photo ? '↺ RETAKE' : '📷 TAKE SELFIE'}
                <input type="file" accept="image/*" capture="user" onChange={pickPhoto} hidden />
              </label>
              {photo && <img className="preview" src={photo.url} alt="Your selfie" />}
              <p>Anything you want to tell Nate? 💌</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional message..."
                rows={3}
                maxLength={600}
              />
              <button className="btn red" disabled={!(smile || note.trim() || photo) || status === 'sending'} onClick={finish}>
                {status === 'sending' ? 'SENDING...' : 'SEND TO NATE ♥'}
              </button>
              {!photo && (smile || note.trim()) && <small>No selfie? You can still send, but Nate will be sad :(</small>}
            </section>
          )}

          {name === 'thanks' && (
            <section className="card">
              <h2>Thank you for playing! 🎉</h2>
              <img className="memory" src="./us.jpg" alt="Austin and Nate" />
              <p>Your smile and your warmth - I still think about them, always. I want to recharge your heart with a big hug. 🤗💙</p>
              <p>
                You must be so tired today - traveling, looking at apartments, meeting agents. I hope everything went
                well for you. I'm always sending my care to you from here, and I miss your hugs all the time. 💙
              </p>
              <p className="sign">- Nate ♥</p>
              <button className="btn" onClick={restart}>
                ↺ PLAY AGAIN
              </button>
            </section>
          )}

          {status === 'error' && <p className="toast">Could not send - check the internet and try again.</p>}
        </main>
        <Wipe phase={wipe} />
        <button
          className={`scroll-hint ${moreBelow ? 'show' : ''}`}
          onClick={() => panel.current?.scrollBy({ top: panel.current.clientHeight * 0.7, behavior: 'smooth' })}
          aria-label="Scroll down for more"
          tabIndex={moreBelow ? 0 : -1}
        >
          ▼
        </button>
      </div>
    </div>
  )
}
