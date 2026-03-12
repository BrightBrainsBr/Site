export async function register() {
  // Node 25+ provides a broken localStorage proxy without getItem when
  // --localstorage-file is missing. Replace it with a working mock.
  const needsMock =
    typeof globalThis.localStorage === 'undefined' ||
    typeof (globalThis.localStorage as Storage | undefined)?.getItem !==
      'function'
  if (needsMock) {
    const store = new Map<string, string>()
    ;(globalThis as Record<string, unknown>).localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
    }
  }
}
