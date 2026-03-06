// services/brapi.js — cotações via BRAPI (plano gratuito: 1 ticker por req)
// Estratégia: cache longo (30min cotação, 24h fundamentals) + 1 req/ticker
// 15.000 req/mês = ~500/dia = suficiente para ~30 tickers únicos com refresh 30min

const fetch = require('node-fetch');
const { get, set } = require('../cache');

const BASE_URL = 'https://brapi.dev/api';

const TTL = {
  QUOTE:      30 * 60,       // 30 min — cotação
  HISTORY:    60 * 60,       // 1h — histórico diário
  HISTORY_5D: 15 * 60,       // 15min — intraday
  DIVIDENDS:  24 * 60 * 60,  // 24h — dividendos
};

// Fetch simples com retry
async function brapiGet(path, retries) {
  retries = retries || 1;
  const token = process.env.BRAPI_TOKEN;
  if (!token) throw new Error('BRAPI_TOKEN não configurado no Railway');

  const sep = path.includes('?') ? '&' : '?';
  const url = BASE_URL + path + sep + 'token=' + token;

  for (var attempt = 0; attempt <= retries; attempt++) {
    try {
      var res = await fetch(url, { timeout: 10000 });
      if (res.status === 429) throw new Error('BRAPI rate limit atingido');
      if (!res.ok) throw new Error('BRAPI HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(function(r){ setTimeout(r, 600 * (attempt + 1)); });
    }
  }
}

function normalize(raw) {
  return {
    ticker:        raw.symbol,
    name:          raw.longName || raw.shortName || raw.symbol,
    shortName:     raw.shortName || raw.symbol,
    price:         raw.regularMarketPrice          || 0,
    change:        raw.regularMarketChange         || 0,
    changePercent: raw.regularMarketChangePercent  || 0,
    open:          raw.regularMarketOpen           || 0,
    high:          raw.regularMarketDayHigh        || 0,
    low:           raw.regularMarketDayLow         || 0,
    previousClose: raw.regularMarketPreviousClose  || 0,
    volume:        raw.regularMarketVolume         || 0,
    week52High:    raw.fiftyTwoWeekHigh            || 0,
    week52Low:     raw.fiftyTwoWeekLow             || 0,
    marketCap:     raw.marketCap                   || 0,
    sharesOutstanding: raw.sharesOutstanding       || 0,
    pl:            raw.priceEarnings    != null ? raw.priceEarnings    : null,
    lpa:           raw.earningsPerShare != null ? raw.earningsPerShare : null,
    pvp:           raw.priceToBook      != null ? raw.priceToBook      : null,
    vpa:           raw.bookValue        != null ? raw.bookValue        : null,
    dy:            raw.dividendYield    != null ? raw.dividendYield / 100 : null,
    roe:           raw.returnOnEquity   != null ? raw.returnOnEquity   : null,
    roa:           raw.returnOnAssets   != null ? raw.returnOnAssets   : null,
    profitMargin:  raw.profitMargins    != null ? raw.profitMargins    : null,
    currency:      raw.currency || 'BRL',
    updatedAt:     new Date().toISOString(),
  };
}

// 1 ticker por requisição — respeita plano free
async function getOneTicker(ticker) {
  var key = 'q1:' + ticker;
  var cached = get(key);
  if (cached) return cached;

  var data = await brapiGet('/quote/' + ticker + '?fundamental=true');
  var result = data.results && data.results[0];
  if (!result) throw new Error('Ticker ' + ticker + ' não encontrado');

  var normalized = normalize(result);
  set(key, normalized, TTL.QUOTE);
  return normalized;
}

// Múltiplos tickers: 1 req cada, paralelo com limite de 8 simultâneos
async function getQuote(tickers) {
  var list = Array.isArray(tickers)
    ? tickers
    : String(tickers).split(',').map(function(t){ return t.trim().toUpperCase(); });

  var CONCURRENCY = 8;
  var results = [];

  for (var i = 0; i < list.length; i += CONCURRENCY) {
    var chunk = list.slice(i, i + CONCURRENCY);
    var settled = await Promise.allSettled(chunk.map(function(t){ return getOneTicker(t); }));
    settled.forEach(function(r){ if (r.status === 'fulfilled') results.push(r.value); });
  }

  return results;
}

async function getHistory(ticker, range, interval) {
  range = range || '1mo';
  interval = interval || '1d';
  var key = 'hist:' + ticker + ':' + range + ':' + interval;
  var cached = get(key);
  if (cached) return cached;

  var data = await brapiGet('/quote/' + ticker + '?range=' + range + '&interval=' + interval + '&history=true');
  var history = (data.results && data.results[0] && data.results[0].historicalDataPrice) || [];
  var ttl = (range === '1d' || range === '5d') ? TTL.HISTORY_5D : TTL.HISTORY;
  set(key, history, ttl);
  return history;
}

async function getDividends(ticker) {
  var key = 'div:' + ticker;
  var cached = get(key);
  if (cached) return cached;

  var data = await brapiGet('/quote/' + ticker + '?dividends=true');
  var dividends = (data.results && data.results[0] && data.results[0].dividendsData && data.results[0].dividendsData.cashDividends) || [];
  set(key, dividends, TTL.DIVIDENDS);
  return dividends;
}

async function getAvailableTickers() {
  var key = 'avail';
  var cached = get(key);
  if (cached) return cached;

  var data = await brapiGet('/available');
  var tickers = data.stocks || [];
  set(key, tickers, 24 * 60 * 60);
  return tickers;
}

module.exports = { getQuote, getOneTicker, getHistory, getDividends, getAvailableTickers };
