import type { Item } from '../../types'

export interface PhotoPageProps {
  item: Item
  onBack: () => void
  onDelete: (id: number) => void | Promise<void>
  onReshoot: (id: number) => void
}
