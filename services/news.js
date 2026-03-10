// services/news.js — notícias via Google News RSS (gratuito, sem chave)
// Extrai imagem do RSS ou via og:image scraping como fallback

const Parser = require('rss-parser');
const fetch  = require('node-fetch');
const { get, set, TTL } = require('../cache');
const { findTicker } = require('../data/tickers');

// ─────────────────────────────────────────────
// Extrai og:image / twitter:image de uma URL
// Lê apenas os primeiros 12kb — suficiente para <head>
// ─────────────────────────────────────────────
const OG_CACHE = new Map(); // cache local simples por URL

async function fetchOgImage(url) {
  if (!url || url === '#') return null;
  if (OG_CACHE.has(url)) return OG_CACHE.get(url);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GranaInvestimentos/1.0)',
        'Accept': 'text/html',
        'Range': 'bytes=0-16383', // só os primeiros 16kb
      },
    });
    clearTimeout(timer);

    // Lê apenas os primeiros 16kb mesmo se Range não for honrado
    let html = '';
    const body = res.body;
    for await (const chunk of body) {
      html += chunk.toString('utf8');
      if (html.length > 16384) break;
    }

    // Extrai og:image
    let img = null;
    const ogMatch = html.match(/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i)
                 || html.match(/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\'][^>]*>/i);
    if (ogMatch) img = ogMatch[1];

    // Fallback twitter:image
    if (!img) {
      const twMatch = html.match(/<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i)
                   || html.match(/<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\'][^>]*>/i);
      if (twMatch) img = twMatch[1];
    }

    // Limpa e valida
    if (img) {
      img = img.trim();
      if (!img.startsWith('http')) img = null; // descarta paths relativos
    }

    OG_CACHE.set(url, img);
    // Limita o cache a 500 entradas
    if (OG_CACHE.size > 500) OG_CACHE.delete(OG_CACHE.keys().next().value);

    return img;
  } catch {
    OG_CACHE.set(url, null);
    return null;
  }
}

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; GranaInvestimentos/1.0)',
    'Accept-Language': 'pt-BR,pt;q=0.9',
  },
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'content:encoded'],
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

// ─────────────────────────────────────────────
// Banco de imagens por categoria — hospedadas no Hostinger
// Pasta: granainvestimentos.com.br/mercado/assets/news/
// ─────────────────────────────────────────────
const NEWS_IMG_BASE = 'https://granainvestimentos.com.br/mercado/assets/news';

const IMAGE_BANK = {
  // Por tipo de ativo
  fii:    `${NEWS_IMG_BASE}/fii.jpg`,
  etf:    `${NEWS_IMG_BASE}/etf.jpg`,
  bdr:    `${NEWS_IMG_BASE}/bdr.jpg`,
  cripto: `${NEWS_IMG_BASE}/cripto.jpg`,

  // Por setor (ações)
  Bancos:      `${NEWS_IMG_BASE}/bancos.jpg`,
  Energia:     `${NEWS_IMG_BASE}/energia.jpg`,
  'Petróleo':  `${NEWS_IMG_BASE}/petroleo.jpg`,
  'Mineração': `${NEWS_IMG_BASE}/mineracao.jpg`,
  Tecnologia:  `${NEWS_IMG_BASE}/tecnologia.jpg`,
  Varejo:      `${NEWS_IMG_BASE}/varejo.jpg`,
  Consumo:     `${NEWS_IMG_BASE}/consumo.jpg`,
  'Saúde':     `${NEWS_IMG_BASE}/saude.jpg`,
  'Imóveis':   `${NEWS_IMG_BASE}/imoveis.jpg`,
  'Logística': `${NEWS_IMG_BASE}/logistica.jpg`,
  Seguros:     `${NEWS_IMG_BASE}/seguros.jpg`,
  Financeiro:  `${NEWS_IMG_BASE}/financeiro.jpg`,
  'Agronegócio': `${NEWS_IMG_BASE}/agronegocio.jpg`,
  'Educação':  `${NEWS_IMG_BASE}/educacao.jpg`,
  Saneamento:  `${NEWS_IMG_BASE}/saneamento.jpg`,
  Papel:       `${NEWS_IMG_BASE}/papel.jpg`,

  // Fallback geral
  mercado:     `${NEWS_IMG_BASE}/mercado.jpg`,
};

// Retorna a URL de fallback correta para o setor/tipo
function getFallbackImage(sector, type) {
  if (type && type !== 'acao' && IMAGE_BANK[type]) return IMAGE_BANK[type];
  if (sector && IMAGE_BANK[sector]) return IMAGE_BANK[sector];
  return IMAGE_BANK.mercado;
}

// ─────────────────────────────────────────────
// Enriquece lista de notícias com og:image em paralelo (máx 8 simultâneos)
// Camadas:
//   1. Imagem do RSS (enclosure / media:content)
//   2. og:image / twitter:image da página do artigo
//   3. Banco de imagens Unsplash por categoria (fallback final)
// ─────────────────────────────────────────────
async function enrichImages(items, sector, type) {
  const withoutImage = items.filter(i => !i.image);
  if (!withoutImage.length) return items;

  // Camada 2: og:image scraping
  const CHUNK = 8;
  for (let i = 0; i < withoutImage.length; i += CHUNK) {
    const chunk = withoutImage.slice(i, i + CHUNK);
    await Promise.allSettled(
      chunk.map(async (item) => {
        const img = await fetchOgImage(item.url);
        if (img) item.image = img;
      })
    );
  }

  // Camada 3: fallback Hostinger para quem ainda não tem imagem
  items.forEach(function(item) {
    if (!item.image) {
      item.image = getFallbackImage(sector, type);
      item.imageFallback = true;
    }
  });

  return items;
}

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

  // Enriquece imagens — passa setor/tipo para fallback Unsplash correto
  const meta = findTicker(ticker);
  await enrichImages(result, meta && meta.sector, meta && meta.type);

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

  // Enriquece imagens — usa categoria "mercado" para notícias gerais
  await enrichImages(unique, 'mercado', null);

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

  // Tenta extrair imagem (múltiplas estratégias)
  let image = null;
  if (item.enclosure?.url)   image = item.enclosure.url;
  else if (item['media:content']?.$.url) image = item['media:content'].$.url;
  else if (item.media?.url)  image = item.media.url;
  else if (item.thumbnail?.url) image = item.thumbnail.url;

  // Tenta extrair do conteúdo HTML (Google News embute <img> no content)
  if (!image) {
    const rawContent = item.content || item['content:encoded'] || item.summary || '';
    const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1] && !imgMatch[1].startsWith('data:')) {
      image = imgMatch[1];
    }
  }

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
