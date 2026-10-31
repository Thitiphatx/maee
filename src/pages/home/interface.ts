import type { Item } from '../../types'

export interface HomePageProps {
  items: Item[]
  hasSavedItems: boolean
  query: string
  isSearchActive: boolean
  aiStatus: 'not-loaded' | 'loading' | 'indexing' | 'ready' | 'error'
  aiError: string | null
  isSearching: boolean
  onQueryChange: (query: string) => void
  onSearch: (query: string) => void
  onSelectItem: (item: Item) => void
  onNewItem: () => void
}
