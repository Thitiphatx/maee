import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../../hooks/useCamera'
import type { CameraPageProps } from './interface'

const cornerClasses = [
  'top-0 left-0 border-t-2 border-l-2',
  'top-0 right-0 border-t-2 border-r-2',
  'bottom-0 left-0 border-b-2 border-l-2',
  'right-0 bottom-0 border-r-2 border-b-2',
]

export function CameraScreen({ onSave, onBack }: CameraPageProps) {
  const { videoRef, ready, error, start, stop, capture } = useCamera()
  const [note, setNote] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    start()
    return () => stop()
  }, [start, stop])

  async function handleShutter() {
    if (isSaving) return
    if (previewUrl) {
      setIsSaving(true)
      setSaveError(null)
      try {
        await onSave(previewUrl, note)
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'บันทึกรูปไม่สำเร็จ')
        setIsSaving(false)
      }
      return
    }
    const url = capture()
    if (url) { stop(); setPreviewUrl(url) }
  }

  function handleRetake() {
    setPreviewUrl(null)
    start()
  }

  function handleFileFallback(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    stop()
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => setPreviewUrl(null)
    reader.readAsDataURL(file)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col bg-bg text-text" aria-busy={isSaving}>
      <header className="flex items-center justify-between border-b border-border bg-card px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-3.5 text-base sm:px-6">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => { stop(); onBack() }}
          className="cursor-pointer border-0 bg-transparent text-[15px] text-muted disabled:cursor-wait disabled:opacity-50"
        >← กลับ</button>
        <span>ถ่ายให้เห็นที่วางด้วยนะ 🙂</span>
        <span className="w-[60px]" aria-hidden="true" />
      </header>

      <section className="relative min-h-[300px] flex-1 overflow-hidden bg-black" aria-label="ช่องมองภาพ">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute top-0 left-0 h-full w-full object-cover ${previewUrl ? 'hidden' : 'block'}`}
        />

        {previewUrl && (
          <img src={previewUrl} alt="ตัวอย่างภาพ" className="absolute top-0 left-0 h-full w-full object-contain" />
        )}

        {!ready && !previewUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
            {error ? (
              <>
                <span className="px-6 text-center text-[15px]">
                  ⚠️ ไม่สามารถเข้าถึงกล้องได้<br />
                  <small className="text-[#6a5040]">{error}</small>
                </span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer rounded-xl border-0 bg-border px-5 py-2.5 text-sm text-text"
                >เลือกรูปจากคลัง</button>
              </>
            ) : (
              <span className="text-sm">กำลังเปิดกล้อง…</span>
            )}
          </div>
        )}

        {ready && !previewUrl && cornerClasses.map(className => (
          <div key={className} className={`absolute m-5 h-7 w-7 border-accent ${className}`} />
        ))}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={isSaving}
          className="hidden"
          onChange={handleFileFallback}
        />
      </section>

      <section className="flex flex-col gap-3 bg-bg p-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:px-6">
        <input
          value={note}
          onChange={event => setNote(event.target.value)}
          disabled={isSaving}
          placeholder="✏️  อยากเขียนอะไรไหม (ไม่ใส่ก็ได้)"
          aria-label="บันทึกข้อความเพิ่มเติม"
          className="w-full rounded-xl border-[1.5px] border-dashed border-border bg-transparent px-3.5 py-[13px] text-[15px] text-text outline-none placeholder:text-muted focus:border-accent"
        />

        <div className="flex gap-2.5">
          {previewUrl && (
            <button
              type="button"
              onClick={handleRetake}
              disabled={isSaving}
              className="flex-1 cursor-pointer rounded-[14px] border-[1.5px] border-border bg-surface p-3.5 text-base font-semibold text-text disabled:opacity-50"
            >🔄 ถ่ายใหม่</button>
          )}
          <button
            type="button"
            onClick={handleShutter}
            disabled={isSaving}
            className="flex-[2] cursor-pointer rounded-[14px] border-0 bg-accent p-4 text-lg font-bold text-bg shadow-[0_4px_20px_rgba(232,133,74,0.4)] disabled:cursor-wait disabled:opacity-70"
          >
            {isSaving ? <span className="inline-flex items-center justify-center gap-2"><span className="h-5 w-5 animate-spin rounded-full border-2 border-bg/40 border-t-bg" aria-hidden="true" />กำลังบันทึกและวิเคราะห์รูป…</span> : previewUrl ? '✔ เก็บเลย' : '📸 ถ่าย'}
          </button>
        </div>

        {saveError && <p className="m-0 text-center text-sm text-[#e87070]" role="alert">{saveError}</p>}

        {!previewUrl && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isSaving}
            className="cursor-pointer border-0 bg-transparent text-[13px] text-muted underline disabled:opacity-50"
          >หรือเลือกรูปจากคลัง</button>
        )}
      </section>
    </main>
  )
}
