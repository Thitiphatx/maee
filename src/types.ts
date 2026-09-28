export interface Item {
  id: number
  imageUrl: string
  note: string
  savedAt: Date
}

export type Screen = 'home' | 'camera' | 'photo'

export function formatDate(d: Date) {
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export const MOCK_ITEMS: Item[] = [
  { id: 1, imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80', note: 'หมอนรองคอ', savedAt: new Date('2026-03-03') },
  { id: 2, imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80', note: 'ของดอนไฟดับ', savedAt: new Date('2026-09-20') },
  { id: 3, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', note: 'เครื่องชั่ง', savedAt: new Date('2026-01-08') },
  { id: 4, imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80', note: '', savedAt: new Date('2025-12-01') },
]
