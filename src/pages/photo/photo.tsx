import { useCallback, useEffect, useRef, useState } from 'react'
import { formatDate } from '../../types'
import type { PhotoPageProps } from './interface'

interface Transform {
  scale: number
  x: number
  y: number
}

const MIN_SCALE = 1
const MAX_SCALE = 6

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function midpoint(t1: React.Touch, t2: React.Touch) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  }
}

function distance(t1: React.Touch, t2: React.Touch) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

export function PhotoScreen({ item, onBack, onDelete, onReshoot }: PhotoPageProps) {
  const [tf, setTf] = useState<Transform>({ scale: 1, x: 0, y: 0 })
  const [isInteracting, setIsInteracting] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const lastTapRef = useRef(0)
  const pinchRef = useRef<{ startDist: number; startScale: number; startMid: { x: number; y: number }; startX: number; startY: number } | null>(null)
  const panRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null)

  useEffect(() => {
    if (!isDeleteConfirmOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isDeleting) setIsDeleteConfirmOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDeleteConfirmOpen, isDeleting])

  function handleTap() {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      setTf(previous => previous.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 })
    }
    lastTapRef.current = now
  }

  function handleTouchStart(event: React.TouchEvent) {
    setIsInteracting(true)
    if (event.touches.length === 2) {
      event.preventDefault()
      const t1 = event.touches[0]
      const t2 = event.touches[1]
      pinchRef.current = {
        startDist: distance(t1, t2),
        startScale: tf.scale,
        startMid: midpoint(t1, t2),
        startX: tf.x,
        startY: tf.y,
      }
      panRef.current = null
    } else if (event.touches.length === 1) {
      const touch = event.touches[0]
      panRef.current = { startX: touch.clientX, startY: touch.clientY, startTx: tf.x, startTy: tf.y }
    }
  }

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2 && pinchRef.current) {
      event.preventDefault()
      const t1 = event.touches[0]
      const t2 = event.touches[1]
      const pinch = pinchRef.current
      const ratio = distance(t1, t2) / pinch.startDist
      const newScale = clamp(pinch.startScale * ratio, MIN_SCALE, MAX_SCALE)
      const mid = midpoint(t1, t2)
      setTf({ scale: newScale, x: pinch.startX + mid.x - pinch.startMid.x, y: pinch.startY + mid.y - pinch.startMid.y })
    } else if (event.touches.length === 1 && panRef.current && tf.scale > 1) {
      event.preventDefault()
      const touch = event.touches[0]
      const pan = panRef.current
      setTf(previous => ({ ...previous, x: pan.startTx + touch.clientX - pan.startX, y: pan.startTy + touch.clientY - pan.startY }))
    }
  }, [tf.scale])

  function handleTouchEnd(event: React.TouchEvent) {
    setIsInteracting(event.touches.length > 0)
    if (event.touches.length < 2) pinchRef.current = null
    if (event.touches.length < 1) panRef.current = null
    setTf(previous => previous.scale < MIN_SCALE ? { scale: 1, x: 0, y: 0 } : previous)
  }

  async function confirmDelete() {
    if (isDeleting) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(item.id)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'ลบรายการไม่สำเร็จ')
      setIsDeleting(false)
    }
  }

  return (
    <main className="flex min-h-dvh select-none flex-col bg-bg text-text">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-3.5">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-text"
        >← กลับ</button>

        {tf.scale > 1 ? (
          <span className="text-xs text-muted">{Math.round(tf.scale * 10) / 10}×</span>
        ) : (
          <span className="text-xs text-[#6a5040]">ดับเบิ้ลแตะเพื่อซูม</span>
        )}

        <button
          type="button"
          onClick={() => setTf({ scale: 1, x: 0, y: 0 })}
          className={`cursor-pointer rounded-full border-0 px-3.5 py-1.5 text-[13px] transition-all ${tf.scale > 1 ? 'bg-border text-text' : 'bg-transparent text-transparent'}`}
        >รีเซ็ต</button>
      </header>

      <div
        className={`relative flex min-h-0 flex-1 items-center justify-center overflow-hidden [touch-action:none] ${tf.scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'}`}
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={item.imageUrl}
          alt={item.note || 'รูปสิ่งของที่บันทึกไว้'}
          draggable={false}
          className={`max-h-full max-w-full origin-center object-contain will-change-transform [pointer-events:none] ${isInteracting ? '' : 'transition-transform duration-300 ease'}`}
          style={{ transform: `scale(${tf.scale}) translate(${tf.x / tf.scale}px, ${tf.y / tf.scale}px)` }}
        />
      </div>

      <footer className="shrink-0 border-t border-border bg-card px-4 pt-3.5 pb-[calc(14px+env(safe-area-inset-bottom))]">
        <p className="mb-1 text-[13px] text-muted">เก็บเมื่อ {formatDate(item.savedAt)}</p>
        {item.note && <p className="mb-3 text-base font-semibold text-text">{item.note}</p>}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => onReshoot(item.id)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-border bg-surface p-[13px] text-[15px] font-semibold text-text"
          >📷 ถ่ายใหม่</button>
          <button
            id="btn-delete-item"
            type="button"
            onClick={() => { setDeleteError(null); setIsDeleteConfirmOpen(true) }}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-[#5a2a2a] bg-[#3a1a1a] p-[13px] text-[15px] font-semibold text-[#e87070]"
          >🗑 ลบรายการ</button>
        </div>
      </footer>

      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:items-center sm:p-5"
          onClick={event => { if (event.target === event.currentTarget && !isDeleting) setIsDeleteConfirmOpen(false) }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6"
          >
            <h2 id="delete-title" className="m-0 text-lg font-bold">ลบรายการนี้ไหม?</h2>
            <p id="delete-description" className="mt-2 mb-0 text-sm text-muted">รูปภาพและข้อมูลที่บันทึกไว้จะถูกลบออกจากอุปกรณ์</p>
            {deleteError && <p className="mt-3 mb-0 text-sm text-[#e87070]" role="alert">{deleteError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                autoFocus
                disabled={isDeleting}
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="min-h-12 cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text disabled:opacity-60"
              >ยกเลิก</button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-[#9d3434] px-4 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70"
              >
                {isDeleting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                {isDeleting ? 'กำลังลบ…' : 'ลบรายการ'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
