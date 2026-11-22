import { onScopeDispose, watch } from 'vue'

const LOCK_CLASS = 'is-scroll-locked'
const GUTTER_VAR = '--scroll-lock-gutter'

let lockCount = 0

function isScrollableOverflow(value: string): boolean {
  return value === 'auto' || value === 'scroll'
}

function canElementScroll(element: Element): boolean {
  const style = window.getComputedStyle(element)
  const canScrollY =
    isScrollableOverflow(style.overflowY) && element.scrollHeight > element.clientHeight
  const canScrollX =
    isScrollableOverflow(style.overflowX) && element.scrollWidth > element.clientWidth
  return canScrollY || canScrollX
}

function canTouchScrollInsideDialog(target: Element, dialog: Element): boolean {
  let current: Element | null = target
  while (current && current !== dialog) {
    if (
      current instanceof HTMLVideoElement ||
      current instanceof HTMLAudioElement ||
      (current instanceof HTMLInputElement &&
        (current.type === 'range' || current.scrollWidth > current.clientWidth))
    ) {
      return true
    }

    if (canElementScroll(current)) {
      return true
    }

    current = current.parentElement
  }

  return canElementScroll(dialog)
}

function handleTouchMove(event: TouchEvent): void {
  if (event.touches.length > 1) return

  const target = event.target
  if (!(target instanceof Element)) {
    event.preventDefault()
    return
  }

  const dialog = target.closest('dialog[open]')
  if (!dialog || target === dialog) {
    event.preventDefault()
    return
  }

  if (!canTouchScrollInsideDialog(target, dialog)) {
    event.preventDefault()
  }
}

function applyScrollLock(): void {
  const html = document.documentElement
  const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth)
  if (scrollbarWidth > 0) {
    html.style.setProperty(GUTTER_VAR, `${String(scrollbarWidth)}px`)
  }
  html.classList.add(LOCK_CLASS)
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
}

function removeScrollLock(): void {
  const html = document.documentElement
  html.classList.remove(LOCK_CLASS)
  html.style.removeProperty(GUTTER_VAR)
  document.removeEventListener('touchmove', handleTouchMove)
}

export function acquireScrollLock(): void {
  lockCount += 1
  if (lockCount === 1) {
    applyScrollLock()
  }
}

export function releaseScrollLock(): void {
  if (lockCount === 0) return
  lockCount -= 1
  if (lockCount === 0) {
    removeScrollLock()
  }
}

export function useScrollLock(isLocked: () => boolean): void {
  let isHoldingLock = false

  function syncLock(shouldLock: boolean): void {
    if (shouldLock && !isHoldingLock) {
      isHoldingLock = true
      acquireScrollLock()
    } else if (!shouldLock && isHoldingLock) {
      isHoldingLock = false
      releaseScrollLock()
    }
  }

  watch(isLocked, syncLock, { immediate: true })

  onScopeDispose(() => {
    syncLock(false)
  })
}
