import type { Tensor } from '@huggingface/transformers'
import type { Item } from '../types'

export const LOCAL_MODEL_ID = 'jinaai/jina-clip-v2'
export const LOCAL_MODEL_DOWNLOAD_NOTE = 'ประมาณ 850 MB · ดาวน์โหลดครั้งเดียว'

const QUERY_PREFIX = 'Represent the query for retrieving evidence documents: '

type ModelOutput = {
  l2norm_text_embeddings?: Tensor
  l2norm_image_embeddings?: Tensor
}

type ProgressCallback = (progress: number) => void
type AiProcessor = Awaited<ReturnType<typeof import('@huggingface/transformers').AutoProcessor.from_pretrained>>
type AiModel = Awaited<ReturnType<typeof import('@huggingface/transformers').AutoModel.from_pretrained>>

let processorPromise: Promise<AiProcessor> | undefined
let modelPromise: Promise<AiModel> | undefined
let activeModelDevice: 'webgpu' | 'wasm' = 'wasm'
let activeModelDtype: 'q4f16' | 'q8' = 'q4f16'
let modelRunQueue: Promise<unknown> = Promise.resolve()
let queryPlaceholderImage: import('@huggingface/transformers').RawImage | undefined

function reportProgress(callback: ProgressCallback, progress: { status?: string; progress?: number }) {
  if (progress.status === 'progress' && typeof progress.progress === 'number') {
    callback(Math.max(0, Math.min(100, progress.progress)))
  } else if (progress.status === 'done') {
    callback(100)
  }
}

export async function loadLocalAiSearch(onProgress: ProgressCallback = () => {}) {
  const { AutoModel, AutoProcessor, env } = await import('@huggingface/transformers')
  // WASM inference can block the UI thread on devices without usable WebGPU.
  // ONNX Runtime's proxy runs those sessions in its worker instead.
  if (env.backends.onnx.wasm) env.backends.onnx.wasm.proxy = true
  processorPromise ??= AutoProcessor.from_pretrained(LOCAL_MODEL_ID, {
    progress_callback: (progress: { status?: string; progress?: number }) => reportProgress(onProgress, progress),
  })

  modelPromise ??= (async () => {
    const progress_callback = (progress: { status?: string; progress?: number }) => reportProgress(onProgress, progress)
    const isWindows = /Windows/i.test(navigator.userAgent)
    const gpu = isWindows
      ? undefined
      : Reflect.get(navigator, 'gpu') as { requestAdapter?: () => Promise<{ features: { has: (feature: string) => boolean } } | null> } | undefined
    const adapter = await gpu?.requestAdapter?.().catch(() => null)
    if (adapter?.features.has('shader-f16')) {
      try {
        const model = await AutoModel.from_pretrained(LOCAL_MODEL_ID, { dtype: 'q4f16', device: 'webgpu', progress_callback })
        activeModelDevice = 'webgpu'
        return model
      } catch {
        // Some browsers load the model but cannot run its WebGPU convolution kernels.
      }
    }
    activeModelDevice = 'wasm'
    activeModelDtype = 'q4f16'
    try {
      return await AutoModel.from_pretrained(LOCAL_MODEL_ID, { dtype: 'q4f16', device: 'wasm', progress_callback })
    } catch {
      activeModelDtype = 'q8'
      return AutoModel.from_pretrained(LOCAL_MODEL_ID, { dtype: 'q8', device: 'wasm', progress_callback })
    }
  })()

  try {
    return { processor: await processorPromise, model: await modelPromise }
  } catch (error) {
    processorPromise = undefined
    modelPromise = undefined
    throw error
  }
}

function runLocalModel(inputs: Parameters<AiModel>[0]) {
  const run = async () => {
    const { model } = await loadLocalAiSearch()
    try {
      return await model(inputs) as ModelOutput
    } catch (error) {
      if (activeModelDevice === 'wasm' && activeModelDtype === 'q8') throw error

      const { AutoModel } = await import('@huggingface/transformers')
      const previousModel = model
      const fallbackDtype = activeModelDevice === 'webgpu' ? 'q4f16' : 'q8'
      activeModelDevice = 'wasm'
      activeModelDtype = fallbackDtype
      modelPromise = AutoModel.from_pretrained(LOCAL_MODEL_ID, { dtype: fallbackDtype, device: 'wasm' })
      await previousModel.dispose().catch(() => [])
      try {
        return await (await modelPromise)(inputs) as ModelOutput
      } catch (fallbackError) {
        if (fallbackDtype === 'q8') throw fallbackError
        activeModelDtype = 'q8'
        modelPromise = AutoModel.from_pretrained(LOCAL_MODEL_ID, { dtype: 'q8', device: 'wasm' })
        const quantizedModel = await modelPromise
        return await quantizedModel(inputs) as ModelOutput
      }
    }
  }

  const result = modelRunQueue.then(run, run)
  modelRunQueue = result.then(() => undefined, () => undefined)
  return result
}

function vector(tensor: Tensor | undefined) {
  return tensor ? Array.from(tensor.data, value => Number(value)) : null
}

export async function createItemEmbeddings(imageUrl: string, note: string) {
  const { RawImage } = await import('@huggingface/transformers')
  const { processor } = await loadLocalAiSearch()
  const image = await RawImage.read(imageUrl)
  const inputs = await processor([note.trim()], [image], { padding: true, truncation: true })
  const output = await runLocalModel(inputs)
  const imageEmbedding = vector(output.l2norm_image_embeddings)
  if (!imageEmbedding) throw new Error('The local model did not return an image embedding')

  return {
    imageEmbedding,
    noteEmbedding: note.trim() ? vector(output.l2norm_text_embeddings) : null,
  }
}

export async function searchItemsLocally(query: string, items: Item[]) {
  if (items.length === 0) return []

  const { RawImage } = await import('@huggingface/transformers')
  const { processor } = await loadLocalAiSearch()
  // This model only publishes a combined text-and-vision ONNX file. A tiny
  // placeholder avoids the zero-sized vision tensor some runtimes reject.
  queryPlaceholderImage ??= new RawImage(new Uint8Array([0, 0, 0]), 1, 1, 3)
  const inputs = await processor([QUERY_PREFIX + query.trim()], [queryPlaceholderImage], { padding: true, truncation: true })
  const output = await runLocalModel(inputs)
  const queryEmbedding = vector(output.l2norm_text_embeddings)
  if (!queryEmbedding) throw new Error('The local model did not return a text embedding')

  const score = (embedding?: number[] | null) => {
    if (!embedding || embedding.length !== queryEmbedding.length) return Number.NEGATIVE_INFINITY
    return embedding.reduce((sum, value, index) => sum + value * queryEmbedding[index], 0)
  }

  return [...items].sort((a, b) => {
    const scoreA = Math.max(score(a.imageEmbedding), score(a.noteEmbedding))
    const scoreB = Math.max(score(b.imageEmbedding), score(b.noteEmbedding))
    return scoreB - scoreA || b.savedAt.getTime() - a.savedAt.getTime()
  })
}
