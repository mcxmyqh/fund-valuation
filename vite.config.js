const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')

module.exports = defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/fund-list': {
        target: 'http://fund.eastmoney.com',
        changeOrigin: true,
        rewrite: p => p.replace('/api/fund-list', '/js/fundcode_search.js'),
      },
      '/api/fundgz': {
        target: 'http://fundgz.1234567.com.cn',
        changeOrigin: true,
        rewrite: p => p.replace('/api/fundgz', ''),
      },
      '/api/fund-holdings': {
        target: 'https://fundf10.eastmoney.com',
        changeOrigin: true,
        rewrite: p => p.replace('/api/fund-holdings', '/FundArchivesDatas.aspx'),
      },
      '/api/watchlist': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/api/fund-nav-history': {
        target: 'https://fundf10.eastmoney.com',
        changeOrigin: true,
        rewrite: p => p.replace('/api/fund-nav-history', '/F10DataApi.aspx'),
      },
    },
  },
})
