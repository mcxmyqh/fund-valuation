<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchFundList, fetchFundValuation } from '../composables/useFundApi.js'
import { useWatchlist } from '../composables/useWatchlist.js'
import FundHoldingsModal from './FundHoldingsModal.vue'
import FundTrendChart from './FundTrendChart.vue'

const { addFund, isWatched } = useWatchlist()

const funds = ref([])
const keyword = ref('')
const loading = ref(true)
const error = ref('')
const valuations = ref({})
const modalFund = ref(null)
const trendFund = ref(null)
const valuationFund = ref(null)

onMounted(async () => {
  try {
    funds.value = await fetchFundList()
  } catch (e) {
    error.value = '加载基金列表失败，请检查网络'
  } finally {
    loading.value = false
  }
})

function fuzzyMatch(text, query) {
  let qi = 0
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] === query[qi]) qi++
  }
  return qi === query.length
}

const filteredFunds = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  let list = funds.value
  if (kw) {
    list = list.filter(f => {
      const code = f.code || ''
      const name = (f.name || '').toLowerCase()
      return fuzzyMatch(code, kw) || fuzzyMatch(name, kw)
    })
  }
  return list.slice(0, 50)
})

async function showValuation(fund) {
  valuationFund.value = fund
  try {
    const data = await fetchFundValuation(fund.code)
    valuations.value = { ...valuations.value, [data.code]: data }
  } catch (e) {
    console.error('获取估值失败', e)
  }
}

function getChangeClass(value) {
  if (!value) return ''
  const num = parseFloat(value)
  if (num > 0) return 'up'
  if (num < 0) return 'down'
  return ''
}
</script>

<template>
  <div class="fund-search">
    <div class="search-bar">
      <input
        v-model="keyword"
        placeholder="输入基金代码、名称或类型搜索..."
        autofocus
      />
    </div>

    <div v-if="loading" class="status">加载基金列表中...</div>
    <div v-else-if="error" class="status error">{{ error }}</div>

    <ul v-else-if="filteredFunds.length" class="fund-list">
      <li v-for="f in filteredFunds" :key="f.code" class="fund-item">
        <div class="fund-info">
          <span class="fund-code">{{ f.code }}</span>
          <span class="fund-name">{{ f.name }}</span>
          <span class="fund-type">{{ f.type }}</span>
        </div>
        <div class="fund-actions">
          <button class="valuation-btn" @click="showValuation(f)">估值</button>
          <button class="trend-btn" @click="trendFund = f">查看趋势</button>
          <button
            :class="{ added: isWatched(f.code) }"
            :disabled="isWatched(f.code)"
            @click="addFund(f)"
          >
            {{ isWatched(f.code) ? '已添加' : '加自选' }}
          </button>
        </div>
      </li>
    </ul>
    <div v-else-if="keyword" class="status">未找到匹配的基金</div>
    <div v-else class="status hint">暂无基金数据</div>

    <div v-if="valuationFund" class="valuation-modal" @click.self="valuationFund = null">
      <div class="valuation-content">
        <div class="valuation-header">
          <span class="title">{{ valuationFund.code }} {{ valuationFund.name }}</span>
          <button class="close-btn" @click="valuationFund = null">×</button>
        </div>
        <div v-if="valuations[valuationFund.code]" class="valuation-body">
          <div class="val-row">
            <span class="label">实时估值</span>
            <span class="value up">{{ valuations[valuationFund.code].estimatedValue.toFixed(4) }}</span>
          </div>
          <div class="val-row">
            <span class="label">涨跌幅</span>
            <span
              class="value"
              :class="getChangeClass(valuations[valuationFund.code].estimatedChange)"
            >{{ valuations[valuationFund.code].estimatedChange }}%</span>
          </div>
          <div class="val-row">
            <span class="label">单位净值</span>
            <span class="value">{{ valuations[valuationFund.code].netValue.toFixed(4) }}</span>
          </div>
          <div class="val-row">
            <span class="label">净值日期</span>
            <span class="value">{{ valuations[valuationFund.code].netValueDate }}</span>
          </div>
          <div class="val-row">
            <span class="label">更新时间</span>
            <span class="value">{{ valuations[valuationFund.code].updateTime }}</span>
          </div>
        </div>
        <div v-else class="loading">加载估值中...</div>
      </div>
    </div>

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
.search-bar {
  margin-bottom: 16px;
}

.search-bar input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.search-bar input:focus {
  border-color: #409eff;
}

.status {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.status.error {
  color: #e74c3c;
}

.status.hint {
  color: #bbb;
}

.fund-list {
  list-style: none;
}

.fund-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.fund-info {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  min-width: 0;
}

.fund-code {
  color: #409eff;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  flex-shrink: 0;
}

.fund-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fund-type {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
}

.fund-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.fund-actions button {
  padding: 4px 10px;
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

.fund-actions button:hover:not(:disabled) {
  background: #409eff;
  color: #fff;
}

.fund-actions button.added {
  border-color: #ddd;
  color: #999;
  background: #f5f5f5;
  cursor: default;
}

.valuation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.valuation-content {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.valuation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.valuation-header .title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #eee;
}

.valuation-body {
  padding: 16px;
}

.val-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.val-row:last-child {
  border-bottom: none;
}

.val-row .label {
  color: #888;
  font-size: 14px;
}

.val-row .value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.val-row .value.up {
  color: #e74c3c;
}

.val-row .value.down {
  color: #27ae60;
}

.loading {
  text-align: center;
  padding: 30px;
  color: #999;
}

@media (max-width: 640px) {
  .fund-item {
    padding: 10px 12px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .fund-info {
    gap: 6px;
    width: 100%;
  }

  .fund-code {
    font-size: 13px;
  }

  .fund-name {
    font-size: 13px;
  }

  .fund-type {
    display: none;
  }

  .fund-actions {
    margin-left: auto;
  }

  .fund-actions button {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
