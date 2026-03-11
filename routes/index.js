// routes/index.js — todas as rotas da API

const express = require('express');
const router = express.Router();
const brapi = require('../services/brapi');
const news = require('../services/news');
const { getFundamentus, calcPrecoJusto } = require('../services/fundamentus');
const { FEATURED_TICKERS, searchTickers, findTicker, TICKERS } = require('../data/tickers');
const { stats } = require('../cache');
const { getDocumentsByCnpj } = require('../services/cvm');

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), cache: stats(), timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────
// HOMEPAGE
// GET /api/macro
// Ibovespa (^BVSP), SPX (^GSPC), USD/BRL, BTC-USD, Ouro (GC=F), Selic, IPCA
// Cache 30min para cotações, 24h para Selic/IPCA
// ─────────────────────────────────────────────
const { get: cacheGet, set: cacheSet } = require('../cache');
const fetch = require('node-fetch');

router.get('/macro', async (req, res) => {
  const cached = cacheGet('macro:all');
  if (cached) return res.json(cached);

  const TOKEN = process.env.BRAPI_TOKEN ? '&token=' + process.env.BRAPI_TOKEN : '';

  try {
    // ── 1. Cotações BRAPI: Ibovespa, S&P500, BTC, Ouro ──────────────────────
    const [quotesRes, usdRes, selicRes, ipcaRes] = await Promise.allSettled([
      brapi.getQuote(['^BVSP', '^GSPC', 'BTC-USD', 'GC=F']),

      // USD/BRL — AwesomeAPI com fallback BCB
      (async () => {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 6000);
          const r = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', { signal: ctrl.signal });
          clearTimeout(t);
          return await r.json();
        } catch(e) { console.warn('[macro] AwesomeAPI USD erro:', e.message); }
        try {
          const ctrl2 = new AbortController();
          const t2 = setTimeout(() => ctrl2.abort(), 6000);
          const r2 = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json', { signal: ctrl2.signal });
          clearTimeout(t2);
          const d = await r2.json();
          if (Array.isArray(d) && d[0]) return { USDBRL: { ask: String(d[0].valor).replace(',','.') } };
        } catch(e2) { console.warn('[macro] BCB USD fallback erro:', e2.message); }
        return null;
      })(),

      // Selic — BCB série 432
      (async () => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        try {
          const r = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json', { signal: ctrl.signal });
          clearTimeout(t);
          return await r.json();
        } catch(e) { clearTimeout(t); return null; }
      })(),

      // IPCA 12m — BCB série 13522
      (async () => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        try {
          const r = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json', { signal: ctrl.signal });
          clearTimeout(t);
          return await r.json();
        } catch(e) { clearTimeout(t); return null; }
      })(),
    ]);

    // Cotações
    const quotes = quotesRes.status === 'fulfilled' ? quotesRes.value : [];
    const byTk   = {};
    quotes.forEach(function(q){ byTk[q.ticker] = q; });

    // ── USD/BRL via AwesomeAPI ───────────────────────────────────────────────
    let usd = null;
    if (usdRes.status === 'fulfilled') {
      try {
        const d = usdRes.value;
        const row = d.USDBRL || d['USD-BRL'] || Object.values(d)[0];
        if (row) {
          usd = parseFloat(row.ask || row.bid || row.high);
        }
      } catch(e) { console.warn('[macro] USD parse error:', e.message); }
    } else {
      console.warn('[macro] USD fetch failed:', usdRes.reason?.message);
    }

    // ── Selic via BCB ────────────────────────────────────────────────────────
    // Série 432 = Taxa Selic (% a.a.)
    let selic = null;
    if (selicRes.status === 'fulfilled') {
      try {
        const arr = selicRes.value;
        if (Array.isArray(arr) && arr[0]) {
          selic = parseFloat(arr[0].valor);
        }
      } catch(e) { console.warn('[macro] Selic parse error:', e.message); }
    } else {
      console.warn('[macro] Selic fetch failed:', selicRes.reason?.message);
    }

    // ── IPCA 12m via BCB ─────────────────────────────────────────────────────
    // Série 13522 = IPCA acumulado 12 meses (já vem calculado pelo BCB)
    let ipca = null;
    if (ipcaRes.status === 'fulfilled') {
      try {
        const arr = ipcaRes.value;
        if (Array.isArray(arr) && arr[0]) {
          ipca = parseFloat(parseFloat(arr[0].valor).toFixed(2));
        }
      } catch(e) { console.warn('[macro] IPCA parse error:', e.message); }
    } else {
      console.warn('[macro] IPCA fetch failed:', ipcaRes.reason?.message);
    }

    const macro = {
      ibov:  byTk['^BVSP']   || null,
      spx:   byTk['^GSPC']   || null,
      btc:   byTk['BTC-USD'] || null,
      ouro:  byTk['GC=F']    || null,
      usd,
      selic,
      ipca,
      updatedAt: new Date().toISOString(),
    };

    console.log('[macro] usd=%s selic=%s ipca=%s', usd, selic, ipca);
    cacheSet('macro:all', macro, 30 * 60); // 30 min
    res.json(macro);
  } catch (err) {
    console.error('[Route /macro]', err.message);
    res.status(500).json({ error: 'Erro ao carregar indices macro' });
  }
});

// GET /api/home
// Plano free BRAPI: 1 ticker por req — buscamos 8 em paralelo
// Com cache 30min: apenas 8 req por meio hora = ~11.520/mês
// ─────────────────────────────────────────────
router.get('/home', async (req, res) => {
  try {
    // 8 tickers para a homepage — cada um vira 1 requisição BRAPI
    const featured = ['BOVA11','BBAS3','PETR4','VALE3','ITUB4','WEGE3','ABEV3','RENT3'];

    const [tickerResults, marketNews] = await Promise.allSettled([
      brapi.getQuote(featured),
      news.getMarketNews(20),
    ]);

    const tickers = tickerResults.status === 'fulfilled' ? tickerResults.value : [];
    const sorted  = [...tickers].sort((a, b) => b.changePercent - a.changePercent);

    res.json({
      tickers,
      gainers:    sorted.slice(0, 5),
      losers:     sorted.slice(-5).reverse(),
      news:       marketNews.status === 'fulfilled' ? marketNews.value : [],
      updatedAt:  new Date().toISOString(),
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
  const range    = req.query.range    || '1mo';
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
  const limit  = Math.min(parseInt(req.query.limit) || 10, 30);
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
      brapi.getOneTicker(ticker),
    ]);

    const fundData     = fund.status === 'fulfilled' ? fund.value : {};
    const quote        = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
    const precosJustos = calcPrecoJusto(quote, fundData);

    res.json({ ticker, fundamentus: fundData, precosJustos, updatedAt: new Date().toISOString() });
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
  const meta   = findTicker(ticker);

  try {
    const [quoteResult, newsResult, dividendsResult, fundResult] = await Promise.allSettled([
      brapi.getOneTicker(ticker),
      news.getNewsByTicker(ticker, 12),
      brapi.getDividends(ticker),
      getFundamentus(ticker),
    ]);

    const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
    if (!quote) return res.status(404).json({ error: `Ticker ${ticker} não encontrado` });

    const fundData     = fundResult.status === 'fulfilled' ? fundResult.value : {};
    const precosJustos = calcPrecoJusto(quote, fundData);

    res.json({
      ticker,
      meta:          meta || { code: ticker, name: quote.name },
      quote,
      fundamentus:   fundData,
      precosJustos,
      news:          newsResult.status === 'fulfilled' ? newsResult.value : [],
      dividends:     dividendsResult.status === 'fulfilled' ? dividendsResult.value : [],
      updatedAt:     new Date().toISOString(),
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
  if (type)   list = list.filter(t => t.type   === type);
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

// ─────────────────────────────────────────────
// RELATÓRIOS RI — Dados Abertos CVM
// GET /api/ri/:ticker
//
// Retorna documentos oficiais (DFP, ITR, FRE, FCA, IPE)
// para ativos com CNPJ cadastrado (ações e FIIs).
// ETFs, BDRs e Criptos recebem available:false.
//
// Resposta:
// {
//   available: true,
//   ticker: "BBAS3",
//   cnpj: "00.000.000/0001-91",
//   docs: [ { tipo, descricao, periodo, versao, link, linkEnet } ],
//   enetLinks: [ { label, descricao, link } ]   ← sempre presentes se CNPJ existir
// }
// ─────────────────────────────────────────────
router.get('/ri/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const meta   = findTicker(ticker);

  // Tipos sem CNPJ (ETF, BDR, Cripto) — retorna links genéricos da CVM
  if (!meta || !meta.cnpj) {
    return res.json({
      available: false,
      ticker,
      reason: meta ? 'sem_cnpj' : 'ticker_nao_encontrado',
      message: meta
        ? `${meta.type?.toUpperCase() || 'Ativo'} não publica documentos na CVM`
        : 'Ticker não encontrado na base de dados',
      enetLinks: [
        {
          label:     'Buscar RI da empresa',
          descricao: 'Pesquisa no Google para Relações com Investidores',
          link:      `https://www.google.com/search?q=${encodeURIComponent(ticker + ' relacoes com investidores RI site:ri.')}`,
        },
        {
          label:     'Portal ENET CVM',
          descricao: 'Consulta geral de documentos',
          link:      'https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx',
        },
        {
          label:     'Dados Abertos CVM',
          descricao: 'Datasets estruturados em CSV',
          link:      'https://dados.cvm.gov.br',
        },
      ],
    });
  }

  try {
    const data = await getDocumentsByCnpj(ticker, meta.cnpj);
    res.set('Cache-Control', 'public, max-age=21600'); // 6h no browser/CDN
    res.json(data);
  } catch (err) {
    console.error(`[Route /ri/${ticker}]`, err.message);
    res.status(500).json({ error: 'Erro ao buscar documentos na CVM', ticker });
  }
});

module.exports = router;
