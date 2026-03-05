// services/fundamentus.js
// Scraping gratuito do Fundamentus para indicadores completos
// Cache de 1 hora — dados mudam pouco durante o dia

const fetch = require('node-fetch');
const cache = require('../cache');

const BASE = 'https://www.fundamentus.com.br/detalhes.php';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Referer': 'https://www.fundamentus.com.br/',
};

// Converte string brasileira → número: "1.234,56" → 1234.56
function parseBR(s) {
  if (!s || s === '-' || s === '') return null;
  const clean = s.replace('%','').replace(/\./g,'').replace(',','.').trim();
  const n = parseFloat(clean);
  return isNaN(n) ? null : (s.includes('%') ? n / 100 : n);
}

// Extrai tabelas de indicadores do HTML do Fundamentus
function parseHTML(html) {
  const result = {};

  // Regex para capturar pares label → valor nas tabelas
  const rowRegex = /<td[^>]*class="[^"]*label[^"]*"[^>]*>\s*<span[^>]*title="([^"]*)"[^>]*>([^<]*)<\/span>\s*<\/td>\s*<td[^>]*class="[^"]*data[^"]*"[^>]*>\s*<span[^>]*>([^<]*)<\/span>/gi;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const title = match[1].trim();
    const label = match[2].trim();
    const value = match[3].trim();
    const key = label || title;
    if (key) result[key] = value;
  }

  // Fallback: regex mais simples para capturar qualquer td label/data
  const simpleRegex = /<td[^>]*>([\w\s\/\.%]+?)<\/td>\s*<td[^>]*>\s*<span[^>]*>([^<]*)<\/span>/gi;
  while ((match = simpleRegex.exec(html)) !== null) {
    const key = match[1].trim();
    const val = match[2].trim();
    if (key.length > 1 && key.length < 30 && val) {
      if (!result[key]) result[key] = val;
    }
  }

  return result;
}

// Mapeia os campos do Fundamentus para nomes padronizados
function mapFields(raw) {
  const get = (keys) => {
    for (const k of keys) {
      for (const rk of Object.keys(raw)) {
        if (rk.toLowerCase().includes(k.toLowerCase())) {
          return parseBR(raw[rk]);
        }
      }
    }
    return null;
  };

  return {
    // Valuation
    pl:         get(['P/L']),
    pvp:        get(['P/VP']),
    psr:        get(['PSR','P/Receita']),
    pAtivo:     get(['P/Ativo']),
    pCapGiro:   get(['P/Cap']),
    pEbit:      get(['P/EBIT']),
    evEbit:     get(['EV/EBIT']),
    evEbitda:   get(['EV/EBITDA']),
    // Dividendos
    dy:         get(['Div.Yield','DY']),
    // Rentabilidade
    roe:        get(['ROE']),
    roic:       get(['ROIC']),
    roa:        get(['ROA']),
    margemBruta:   get(['Mrg Bruta','Margem Bruta']),
    margemEbit:    get(['Mrg Ebit','Margem Ebit']),
    margemLiquida: get(['Mrg. Líq','Margem Líquida','Mrg Liq']),
    // Endividamento
    liquidezCorr:  get(['Liq. Corr','Liquidez Corrente']),
    divLiqPl:      get(['Dív.Liq/PL','Div Liq/PL']),
    divLiqEbitda:  get(['Dív.Liq/Ebit','Div Liq/EBITDA']),
    // Dados por ação
    lpa:        get(['LPA']),
    vpa:        get(['VPA']),
    // Resultado
    receitaLiq: get(['Receita Liq']),
    ebit:       get(['EBIT']),
    lucroLiq:   get(['Lucro Liq']),
    // Balanço
    ativoTotal: get(['Ativo Total','Ativos']),
    patrimonio: get(['Patrim']),
    divBruta:   get(['Dív. Bruta','Div Bruta']),
    divLiquida: get(['Dív. Líq','Div Liq']),
    // Mercado
    cotacao:    get(['Cotação','Cot']),
    minimo52:   get(['Min 52 sem','Mín 52']),
    maximo52:   get(['Max 52 sem','Máx 52']),
    volume:     get(['Vol $ méd','Volume']),
    marketCap:  get(['Valor de mercado','Mkt Cap']),
    numAcoes:   get(['Nro. Ações','Num Ações']),
  };
}

async function getFundamentus(ticker) {
  const cacheKey = `fundamentus:${ticker.toUpperCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE}?papel=${ticker.toUpperCase()}`;
    const res = await fetch(url, { headers: HEADERS, timeout: 10000 });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    // Verifica se retornou página válida
    if (!html.includes('Cotação') && !html.includes('detalhes')) {
      throw new Error('Ticker não encontrado no Fundamentus');
    }

    const raw = parseHTML(html);
    const mapped = mapFields(raw);
    mapped._raw = raw;
    mapped._source = 'fundamentus';
    mapped._ticker = ticker.toUpperCase();
    mapped._updatedAt = new Date().toISOString();

    cache.set(cacheKey, mapped, 3600); // 1 hora
    console.log(`[Fundamentus] ${ticker} carregado com ${Object.keys(raw).length} campos`);
    return mapped;

  } catch (err) {
    console.warn(`[Fundamentus] Erro ao buscar ${ticker}:`, err.message);
    // Retorna objeto vazio para não quebrar a página
    return { _error: err.message, _ticker: ticker, _source: 'fundamentus' };
  }
}

// Calcula preços justos com base nos dados disponíveis
function calcPrecoJusto(quote, fund) {
  const lpa = fund?.lpa || quote?.lpa || null;
  const vpa = fund?.vpa || quote?.vpa || null;
  const dy = fund?.dy || quote?.dy || null;
  const preco = quote?.price || null;

  const result = {};

  // Graham: √(22.5 × LPA × VPA)
  if (lpa && vpa && lpa > 0 && vpa > 0) {
    result.graham = Math.sqrt(22.5 * lpa * vpa);
    result.upsideGraham = preco ? ((result.graham / preco) - 1) * 100 : null;
  }

  // Bazin: dividendo anual / 0.06
  // DY vem como decimal (0.08 = 8%), dividendo = preco * dy
  if (preco && dy && dy > 0) {
    const dividendoAnual = preco * dy;
    result.bazin = dividendoAnual / 0.06;
    result.upsideBazin = ((result.bazin / preco) - 1) * 100;
    result.dividendoAnual = dividendoAnual;
  }

  // Preço teto Bazin (alias mais explícito)
  if (result.bazin) {
    result.precoTeto = result.bazin;
  }

  // P/L justo pelo crescimento (Peter Lynch simplificado)
  // Preço justo = LPA × 15 (P/L médio histórico do mercado)
  if (lpa && lpa > 0) {
    result.plJusto = lpa * 15;
    result.upsidePlJusto = preco ? ((result.plJusto / preco) - 1) * 100 : null;
  }

  // Earnings Yield (inverso do P/L)
  const pl = fund?.pl || quote?.pl || null;
  if (pl && pl > 0) {
    result.earningsYield = (1 / pl) * 100;
  }

  // Dividend Yield em %
  if (dy) {
    result.dyPct = dy * 100;
  }

  // Margem de segurança Graham (quanto está abaixo do preço justo)
  if (result.graham && preco) {
    result.margemSeguranca = ((result.graham - preco) / result.graham) * 100;
  }

  return result;
}

module.exports = { getFundamentus, calcPrecoJusto };
