import { effectScope, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { acquireScrollLock, releaseScrollLock, useScrollLock } from './scroll-lock'

function createTouchMoveEvent(touchCount = 1): Event {
  const event = new Event('touchmove', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', {
    value: { length: touchCount },
  })
  return event
}

describe('scroll-lock', () => {
  afterEach(() => {
    for (let i = 0; i < 5; i += 1) {
      releaseScrollLock()
    }
    document.body.innerHTML = ''
  })

  it('locks and unlocks html scroll with reference counting for nested modals', () => {
    const html = document.documentElement
    expect(html.classList.contains('is-scroll-locked')).toBe(false)

    acquireScrollLock()
    expect(html.classList.contains('is-scroll-locked')).toBe(true)

    acquireScrollLock()
    expect(html.classList.contains('is-scroll-locked')).toBe(true)

    releaseScrollLock()
    expect(html.classList.contains('is-scroll-locked')).toBe(true)

    releaseScrollLock()
    expect(html.classList.contains('is-scroll-locked')).toBe(false)

    // Extra release is a safe no-op
    releaseScrollLock()
    expect(html.classList.contains('is-scroll-locked')).toBe(false)
  })

  it('compensates scrollbar width via css custom property when scrollbar exists', () => {
    const html = document.documentElement
    const originalInnerWidth = window.innerWidth
    const originalClientWidth = Object.getOwnPropertyDescriptor(html, 'clientWidth')

    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
    Object.defineProperty(html, 'clientWidth', { value: 1185, configurable: true })

    try {
      acquireScrollLock()
      expect(html.style.getPropertyValue('--scroll-lock-gutter')).toBe('15px')

      releaseScrollLock()
      expect(html.style.getPropertyValue('--scroll-lock-gutter')).toBe('')
    } finally {
      Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true })
      if (originalClientWidth) {
        Object.defineProperty(html, 'clientWidth', originalClientWidth)
      } else {
        Reflect.deleteProperty(html, 'clientWidth')
      }
    }
  })

  it('tracks reactive state and releases lock automatically on scope dispose', async () => {
    const html = document.documentElement
    const isFirstOpen = ref(false)
    const isSecondOpen = ref(true)

    const scope1 = effectScope()
    const scope2 = effectScope()

    scope1.run(() => {
      useScrollLock(() => isFirstOpen.value)
    })
    expect(html.classList.contains('is-scroll-locked')).toBe(false)

    scope2.run(() => {
      useScrollLock(() => isSecondOpen.value)
    })
    expect(html.classList.contains('is-scroll-locked')).toBe(true)

    isFirstOpen.value = true
    await nextTick()
    expect(html.classList.contains('is-scroll-locked')).toBe(true)

    scope2.stop()
    expect(html.classList.contains('is-scroll-locked')).toBe(true)

    scope1.stop()
    expect(html.classList.contains('is-scroll-locked')).toBe(false)
  })

  it('blocks touchmove outside dialog or on backdrop, while allowing scrollable dialog content', () => {
    const outside = document.createElement('div')
    const dialog = document.createElement('dialog')
    dialog.setAttribute('open', '')

    const staticBody = document.createElement('div')
    const scrollableArea = document.createElement('div')
    scrollableArea.style.overflowY = 'auto'
    Object.defineProperty(scrollableArea, 'scrollHeight', { value: 600, configurable: true })
    Object.defineProperty(scrollableArea, 'clientHeight', { value: 200, configurable: true })
    const scrollChild = document.createElement('p')
    scrollableArea.appendChild(scrollChild)

    dialog.appendChild(staticBody)
    dialog.appendChild(scrollableArea)
    document.body.appendChild(outside)
    document.body.appendChild(dialog)

    acquireScrollLock()

    // Touching outside the modal is prevented
    const outsideEvent = createTouchMoveEvent()
    outside.dispatchEvent(outsideEvent)
    expect(outsideEvent.defaultPrevented).toBe(true)

    // Touching directly on dialog (::backdrop area) is prevented
    const backdropEvent = createTouchMoveEvent()
    dialog.dispatchEvent(backdropEvent)
    expect(backdropEvent.defaultPrevented).toBe(true)

    // Touching non-scrollable modal area is prevented
    const staticEvent = createTouchMoveEvent()
    staticBody.dispatchEvent(staticEvent)
    expect(staticEvent.defaultPrevented).toBe(true)

    // Touching inside scrollable modal content is allowed
    const scrollEvent = createTouchMoveEvent()
    scrollChild.dispatchEvent(scrollEvent)
    expect(scrollEvent.defaultPrevented).toBe(false)

    // Pinch-zoom multi-touch is allowed
    const pinchEvent = createTouchMoveEvent(2)
    dialog.dispatchEvent(pinchEvent)
    expect(pinchEvent.defaultPrevented).toBe(false)
  })
})
