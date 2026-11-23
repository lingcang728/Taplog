import { useSyncExternalStore } from 'react'

export interface ReadableStore<T> {
  get: () => T
  set: (patch: Partial<T> | ((current: T) => Partial<T>)) => void
  replace: (next: T) => void
  subscribe: (listener: () => void) => () => void
}

export function createStore<T extends object>(initial: T): ReadableStore<T> {
  let state = initial
  const listeners = new Set<() => void>()

  const notify = () => {
    for (const listener of listeners) listener()
  }

  return {
    get: () => state,
    set: (patch) => {
      const partial = typeof patch === 'function' ? patch(state) : patch
      let changed = false
      for (const key of Object.keys(partial) as (keyof T)[]) {
        if (!Object.is(state[key], partial[key])) {
          changed = true
          break
        }
      }
      if (!changed) return
      state = { ...state, ...partial }
      notify()
    },
    replace: (next) => {
      if (Object.is(state, next)) return
      state = next
      notify()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function useStore<T extends object, S>(
  store: ReadableStore<T>,
  selector: (state: T) => S,
): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  )
}
