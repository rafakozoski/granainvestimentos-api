// routes/index.js — todas as rotas da API

const express = require('express');
const router = express.Router();
const brapi = require('../services/brapi');
const news = require('../services/news');
const { FEATURED_TICKERS, searchTickers, findTicker, TICKERS } = require('../data/tickers');
const { stats } = require('../cache');

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    cache: stats(),
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// HOMEPAGE — dados agregados para a home
// GET /api/home
// ─────────────────────────────────────────────
router.get('/home', async (req, res) => {
  try {
    const [quotes, marketNews] = await Promise.allSettled([
      brapi.getQuote(FEATURED_TICKERS),
      news.getMarketNews(20),
    ]);

    res.json({
      tickers: quotes.status === 'fulfilled' ? quotes.value : [],
      news: marketNews.status === 'fulfilled' ? marketNews.value : [],
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Route /home]', err.message);
    res.status(500).json({ error: 'Erro ao carregar dados da homepage' });
  }
});

// ─────────────────────────────────────────────
// COTAÇÃO — um ou múltiplos tickers
// GET /api/quote/BBAS3
// GET /api/quote/BBAS3,PETR4,VALE3
// ─────────────────────────────────────────────
router.get('/quote/:tickers', async (req, res) => {
  const { tickers } = req.params;

  // Valida formato dos tickers
  const tickerList = tickers.toUpperCase().split(',').slice(0, 20); // máx 20 por req
  const invalid = tickerList.filter(t => !/^[A-Z0-9]{4,6}$/.test(t));
  if (invalid.length) {
    return res.status(400).json({ error: `Ticker(s) inválido(s): ${invalid.join(', ')}` });
  }

  try {
    const data = await brapi.getQuote(tickerList);
    res.json({ results: data, count: data.length });
  } catch (err) {
    console.error(`[Route /quote/${tickers}]`, err.message);
    res.status(502).json({ error: 'Erro ao buscar cotação. Tente novamente em instantes.' });
  }
});

// ─────────────────────────────────────────────
// HISTÓRICO DE PREÇOS — para o gráfico
// GET /api/history/BBAS3?range=1mo&interval=1d
// ─────────────────────────────────────────────
router.get('/history/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const range = req.query.range || '1mo';
  const interval = req.query.interval || '1d';

  const validRanges = ['1d','5d','1mo','3mo','6mo','1y','2y','5y','10y','ytd','max'];
  const validIntervals = ['1m','5m','15m','30m','60m','1h','1d','1wk','1mo'];

  if (!validRanges.includes(range)) {
    return res.status(400).json({ error: `Range inválido. Use: ${validRanges.join(', ')}` });
  }
  if (!validIntervals.includes(interval)) {
    return res.status(400).json({ error: `Interval inválido. Use: ${validIntervals.join(', ')}` });
  }

  try {
    const history = await brapi.getHistory(ticker, range, interval);
    res.json({ ticker, range, interval, history, count: history.length });
  } catch (err) {
    console.error(`[Route /history/${ticker}]`, err.message);
    res.status(502).json({ error: 'Erro ao buscar histórico' });
  }
});

// ─────────────────────────────────────────────
// DIVIDENDOS
// GET /api/dividends/BBAS3
// ─────────────────────────────────────────────
router.get('/dividends/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  try {
    const dividends = await brapi.getDividends(ticker);
    res.json({ ticker, dividends, count: dividends.length });
  } catch (err) {
    console.error(`[Route /dividends/${ticker}]`, err.message);
    res.status(502).json({ error: 'Erro ao buscar dividendos' });
  }
});

// ─────────────────────────────────────────────
// NOTÍCIAS POR TICKER
// GET /api/news/BBAS3?limit=10
// ─────────────────────────────────────────────
router.get('/news/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);

  try {
    const articles = await news.getNewsByTicker(ticker, limit);
    res.json({ ticker, news: articles, count: articles.length });
  } catch (err) {
    console.error(`[Route /news/${ticker}]`, err.message);
    res.status(502).json({ error: 'Erro ao buscar notícias' });
  }
});

// ─────────────────────────────────────────────
// NOTÍCIAS DE MERCADO
// GET /api/news?limit=20
// ─────────────────────────────────────────────
router.get('/news', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  try {
    const articles = await news.getMarketNews(limit);
    res.json({ news: articles, count: articles.length });
  } catch (err) {
    console.error('[Route /news]', err.message);
    res.status(502).json({ error: 'Erro ao buscar notícias de mercado' });
  }
});

// ─────────────────────────────────────────────
// TICKER COMPLETO — cotação + notícias + meta
// GET /api/ticker/BBAS3
// ─────────────────────────────────────────────
router.get('/ticker/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const meta = findTicker(ticker);

  try {
    const [quoteResult, newsResult, dividendsResult] = await Promise.allSettled([
      brapi.getQuote(ticker),
      news.getNewsByTicker(ticker, 12),
      brapi.getDividends(ticker),
    ]);

    const quote = quoteResult.status === 'fulfilled' ? quoteResult.value?.[0] : null;

    if (!quote) {
      return res.status(404).json({ error: `Ticker ${ticker} não encontrado` });
    }

    res.json({
      ticker,
      meta: meta || { code: ticker, name: quote.name },
      quote,
      news: newsResult.status === 'fulfilled' ? newsResult.value : [],
      dividends: dividendsResult.status === 'fulfilled' ? dividendsResult.value : [],
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[Route /ticker/${ticker}]`, err.message);
    res.status(500).json({ error: 'Erro ao carregar dados do ativo' });
  }
});

// ─────────────────────────────────────────────
// BUSCA DE TICKERS (autocomplete)
// GET /api/search?q=BB
// ─────────────────────────────────────────────
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) {
    return res.json({ results: [] });
  }

  const results = searchTickers(q);
  res.json({ results, count: results.length });
});

// ─────────────────────────────────────────────
// LISTA DE TICKERS DISPONÍVEIS
// GET /api/tickers
// ─────────────────────────────────────────────
router.get('/tickers', (req, res) => {
  const sector = req.query.sector;
  const list = sector
    ? TICKERS.filter(t => t.sector === sector)
    : TICKERS;

  res.json({ tickers: list, count: list.length });
});

// ─────────────────────────────────────────────
// SETORES DISPONÍVEIS
// GET /api/sectors
// ─────────────────────────────────────────────
router.get('/sectors', (req, res) => {
  const sectors = [...new Set(TICKERS.map(t => t.sector))].sort();
  res.json({ sectors });
});

module.exports = router;
