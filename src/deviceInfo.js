// Builds a short, readable summary of the visitor's device for the open notification.
function guessDevice(ua) {
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad'
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet'
  if (/Macintosh/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows PC'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

function guessOS(ua) {
  let m
  if ((m = ua.match(/OS (\d+[_\d]*) like Mac OS X/))) return `iOS ${m[1].replace(/_/g, '.')}`
  if ((m = ua.match(/Android ([\d.]+)/))) return `Android ${m[1]}`
  if ((m = ua.match(/Mac OS X ([\d_]+)/))) return `macOS ${m[1].replace(/_/g, '.')}`
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11'
  return '-'
}

function guessBrowser(ua) {
  let m
  if ((m = ua.match(/Line\/([\d.]+)/))) return `LINE in-app ${m[1]}`
  if (/FBAN|FBAV/.test(ua)) return 'Facebook in-app'
  if (/Instagram/.test(ua)) return 'Instagram in-app'
  if ((m = ua.match(/Edg\/([\d.]+)/))) return `Edge ${m[1]}`
  if ((m = ua.match(/CriOS\/([\d.]+)/) || ua.match(/Chrome\/([\d.]+)/))) return `Chrome ${m[1]}`
  if ((m = ua.match(/FxiOS\/([\d.]+)/) || ua.match(/Firefox\/([\d.]+)/))) return `Firefox ${m[1]}`
  if ((m = ua.match(/Version\/([\d.]+).*Safari/))) return `Safari ${m[1]}`
  return '-'
}

export function deviceReport() {
  const ua = navigator.userAgent
  const now = new Date()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const when = now.toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const bangkok = now.toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' })
  const conn = navigator.connection?.effectiveType
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
  return [
    `🕒 ${when} (${tz})`,
    `🇹🇭 Bangkok time: ${bangkok}`,
    `📱 Device: ${guessDevice(ua)}`,
    `⚙️ OS: ${guessOS(ua)}`,
    `🌐 Browser: ${guessBrowser(ua)}${standalone ? ' (home-screen app)' : ''}`,
    `🖥️ Screen: ${screen.width}x${screen.height} @${window.devicePixelRatio}x, window ${innerWidth}x${innerHeight}`,
    `🗣️ Language: ${navigator.languages?.join(', ') || navigator.language}`,
    conn ? `📶 Network: ${conn}` : null,
    `🔗 From: ${document.referrer || 'direct link'}`,
    `🧾 UA: ${ua}`,
  ]
    .filter(Boolean)
    .join('\n')
}
