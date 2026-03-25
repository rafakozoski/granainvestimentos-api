// services/coingecko.js — dados de criptomoedas via CoinGecko API (plano free/demo)
// Free: ~10-30 req/min sem key | Demo key gratuita: 30 req/min, 10K req/mês
// TTLs agressivos para manter dentro dos limites

const fetch = require('node-fetch');
const { get, set } = require('../cache');

const BASE_URL = 'https://api.coingecko.com/api/v3';

const TTL = {
  PRICES:  15 * 60,        // 15 min — preços e variações
  HISTORY:  2 * 60 * 60,  // 2h    — histórico para gráfico
  DETAIL:   6 * 60 * 60,  // 6h    — descrição, links, ATH/ATL
  GLOBAL:  15 * 60,        // 15 min — market cap total, dominância
};

// Mapa: ticker → CoinGecko ID (top ~60 por market cap, excluindo stablecoins e RWAs)
const TICKER_TO_ID = {
  // Layer 1 — Prova de Trabalho
  'BTC-USD':    'bitcoin',
  'ETH-USD':    'ethereum',
  'DOGE-USD':   'dogecoin',
  'LTC-USD':    'litecoin',
  'BCH-USD':    'bitcoin-cash',
  'XMR-USD':    'monero',
  'ZEC-USD':    'zcash',
  'ETC-USD':    'ethereum-classic',
  'KAS-USD':    'kaspa',
  // Layer 1 — Smart Contracts / PoS
  'SOL-USD':    'solana',
  'BNB-USD':    'binancecoin',
  'XRP-USD':    'ripple',
  'ADA-USD':    'cardano',
  'TRX-USD':    'tron',
  'TON-USD':    'the-open-network',
  'AVAX-USD':   'avalanche-2',
  'DOT-USD':    'polkadot',
  'HBAR-USD':   'hedera-hashgraph',
  'SUI-USD':    'sui',
  'NEAR-USD':   'near',
  'APT-USD':    'aptos',
  'ALGO-USD':   'algorand',
  'XLM-USD':    'stellar',
  'ICP-USD':    'internet-computer',
  'VET-USD':    'vechain',
  'XDC-USD':    'xdce-crowd-sale',
  'FLR-USD':    'flare-networks',
  'PI-USD':     'pi-network',
  // Layer 2
  'MATIC-USD':  'matic-network',
  'POL-USD':    'polygon-ecosystem-token',
  'MNT-USD':    'mantle',
  'ARB-USD':    'arbitrum',
  // DeFi
  'LINK-USD':   'chainlink',
  'UNI-USD':    'uniswap',
  'AAVE-USD':   'aave',
  'ATOM-USD':   'cosmos',
  'RENDER-USD': 'render-token',
  'FET-USD':    'fetch-ai',
  'TAO-USD':    'bittensor',
  'HYPE-USD':   'hyperliquid',
  'ENA-USD':    'ethena',
  'MORPHO-USD': 'morpho',
  'ONDO-USD':   'ondo-finance',
  'JUP-USD':    'jupiter-exchange-solana',
  'SKY-USD':    'sky',
  'JST-USD':    'just',
  // Armazenamento / Infra
  'FIL-USD':    'filecoin',
  'QNT-USD':    'quant-network',
  'ZRO-USD':    'layerzero',
  // Exchange Tokens
  'BGB-USD':    'bitget-token',
  'OKB-USD':    'okb',
  'GT-USD':     'gatechain-token',
  'KCS-USD':    'kucoin-shares',
  'LEO-USD':    'leo-token',
  'CRO-USD':    'crypto-com-chain',
  'NEXO-USD':   'nexo',
  // Meme
  'SHIB-USD':   'shiba-inu',
  'PEPE-USD':   'pepe',
  'BONK-USD':   'bonk',
  'TRUMP-USD':  'official-trump',
  // Outros
  'WLD-USD':    'worldcoin-wld',
};

// Mapa inverso: CoinGecko ID → ticker
const ID_TO_TICKER = {};
Object.keys(TICKER_TO_ID).forEach(function(tk) {
  ID_TO_TICKER[TICKER_TO_ID[tk]] = tk;
});

function resolveId(ticker) {
  return TICKER_TO_ID[ticker.toUpperCase()] || null;
}

// Fetch com retry e backoff para rate limit
async function geckoGet(path, retries) {
  retries = retries != null ? retries : 2;
  const key = process.env.COINGECKO_DEMO_KEY;
  const sep = path.includes('?') ? '&' : '?';
  const url = BASE_URL + path + (key ? sep + 'x_cg_demo_api_key=' + key : '');

  for (var attempt = 0; attempt <= retries; attempt++) {
    try {
      var res = await fetch(url, { timeout: 12000 });
      if (res.status === 429) {
        console.warn('[CoinGecko] Rate limit atingido, aguardando...');
        await new Promise(function(r) { setTimeout(r, 2000 * (attempt + 1)); });
        continue;
      }
      if (!res.ok) throw new Error('CoinGecko HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(function(r) { setTimeout(r, 800 * (attempt + 1)); });
    }
  }
}

// Normaliza item do /coins/markets para shape interno
function normalizeMarket(raw) {
  const ticker = ID_TO_TICKER[raw.id] || (raw.symbol.toUpperCase() + '-USD');
  const pc = raw.price_change_percentage_1h_in_currency;
  const pc24 = raw.price_change_percentage_24h_in_currency != null
    ? raw.price_change_percentage_24h_in_currency
    : raw.price_change_percentage_24h;
  const pc7 = raw.price_change_percentage_7d_in_currency;
  const pc30 = raw.price_change_percentage_30d_in_currency;
  const pc1y = raw.price_change_percentage_1y_in_currency;

  return {
    ticker,
    coinGeckoId:       raw.id,
    name:              raw.name,
    symbol:            raw.symbol ? raw.symbol.toUpperCase() : '',
    image:             raw.image || null,
    price:             raw.current_price           || 0,
    change24h:         raw.price_change_24h        || 0,
    changePct24h:      pc24                        || 0,
    changePct1h:       pc  != null ? pc  : null,
    changePct7d:       pc7 != null ? pc7 : null,
    changePct30d:      pc30!= null ? pc30: null,
    changePct1y:       pc1y!= null ? pc1y: null,
    high24h:           raw.high_24h                || 0,
    low24h:            raw.low_24h                 || 0,
    volume24h:         raw.total_volume            || 0,
    marketCap:         raw.market_cap              || 0,
    marketCapRank:     raw.market_cap_rank         || null,
    circulatingSupply: raw.circulating_supply      || null,
    totalSupply:       raw.total_supply            || null,
    maxSupply:         raw.max_supply              || null,
    ath:               raw.ath                     || null,
    athDate:           raw.ath_date                || null,
    atl:               raw.atl                     || null,
    atlDate:           raw.atl_date                || null,
    week52High:        raw.high_24h                || null, // fallback (CG não tem 52w direto)
    week52Low:         raw.low_24h                 || null,
    updatedAt:         raw.last_updated            || new Date().toISOString(),
  };
}

// Retorna dados de mercado em batch para uma lista de geckoIds
async function getMarkets(geckoIds) {
  if (!geckoIds || !geckoIds.length) return [];

  var results = [];
  var toFetch = [];

  geckoIds.forEach(function(id) {
    var cached = get('cgmkt:' + id);
    if (cached) { results.push(cached); }
    else { toFetch.push(id); }
  });

  if (toFetch.length) {
    var data = await geckoGet(
      '/coins/markets?vs_currency=usd' +
      '&ids=' + toFetch.join(',') +
      '&order=market_cap_desc' +
      '&per_page=50&page=1' +
      '&sparkline=false' +
      '&price_change_percentage=1h%2C24h%2C7d%2C30d%2C1y'
    );
    if (Array.isArray(data)) {
      data.forEach(function(raw) {
        var normalized = normalizeMarket(raw);
        set('cgmkt:' + raw.id, normalized, TTL.PRICES);
        results.push(normalized);
      });
    }
  }

  return results;
}

// Retorna dados detalhados de uma moeda (descrição, links, ATH/ATL estendido)
async function getCoinDetail(geckoId) {
  var cacheKey = 'cgdet:' + geckoId;
  var cached = get(cacheKey);
  if (cached) return cached;

  var raw = await geckoGet(
    '/coins/' + geckoId +
    '?localization=true&tickers=false&market_data=false' +
    '&community_data=false&developer_data=false&sparkline=false'
  );

  // Strip HTML tags da descrição — prefere PT, cai em EN
  var desc = (raw.description && (raw.description.pt || raw.description['pt-br'] || raw.description.en)) || '';
  desc = desc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (desc.length > 1200) desc = desc.slice(0, 1200) + '...';

  var links = raw.links || {};
  var detail = {
    coinGeckoId: geckoId,
    description: desc,
    website:     (links.homepage && links.homepage[0]) || null,
    whitepaper:  links.whitepaper || null,
    explorer:    (links.blockchain_site && links.blockchain_site[0]) || null,
    twitter:     links.twitter_screen_name ? 'https://twitter.com/' + links.twitter_screen_name : null,
    reddit:      links.subreddit_url || null,
    github:      (links.repos_url && links.repos_url.github && links.repos_url.github[0]) || null,
    categories:  raw.categories ? raw.categories.slice(0, 5) : [],
    genesisDate: raw.genesis_date || null,
  };

  set(cacheKey, detail, TTL.DETAIL);
  return detail;
}

// Retorna histórico de preços no formato [{date, close}] — compatível com renderChart()
async function getHistory(geckoId, days) {
  days = days || 30;
  var cacheKey = 'cghist:' + geckoId + ':' + days;
  var cached = get(cacheKey);
  if (cached) return cached;

  var data = await geckoGet(
    '/coins/' + geckoId + '/market_chart' +
    '?vs_currency=usd&days=' + days
  );

  var prices = (data && data.prices) || [];

  // CoinGecko retorna [[timestamp_ms, price], ...]
  // Para dias > 1, vem com granularidade diária; para dias <= 1, horária
  // Normaliza para [{date: 'YYYY-MM-DD', close: price}] ou [{date: ISO, close}]
  var history = prices.map(function(p) {
    return {
      date:  new Date(p[0]).toISOString().slice(0, 10),
      close: p[1],
    };
  });

  // Remove duplicatas de data (para granularidade diária manter apenas último do dia)
  var seen = {};
  var deduped = [];
  history.forEach(function(h) {
    seen[h.date] = h; // sobrescreve, ficamos com o último do dia
  });
  Object.keys(seen).sort().forEach(function(d) { deduped.push(seen[d]); });

  set(cacheKey, deduped, TTL.HISTORY);
  return deduped;
}

// Retorna dados globais do mercado cripto (total market cap, dominância)
async function getGlobal() {
  var cacheKey = 'cglobal';
  var cached = get(cacheKey);
  if (cached) return cached;

  var data = await geckoGet('/global');
  var gd = (data && data.data) || {};

  var result = {
    totalMarketCap:  (gd.total_market_cap && gd.total_market_cap.usd)  || null,
    totalVolume24h:  (gd.total_volume     && gd.total_volume.usd)       || null,
    btcDominance:    gd.market_cap_percentage && gd.market_cap_percentage.btc != null
                       ? parseFloat(gd.market_cap_percentage.btc.toFixed(1)) : null,
    ethDominance:    gd.market_cap_percentage && gd.market_cap_percentage.eth != null
                       ? parseFloat(gd.market_cap_percentage.eth.toFixed(1)) : null,
    activeCryptos:   gd.active_cryptocurrencies || null,
    marketCapChange24h: gd.market_cap_change_percentage_24h_usd || null,
    updatedAt: new Date().toISOString(),
  };

  set(cacheKey, result, TTL.GLOBAL);
  return result;
}

// Wrapper conveniente: busca dados de um ticker pelo formato BTC-USD
async function getQuoteByTicker(ticker) {
  var geckoId = resolveId(ticker);
  if (!geckoId) throw new Error('Ticker cripto nao mapeado: ' + ticker);
  var markets = await getMarkets([geckoId]);
  return markets[0] || null;
}

module.exports = {
  resolveId,
  getMarkets,
  getCoinDetail,
  getHistory,
  getGlobal,
  getQuoteByTicker,
  TICKER_TO_ID,
};
