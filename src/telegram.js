const TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID
const API = `https://api.telegram.org/bot${TOKEN}`

export async function sendMessage(text) {
  const res = await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text }),
  })
  if (!res.ok) throw new Error(`Telegram ${res.status}`)
}

export async function sendPhoto(blob, caption) {
  const form = new FormData()
  form.append('chat_id', CHAT_ID)
  form.append('caption', caption.slice(0, 1000))
  form.append('photo', blob, 'selfie.jpg')
  const res = await fetch(`${API}/sendPhoto`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Telegram ${res.status}`)
}

// Shrink big phone photos so uploads are fast and under Telegram limits.
export function compressImage(file, max = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('compress failed'))), 'image/jpeg', 0.85)
    }
    img.onerror = reject
    img.src = url
  })
}
