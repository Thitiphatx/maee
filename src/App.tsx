import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteItem as deleteStoredItem, getItems, saveItem } from './storage/items'
import { createItemEmbeddings, loadLocalAiSearch, searchItemsLocally } from './services/localAiSearch'
import type { Item, Screen } from './types'
import { HomeScreen } from './pages/home/home'
import { CameraScreen } from './pages/camera/camera'
import { PhotoScreen } from './pages/photo/photo'
import './App.css'

type AiStatus = 'not-loaded' | 'loading' | 'indexing' | 'ready' | 'error'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [items, setItems] = useState<Item[]>([])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Item[]>([])
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [reshootId, setReshootId] = useState<number | null>(null)
  const [aiStatus, setAiStatus] = useState<AiStatus>('not-loaded')
  const [aiProgress, setAiProgress] = useState(0)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const aiActivationInProgress = useRef(false)
  const autoLoadStarted = useRef(false)

  const handleEnableAi = useCallback(async () => {
    if (aiActivationInProgress.current || aiStatus === 'loading' || aiStatus === 'indexing' || aiStatus === 'ready') return
    aiActivationInProgress.current = true
    setAiStatus('loading')
    setAiProgress(0)
    setAiError(null)

    try {
      await loadLocalAiSearch(setAiProgress)
      setAiStatus('indexing')
      const savedItems = await getItems()
      for (const item of savedItems) {
        if (item.imageEmbedding?.length) continue
        const embeddings = await createItemEmbeddings(item.imageUrl, item.note)
        const indexedItem = { ...item, ...embeddings }
        await saveItem(indexedItem)
        setItems(previous => previous.map(saved => saved.id === indexedItem.id ? indexedItem : saved))
      }
      localStorage.setItem('maee-local-ai-enabled', 'true')
      setAiStatus('ready')
    } catch (error) {
      localStorage.removeItem('maee-local-ai-enabled')
      setAiStatus('error')
      setAiError(error instanceof Error ? error.message : String(error))
    } finally {
      aiActivationInProgress.current = false
    }
  }, [aiStatus])

  useEffect(() => {
    let active = true
    getItems().then(savedItems => {
      if (active) setItems(savedItems)
    }).catch(error => {
      if (active) setAiError(error instanceof Error ? error.message : String(error))
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (autoLoadStarted.current) return
    autoLoadStarted.current = true
    void handleEnableAi()
  }, [handleEnableAi])

  useEffect(() => {
    let active = true
    const normalizedQuery = submittedQuery.trim().toLocaleLowerCase()
    if (!normalizedQuery) return

    const timer = window.setTimeout(() => {
      if (aiStatus === 'ready') {
        setIsSearching(true)
        searchItemsLocally(submittedQuery, items).then(results => {
          if (active) setSearchResults(results)
        }).catch(error => {
          if (active) {
            setAiError(error instanceof Error ? error.message : String(error))
            setAiStatus('error')
            setSearchResults(items.filter(item => item.note.toLocaleLowerCase().includes(normalizedQuery)))
          }
        }).finally(() => {
          if (active) setIsSearching(false)
        })
      } else {
        setSearchResults(items.filter(item => item.note.toLocaleLowerCase().includes(normalizedQuery)))
        setIsSearching(false)
      }
    }, 0)

    return () => {
      active = false
      setIsSearching(false)
      window.clearTimeout(timer)
    }
  }, [aiStatus, items, submittedQuery])

  async function handleSave(imageUrl: string, note: string) {
    const savedAt = new Date()
    let item: Item
    const isReshoot = reshootId !== null

    if (isReshoot) {
      const current = items.find(candidate => candidate.id === reshootId)
      if (!current) return
      item = {
        ...current,
        imageUrl,
        note: note || current.note,
        savedAt,
        imageEmbedding: null,
        noteEmbedding: null,
      }
    } else {
      item = { id: Date.now(), imageUrl, note, savedAt, imageEmbedding: null, noteEmbedding: null }
    }

    await saveItem(item)

    setItems(previous => isReshoot
      ? previous.map(candidate => candidate.id === item.id ? item : candidate)
      : [item, ...previous])

    if (aiStatus === 'ready') {
      try {
        const embeddings = await createItemEmbeddings(item.imageUrl, item.note)
        const indexedItem = { ...item, ...embeddings }
        await saveItem(indexedItem)
        setItems(previous => previous.map(saved => saved.id === indexedItem.id ? indexedItem : saved))
        setSelectedItem(previous => previous?.id === indexedItem.id ? indexedItem : previous)
      } catch (error) {
        setAiError(error instanceof Error ? error.message : String(error))
        setAiStatus('error')
      }
    }

    if (isReshoot) {
      setReshootId(null)
      setScreen('photo')
    } else {
      setScreen('home')
    }
  }

  async function handleDelete(id: number) {
    await deleteStoredItem(id)
    setItems(previous => previous.filter(item => item.id !== id))
    setScreen('home')
  }

  function handleReshoot(id: number) {
    setReshootId(id)
    setScreen('camera')
  }

  let page: React.ReactNode = null
  if (screen === 'home') page = (
    <HomeScreen
      items={submittedQuery.trim() ? searchResults : items}
      hasSavedItems={items.length > 0}
      query={query}
      isSearchActive={Boolean(submittedQuery.trim())}
      aiStatus={aiStatus}
      aiError={aiError}
      isSearching={isSearching}
      onQueryChange={setQuery}
      onSearch={setSubmittedQuery}
      onSelectItem={item => { setSelectedItem(item); setScreen('photo') }}
      onNewItem={() => { setReshootId(null); setScreen('camera') }}
    />
  )

  if (screen === 'camera') page = (
    <CameraScreen
      onSave={handleSave}
      onBack={() => setScreen(reshootId !== null ? 'photo' : 'home')}
    />
  )

  if (screen === 'photo' && selectedItem) page = (
    <PhotoScreen
      item={selectedItem}
      onBack={() => setScreen('home')}
      onDelete={handleDelete}
      onReshoot={handleReshoot}
    />
  )

  return (
    <>
      {page}
      {(aiStatus === 'loading' || aiStatus === 'indexing') && (
        <div className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-bg px-8 text-center text-text" role="status" aria-live="polite">
          <div className="w-full max-w-sm">
            <h1 className="m-0 text-xl font-bold">{aiStatus === 'loading' ? 'กำลังเตรียม AI ในเครื่อง' : 'กำลังเตรียมรูปภาพสำหรับค้นหา'}</h1>
            <p className="mt-2 mb-0 text-sm text-muted">{aiStatus === 'loading' ? 'กำลังโหลดโมเดล · ทำครั้งแรกอาจใช้เวลาสักครู่' : 'กำลังประมวลผลรูปที่บันทึกไว้ อุปกรณ์อาจใช้เวลาสักครู่'}</p>
            <progress
              value={aiStatus === 'loading' ? aiProgress : undefined}
              max={100}
              aria-label={aiStatus === 'loading' ? 'กำลังดาวน์โหลด AI' : 'กำลังเตรียมรูปภาพ'}
              className="mt-5 h-2 w-full accent-accent"
            />
          </div>
        </div>
      )}
    </>
  )
}
