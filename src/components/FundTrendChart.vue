<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchFundNavHistory } from '../composables/useFundApi.js'

const props = defineProps({
  fundCode: String,
  fundName: String,
})

const emit = defineEmits(['close'])

const data = ref([])
const loading = ref(true)
const error = ref('')

const W = 600
const H = 280
const PAD = { top: 20, right: 16, bottom: 30, left: 50 }

const chartW = computed(() => W - PAD.left - PAD.right)
const chartH = computed(() => H - PAD.top - PAD.bottom)

const minVal = computed(() => data.value.length ? Math.min(...data.value.map(d => d.nav)) : 0)
const maxVal = computed(() => data.value.length ? Math.max(...data.value.map(d => d.nav)) : 0)
const range = computed(() => maxVal.value - minVal.value || 1)

function x(i) {
  return PAD.left + (i / (data.value.length - 1 || 1)) * chartW.value
}

function y(v) {
  return PAD.top + chartH.value - ((v - minVal.value) / range.value) * chartH.value
}

function path() {
  return data.value.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.nav)}`).join(' ')
}

function areaPath() {
  const baseline = PAD.top + chartH.value
  const p = data.value.map((d, i) => `${x(i)},${y(d.nav)}`).join('L')
  return `M${x(0)},${baseline}L${p}L${x(data.value.length - 1)},${baseline}Z`
}

function yTicks() {
  const ticks = 5
  const step = range.value / ticks
  return Array.from({ length: ticks + 1 }, (_, i) => {
    const v = minVal.value + step * i
    return { v, y: y(v), label: v.toFixed(4) }
  })
}

function xLabels() {
  if (!data.value.length) return []
  const step = Math.max(1, Math.floor(data.value.length / 6))
  const indices = []
  for (let i = 0; i < data.value.length; i += step) indices.push(i)
  if (indices[indices.length - 1] !== data.value.length - 1) indices.push(data.value.length - 1)
  return indices.map(i => ({ i, label: data.value[i].date.slice(5) }))
}

onMounted(async () => {
  try {
    data.value = await fetchFundNavHistory(props.fundCode)
  } catch {
    error.value = '加载走势数据失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ fundName }}（{{ fundCode }}）— 近半年净值走势</h3>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="status">加载中...</div>
        <div v-else-if="error" class="status error">{{ error }}</div>
        <div v-else-if="data.length" class="chart-wrap">
          <svg :viewBox="`0 0 ${W} ${H}`" class="chart">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#409eff" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#409eff" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            <line
              v-for="t in yTicks()" :key="t.v"
              :x1="PAD.left" :y1="t.y" :x2="W - PAD.right" :y2="t.y"
              stroke="#eee" stroke-width="1"
            />
            <text
              v-for="t in yTicks()" :key="t.v"
              :x="PAD.left - 6" :y="t.y + 4"
              text-anchor="end" fill="#999" font-size="11"
            >{{ t.label }}</text>
            <text
              v-for="l in xLabels()" :key="l.i"
              :x="x(l.i)" :y="H - 6"
              text-anchor="middle" fill="#999" font-size="11"
            >{{ l.label }}</text>
            <path :d="areaPath()" fill="url(#areaGrad)" />
            <path :d="path()" fill="none" stroke="#409eff" stroke-width="2" stroke-linejoin="round" />
            <circle
              v-for="(d, i) in data" :key="d.date"
              :cx="x(i)" :cy="y(d.nav)" r="3" fill="#409eff"
            >
              <title>{{ d.date }} {{ d.nav.toFixed(4) }}</title>
            </circle>
          </svg>
        </div>
        <div v-else class="status">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 680px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0 4px;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 16px;
  overflow: hidden;
}

.chart-wrap {
  width: 100%;
  overflow-x: auto;
}

.chart {
  width: 100%;
  height: auto;
  display: block;
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

@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal {
    max-height: 85vh;
    border-radius: 12px 12px 0 0;
  }

  .modal-header {
    padding: 14px 16px;
  }

  .modal-header h3 {
    font-size: 14px;
  }

  .close-btn {
    font-size: 28px;
    padding: 4px 8px;
  }

  .modal-body {
    padding: 12px;
  }
}
</style>
