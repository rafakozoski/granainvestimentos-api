// services/cvm.js — Relatórios RI via ENET CVM (links diretos, sem CKAN)
// Estratégia: usa CVM Dados Abertos para buscar CNPJ, depois gera links
// diretos para o portal ENET que sempre funcionam.

const https = require('https');
const { get, set } = require('../cache');

function cleanCnpj(cnpj) {
  return (cnpj || '').replace(/\D/g, '');
}
function formatCnpj(digits) {
  if (!digits || digits.length !== 14) return digits;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper com retry
// ─────────────────────────────────────────────────────────────────────────────
function fetchJson(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs || 12000 }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return fetchJson(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('JSON inválido (' + res.statusCode + ')')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Busca documentos via CVM ENET frmConsultaExternaCVM (scraping leve do JSON)
// A API de consulta externa retorna JSON quando chamada com Accept: application/json
// ─────────────────────────────────────────────────────────────────────────────
async function fetchEnetDocs(cnpjClean) {
  const docs = [];

  const TIPOS = [
    { categ: 'DFP', label: 'DFP', desc: 'Demonstrações Financeiras Anuais' },
    { categ: 'ITR', label: 'ITR', desc: 'Informações Trimestrais' },
    { categ: 'FRE', label: 'FRE', desc: 'Formulário de Referência' },
    { categ: 'IPE', label: 'IPE', desc: 'Fatos Relevantes e Comunicados' },
  ];

  // Tenta buscar documentos via API de consulta do ENET
  // Endpoint: /ENET/frmConsultaExternaCVM.aspx retorna HTML, mas
  // a API de busca de documentos da CVM retorna JSON
  const baseEnet = 'https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx';

  await Promise.allSettled(TIPOS.map(async ({ categ, label, desc }) => {
    try {
      // A CVM tem uma API JSON interna usada pelo próprio portal
      const apiUrl = `https://sistemaswebb3-listados.cvm.gov.br/itrDoc/ITRApi/GetDocumentsByCompany`
        + `?cnpj=${cnpjClean}&categDoc=${categ}&numPag=1&qtdPag=5`;

      const data = await fetchJson(apiUrl, 8000);

      if (data && Array.isArray(data.result)) {
        data.result.forEach(doc => {
          docs.push({
            tipo:      label,
            descricao: desc,
            empresa:   doc.nomeCia || doc.empresa || '',
            periodo:   (doc.dtApresentacao || doc.dtReferencia || '').slice(0, 10),
            versao:    String(doc.versao || '1'),
            link:      doc.linkDocumento || `${baseEnet}?CNPJ=${cnpjClean}&CATEG_DOC=${categ}`,
          });
        });
      }
    } catch(e) {
      // silencia — usa links diretos como fallback
    }
  }));

  return docs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Links diretos ENET — sempre disponíveis independente de qualquer API
// ─────────────────────────────────────────────────────────────────────────────
function buildEnetLinks(cnpjClean) {
  const base = `https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx?CNPJ=${cnpjClean}`;
  return [
    {
      label: 'Consultar todos os documentos',
      descricao: 'Portal ENET — todos os documentos registrados na CVM',
      link: base,
    },
    {
      label: 'DFP — Demonstrações Financeiras Anuais',
      descricao: 'Balanço patrimonial, DRE, fluxo de caixa e notas explicativas',
      link: base + '&CATEG_DOC=DFP',
    },
    {
      label: 'ITR — Informações Trimestrais',
      descricao: 'Resultados dos últimos trimestres (balanço e DRE)',
      link: base + '&CATEG_DOC=ITR',
    },
    {
      label: 'FRE — Formulário de Referência',
      descricao: 'Governança corporativa, remuneração e fatores de risco',
      link: base + '&CATEG_DOC=FRE',
    },
    {
      label: 'IPE — Fatos Relevantes',
      descricao: 'Fatos relevantes, comunicados ao mercado e atas',
      link: base + '&CATEG_DOC=IPE',
    },
    {
      label: 'FCA — Formulário Cadastral',
      descricao: 'Dados cadastrais, atividades e auditores',
      link: base + '&CATEG_DOC=FCA',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Função principal exportada
// ─────────────────────────────────────────────────────────────────────────────
async function getDocumentsByCnpj(ticker, cnpj) {
  if (!cnpj) return { available: false, reason: 'sem_cnpj', docs: [], enetLinks: [] };

  const cnpjClean = cleanCnpj(cnpj);
  if (cnpjClean.length !== 14) {
    return { available: false, reason: 'cnpj_invalido', cnpj, docs: [], enetLinks: [] };
  }

  const cacheKey = `cvm:docs:${cnpjClean}`;
  const cached = get(cacheKey);
  if (cached) return cached;

  const enetLinks = buildEnetLinks(cnpjClean);

  // Tenta buscar docs via API — mas não bloqueia se falhar
  let docs = [];
  try {
    docs = await fetchEnetDocs(cnpjClean);
  } catch(e) {
    console.warn('[CVM] fetchEnetDocs falhou:', e.message);
  }

  const response = {
    available: true,
    ticker,
    cnpj:      formatCnpj(cnpjClean),
    cnpjClean,
    docs:      docs.slice(0, 30),
    enetLinks,
  };

  // Cache de 6h — docs RI não mudam com frequência
  set(cacheKey, response, 6 * 60 * 60);
  return response;
}

module.exports = { getDocumentsByCnpj };
