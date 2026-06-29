<script setup>
import { ref } from 'vue'
import { fetchFundHoldings } from '../composables/useFundApi.js'

const props = defineProps({
  fundCode: String,
  fundName: String,
})

const emit = defineEmits(['close'])

const holdings = ref([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    holdings.value = await fetchFundHoldings(props.fundCode)
  } catch (e) {
    error.value = '加载成分股失败'
  } finally {
    loading.value = false
  }
}

load()
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ fundName }}（{{ fundCode }}）</h3>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>
      <div v-if="loading" class="modal-body status">加载中...</div>
      <div v-else-if="error" class="modal-body status error">{{ error }}</div>
      <div v-else class="modal-body">
        <div class="table-wrap" v-if="holdings.length">
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>股票代码</th>
                <th>股票名称</th>
                <th>占净值比例</th>
                <th>持股数(万股)</th>
                <th>持仓市值(万元)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in holdings" :key="h.order">
                <td>{{ h.order }}</td>
                <td>{{ h.stockCode }}</td>
                <td>{{ h.stockName }}</td>
                <td>{{ h.ratio }}</td>
                <td>{{ h.shares }}</td>
                <td>{{ h.marketValue }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="modal-body status">暂无成分股数据</div>
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
  max-width: 700px;
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
  font-size: 16px;
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
  padding: 16px 20px;
  overflow-y: auto;
}

.modal-body.status {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.modal-body.status.error {
  color: #e74c3c;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  background: #f5f7fa;
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: #666;
  border-bottom: 2px solid #e8ecf1;
  white-space: nowrap;
}

td {
  padding: 10px 8px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

tr:hover td {
  background: #fafbfc;
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
    font-size: 15px;
  }

  .close-btn {
    font-size: 28px;
    padding: 4px 8px;
  }

  .modal-body {
    padding: 12px 14px;
  }

  .table-wrap {
    overflow-x: auto;
    margin: 0 -14px;
    padding: 0 14px;
  }

  th, td {
    padding: 8px 6px;
    font-size: 12px;
    white-space: nowrap;
  }

  th:first-child, td:first-child {
    padding-left: 0;
  }

  th:last-child, td:last-child {
    padding-right: 0;
  }
}
</style>
