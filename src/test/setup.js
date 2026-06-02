import 'fake-indexeddb/auto'

// Provide crypto.randomUUID in Node (not available by default in older versions)
if (!globalThis.crypto?.randomUUID) {
  const { randomUUID } = await import('crypto')
  globalThis.crypto = { ...globalThis.crypto, randomUUID }
}
