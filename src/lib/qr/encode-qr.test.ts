import { describe, expect, it } from 'vitest'
import { encodeQr } from './encode-qr'

describe('encodeQr', () => {
  it('generates valid QR matrix for short, UTF-8 and long URLs', () => {
    const shortQr = encodeQr('https://drop.example.com/')
    expect(shortQr.size).toBe(25)
    expect(shortQr.path.length).toBeGreaterThan(50)
    expect(shortQr.viewBox).toBe('0 0 29 29')

    const utf8Qr = encodeQr('http://192.168.1.10:5000/%E4%B8%AD%E6%96%87/test.pdf')
    expect(utf8Qr.size).toBeGreaterThanOrEqual(29)

    const longQr = encodeQr(`http://nas.local:5000/${'segment-'.repeat(25)}archive.zip`)
    expect(longQr.size).toBeGreaterThanOrEqual(45)
  })
})
