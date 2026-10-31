import type { Item } from '../types'

const DATABASE_NAME = 'maee-local-items'
const DATABASE_VERSION = 1
const STORE_NAME = 'items'

let databasePromise: Promise<IDBDatabase> | undefined
let persistenceRequestStarted = false

function getDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Could not open local item storage'))
      request.onblocked = () => reject(new Error('Local item storage is blocked by another app tab'))
    })
  }
  return databasePromise
}

export async function getItems() {
  const database = await getDatabase()
  return new Promise<Item[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve((request.result as Item[]).sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime()))
    request.onerror = () => reject(request.error ?? new Error('Could not read saved items'))
  })
}

export async function saveItem(item: Item) {
  const database = await getDatabase()
  return new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(item)
    request.onsuccess = () => {
      if (!persistenceRequestStarted && navigator.storage?.persist) {
        persistenceRequestStarted = true
        void navigator.storage.persist()
      }
      resolve()
    }
    request.onerror = () => reject(request.error ?? new Error('Could not save item'))
  })
}

export async function deleteItem(id: number) {
  const database = await getDatabase()
  return new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Could not delete item'))
  })
}
