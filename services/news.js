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
      ['description', 'description'],
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
// 3 variações por categoria, selecionadas por hash do título da notícia
// Pasta: granainvestimentos.com.br/mercado/assets/news/
// ─────────────────────────────────────────────
const NEWS_IMG_BASE = 'https://granainvestimentos.com.br/mercado/assets/news';

const IMAGE_BANK = {
  // Por tipo de ativo
  fii:    [`${NEWS_IMG_BASE}/fii-1.jpg`,    `${NEWS_IMG_BASE}/fii-2.jpg`,    `${NEWS_IMG_BASE}/fii-3.jpg`],
  etf:    [`${NEWS_IMG_BASE}/etf-1.jpg`,    `${NEWS_IMG_BASE}/etf-2.jpg`,    `${NEWS_IMG_BASE}/etf-3.jpg`],
  bdr:    [`${NEWS_IMG_BASE}/bdr-1.jpg`,    `${NEWS_IMG_BASE}/bdr-2.jpg`,    `${NEWS_IMG_BASE}/bdr-3.jpg`],
  cripto: [`${NEWS_IMG_BASE}/cripto-1.jpg`, `${NEWS_IMG_BASE}/cripto-2.jpg`, `${NEWS_IMG_BASE}/cripto-3.jpg`],

  // Por setor (ações)
  Bancos:        [`${NEWS_IMG_BASE}/bancos-1.jpg`,      `${NEWS_IMG_BASE}/bancos-2.jpg`,      `${NEWS_IMG_BASE}/bancos-3.jpg`],
  Energia:       [`${NEWS_IMG_BASE}/energia-1.jpg`,     `${NEWS_IMG_BASE}/energia-2.jpg`,     `${NEWS_IMG_BASE}/energia-3.jpg`],
  'Petróleo':    [`${NEWS_IMG_BASE}/petroleo-1.jpg`,    `${NEWS_IMG_BASE}/petroleo-2.jpg`,    `${NEWS_IMG_BASE}/petroleo-3.jpg`],
  'Mineração':   [`${NEWS_IMG_BASE}/mineracao-1.jpg`,   `${NEWS_IMG_BASE}/mineracao-2.jpg`,   `${NEWS_IMG_BASE}/mineracao-3.jpg`],
  Tecnologia:    [`${NEWS_IMG_BASE}/tecnologia-1.jpg`,  `${NEWS_IMG_BASE}/tecnologia-2.jpg`,  `${NEWS_IMG_BASE}/tecnologia-3.jpg`],
  Varejo:        [`${NEWS_IMG_BASE}/varejo-1.jpg`,      `${NEWS_IMG_BASE}/varejo-2.jpg`,      `${NEWS_IMG_BASE}/varejo-3.jpg`],
  Consumo:       [`${NEWS_IMG_BASE}/consumo-1.jpg`,     `${NEWS_IMG_BASE}/consumo-2.jpg`,     `${NEWS_IMG_BASE}/consumo-3.jpg`],
  'Saúde':       [`${NEWS_IMG_BASE}/saude-1.jpg`,       `${NEWS_IMG_BASE}/saude-2.jpg`,       `${NEWS_IMG_BASE}/saude-3.jpg`],
  'Imóveis':     [`${NEWS_IMG_BASE}/imoveis-1.jpg`,     `${NEWS_IMG_BASE}/imoveis-2.jpg`,     `${NEWS_IMG_BASE}/imoveis-3.jpg`],
  'Logística':   [`${NEWS_IMG_BASE}/logistica-1.jpg`,   `${NEWS_IMG_BASE}/logistica-2.jpg`,   `${NEWS_IMG_BASE}/logistica-3.jpg`],
  Seguros:       [`${NEWS_IMG_BASE}/seguros-1.jpg`,     `${NEWS_IMG_BASE}/seguros-2.jpg`,     `${NEWS_IMG_BASE}/seguros-3.jpg`],
  Financeiro:    [`${NEWS_IMG_BASE}/financeiro-1.jpg`,  `${NEWS_IMG_BASE}/financeiro-2.jpg`,  `${NEWS_IMG_BASE}/financeiro-3.jpg`],
  'Agronegócio': [`${NEWS_IMG_BASE}/agronegocio-1.jpg`, `${NEWS_IMG_BASE}/agronegocio-2.jpg`, `${NEWS_IMG_BASE}/agronegocio-3.jpg`],
  'Educação':    [`${NEWS_IMG_BASE}/educacao-1.jpg`,    `${NEWS_IMG_BASE}/educacao-2.jpg`,    `${NEWS_IMG_BASE}/educacao-3.jpg`],
  Saneamento:    [`${NEWS_IMG_BASE}/saneamento-1.jpg`,  `${NEWS_IMG_BASE}/saneamento-2.jpg`,  `${NEWS_IMG_BASE}/saneamento-3.jpg`],
  Papel:         [`${NEWS_IMG_BASE}/papel-1.jpg`,       `${NEWS_IMG_BASE}/papel-2.jpg`,       `${NEWS_IMG_BASE}/papel-3.jpg`],

  // Fallback geral
  mercado: [`${NEWS_IMG_BASE}/mercado-1.jpg`, `${NEWS_IMG_BASE}/mercado-2.jpg`, `${NEWS_IMG_BASE}/mercado-3.jpg`],
};

// Hash simples do título para seleção determinística (mesma notícia = mesma imagem sempre)
function strHash(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

// Retorna a URL de fallback correta para o setor/tipo, variando pela notícia
function getFallbackImage(sector, type, title) {
  // Tenta match direto por tipo/setor
  let pool = null;

  if (type && type !== 'acao' && IMAGE_BANK[type]) {
    pool = IMAGE_BANK[type];
  } else if (sector && IMAGE_BANK[sector]) {
    pool = IMAGE_BANK[sector];
  }

  // Se não achou por setor/tipo, tenta palavras-chave no título
  if (!pool && title) {
    const t = title.toLowerCase();
    if (/bitcoin|btc|ethereum|eth|cripto|crypto/.test(t))      pool = IMAGE_BANK.cripto;
    else if (/petrobras|petr|petroleo|petróleo|oil|gas/.test(t)) pool = IMAGE_BANK['Petróleo'];
    else if (/vale|mineração|mineracao|minério|minero/.test(t))  pool = IMAGE_BANK['Mineração'];
    else if (/banco|itau|bradesco|financ/.test(t))               pool = IMAGE_BANK.Bancos;
    else if (/fii|fundo imobiliário|imobiliario|cri|lci/.test(t)) pool = IMAGE_BANK.fii;
    else if (/etf|bova11|ivvb|selic|tesouro/.test(t))           pool = IMAGE_BANK.etf;
    else if (/bdr|aapl|apple|microsoft|amazon|google/.test(t))  pool = IMAGE_BANK.bdr;
    else if (/energia|eletrica|enel|cemig|copel/.test(t))       pool = IMAGE_BANK.Energia;
    else if (/agro|soja|milho|boi|cana|farm/.test(t))           pool = IMAGE_BANK['Agronegócio'];
    else if (/saude|hospital|fleury|dasa|hapvida/.test(t))       pool = IMAGE_BANK['Saúde'];
    else if (/varejo|lojas|magazine|renner|via/.test(t))        pool = IMAGE_BANK.Varejo;
    else if (/tecnologia|tech|software|totvs/.test(t))          pool = IMAGE_BANK.Tecnologia;
  }

  if (!pool) pool = IMAGE_BANK.mercado;

  const idx = strHash(title || '') % pool.length;
  return pool[idx];
}

// ─────────────────────────────────────────────
// Enriquece lista de notícias com og:image em paralelo (máx 8 simultâneos)
// Camadas:
//   1. Imagem do RSS (enclosure / media:content)
//   2. og:image / twitter:image da página do artigo
//   3. Banco de imagens Unsplash por categoria (fallback final)
// ─────────────────────────────────────────────
async function enrichImages(items, sector, type) {
  // Camada 2: og:image scraping — só para itens sem imagem e com URL real
  const withoutImage = items.filter(i => !i.image && i.url && i.url !== '#');

  if (withoutImage.length > 0) {
    const CHUNK = 6;
    for (let i = 0; i < withoutImage.length; i += CHUNK) {
      const chunk = withoutImage.slice(i, i + CHUNK);
      await Promise.allSettled(
        chunk.map(async (item) => {
          const img = await fetchOgImage(item.url);
          if (img) item.image = img;
        })
      );
    }
  }

  // Camada 3: fallback inteligente — usa palavras-chave do título para variar imagem
  items.forEach(function(item) {
    if (!item.image) {
      item.image = getFallbackImage(sector, type, item.title);
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

  // Extrai imagem — várias estratégias em ordem de confiabilidade
  let image = null;

  // 1. enclosure (RSS padrão)
  if (item.enclosure?.url) image = item.enclosure.url;

  // 2. media:content
  if (!image && item['media:content']?.$.url) image = item['media:content'].$.url;
  if (!image && item.media?.url) image = item.media.url;
  if (!image && item.thumbnail?.url) image = item.thumbnail.url;

  // 3. Google News embute thumbnail no campo "description" / content como <img src="...">
  //    Pode vir com src dentro de aspas simples, duplas ou sem aspas (encoded)
  if (!image) {
    const rawDesc = item.description || item['content:encoded'] || item.content || item.summary || '';
    // Tenta src com aspas duplas, simples ou entidade &quot;
    const imgMatch = rawDesc.match(/<img[^>]+src=["\']([^"\'\s>]+)["\']|<img[^>]+src=([^\s>"\'/][^\s>]+)/i);
    if (imgMatch) {
      const candidate = imgMatch[1] || imgMatch[2] || '';
      if (candidate && !candidate.startsWith('data:') && candidate.startsWith('http')) {
        image = candidate;
      }
    }
  }

  // 4. Tenta extrair URL de imagem do link Google News via parâmetro interno
  //    Google News às vezes embute a imagem como parâmetro na URL do item
  if (!image && item.link) {
    const gImgMatch = item.link.match(/imgurl=([^&]+)/);
    if (gImgMatch) {
      try { image = decodeURIComponent(gImgMatch[1]); } catch(e) {}
    }
  }

  // 5. Campo thumbnail direto (alguns parsers expõem assim)
  if (!image && item['media:thumbnail'] && typeof item['media:thumbnail'] === 'string') {
    image = item['media:thumbnail'];
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
