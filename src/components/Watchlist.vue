<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { fetchFundValuation } from '../composables/useFundApi.js'
import { useWatchlist } from '../composables/useWatchlist.js'
import FundHoldingsModal from './FundHoldingsModal.vue'
import FundTrendChart from './FundTrendChart.vue'

const { watchlist, removeFund } = useWatchlist()

const VALUATION_CACHE_KEY = 'fund-valuation-cache'

const valuations = ref(loadCache())
const modalFund = ref(null)
const trendFund = ref(null)
const loading = ref(false)
const autoRefresh = ref(true)
let timer = null

function loadCache() {
  try {
    const raw = localStorage.getItem(VALUATION_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveCache() {
  try {
    localStorage.setItem(VALUATION_CACHE_KEY, JSON.stringify(valuations.value))
  } catch {}
}

watch(valuations, saveCache, { deep: true })

watch(watchlist, (val) => {
  if (val.length) refreshAll()
}, { immediate: true })

const SORT_KEY = 'fund-sort-order'
const sortBy = ref(localStorage.getItem(SORT_KEY) || '')
watch(sortBy, v => localStorage.setItem(SORT_KEY, v))

const sortedWatchlist = computed(() => {
  const list = [...watchlist.value]
  if (sortBy.value === 'asc' || sortBy.value === 'desc') {
    list.sort((a, b) => {
      const va = parseFloat(valuations.value[a.code]?.estimatedChange || 0)
      const vb = parseFloat(valuations.value[b.code]?.estimatedChange || 0)
      return sortBy.value === 'asc' ? va - vb : vb - va
    })
  }
  return list
})

function toggleSort() {
  if (sortBy.value === 'desc') sortBy.value = 'asc'
  else if (sortBy.value === 'asc') sortBy.value = ''
  else sortBy.value = 'desc'
}

async function refreshAll() {
  if (loading.value) return
  loading.value = true
  const codes = watchlist.value.map(f => f.code)
  const results = await Promise.allSettled(
    codes.map(code => fetchFundValuation(code))
  )
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const data = result.value
      valuations.value = { ...valuations.value, [data.code]: data }
    }
  }
  loading.value = false
}

function getChangeClass(value) {
  if (!value) return ''
  const num = parseFloat(value)
  if (num > 0) return 'up'
  if (num < 0) return 'down'
  return ''
}

onMounted(() => {
  timer = setInterval(() => {
    if (autoRefresh.value && watchlist.value.length > 0) {
      refreshAll()
    }
  }, 30000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<template>
  <div class="watchlist">
    <div class="toolbar">
      <label class="auto-refresh">
        <input type="checkbox" v-model="autoRefresh" />
        自动刷新（30秒）
      </label>
      <div class="toolbar-right">
        <button
          class="sort-btn"
          :class="{ active: sortBy }"
          @click="toggleSort"
        >涨跌幅 {{ sortBy === 'desc' ? '↓' : sortBy === 'asc' ? '↑' : '' }}</button>
        <button class="refresh-btn" :disabled="loading" @click="refreshAll">
          {{ loading ? '刷新中...' : '手动刷新' }}
        </button>
      </div>
    </div>

    <div v-if="watchlist.length === 0" class="empty">
      <p>自选列表为空</p>
      <p class="sub">前往「基金搜索」添加关注的基金</p>
    </div>

    <ul v-else class="fund-list">
      <li v-for="f in sortedWatchlist" :key="f.code" class="fund-item">
        <div class="fund-header">
          <span class="fund-code clickable" @click="modalFund = f">{{ f.code }}</span>
          <span class="fund-name clickable" @click="modalFund = f">{{ f.name }}</span>
          <button class="trend-btn" @click="trendFund = f">走势</button>
          <button class="remove-btn" @click="removeFund(f.code)">删除</button>
        </div>
        <div v-if="valuations[f.code]" class="valuation">
          <div class="val-row first-row">
            <span class="label">实时估值</span>
            <span class="value up">{{ valuations[f.code].estimatedValue.toFixed(4) }}</span>
            <span class="sep"></span>
            <span class="label">涨跌幅</span>
            <span
              class="value"
              :class="getChangeClass(valuations[f.code].estimatedChange)"
            >{{ valuations[f.code].estimatedChange }}%</span>
            <span class="sep"></span>
            <span class="label muted">更新时间</span>
            <span class="value muted">{{ valuations[f.code].updateTime }}</span>
          </div>
          <div class="val-row">
            <span class="label">单位净值</span>
            <span class="value">{{ valuations[f.code].netValue.toFixed(4) }}</span>
          </div>
          <div class="val-row muted">
            <span class="label">净值日期</span>
            <span class="value">{{ valuations[f.code].netValueDate }}</span>
          </div>
        </div>
        <div v-else class="loading-val">加载估值中...</div>
      </li>
    </ul>
    <FundHoldingsModal
      v-if="modalFund"
      :fund-code="modalFund.code"
      :fund-name="modalFund.name"
      @close="modalFund = null"
    />
    <FundTrendChart
      v-if="trendFund"
      :fund-code="trendFund.code"
      :fund-name="trendFund.name"
      @close="trendFund = null"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-right {
  display: flex;
  gap: 6px;
  align-items: center;
}

.sort-btn {
  padding: 8px 14px;
  border: 1px solid #ddd;
  background: #fff;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}

.sort-btn.active {
  border-color: #409eff;
  color: #409eff;
  background: #f0f7ff;
}

.sort-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.auto-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.auto-refresh input {
  cursor: pointer;
}

.refresh-btn {
  padding: 8px 18px;
  border: 1px solid #409eff;
  background: #409eff;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn:hover:not(:disabled) {
  background: #66b1ff;
  border-color: #66b1ff;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: #999;
  font-size: 15px;
}

.empty .sub {
  margin-top: 8px;
  font-size: 13px;
  color: #bbb;
}

.fund-list {
  list-style: none;
}

.fund-item {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 14px;
  padding: 16px 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.fund-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.fund-code {
  color: #409eff;
  font-weight: 700;
  font-size: 15px;
}

.fund-name {
  font-size: 15px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
}

.clickable {
  cursor: pointer;
  transition: opacity 0.15s;
}

.clickable:hover {
  opacity: 0.7;
}

.trend-btn {
  padding: 4px 12px;
  border: 1px solid #409eff;
  background: #fff;
  color: #409eff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}

.trend-btn:hover {
  background: #409eff;
  color: #fff;
}

.remove-btn {
  padding: 4px 10px;
  border: 1px solid #e74c3c;
  background: #fff;
  color: #e74c3c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #e74c3c;
  color: #fff;
}

.valuation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
}

.val-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.val-row.first-row {
  justify-content: flex-start;
  gap: 8px;
  grid-column: 1 / -1;
  padding-bottom: 6px;
}

.val-row.first-row .label {
  font-size: 12px;
  color: #888;
  letter-spacing: 0.5px;
}

.val-row.first-row .value {
  font-weight: 700;
  font-size: 15px;
  margin-right: 4px;
}

.val-row.first-row .value.muted {
  color: #888;
  font-size: 12px;
  font-weight: 500;
}

.val-row.first-row .label.muted {
  color: #aaa;
  font-size: 12px;
}

.val-row .label {
  color: #999;
  white-space: nowrap;
}

.sep {
  width: 1px;
  height: 16px;
  background: #ddd;
  flex-shrink: 0;
  margin: 0 4px;
}

.val-row.muted .value {
  color: #999;
  font-size: 12px;
}

.value.up {
  color: #e74c3c;
}

.value.down {
  color: #27ae60;
}

.loading-val {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 8px 0;
}

@media (max-width: 640px) {
  .toolbar {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .toolbar-right {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .fund-item {
    padding: 12px 14px;
    border-radius: 10px;
    margin-bottom: 10px;
  }

  .fund-header {
    gap: 8px;
    margin-bottom: 10px;
    padding-bottom: 10px;
  }

  .fund-code {
    font-size: 14px;
  }

  .fund-name {
    font-size: 14px;
  }

  .remove-btn {
    padding: 6px 12px;
  }

  .valuation {
    gap: 8px 12px;
  }

  .val-row {
    font-size: 13px;
  }

  .val-row.first-row {
    flex-wrap: wrap;
    gap: 6px;
    padding-bottom: 4px;
  }

  .val-row.first-row .value {
    font-size: 14px;
  }

  .sort-btn,
  .refresh-btn {
    padding: 10px 16px;
    font-size: 14px;
  }

  .auto-refresh {
    font-size: 14px;
  }
}

@media (max-width: 400px) {
  .valuation {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .val-row.first-row {
    font-size: 12px;
  }
}
</style>
