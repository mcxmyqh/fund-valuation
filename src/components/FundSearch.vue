<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchFundList } from '../composables/useFundApi.js'
import { useWatchlist } from '../composables/useWatchlist.js'

const { addFund, isWatched } = useWatchlist()

const funds = ref([])
const keyword = ref('')
const loading = ref(true)
const error = ref('')

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
        <button
          :class="{ added: isWatched(f.code) }"
          :disabled="isWatched(f.code)"
          @click="addFund(f)"
        >
          {{ isWatched(f.code) ? '已添加' : '加自选' }}
        </button>
      </li>
    </ul>
    <div v-else-if="keyword" class="status">未找到匹配的基金</div>
    <div v-else class="status hint">暂无基金数据</div>
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

button {
  padding: 6px 14px;
  border: 1px solid #409eff;
  background: #fff;
  color: #409eff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: #409eff;
  color: #fff;
}

button.added {
  border-color: #ddd;
  color: #999;
  background: #f5f5f5;
  cursor: default;
}

@media (max-width: 640px) {
  .fund-item {
    padding: 10px 12px;
  }

  .fund-info {
    gap: 6px;
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

  button {
    padding: 8px 14px;
    font-size: 14px;
  }
}
</style>
