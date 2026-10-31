export interface Item {
  id: number
  imageUrl: string
  note: string
  savedAt: Date
  imageEmbedding?: number[] | null
  noteEmbedding?: number[] | null
}

export type Screen = 'home' | 'camera' | 'photo'

export function formatDate(date: Date) {
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}
