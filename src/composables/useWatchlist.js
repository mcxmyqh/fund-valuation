import { ref } from 'vue'

const API = '/api/watchlist'
const STORAGE_KEY = 'fund-watchlist'

const watchlist = ref([])

async function init() {
  try {
    const res = await fetch(API)
    const data = await res.json()
    if (Array.isArray(data)) {
      watchlist.value = data
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
      return
    }
  } catch {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      watchlist.value = JSON.parse(raw)
    }
  } catch {}
}

init()

export function useWatchlist() {
  async function addFund(fund) {
    if (watchlist.value.some(f => f.code === fund.code)) return
    watchlist.value = [...watchlist.value, { code: fund.code, name: fund.name }]
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist.value)) } catch {}
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: fund.code, name: fund.name }),
    })
    const data = await res.json()
    if (Array.isArray(data)) watchlist.value = data
  }

  async function removeFund(code) {
    watchlist.value = watchlist.value.filter(f => f.code !== code)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist.value)) } catch {}
    const res = await fetch(API, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (Array.isArray(data)) watchlist.value = data
  }

  function isWatched(code) {
    return watchlist.value.some(f => f.code === code)
  }

  return { watchlist, addFund, removeFund, isWatched }
}
