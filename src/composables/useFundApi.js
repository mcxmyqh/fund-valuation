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
