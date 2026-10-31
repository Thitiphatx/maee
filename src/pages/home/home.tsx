import type { HomePageProps } from './interface'
import { formatDate } from '../../types'

export function HomeScreen({ items, hasSavedItems, query, isSearchActive, aiStatus, aiError, isSearching, onQueryChange, onSearch, onSelectItem, onNewItem }: HomePageProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 bg-bg px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-24 text-text sm:gap-5 sm:px-6 sm:pb-28">
      <h1 className="m-0 text-[30px] font-extrabold">ของอยู่ไหนนะ</h1>

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted" role="status" aria-live="polite">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" aria-hidden="true" />
          <span>กำลังค้นหารูปด้วย AI…</span>
        </div>
      )}

      {aiError && <p className="m-0 text-sm text-[#e87070]" role="alert">{aiError}</p>}

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-label="รายการรูปภาพ" aria-busy={isSearching}>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectItem(item)}
            className="relative cursor-pointer overflow-hidden rounded-[14px] border-[1.5px] border-border bg-card text-left transition-transform duration-150 active:scale-[0.97]"
          >
            {isSearchActive && index === 0 && (
              <span className="absolute top-2 left-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-bg">
                ตรงที่สุด
              </span>
            )}
            <img
              src={item.imageUrl}
              alt={item.note || 'รูปสิ่งของที่บันทึกไว้'}
              className="block aspect-square w-full object-cover"
            />
            <span className="block min-h-10 px-2 py-1.5 pb-2 text-xs text-muted line-clamp-2">
              {item.note.trim() || `เก็บเมื่อ ${formatDate(item.savedAt)}`}
            </span>
          </button>
        ))}
      </section>

      {items.length === 0 && (
        <p className="mt-8 text-center text-muted">
          {isSearchActive && hasSavedItems && aiStatus !== 'ready'
            ? 'เปิดใช้ AI ด้านบนเพื่อค้นหาจากสิ่งที่เห็นในรูป'
            : isSearchActive ? 'ไม่พบสิ่งที่ค้นหา' : 'ยังไม่มีรูปภาพ กดปุ่มกล้องเพื่อเพิ่มของ'}
        </p>
      )}

      <p className="m-0 text-[13px] text-muted">
        ตัวอย่าง: <span className="rounded-lg bg-surface px-2 py-0.5">ของดอนไฟดับ</span>
      </p>
      <button
        type="button"
        className="flex w-fit cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-border bg-transparent px-[18px] py-[9px] text-[15px] text-text"
      >
        🎤 พูดค้นหา
      </button>

      <form
        onSubmit={event => { event.preventDefault(); onSearch(query) }}
        aria-busy={isSearching}
        className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-3xl items-center gap-2.5 border-t-[1.5px] border-border bg-bg px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:px-6"
      >
        <div className="relative min-w-0 flex-1">
          <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-lg" aria-hidden="true">🔍</span>
          <input
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            placeholder="หมอนรองคอ…"
            aria-label="ค้นหาสิ่งของ"
            enterKeyHint="search"
            disabled={isSearching}
            className="w-full rounded-[14px] border-[1.5px] border-border bg-transparent py-3.5 pr-3.5 pl-11 text-[17px] text-text outline-none placeholder:text-muted focus:border-accent"
          />
        </div>
        <button
          id="btn-new-item"
          type="button"
          onClick={onNewItem}
          aria-label="เก็บของใหม่"
          disabled={isSearching}
          className="flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-accent text-bg shadow-[0_4px_24px_rgba(232,133,74,0.45)] transition-transform active:scale-[0.96] disabled:cursor-wait disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="block h-6 w-6 shrink-0">
            <path d="M4 7.5h3l1.5-2h7l1.5 2h3A1.5 1.5 0 0 1 21.5 9v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </form>
    </main>
  )
}
