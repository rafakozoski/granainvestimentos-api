// services/news.js — notícias via Google News RSS (gratuito, sem chave)
// Fallback para múltiplas fontes

const Parser = require('rss-parser');
const { get, set, TTL } = require('../cache');

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; GranaInvestimentos/1.0)',
    'Accept-Language': 'pt-BR,pt;q=0.9',
  },
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
});

/**
 * Fontes de RSS financeiro brasileiro (todas gratuitas)
 */
const RSS_SOURCES = {
  // Google News por ticker — atualiza em tempo real
  googleNews: (query) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`,

  // Fontes específicas de finanças com RSS público
  infomoney: 'https://www.infomoney.com.br/feed/',
  valorEconomico: 'https://valor.globo.com/rss/financas/feed.xml',
  exameInvest: 'https://exame.com/invest/feed/',
  moneyTimes: 'https://www.moneytimes.com.br/feed/',
};

/**
 * Busca notícias de um ticker específico
 * @param {string} ticker - ex: 'BBAS3'
 * @param {number} limit - número de notícias
 */
async function getNewsByTicker(ticker, limit = 10) {
  const cacheKey = `news:${ticker}:${limit}`;

  const cached = get(cacheKey);
  if (cached) return cached;

  // Monta queries específicas para o ativo
  const queries = [
    `${ticker}`,
    `${ticker} ação bolsa`,
  ];

  const allNews = [];

  // Busca em paralelo nas fontes Google News
  await Promise.allSettled(
    queries.slice(0, 2).map(async (query) => {
      try {
        const url = RSS_SOURCES.googleNews(query);
        const feed = await parser.parseURL(url);

        feed.items.forEach((item) => {
          allNews.push(normalizeNewsItem(item, 'Google News'));
        });
      } catch (err) {
        console.warn(`[News] Falha ao buscar "${query}":`, err.message);
      }
    })
  );

  // Remove duplicatas por título
  const seen = new Set();
  const unique = allNews.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ordena por data (mais recente primeiro)
  unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const result = unique.slice(0, limit);

  set(cacheKey, result, TTL.NEWS);
  return result;
}

/**
 * Busca notícias gerais de mercado (para a homepage)
 * @param {number} limit
 */
async function getMarketNews(limit = 20) {
  const cacheKey = `news:market:${limit}`;

  const cached = get(cacheKey);
  if (cached) return cached;

  const queries = [
    'ações bolsa brasileira B3',
    'Ibovespa mercado financeiro',
    'dividendos resultados trimestrais B3',
  ];

  const allNews = [];

  await Promise.allSettled(
    queries.map(async (query) => {
      try {
        const url = RSS_SOURCES.googleNews(query);
        const feed = await parser.parseURL(url);

        feed.items.forEach((item) => {
          allNews.push(normalizeNewsItem(item, 'Google News'));
        });
      } catch (err) {
        console.warn(`[News] Falha ao buscar mercado:`, err.message);
      }
    })
  );

  // Remove duplicatas e ordena
  const seen = new Set();
  const unique = allNews
    .filter((item) => {
      const key = item.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, limit);

  set(cacheKey, unique, TTL.NEWS);
  return unique;
}

/**
 * Normaliza um item RSS para o formato padrão
 */
function normalizeNewsItem(item, sourceFallback) {
  // Google News encapsula o título como "Título - Fonte"
  let title = item.title || '';
  let source = sourceFallback;

  const googlePattern = / - ([^-]+)$/;
  const match = title.match(googlePattern);
  if (match) {
    source = match[1].trim();
    title = title.replace(googlePattern, '').trim();
  }

  // Limpa HTML do excerpt
  let excerpt = item.contentSnippet || item.content || item.summary || '';
  excerpt = excerpt.replace(/<[^>]*>/g, '').trim().slice(0, 220);
  if (excerpt.length === 220) excerpt += '…';

  // Tenta extrair imagem
  let image = null;
  if (item.enclosure?.url) image = item.enclosure.url;
  else if (item.media?.url) image = item.media.url;
  else if (item.thumbnail?.url) image = item.thumbnail.url;

  return {
    title,
    excerpt,
    source,
    url: item.link || item.guid || '#',
    pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
    relativeTime: getRelativeTime(item.isoDate || item.pubDate),
    image,
    guid: item.guid || item.link || title,
  };
}

/**
 * Converte data para tempo relativo ("2h atrás", "3 dias atrás")
 */
function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 5) return 'agora mesmo';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffH < 24) return `${diffH}h atrás`;
  if (diffD === 1) return 'ontem';
  if (diffD < 7) return `${diffD} dias atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

module.exports = { getNewsByTicker, getMarketNews };
