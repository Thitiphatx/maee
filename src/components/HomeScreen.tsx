import { type Item, formatDate } from '../types'

interface Props {
  items: Item[]
  query: string
  onQueryChange: (q: string) => void
  onSelectItem: (item: Item) => void
  onNewItem: () => void
}

export function HomeScreen({ items, query, onQueryChange, onSelectItem, onNewItem }: Props) {
  const filtered = query.trim()
    ? items.filter(i => i.note.toLowerCase().includes(query.toLowerCase()))
    : items

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#1a1208',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px 100px',
      gap: '16px',
      fontFamily: "'Sarabun', sans-serif",
      color: '#f5e8d0',
    }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>ของอยู่ไหนนะ?</h1>

      {/* Search box */}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
        <input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="หมอนรองคอ…"
          style={{
            width: '100%', padding: '14px 14px 14px 44px',
            background: 'transparent', border: '1.5px solid #4a3520',
            borderRadius: 14, color: '#f5e8d0', fontSize: 17,
            outline: 'none', fontFamily: "'Sarabun', sans-serif",
          }}
        />
      </div>

      <button style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'transparent', border: '1.5px solid #4a3520',
        borderRadius: 20, padding: '9px 18px', color: '#f5e8d0',
        fontSize: 15, cursor: 'pointer', width: 'fit-content',
        fontFamily: "'Sarabun', sans-serif",
      }}>🎤 พูดค้นหา</button>

      <p style={{ margin: 0, fontSize: 13, color: '#9a8070' }}>
        ตัวอย่าง:{' '}
        <span style={{ background: '#2a1f0e', borderRadius: 8, padding: '2px 8px' }}>ของดอนไฟดับ</span>
      </p>

      {/* Photo grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {filtered.map((item, i) => (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            style={{
              borderRadius: 14, overflow: 'hidden', position: 'relative', cursor: 'pointer',
              border: '1.5px solid #4a3520', background: '#231a0c',
              transition: 'transform 0.15s ease',
            }}
            onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {i === 0 && (
              <span style={{
                position: 'absolute', top: 8, left: 8, zIndex: 2,
                background: '#e8854a', color: '#1a1208', fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 20,
              }}>ใกล้เคียงสุด</span>
            )}
            <img
              src={item.imageUrl}
              alt={item.note}
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ padding: '6px 8px 8px', fontSize: 12, color: '#9a8070' }}>
              เก็บเมื่อ {formatDate(item.savedAt)}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9a8070', marginTop: 32 }}>ไม่พบของที่ค้นหา</p>
      )}

      {/* FAB */}
      <button
        id="btn-new-item"
        onClick={onNewItem}
        style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#e8854a', color: '#1a1208', fontWeight: 700, fontSize: 17,
          border: 'none', borderRadius: 20, padding: '16px 36px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 24px rgba(232,133,74,0.45)',
          fontFamily: "'Sarabun', sans-serif", whiteSpace: 'nowrap',
        }}
        onTouchStart={e => (e.currentTarget.style.transform = 'translateX(-50%) scale(0.96)')}
        onTouchEnd={e => (e.currentTarget.style.transform = 'translateX(-50%) scale(1)')}
      >📷 เก็บของใหม่</button>
    </div>
  )
}
