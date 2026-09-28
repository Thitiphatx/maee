import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../hooks/useCamera'

interface Props {
  onSave: (imageUrl: string, note: string) => void
  onBack: () => void
}

export function CameraScreen({ onSave, onBack }: Props) {
  const { videoRef, ready, error, start, stop, capture } = useCamera()
  const [note, setNote] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    start()
    return () => stop()
  }, [start, stop])

  function handleShutter() {
    if (previewUrl) {
      onSave(previewUrl, note)
      return
    }
    const url = capture()
    if (url) { stop(); setPreviewUrl(url) }
  }

  function handleRetake() {
    setPreviewUrl(null)
    start()
  }

  function handleFileFallback(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) { stop(); setPreviewUrl(URL.createObjectURL(f)) }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#1a1208',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Sarabun', sans-serif",
      color: '#f5e8d0',
    }}>
      {/* Header */}
      <div style={{
        background: '#231a0c', padding: '14px 16px',
        borderBottom: '1px solid #4a3520', fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => { stop(); onBack() }}
          style={{ background: 'none', border: 'none', color: '#9a8070', fontSize: 15, cursor: 'pointer', fontFamily: "'Sarabun', sans-serif" }}
        >← กลับ</button>
        <span>ถ่ายให้เห็นที่วางด้วยนะ 🙂</span>
        <span style={{ width: 60 }} />
      </div>

      {/* Viewfinder */}
      <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden', minHeight: 300 }}>
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: previewUrl ? 'none' : 'block',
            position: 'absolute', top: 0, left: 0,
          }}
        />

        {previewUrl && (
          <img src={previewUrl} alt="ตัวอย่าง"
            style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0 }} />
        )}

        {/* Loading / Error overlay */}
        {!ready && !previewUrl && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12, color: '#9a8070',
          }}>
            {error ? (
              <>
                <span style={{ fontSize: 15, textAlign: 'center', padding: '0 24px' }}>
                  ⚠️ ไม่สามารถเข้าถึงกล้องได้<br />
                  <small style={{ color: '#6a5040' }}>{error}</small>
                </span>
                <button onClick={() => fileRef.current?.click()} style={{
                  background: '#4a3520', color: '#f5e8d0', border: 'none',
                  borderRadius: 12, padding: '10px 20px', fontSize: 14, cursor: 'pointer',
                  fontFamily: "'Sarabun', sans-serif",
                }}>เลือกรูปจากคลัง</button>
              </>
            ) : (
              <span style={{ fontSize: 14 }}>กำลังเปิดกล้อง…</span>
            )}
          </div>
        )}

        {/* Corner guides */}
        {ready && !previewUrl && (
          <>
            {[
              { top: 0, left: 0, borderTop: true, borderLeft: true },
              { top: 0, right: 0, borderTop: true, borderRight: true },
              { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
              { bottom: 0, right: 0, borderBottom: true, borderRight: true },
            ].map((pos, k) => (
              <div key={k} style={{
                position: 'absolute', width: 28, height: 28, margin: 20,
                ...pos,
                borderTop: pos.borderTop ? '2px solid #e8854a' : 'none',
                borderBottom: pos.borderBottom ? '2px solid #e8854a' : 'none',
                borderLeft: pos.borderLeft ? '2px solid #e8854a' : 'none',
                borderRight: pos.borderRight ? '2px solid #e8854a' : 'none',
              }} />
            ))}
          </>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          style={{ display: 'none' }} onChange={handleFileFallback} />
      </div>

      {/* Controls */}
      <div style={{ background: '#1a1208', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="✏️  อยากเขียนอะไรไหม (ไม่ใส่ก็ได้)"
          style={{
            width: '100%', padding: '13px 14px',
            background: 'transparent', border: '1.5px dashed #4a3520',
            borderRadius: 12, color: '#f5e8d0', fontSize: 15,
            outline: 'none', fontFamily: "'Sarabun', sans-serif",
          }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          {previewUrl && (
            <button onClick={handleRetake} style={{
              flex: 1, background: '#2a1f0e', color: '#f5e8d0', fontWeight: 600, fontSize: 16,
              border: '1.5px solid #4a3520', borderRadius: 14, padding: '14px',
              cursor: 'pointer', fontFamily: "'Sarabun', sans-serif",
            }}>🔄 ถ่ายใหม่</button>
          )}
          <button onClick={handleShutter} style={{
            flex: 2, background: '#e8854a', color: '#1a1208', fontWeight: 700, fontSize: 18,
            border: 'none', borderRadius: 14, padding: '16px',
            cursor: 'pointer', fontFamily: "'Sarabun', sans-serif",
            boxShadow: '0 4px 20px rgba(232,133,74,0.4)',
          }}>
            {previewUrl ? '✔ เก็บเลย' : '📸 ถ่าย'}
          </button>
        </div>

        {!previewUrl && (
          <button onClick={() => fileRef.current?.click()} style={{
            background: 'none', border: 'none', color: '#9a8070', fontSize: 13,
            cursor: 'pointer', fontFamily: "'Sarabun', sans-serif", textDecoration: 'underline',
          }}>หรือเลือกรูปจากคลัง</button>
        )}
      </div>
    </div>
  )
}
