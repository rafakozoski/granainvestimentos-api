// routes/index.js — todas as rotas da API

const express = require('express');
const router = express.Router();
const brapi = require('../services/brapi');
const news = require('../services/news');
const { getFundamentus, calcPrecoJusto } = require('../services/fundamentus');
const { FEATURED_TICKERS, searchTickers, findTicker, TICKERS } = require('../data/tickers');
const { stats } = require('../cache');

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), cache: stats(), timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────
// HOMEPAGE — dados agregados + maiores altas/baixas
// GET /api/home
// ─────────────────────────────────────────────
router.get('/home', async (req, res) => {
  try {
    const allFeatured = [
      'BBAS3','PETR4','VALE3','ITUB4','WEGE3','MGLU3','RENT3','RDOR3',
      'ABEV3','JBSS3','SUZB3','EMBR3','SBSP3','VIVT3','EGIE3','PRIO3'
    ];

    const [quotes, marketNews] = await Promise.allSettled([
      brapi.getQuote(allFeatured),
      news.getMarketNews(20),
    ]);

    const tickers = quotes.status === 'fulfilled' ? quotes.value : [];
    const sorted = [...tickers].sort((a,b) => b.changePercent - a.changePercent);

    res.json({
      tickers: tickers.slice(0, 8),
      gainers: sorted.slice(0, 5),
      losers: sorted.slice(-5).reverse(),
      news: marketNews.status === 'fulfilled' ? marketNews.value : [],
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Route /home]', err.message);
    res.status(500).json({ error: 'Erro ao carregar dados da homepage' });
  }
});

// ─────────────────────────────────────────────
// COTAÇÃO
// GET /api/quote/BBAS3
// GET /api/quote/BBAS3,PETR4,VALE3
// ─────────────────────────────────────────────
router.get('/quote/:tickers', async (req, res) => {
  const { tickers } = req.params;
  const tickerList = tickers.toUpperCase().split(',').slice(0, 20);

  // Criptos têm formato diferente (BTC-USD), permite hífen
  const invalid = tickerList.filter(t => !/^[A-Z0-9]{2,6}(-[A-Z]{2,4})?$/.test(t));
  if (invalid.length) {
    return res.status(400).json({ error: `Ticker(s) inválido(s): ${invalid.join(', ')}` });
  }

  try {
    const data = await brapi.getQuote(tickerList);
    res.json({ results: data, count: data.length });
  } catch (err) {
    console.error(`[Route /quote/${tickers}]`, err.message);
    res.status(502).json({ error: 'Erro ao buscar cotação.' });
  }
});

// ─────────────────────────────────────────────
// HISTÓRICO DE PREÇOS
// GET /api/history/BBAS3?range=1mo&interval=1d
// ─────────────────────────────────────────────
router.get('/history/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const range = req.query.range || '1mo';
  const interval = req.query.interval || '1d';

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
    res.status(502).json({ error: 'Erro ao buscar notícias de mercado' });
  }
});

// ─────────────────────────────────────────────
// FUNDAMENTUS — indicadores completos + preços justos
// GET /api/fundamentus/BBAS3
// ─────────────────────────────────────────────
router.get('/fundamentus/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    const [fund, quoteResult] = await Promise.allSettled([
      getFundamentus(ticker),
      brapi.getQuote([ticker]),
    ]);

    const fundData = fund.status === 'fulfilled' ? fund.value : {};
    const quote = quoteResult.status === 'fulfilled' ? quoteResult.value?.[0] : null;
    const precosJustos = calcPrecoJusto(quote, fundData);

    res.json({
      ticker,
      fundamentus: fundData,
      precosJustos,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[Route /fundamentus/${ticker}]`, err.message);
    res.status(502).json({ error: 'Erro ao buscar dados do Fundamentus' });
  }
});

// ─────────────────────────────────────────────
// TICKER COMPLETO — tudo em uma chamada
// GET /api/ticker/BBAS3
// ─────────────────────────────────────────────
router.get('/ticker/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const meta = findTicker(ticker);

  try {
    const [quoteResult, newsResult, dividendsResult, fundResult] = await Promise.allSettled([
      brapi.getQuote([ticker]),
      news.getNewsByTicker(ticker, 12),
      brapi.getDividends(ticker),
      getFundamentus(ticker),
    ]);

    const quote = quoteResult.status === 'fulfilled' ? quoteResult.value?.[0] : null;
    if (!quote) return res.status(404).json({ error: `Ticker ${ticker} não encontrado` });

    const fundData = fundResult.status === 'fulfilled' ? fundResult.value : {};
    const precosJustos = calcPrecoJusto(quote, fundData);

    res.json({
      ticker,
      meta: meta || { code: ticker, name: quote.name },
      quote,
      fundamentus: fundData,
      precosJustos,
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
// BUSCA (autocomplete)
// GET /api/search?q=BB
// ─────────────────────────────────────────────
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ results: [] });
  const results = searchTickers(q);
  res.json({ results, count: results.length });
});

// ─────────────────────────────────────────────
// LISTA DE TICKERS
// GET /api/tickers?sector=Bancos&type=acao
// ─────────────────────────────────────────────
router.get('/tickers', (req, res) => {
  const { sector, type } = req.query;
  let list = TICKERS;
  if (sector) list = list.filter(t => t.sector === sector);
  if (type) list = list.filter(t => t.type === type);
  res.json({ tickers: list, count: list.length });
});

// ─────────────────────────────────────────────
// SETORES
// GET /api/sectors
// ─────────────────────────────────────────────
router.get('/sectors', (req, res) => {
  const sectors = [...new Set(TICKERS.map(t => t.sector))].sort();
  res.json({ sectors });
});

module.exports = router;
