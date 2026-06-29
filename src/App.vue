<script setup>
import { ref, watch } from 'vue'
import FundSearch from './components/FundSearch.vue'
import Watchlist from './components/Watchlist.vue'

const saved = localStorage.getItem('fund-active-tab')
const activeTab = ref(saved === 'search' ? 'search' : 'watchlist')
watch(activeTab, v => localStorage.setItem('fund-active-tab', v))
</script>

<template>
  <div class="app">
    <header>
      <h1>基金估值</h1>
      <nav>
        <button
          :class="{ active: activeTab === 'watchlist' }"
          @click="activeTab = 'watchlist'"
        >我的自选</button>
        <button
          :class="{ active: activeTab === 'search' }"
          @click="activeTab = 'search'"
        >基金搜索</button>
      </nav>
    </header>
    <main>
      <FundSearch v-if="activeTab === 'search'" />
      <Watchlist v-else />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

header h1 {
  font-size: 24px;
  margin-bottom: 12px;
}

nav {
  display: flex;
  gap: 8px;
  justify-content: center;
}

nav button {
  padding: 8px 24px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

nav button.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

@media (max-width: 640px) {
  .app {
    padding: 12px;
  }

  header h1 {
    font-size: 20px;
    margin-bottom: 10px;
  }

  nav button {
    flex: 1;
    padding: 10px 12px;
    font-size: 14px;
  }
}
</style>
