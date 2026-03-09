// services/cvm.js — Integração com Dados Abertos CVM
// API pública: https://dados.cvm.gov.br/
//
// Documentos suportados:
//   DFP  — Demonstrações Financeiras Padronizadas (anual)
//   ITR  — Informações Trimestrais
//   FRE  — Formulário de Referência (anual, dados cadastrais e de governança)
//   FCA  — Formulário Cadastral
//   IPE  — Informações Periódicas e Eventuais (fatos relevantes, comunicados)
//
// Fluxo:
//   1. Recebe ticker → busca CNPJ em tickers.js
//   2. Para cada tipo de documento, consulta a API de metadados da CVM
//   3. Normaliza e retorna lista de documentos com link de download

const https = require('https');
const { get, set, TTL } = require('../cache');

// Base da API de dados abertos da CVM
const CVM_API = 'https://dados.cvm.gov.br/api/dados';

// Tipos de documento que vamos buscar, com label amigável
const DOC_TYPES = [
  { tipo: 'dfp',  label: 'DFP',  descricao: 'Demonstrações Financeiras Padronizadas',  freq: 'Anual'     },
  { tipo: 'itr',  label: 'ITR',  descricao: 'Informações Trimestrais',                 freq: 'Trimestral' },
  { tipo: 'fre',  label: 'FRE',  descricao: 'Formulário de Referência',                freq: 'Anual'     },
  { tipo: 'ipe',  label: 'IPE',  descricao: 'Fatos Relevantes e Comunicados',          freq: 'Eventual'  },
  { tipo: 'fca',  label: 'FCA',  descricao: 'Formulário Cadastral',                    freq: 'Eventual'  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers HTTP (sem axios — usa apenas módulo nativo do Node)
// ─────────────────────────────────────────────────────────────────────────────

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 12000 }, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} — ${url}`));
        }
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`JSON inválido de ${url}`));
        }
      });
    })
    .on('error', reject)
    .on('timeout', () => reject(new Error(`Timeout — ${url}`)));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Normaliza CNPJ para o formato que a CVM usa na query: só dígitos
// ex: "33.000.167/0001-01" → "33000167000101"
// ─────────────────────────────────────────────────────────────────────────────
function cleanCnpj(cnpj) {
  return (cnpj || '').replace(/\D/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Busca documentos de um tipo específico para um CNPJ
// Endpoint: GET /api/dados/cia_aberta/doc/{tipo}/{tipo}_{ano}.csv
// A CVM disponibiliza CSV por ano — usamos a API de metadados CKAN
// ─────────────────────────────────────────────────────────────────────────────
async function fetchDocsByType(cnpjClean, tipoObj) {
  const { tipo, label, descricao, freq } = tipoObj;

  // Busca metadados do dataset via CKAN API
  // O dataset ID segue o padrão: cia_aberta-doc-{tipo}
  const datasetId = `cia_aberta-doc-${tipo}`;
  const metaUrl   = `https://dados.cvm.gov.br/api/3/action/package_show?id=${datasetId}`;

  let resources;
  try {
    const meta = await fetchJson(metaUrl);
    resources = meta?.result?.resources || [];
  } catch {
    return [];
  }

  // Filtra os resources dos últimos 5 anos (CSV com dados)
  const thisYear = new Date().getFullYear();
  const csvResources = resources
    .filter(r => {
      const name = (r.name || r.url || '').toLowerCase();
      // Pega arquivos CSV que contenham o ano (ex: dfp_cia_aberta_2024.csv)
      for (let y = thisYear; y >= thisYear - 4; y--) {
        if (name.includes(String(y)) && name.endsWith('.csv')) return true;
      }
      return false;
    })
    .sort((a, b) => (b.name || '').localeCompare(a.name || '')) // mais recente primeiro
    .slice(0, 5);

  if (!csvResources.length) return [];

  // Para cada CSV encontrado, busca registros do CNPJ via streaming parcial
  // A CVM tem endpoint de query via CKAN DataStore para alguns datasets
  // Usamos o endpoint de resource_search para evitar baixar o CSV inteiro
  const docs = [];

  for (const resource of csvResources) {
    // Tenta DataStore API primeiro (mais rápido — query SQL)
    const dsUrl = `https://dados.cvm.gov.br/api/3/action/datastore_search?resource_id=${resource.id}&filters={"CNPJ_CIA":"${cnpjClean}"}&limit=20`;
    try {
      const ds = await fetchJson(dsUrl);
      const records = ds?.result?.records || [];

      for (const rec of records) {
        // Monta URL de download do documento
        // Os registros têm campo LINK_DOC ou podemos construir via ENET
        const linkCvm = rec.LINK_DOC
          || (rec.NUM_SEQ_DOC
              ? `https://www.rad.cvm.gov.br/ENET/frmExibirArquivoIPE.aspx?NumeroSequencialDocumento=${rec.NUM_SEQ_DOC}&CodigoTipoDocumento=${rec.COD_TIPO_DOC || ''}&DataApresentacao=${rec.DT_REFER || ''}&NumeroSequencialRegistroCvm=${rec.NUM_SEQ_REGST || ''}&CodigoInstituicao=1`
              : null);

        docs.push({
          tipo:      label,
          descricao: descricao,
          freq:      freq,
          empresa:   rec.DENOM_CIA || rec.NOME_CIA || '',
          cnpj:      rec.CNPJ_CIA || cnpjClean,
          periodo:   rec.DT_REFER || rec.DT_INI_EXERC || rec.DT_RECEB || '',
          versao:    rec.VERSAO    || '1',
          situacao:  rec.SIT_REG   || 'ATIVO',
          link:      linkCvm,
          linkEnet:  `https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx?CodCVM=&CNPJ=${cnpjClean}&DENOM_CIA=&ANO=&CATEG_DOC=${tipo.toUpperCase()}&PERIODO_INI=&PERIODO_FIM=&IDT_FORM=&SIT=A`,
        });
      }
    } catch {
      // Se DataStore falhar, retorna o link direto para o recurso CSV/página
      docs.push({
        tipo:      label,
        descricao: descricao,
        freq:      freq,
        empresa:   '',
        cnpj:      cnpjClean,
        periodo:   resource.name || '',
        versao:    '—',
        situacao:  'CSV',
        link:      resource.url,
        linkEnet:  `https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx?CNPJ=${cnpjClean}&CATEG_DOC=${tipo.toUpperCase()}`,
      });
      break; // um fallback por tipo é suficiente
    }
  }

  return docs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Função principal: busca todos os documentos de um ticker
// ─────────────────────────────────────────────────────────────────────────────
async function getDocumentsByCnpj(ticker, cnpj) {
  if (!cnpj) return { available: false, reason: 'sem_cnpj', docs: [] };

  const cnpjClean = cleanCnpj(cnpj);
  const cacheKey  = `cvm:docs:${cnpjClean}`;

  const cached = get(cacheKey);
  if (cached) return cached;

  // Busca todos os tipos em paralelo
  const results = await Promise.allSettled(
    DOC_TYPES.map(t => fetchDocsByType(cnpjClean, t))
  );

  // Agrega resultados
  const allDocs = [];
  results.forEach(r => {
    if (r.status === 'fulfilled') allDocs.push(...r.value);
  });

  // Ordena por período (mais recente primeiro) e limita a 30
  allDocs.sort((a, b) => (b.periodo || '').localeCompare(a.periodo || ''));
  const docs = allDocs.slice(0, 30);

  // Links diretos para o portal ENET (sempre disponível, independente dos docs)
  const enetLinks = [
    {
      label:     'Consultar todos os documentos no ENET',
      descricao: 'Portal de consulta de documentos da CVM',
      link:      `https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx?CNPJ=${cnpjClean}`,
    },
    {
      label:     'DFP — Demonstrações Financeiras Anuais',
      descricao: 'Balanço patrimonial, DRE, fluxo de caixa',
      link:      `https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx?CNPJ=${cnpjClean}&CATEG_DOC=DFP`,
    },
    {
      label:     'ITR — Informações Trimestrais',
      descricao: 'Resultados dos últimos trimestres',
      link:      `https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx?CNPJ=${cnpjClean}&CATEG_DOC=ITR`,
    },
    {
      label:     'FRE — Formulário de Referência',
      descricao: 'Governança, remuneração, fatores de risco',
      link:      `https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx?CNPJ=${cnpjClean}&CATEG_DOC=FRE`,
    },
    {
      label:     'IPE — Fatos Relevantes e Comunicados',
      descricao: 'Avisos, fatos relevantes, atas de reunião',
      link:      `https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx?CNPJ=${cnpjClean}&CATEG_DOC=IPE`,
    },
  ];

  const response = {
    available: true,
    ticker,
    cnpj,
    cnpjClean,
    docs,
    enetLinks,
    updatedAt: new Date().toISOString(),
  };

  // Cache por 6 horas (documentos não mudam com frequência)
  set(cacheKey, response, 6 * 60 * 60);

  return response;
}

module.exports = { getDocumentsByCnpj, cleanCnpj, DOC_TYPES };
