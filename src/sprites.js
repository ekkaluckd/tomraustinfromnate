// 16px-wide pixel sprites, two frames each. An outline is added at render time.
export const PALETTE = {
  K: '#1c1f2b', // black shirt / shoes
  S: '#f6c9a8', // skin
  s: '#e3a987', // skin shade
  W: '#ffffff', // white tee
  w: '#d9e6f5', // tee shade
  N: '#22356b', // navy
  n: '#3a55a0', // navy light
  B: '#4f86d9', // jeans
  R: '#e6394a', // red
  H: '#15161d', // hair
  G: '#8fa3bf', // glasses frame
  g: '#cfe8ff', // glasses lens
  b: '#eeeeee', // beard
  E: '#1c1f2b', // eyes
  P: '#ff8fa3', // blush
}
export const OUTLINE = '#0d1a3a'

const AUSTIN_BASE = [
  '................',
  '.....NNNNNN.....',
  '....NNnnNNNN....',
  '...NNNNNNNNNNN..',
  '....SSSSSSSS....',
  '....SESSSSES....',
  '....PSSssSSP....',
  '....bSSRRSSb....',
  '....bbbbbbbb....',
  '.....bbbbbb.....',
  '......SSSS......',
  '...WWWWWWWWWW...',
  '..WWWWWWWWWWWW..',
  '..SWWWWWWWWWWS..',
  '..SWwWWWWWWwWS..',
  '...WWWWWWWWWW...',
  '...BBBBBBBBBB...',
  '...BBBB..BBBB...',
  '...BBBB..BBBB...',
  '...KKKK..KKKK...',
]
const AUSTIN_WAVE = AUSTIN_BASE.slice()
AUSTIN_WAVE[5] = '....SEESSEES....' // happy squint
AUSTIN_WAVE[9] = '.....bbbbbb..S..'
AUSTIN_WAVE[10] = '......SSSS...S..'
AUSTIN_WAVE[11] = '...WWWWWWWWWWS..'
AUSTIN_WAVE[12] = '..WWWWWWWWWWW...'
AUSTIN_WAVE[13] = '..SWWWWWWWWWW...'
AUSTIN_WAVE[14] = '..SWwWWWWWWwW...'

const NATE_BASE = [
  '................',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HHSSSSSSHH...',
  '...HGGGSSGGGH...',
  '....GgEGGEgG....',
  '....PSSSSSSP....',
  '....SSSRRSSS....',
  '.....SSSSSS.....',
  '......SSSS......',
  '...KKKRRRRKKK...',
  '..KKKKKRRKKKKK..',
  '..SKKKKKKKKKKS..',
  '..SKKKKKKKKKKS..',
  '...KKKKRKKKKK...',
  '...NNNNNNNNNN...',
  '...NNNN..NNNN...',
  '...NNNN..NNNN...',
  '...NNNN..NNNN...',
  '...WWWW..WWWW...',
]
const NATE_WAVE = NATE_BASE.slice()
NATE_WAVE[7] = '....SSSRRSSS....'
NATE_WAVE[8] = '.....SSRRSS.....' // tongue out, like the selfie
NATE_WAVE[9] = '..S...SSSS......'
NATE_WAVE[10] = '..SKKKRRRRKKK...'
NATE_WAVE[11] = '...KKKKRRKKKKK..'
NATE_WAVE[12] = '...KKKKKKKKKKS..'

// Smaller Nate for the hug scene (12 wide x 15 tall), right arm reaching around Austin.
const NATE_SMALL = [
  '..HHHHHHH...',
  '.HHHHHHHHH..',
  '.HHSSSSSSH..',
  '.GgEGGgEG...',
  '..PSSSSSP...',
  '..SSSRRSS...',
  '...SSSSS....',
  '..KKRRRKK...',
  '.KKKKRKKKKSS',
  '.SKKKKKKKK..',
  '..KKKKKKK...',
  '..NNNNNNN...',
  '..NNN.NNN...',
  '..NNN.NNN...',
  '..WWW.WWW...',
]

// Builds a 24x20 hug: Austin behind, Nate (shorter) leaning in front.
function hugFrame(austinRows, nateRows, nateLift) {
  const W = 24
  const H = 20
  const grid = Array.from({ length: H }, () => Array(W).fill('.'))
  const paste = (rows, ox, oy) =>
    rows.forEach((r, y) => [...r].forEach((c, x) => c !== '.' && grid[y + oy] && (grid[y + oy][x + ox] = c)))
  paste(austinRows, 8, 0)
  paste(nateRows, 2, H - nateRows.length - nateLift)
  // Austin's arm wraps over Nate's shoulder
  const armY = H - nateRows.length - nateLift + 7
  for (let x = 8; x <= 10; x++) grid[armY][x] = 'W'
  for (let x = 2; x <= 7; x++) grid[armY][x] = 'S'
  return grid.map((r) => r.join(''))
}
const AUSTIN_HUG = AUSTIN_BASE.slice()
AUSTIN_HUG[5] = '....SEESSEES....'
AUSTIN_HUG[13] = '...WWWWWWWWWWS..'
AUSTIN_HUG[14] = '...WwWWWWWWwWS..'
const NATE_HUG_B = NATE_SMALL.slice()
NATE_HUG_B[3] = '.GgEEGEEG...' // eyes closed, happy squeeze
const HUG0 = hugFrame(AUSTIN_HUG, NATE_SMALL, 0)
const HUG1 = hugFrame(AUSTIN_BASE.map((r, i) => (i === 5 ? '....SEESSEES....' : AUSTIN_HUG[i])), NATE_HUG_B, 1)

const HEART = [
  '.RR.RR.',
  'RRRRRRR',
  'RRRRRRR',
  '.RRRRR.',
  '..RRR..',
  '...R...',
]
const CLOUD = [
  '.....WWWW.......',
  '...WWWWWWWW.....',
  '..WWWWWWWWWWWW..',
  'WWWWWWWWWWWWWWWW',
  '.wwwwwwwwwwwwww.',
]
const DROP = ['..B..', '.BBB.', 'BBgBB', 'BBBBB', '.BBB.']
const STAR = ['..W..', '.WWW.', 'WWWWW', '.WWW.', '..W..']

export const SPRITES = {
  austin0: { rows: AUSTIN_BASE, outline: true },
  austin1: { rows: AUSTIN_WAVE, outline: true },
  nate0: { rows: NATE_BASE, outline: true },
  nate1: { rows: NATE_WAVE, outline: true },
  hug0: { rows: HUG0, outline: true },
  hug1: { rows: HUG1, outline: true },
  heart: { rows: HEART, outline: true },
  cloud: { rows: CLOUD, outline: false },
  drop: { rows: DROP, outline: true },
  star: { rows: STAR, outline: false },
}

// Draws a sprite into a canvas at 1px per cell, with a 1px outline border.
export function spriteCanvas({ rows, outline }) {
  const h = rows.length
  const w = rows[0].length
  const pad = outline ? 1 : 0
  const c = document.createElement('canvas')
  c.width = w + pad * 2
  c.height = h + pad * 2
  const ctx = c.getContext('2d')
  const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] !== '.'
  if (outline) {
    ctx.fillStyle = OUTLINE
    for (let y = -1; y <= h; y++)
      for (let x = -1; x <= w; x++)
        if (!filled(x, y) && (filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1)))
          ctx.fillRect(x + pad, y + pad, 1, 1)
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x]
      if (ch === '.') continue
      ctx.fillStyle = PALETTE[ch]
      ctx.fillRect(x + pad, y + pad, 1, 1)
    }
  return c
}
