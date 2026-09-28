import { useState, useRef, useCallback } from 'react'
import { type Item, formatDate } from '../types'

interface Props {
  item: Item
  onBack: () => void
  onDelete: (id: number) => void
  onReshoot: (id: number) => void
}

// ─── Pinch-zoom / pan state ───────────────────────────────────────────────────
interface Transform {
  scale: number
  x: number
  y: number
}

const MIN_SCALE = 1
const MAX_SCALE = 6

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function midpoint(t1: React.Touch, t2: React.Touch) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  }
}

function dist(t1: React.Touch, t2: React.Touch) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

export function PhotoScreen({ item, onBack, onDelete, onReshoot }: Props) {
  const [tf, setTf] = useState<Transform>({ scale: 1, x: 0, y: 0 })
  const lastTapRef = useRef(0)
  const pinchRef = useRef<{ startDist: number; startScale: number; startMid: { x: number; y: number }; startX: number; startY: number } | null>(null)
  const panRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null)

  // ── Double-tap to zoom ────────────────────────────────────────────────────
  function handleTap() {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      setTf(prev => prev.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 })
    }
    lastTapRef.current = now
  }

  // ── Touch start ───────────────────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault()
      const t1 = e.touches[0], t2 = e.touches[1]
      pinchRef.current = {
        startDist: dist(t1, t2),
        startScale: tf.scale,
        startMid: midpoint(t1, t2),
        startX: tf.x,
        startY: tf.y,
      }
      panRef.current = null
    } else if (e.touches.length === 1) {
      panRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTx: tf.x,
        startTy: tf.y,
      }
    }
  }

  // ── Touch move ────────────────────────────────────────────────────────────
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const t1 = e.touches[0], t2 = e.touches[1]
      const p = pinchRef.current
      const ratio = dist(t1, t2) / p.startDist
      const newScale = clamp(p.startScale * ratio, MIN_SCALE, MAX_SCALE)
      const mid = midpoint(t1, t2)
      const dx = mid.x - p.startMid.x
      const dy = mid.y - p.startMid.y
      setTf({ scale: newScale, x: p.startX + dx, y: p.startY + dy })
    } else if (e.touches.length === 1 && panRef.current && tf.scale > 1) {
      e.preventDefault()
      const p = panRef.current
      const dx = e.touches[0].clientX - p.startX
      const dy = e.touches[0].clientY - p.startY
      setTf(prev => ({ ...prev, x: p.startTx + dx, y: p.startTy + dy }))
    }
  }, [tf.scale])

  // ── Touch end ─────────────────────────────────────────────────────────────
  function handleTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchRef.current = null
    if (e.touches.length < 1) panRef.current = null
    // Snap back if over-zoomed out
    setTf(prev => prev.scale < MIN_SCALE ? { scale: 1, x: 0, y: 0 } : prev)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#1a1208',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Sarabun', sans-serif",
      color: '#f5e8d0',
      userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        background: '#231a0c',
        padding: '14px 16px',
        borderBottom: '1px solid #4a3520',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            background: '#2a1f0e', color: '#f5e8d0', border: '1px solid #4a3520',
            borderRadius: 20, padding: '7px 16px', fontSize: 14,
            cursor: 'pointer', fontFamily: "'Sarabun', sans-serif",
          }}
        >← กลับ</button>

        {tf.scale > 1 && (
          <span style={{ fontSize: 12, color: '#9a8070' }}>
            {Math.round(tf.scale * 10) / 10}×
          </span>
        )}
        {tf.scale === 1 && (
          <span style={{ fontSize: 12, color: '#6a5040' }}>ดับเบิ้ลแตะเพื่อซูม</span>
        )}

        <button
          onClick={() => setTf({ scale: 1, x: 0, y: 0 })}
          style={{
            background: tf.scale > 1 ? '#4a3520' : 'transparent',
            color: tf.scale > 1 ? '#f5e8d0' : 'transparent',
            border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 13,
            cursor: tf.scale > 1 ? 'pointer' : 'default',
            fontFamily: "'Sarabun', sans-serif",
            transition: 'all 0.2s',
          }}
        >รีเซ็ต</button>
      </div>

      {/* Image viewport */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
          cursor: tf.scale > 1 ? 'grab' : 'zoom-in',
        }}
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={item.imageUrl}
          alt={item.note}
          draggable={false}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${tf.scale}) translate(${tf.x / tf.scale}px, ${tf.y / tf.scale}px)`,
            transformOrigin: 'center center',
            transition: pinchRef.current || panRef.current ? 'none' : 'transform 0.25s ease',
            willChange: 'transform',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Footer */}
      <div style={{
        background: '#231a0c',
        borderTop: '1px solid #4a3520',
        padding: '14px 16px',
        flexShrink: 0,
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#9a8070' }}>
          เก็บเมื่อ {formatDate(item.savedAt)}
        </p>
        {item.note && (
          <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#f5e8d0' }}>{item.note}</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onReshoot(item.id)}
            style={{
              flex: 1, background: '#2a1f0e', color: '#f5e8d0', fontWeight: 600, fontSize: 15,
              border: '1.5px solid #4a3520', borderRadius: 14, padding: '13px',
              cursor: 'pointer', fontFamily: "'Sarabun', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >📷 ถ่ายใหม่</button>

          <button
            id="btn-delete-item"
            onClick={() => onDelete(item.id)}
            style={{
              flex: 1, background: '#3a1a1a', color: '#e87070', fontWeight: 600, fontSize: 15,
              border: '1.5px solid #5a2a2a', borderRadius: 14, padding: '13px',
              cursor: 'pointer', fontFamily: "'Sarabun', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >🗑 ลบรายการ</button>
        </div>
      </div>
    </div>
  )
}
