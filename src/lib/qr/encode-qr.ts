/* Pure TypeScript ISO/IEC 18004 QR Code encoder (Byte mode UTF-8, ECC Level M, Versions 1..20) */

type VersionSpec = readonly [
  totalCodewords: number,
  ecPerBlock: number,
  blocks1: number,
  data1: number,
  blocks2: number,
  data2: number,
]

const VERSION_SPECS: readonly (VersionSpec | null)[] = [
  null,
  [26, 10, 1, 16, 0, 0],
  [44, 16, 1, 28, 0, 0],
  [70, 26, 1, 44, 0, 0],
  [100, 18, 2, 32, 0, 0],
  [134, 24, 2, 43, 0, 0],
  [172, 16, 4, 27, 0, 0],
  [196, 18, 4, 31, 0, 0],
  [242, 22, 2, 38, 2, 39],
  [292, 22, 3, 36, 2, 37],
  [346, 26, 4, 43, 1, 44],
  [404, 30, 1, 50, 4, 51],
  [466, 22, 6, 36, 2, 37],
  [532, 22, 8, 37, 1, 38],
  [581, 24, 4, 40, 5, 41],
  [655, 24, 5, 41, 5, 42],
  [733, 28, 7, 45, 3, 46],
  [815, 28, 10, 46, 1, 47],
  [901, 26, 9, 43, 4, 44],
  [991, 26, 3, 44, 11, 45],
  [1085, 26, 3, 41, 13, 42],
]

const ALIGN_POSITIONS: readonly (readonly number[])[] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
]

const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)
for (let i = 0, x = 1; i < 255; i++) {
  GF_EXP[i] = x
  GF_LOG[x] = i
  x <<= 1
  if (x & 256) {
    x ^= 0x11d
  }
}
for (let i = 255; i < 512; i++) {
  GF_EXP[i] = GF_EXP[i - 255] ?? 0
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  const logA = GF_LOG[a] ?? 0
  const logB = GF_LOG[b] ?? 0
  return GF_EXP[logA + logB] ?? 0
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0)
    const factor = GF_EXP[i] ?? 0
    for (let j = 0; j < poly.length; j++) {
      const val = poly[j] ?? 0
      next[j] = (next[j] ?? 0) ^ val
      next[j + 1] = (next[j + 1] ?? 0) ^ gfMul(val, factor)
    }
    poly = next
  }
  return poly
}

function rsRemainder(data: readonly number[], ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen)
  const rem = new Uint8Array(ecLen)
  for (const byte of data) {
    const factor = byte ^ (rem[0] ?? 0)
    rem.copyWithin(0, 1)
    rem[ecLen - 1] = 0
    for (let j = 0; j < ecLen; j++) {
      rem[j] = (rem[j] ?? 0) ^ gfMul(gen[j + 1] ?? 0, factor)
    }
  }
  return rem
}

function maskCondition(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0
    case 1:
      return r % 2 === 0
    case 2:
      return c % 3 === 0
    case 3:
      return (r + c) % 3 === 0
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0
    default:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  }
}

function setCell(grid: Uint8Array[], r: number, c: number, val: number): void {
  const row = grid[r]
  if (row && c >= 0 && c < row.length) {
    row[c] = val
  }
}

function getCell(grid: readonly Uint8Array[], r: number, c: number): number {
  return grid[r]?.[c] ?? 0
}

function applyFormatBits(grid: Uint8Array[], size: number, mask: number): void {
  const data = mask // ECC Level M = 0b00
  let rem = data
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  }
  const fbits = ((data << 10) | rem) ^ 0x5412

  for (let i = 0; i <= 5; i++) {
    setCell(grid, 8, i, (fbits >>> (14 - i)) & 1)
  }
  setCell(grid, 8, 7, (fbits >>> 8) & 1)
  setCell(grid, 8, 8, (fbits >>> 7) & 1)
  setCell(grid, 7, 8, (fbits >>> 6) & 1)
  for (let i = 0; i <= 5; i++) {
    setCell(grid, 5 - i, 8, (fbits >>> (5 - i)) & 1)
  }

  for (let i = 0; i < 7; i++) {
    setCell(grid, size - 1 - i, 8, (fbits >>> (14 - i)) & 1)
  }
  setCell(grid, size - 8, 8, 1)
  for (let i = 0; i < 8; i++) {
    setCell(grid, 8, size - 8 + i, (fbits >>> (7 - i)) & 1)
  }
}

function computePenalty(grid: readonly Uint8Array[], size: number): number {
  let score = 0
  let dark = 0

  for (let r = 0; r < size; r++) {
    let run = 1
    for (let c = 1; c < size; c++) {
      if (getCell(grid, r, c) === getCell(grid, r, c - 1)) {
        run++
        if (run === 5) score += 3
        else if (run > 5) score += 1
      } else {
        run = 1
      }
    }
  }

  for (let c = 0; c < size; c++) {
    let run = 1
    for (let r = 1; r < size; r++) {
      if (getCell(grid, r, c) === getCell(grid, r - 1, c)) {
        run++
        if (run === 5) score += 3
        else if (run > 5) score += 1
      } else {
        run = 1
      }
    }
  }

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = getCell(grid, r, c)
      if (
        v === getCell(grid, r, c + 1) &&
        v === getCell(grid, r + 1, c) &&
        v === getCell(grid, r + 1, c + 1)
      ) {
        score += 3
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      dark += getCell(grid, r, c)
    }
  }

  return score + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10
}

export type QrMatrix = {
  readonly size: number
  readonly modules: readonly Uint8Array[]
  readonly viewBox: string
  readonly path: string
}

export function encodeQr(text: string, quiet = 2): QrMatrix {
  const bytes = new TextEncoder().encode(text)
  let version = 1
  let spec: VersionSpec | null = null

  for (; version < VERSION_SPECS.length; version++) {
    const candidate = VERSION_SPECS[version] ?? null
    if (!candidate) continue
    const capacity = candidate[2] * candidate[3] + candidate[4] * candidate[5]
    const headerBits = 4 + (version <= 9 ? 8 : 16)
    if (Math.ceil((headerBits + bytes.length * 8) / 8) <= capacity) {
      spec = candidate
      break
    }
  }

  if (!spec) {
    throw new Error('URL exceeds QR code capacity')
  }

  const [, ecLen, blocks1, data1, blocks2, data2] = spec
  const totalData = blocks1 * data1 + blocks2 * data2
  const bits: number[] = []
  const pushBits = (val: number, len: number): void => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1)
    }
  }

  pushBits(0b0100, 4)
  pushBits(bytes.length, version <= 9 ? 8 : 16)
  for (const b of bytes) {
    pushBits(b, 8)
  }
  pushBits(0, Math.min(4, totalData * 8 - bits.length))
  while (bits.length % 8 !== 0) {
    bits.push(0)
  }

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] ?? 0)
    }
    codewords.push(byte)
  }
  for (let padIdx = 0; codewords.length < totalData; padIdx++) {
    codewords.push(padIdx % 2 === 0 ? 0xec : 0x11)
  }

  const dataBlocks: number[][] = []
  const ecBlocks: Uint8Array[] = []
  let offset = 0
  const splitGroup = (count: number, len: number): void => {
    for (let b = 0; b < count; b++) {
      const slice = codewords.slice(offset, offset + len)
      offset += len
      dataBlocks.push(slice)
      ecBlocks.push(rsRemainder(slice, ecLen))
    }
  }
  splitGroup(blocks1, data1)
  splitGroup(blocks2, data2)

  const finalBytes: number[] = []
  const maxDataLen = Math.max(data1, data2)
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) {
      const val = block[i]
      if (val !== undefined) finalBytes.push(val)
    }
  }
  for (let i = 0; i < ecLen; i++) {
    for (const ec of ecBlocks) {
      finalBytes.push(ec[i] ?? 0)
    }
  }

  const size = version * 4 + 17
  const mod = Array.from({ length: size }, () => new Uint8Array(size))
  const fn = Array.from({ length: size }, () => new Uint8Array(size))
  const setFn = (r: number, c: number, isDark: boolean): void => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      setCell(mod, r, c, isDark ? 1 : 0)
      setCell(fn, r, c, 1)
    }
  }

  const drawFinder = (r0: number, c0: number): void => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const dist = Math.max(Math.abs(dr - 3), Math.abs(dc - 3))
        const inBox = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6
        setFn(r0 + dr, c0 + dc, inBox && (dist === 0 || dist === 1 || dist === 3))
      }
    }
  }
  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  for (let i = 8; i < size - 8; i++) {
    setFn(6, i, i % 2 === 0)
    setFn(i, 6, i % 2 === 0)
  }

  const align = ALIGN_POSITIONS[version] ?? []
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      const isCorner =
        (i === 0 && j === 0) ||
        (i === 0 && j === align.length - 1) ||
        (i === align.length - 1 && j === 0)
      if (isCorner) continue
      const r = align[i] ?? 0
      const c = align[j] ?? 0
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          setFn(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1)
        }
      }
    }
  }

  for (let i = 0; i <= 8; i++) {
    if (getCell(fn, 8, i) === 0) setFn(8, i, false)
    if (getCell(fn, i, 8) === 0) setFn(i, 8, false)
  }
  for (let i = 0; i < 8; i++) {
    setFn(8, size - 1 - i, false)
    setFn(size - 1 - i, 8, false)
  }
  setFn(size - 8, 8, true)

  if (version >= 7) {
    let rem = version
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    }
    const vbits = (version << 12) | rem
    for (let i = 0; i < 18; i++) {
      const isDark = ((vbits >>> i) & 1) === 1
      const a = size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      setFn(a, b, isDark)
      setFn(b, a, isDark)
    }
  }

  let bitIdx = 0
  const totalBits = finalBytes.length * 8
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    const isUpward = ((right + 1) & 2) === 0
    for (let vert = 0; vert < size; vert++) {
      const r = isUpward ? size - 1 - vert : vert
      for (let j = 0; j < 2; j++) {
        const c = right - j
        if (getCell(fn, r, c) === 0) {
          let dark = 0
          if (bitIdx < totalBits) {
            dark = ((finalBytes[bitIdx >>> 3] ?? 0) >>> (7 - (bitIdx & 7))) & 1
            bitIdx++
          }
          setCell(mod, r, c, dark)
        }
      }
    }
  }

  let bestGrid: Uint8Array[] = mod
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const candidate = mod.map((row, r) => {
      const copy = new Uint8Array(row)
      for (let c = 0; c < size; c++) {
        if (getCell(fn, r, c) === 0 && maskCondition(mask, r, c)) {
          copy[c] = (copy[c] ?? 0) ^ 1
        }
      }
      return copy
    })
    applyFormatBits(candidate, size, mask)
    const score = computePenalty(candidate, size)
    if (score < bestScore) {
      bestScore = score
      bestGrid = candidate
    }
  }

  const total = size + quiet * 2
  let path = ''
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (getCell(bestGrid, r, c) === 1) {
        path += `M${String(c + quiet)},${String(r + quiet)}h1v1h-1z`
      }
    }
  }

  return {
    size,
    modules: bestGrid,
    viewBox: `0 0 ${String(total)} ${String(total)}`,
    path,
  }
}

export function qrToPngDataUrl(text: string, pxSize = 512, quiet = 4): string {
  const { size, modules } = encodeQr(text, quiet)
  const total = size + quiet * 2
  const scale = Math.max(2, Math.floor(pxSize / total))
  const real = scale * total
  const canvas = document.createElement('canvas')
  canvas.width = real
  canvas.height = real
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable')
  }
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, real, real)
  ctx.fillStyle = '#111111'
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (getCell(modules, r, c) === 1) {
        ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale)
      }
    }
  }
  return canvas.toDataURL('image/png')
}
