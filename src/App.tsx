import { useState } from 'react'
import { MOCK_ITEMS, type Item, type Screen } from './types'
import { HomeScreen } from './components/HomeScreen'
import { CameraScreen } from './components/CameraScreen'
import { PhotoScreen } from './components/PhotoScreen'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS)
  const [query, setQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  // When reshoot: replace image on this item id instead of creating new
  const [reshootId, setReshootId] = useState<number | null>(null)

  function handleSave(imageUrl: string, note: string) {
    if (reshootId !== null) {
      // Replace photo of existing item
      setItems(prev => prev.map(i =>
        i.id === reshootId ? { ...i, imageUrl, note: note || i.note, savedAt: new Date() } : i
      ))
      const updated = items.find(i => i.id === reshootId)
      if (updated) setSelectedItem({ ...updated, imageUrl, note: note || updated.note, savedAt: new Date() })
      setReshootId(null)
      setScreen('photo')
    } else {
      setItems(prev => [{ id: Date.now(), imageUrl, note, savedAt: new Date() }, ...prev])
      setScreen('home')
    }
  }

  function handleDelete(id: number) {
    setItems(prev => prev.filter(i => i.id !== id))
    setScreen('home')
  }

  function handleReshoot(id: number) {
    setReshootId(id)
    setScreen('camera')
  }

  if (screen === 'home') return (
    <HomeScreen
      items={items}
      query={query}
      onQueryChange={setQuery}
      onSelectItem={item => { setSelectedItem(item); setScreen('photo') }}
      onNewItem={() => { setReshootId(null); setScreen('camera') }}
    />
  )

  if (screen === 'camera') return (
    <CameraScreen
      onSave={handleSave}
      onBack={() => setScreen(reshootId !== null ? 'photo' : 'home')}
    />
  )

  if (screen === 'photo' && selectedItem) return (
    <PhotoScreen
      item={selectedItem}
      onBack={() => setScreen('home')}
      onDelete={handleDelete}
      onReshoot={handleReshoot}
    />
  )

  return null
}
