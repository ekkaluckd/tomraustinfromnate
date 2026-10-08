import { useState } from 'react'
import Stage from './Stage.jsx'
import { sendMessage, sendPhoto, compressImage } from './telegram.js'
import { sfx, startMusic, setMuted } from './sound.js'

const QUESTIONS = [
  {
    id: 'smile',
    mood: 'day',
    title: 'Level 1',
    text: "How are you today? Don't forget to look in the mirror and see your smile - see how cute it is!",
    chips: ['Feeling great!', 'Pretty good', 'A bit tired', 'Okay I looked. Cute.'],
  },
  {
    id: 'water',
    mood: 'water',
    title: 'Level 2',
    text: 'Have you had enough water today? It is SO hot out there, haha!',
    chips: ['Yes, hydrated!', 'Drinking now', 'Oops... not yet'],
  },
  {
    id: 'travel',
    mood: 'dusk',
    title: 'Level 3',
    text: 'Are you tired from traveling today? I hope you have had dinner already.',
    chips: ['Ate already!', 'Eating soon', 'A little tired', 'Not tired at all'],
  },
]

const STEPS = ['intro', ...QUESTIONS.map((q) => q.id), 'selfie', 'thanks']
const SMILE_OPTIONS = ['Yes, big smile!', 'A little smile', 'Hmm, not yet']

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
  const [smile, setSmile] = useState('')
  const [photo, setPhoto] = useState(null)
  const [cheer, setCheer] = useState(0)
  const [status, send] = useSender()
  const [muted, setMute] = useState(false)

  const toggleMute = () => {
    setMuted(!muted)
    setMute(!muted)
    if (muted) sfx('tap')
  }

  const name = STEPS[step]
  const q = QUESTIONS.find((x) => x.id === name)
  const mood = q?.mood || (name === 'thanks' ? 'night' : 'day')

  const go = (n) => {
    setStep(n)
    setDraft('')
    setCheer((c) => c + 1)
    sfx(n === STEPS.length - 1 ? 'win' : 'next')
    window.scrollTo(0, 0)
  }

  const submitAnswer = () => {
    const text = draft.trim()
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
      `\n\nDid this make you smile? ${smile}`
    const ok = await send(async () => {
      if (photo) await sendPhoto(await compressImage(photo.file), summary)
      else await sendMessage(summary + '\n(no selfie this time)')
    })
    if (ok) go(step + 1)
  }

  const restart = () => {
    if (photo) URL.revokeObjectURL(photo.url)
    setAnswers({})
    setSmile('')
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

        <main className="panel">
          {name === 'intro' && (
            <section className="card">
              <h1>Hi Austin!</h1>
              <p>Nate made you a tiny game.</p>
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
              <p>{q.text}</p>
              <div className="chips">
                {q.chips.map((c) => (
                  <button key={c} className={`chip ${draft === c ? 'picked' : ''}`} onClick={() => {
                      setDraft(c)
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
              <button className="btn" disabled={!draft.trim()} onClick={submitAnswer}>
                NEXT ▶
              </button>
            </section>
          )}

          {name === 'selfie' && (
            <section className="card">
              <h2>Final Level</h2>
              <p>Did any of this make you smile?</p>
              <div className="chips">
                {SMILE_OPTIONS.map((c) => (
                  <button key={c} className={`chip ${smile === c ? 'picked' : ''}`} onClick={() => {
                      setSmile(c)
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
              <button className="btn red" disabled={!smile || status === 'sending'} onClick={finish}>
                {status === 'sending' ? 'SENDING...' : 'SEND TO NATE ♥'}
              </button>
              {!photo && smile && <small>No selfie? You can still send, but Nate will be sad :(</small>}
            </section>
          )}

          {name === 'thanks' && (
            <section className="card">
              <h2>Thank you for playing!</h2>
              <img className="memory" src="./us.jpg" alt="Austin and Nate" />
              <p>Your smile and your warmth - I still think about them, always.</p>
              <p className="sign">- Nate ♥</p>
              <button className="btn" onClick={restart}>
                ↺ PLAY AGAIN
              </button>
            </section>
          )}

          {status === 'error' && <p className="toast">Could not send - check the internet and try again.</p>}
        </main>
      </div>
    </div>
  )
}
