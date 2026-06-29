const FUND_LIST_URL = '/api/fund-list'

let fundListCache = null

export async function fetchFundList() {
  if (fundListCache) return fundListCache
  const text = await fetch(FUND_LIST_URL).then(r => r.text())
  const match = text.match(/var\s+\w+\s*=\s*(\[[\s\S]*\]);/)
  if (!match) throw new Error('Failed to parse fund list')
  const raw = JSON.parse(match[1])
  fundListCache = raw.map(([code, , name, type]) => ({ code, name, type }))
  return fundListCache
}

const HOLDINGS_URL = '/api/fund-holdings'

export async function fetchFundHoldings(code) {
  const url = `${HOLDINGS_URL}?type=jjcc&code=${code}&topline=10`
  const text = await fetch(url).then(r => r.text())
  const match = text.match(/content\s*:\s*"([\s\S]*?)",\s*arryear/)
  if (!match) throw new Error('Failed to parse holdings data')
  const html = match[1]
  const rows = []
  const trRegex = /<tr>(.*?)<\/tr>/g
  let trMatch
  while ((trMatch = trRegex.exec(html)) !== null) {
    const tds = trMatch[1].match(/<td[^>]*>([\s\S]*?)<\/td>/g)
    if (!tds || tds.length < 9) continue
    const order = tds[0].replace(/<[^>]+>/g, '').trim()
    if (!order || !/^\d+$/.test(order)) continue
    const stockCode = (tds[1].match(/<a[^>]*>([\s\S]*?)<\/a>/) || [,''])[1]
    const stockName = (tds[2].match(/<a[^>]*>([\s\S]*?)<\/a>/) || [,''])[1]
    const ratio = tds[6].replace(/<[^>]+>/g, '').trim()
    const shares = tds[7].replace(/<[^>]+>/g, '').trim()
    const marketValue = tds[8].replace(/<[^>]+>/g, '').trim()
    rows.push({ order, stockCode, stockName, ratio, shares, marketValue })
  }
  return rows
}

function parseNavTable(html) {
  const rows = []
  const trRegex = /<tr>(.*?)<\/tr>/g
  let trMatch
  while ((trMatch = trRegex.exec(html)) !== null) {
    const tds = trMatch[1].match(/<td[^>]*>([\s\S]*?)<\/td>/g)
    if (!tds || tds.length < 3) continue
    const date = tds[0].replace(/<[^>]+>/g, '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    const nav = parseFloat(tds[1].replace(/<[^>]+>/g, '').trim())
    const accNav = parseFloat(tds[2].replace(/<[^>]+>/g, '').trim())
    rows.push({ date, nav, accNav })
  }
  return rows
}

export async function fetchFundNavHistory(code) {
  const today = new Date()
  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sdate = sixMonthsAgo.toISOString().slice(0, 10)
  const edate = today.toISOString().slice(0, 10)
  const baseUrl = `/api/fund-nav-history?type=lsjz&code=${code}&sdate=${sdate}&edate=${edate}`

  const text = await fetch(`${baseUrl}&page=1`).then(r => r.text())
  const match = text.match(/content\s*:\s*"([\s\S]*?)",\s*records:(\d+),pages:(\d+),curpage:(\d+)/)
  if (!match) throw new Error('Failed to parse NAV history')
  const allRows = parseNavTable(match[1])
  const totalPages = parseInt(match[3])
  const totalRecords = parseInt(match[2])

  if (totalPages > 1 && allRows.length < totalRecords) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        fetch(`${baseUrl}&page=${i + 2}`).then(r => r.text())
      )
    )
    for (const t of rest) {
      const m = t.match(/content\s*:\s*"([\s\S]*?)",\s*records/)
      if (m) allRows.push(...parseNavTable(m[1]))
    }
  }

  return allRows.reverse()
}

export async function fetchFundValuation(code) {
  const url = `/api/fundgz/js/${code}.js?rt=${Date.now()}`
  const text = await fetch(url).then(r => r.text())
  const jsonStr = text.replace(/^jsonpgz\(/, '').replace(/\);$/, '')
  const data = JSON.parse(jsonStr)
  return {
    code: data.fundcode,
    name: data.name,
    estimatedValue: parseFloat(data.gsz),
    estimatedChange: data.gszzl,
    netValue: parseFloat(data.dwjz),
    netValueDate: data.jzrq,
    updateTime: data.gztime,
  }
}
