// services/brapi.js — cotações e fundamentalistas via BRAPI
// Documentação: https://brapi.dev/docs

const fetch = require('node-fetch');
const { get, set, TTL } = require('../cache');

const BASE_URL = 'https://brapi.dev/api';

// Campos fundamentalistas que a BRAPI retorna
const FUNDAMENTAL_FIELDS = [
'longName',
'shortName',
'regularMarketPrice',
'regularMarketChange',
'regularMarketChangePercent',
'regularMarketDayHigh',
'regularMarketDayLow',
'regularMarketVolume',
'regularMarketOpen',
'regularMarketPreviousClose',
'fiftyTwoWeekLow',
'fiftyTwoWeekHigh',
'marketCap',
'sharesOutstanding',
'priceEarnings',
'earningsPerShare',
'dividendYield'
].join(',');

/**
 * Busca cotação e indicadores de um ou mais tickers
 * @param {string|string[]} tickers - ex: 'BBAS3' ou ['BBAS3','PETR4']
 */
async function getQuote(tickers) {
  const tickerList = Array.isArray(tickers) ? tickers.join(',') : tickers;
  const cacheKey = `quote:${tickerList}`;

  const cached = get(cacheKey);
  if (cached) return cached;

  const token = process.env.BRAPI_TOKEN;

  const url = `${BASE_URL}/quote/${tickerList}?token=${token}&fundamental=true`;

  try {
    const res = await fetch(url, { timeout: 8000 });
    if (!res.ok) throw new Error(`BRAPI HTTP ${res.status}`);

    const data = await res.json();

    if (!data.results || !data.results.length) {
      throw new Error('Nenhum resultado retornado pela BRAPI');
    }

    // Normaliza os dados para o formato do front-end
    const normalized = data.results.map(normalizeQuote);

    set(cacheKey, normalized, TTL.QUOTE);
    return normalized;

  } catch (err) {
    console.error(`[BRAPI] Erro ao buscar ${tickerList}:`, err.message);
    throw err;
  }
}

/**
 * Busca histórico de preços para o gráfico
 * @param {string} ticker
 * @param {string} range - '1d','5d','1mo','3mo','6mo','1y','2y','5y','10y','ytd','max'
 * @param {string} interval - '1m','2m','5m','15m','30m','60m','90m','1h','1d','5d','1wk','1mo','3mo'
 */
async function getHistory(ticker, range = '1mo', interval = '1d') {
  const cacheKey = `history:${ticker}:${range}:${interval}`;

  const cached = get(cacheKey);
  if (cached) return cached;

  const token = process.env.BRAPI_TOKEN;
  const url = `${BASE_URL}/quote/${ticker}?token=${token}&range=${range}&interval=${interval}&history=true`;

  try {
    const res = await fetch(url, { timeout: 8000 });
    if (!res.ok) throw new Error(`BRAPI HTTP ${res.status}`);

    const data = await res.json();
    const history = data.results?.[0]?.historicalDataPrice || [];

    // TTL menor para histórico intraday
    const ttl = range === '1d' ? 5 * 60 : 30 * 60;
    set(cacheKey, history, ttl);

    return history;

  } catch (err) {
    console.error(`[BRAPI] Erro ao buscar histórico de ${ticker}:`, err.message);
    throw err;
  }
}

/**
 * Busca dividendos de um ticker
 */
async function getDividends(ticker) {
  const cacheKey = `dividends:${ticker}`;

  const cached = get(cacheKey);
  if (cached) return cached;

  const token = process.env.BRAPI_TOKEN;
  const url = `${BASE_URL}/quote/${ticker}?token=${token}&dividends=true`;

  try {
    const res = await fetch(url, { timeout: 8000 });
    if (!res.ok) throw new Error(`BRAPI HTTP ${res.status}`);

    const data = await res.json();
    const dividends = data.results?.[0]?.dividendsData?.cashDividends || [];

    set(cacheKey, dividends, TTL.FUNDAMENTALS);
    return dividends;

  } catch (err) {
    console.error(`[BRAPI] Erro ao buscar dividendos de ${ticker}:`, err.message);
    throw err;
  }
}

/**
 * Busca lista de todos os tickers disponíveis na B3
 */
async function getAvailableTickers() {
  const cacheKey = 'available_tickers';

  const cached = get(cacheKey);
  if (cached) return cached;

  const token = process.env.BRAPI_TOKEN;
  const url = `${BASE_URL}/available?token=${token}`;

  try {
    const res = await fetch(url, { timeout: 10000 });
    if (!res.ok) throw new Error(`BRAPI HTTP ${res.status}`);

    const data = await res.json();
    const tickers = data.stocks || [];

    set(cacheKey, tickers, TTL.TICKERS_LIST);
    return tickers;

  } catch (err) {
    console.error('[BRAPI] Erro ao buscar lista de tickers:', err.message);
    throw err;
  }
}

/**
 * Normaliza os dados crus da BRAPI para o formato do front-end
 */
function normalizeQuote(raw) {
  return {
    ticker: raw.symbol,
    name: raw.longName || raw.shortName || raw.symbol,
    shortName: raw.shortName,

    // Preço
    price: raw.regularMarketPrice || 0,
    change: raw.regularMarketChange || 0,
    changePercent: raw.regularMarketChangePercent || 0,
    open: raw.regularMarketOpen || 0,
    high: raw.regularMarketDayHigh || 0,
    low: raw.regularMarketDayLow || 0,
    previousClose: raw.regularMarketPreviousClose || 0,
    volume: raw.regularMarketVolume || 0,

    // 52 semanas
    week52High: raw.fiftyTwoWeekHigh || 0,
    week52Low: raw.fiftyTwoWeekLow || 0,

    // Empresa
    marketCap: raw.marketCap || 0,
    sharesOutstanding: raw.sharesOutstanding || 0,

    // Indicadores fundamentalistas
    pl: raw.priceEarnings || null,
    lpa: raw.earningsPerShare || null,
    pvp: raw.priceToBook || null,
    vpa: raw.bookValue || null,
    dy: raw.dividendYield ? raw.dividendYield / 100 : null,
    roe: raw.returnOnEquity || null,
    roa: raw.returnOnAssets || null,
    profitMargin: raw.profitMargins || null,

    // Metadados
    currency: raw.currency || 'BRL',
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { getQuote, getHistory, getDividends, getAvailableTickers };
