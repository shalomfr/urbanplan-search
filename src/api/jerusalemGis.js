// Jerusalem Municipality GIS client.
// Documentation: src/api/jerusalemGis.api.md

// Always go through the host's /jergis path. In dev Vite proxies it; in
// production the deploy target (e.g. Render) must rewrite /jergis/* ->
// https://jergisinfohub.jerusalem.muni.il/Services/api/:splat. Direct calls
// to jergisinfohub.jerusalem.muni.il fail CORS in the browser.
const JERGIS_BASE = '/jergis';

const JERGIS_UI_BASE = 'https://jergisinfohub.jerusalem.muni.il/UI/GisMeidaT/index.html';
const YKPUB_BASE = 'https://ykpubdata.jerusalem.muni.il/#/Rishui';
const JERBASIC_API = 'https://jerbasicserviceapi.jerusalem.muni.il/api/Db/ExecuteGetJSON';

// SystemCode per category — used when calling jerbasicserviceapi document APIs.
// Categories not listed (13, 40, 47, 50) don't have per-record documents.
export const CATEGORY_SYSTEM_CODE = {
  12: '26400001', // תב"ע
  16: '26400023', // תצ"ר
  14: '26400024', // מידע להיתר
  1:  '26400046', // רישוי בנייה
  6:  '26400056', // פיקוח / עבירות בנייה
  84: '26400086', // חוות דעת שימור
  23: '26400230', // אתרים לשימור
};

export const CATEGORY_META = {
  12: { name: 'YeudayKarka',         label: 'תב"ע (החלות על המגרש)',     priority: 1 },
  13: { name: 'Migrashim',           label: 'מגרשים / זכויות בנייה',      priority: 2 },
  47: { name: 'YeudayKarkaCityAll',  label: 'תוכניות החלות על כל העיר',  priority: 3 },
  50: { name: 'TochnitMechuziVeartzi', label: 'תוכניות מחוזיות וארציות', priority: 4 },
  40: { name: 'TohniyotAvShunati',   label: 'תכניות אב ומתאר שכונתיות',  priority: 5 },
  1:  { name: 'RishuiBniya',         label: 'רישוי בנייה',                priority: 6 },
  14: { name: 'KaveyBniyan',         label: 'מידע להיתר',                 priority: 7 },
  6:  { name: 'PikuachBniya',        label: 'עבירות בנייה',               priority: 8 },
  16: { name: 'Tazar',               label: 'תצ"ר',                       priority: 9 },
  23: { name: 'AtarimLeshimur',      label: 'אתרים לשימור',               priority: 10 },
  84: { name: 'ShimurChavatDaat',    label: 'חוות דעת שימור',             priority: 11 },
};

const SUB_TOPIC_LABELS = {
  ArchivInfo:   'מסמכי תוכנית (PDF)',
  ProcessInfo:  'תהליך אישור',
  VahadaInfo:   'החלטות ועדה',
  LocationInfo: 'נתוני מיקום',
  BakashalInfo: 'תיאור הבקשה',
  AreasInfo:    'שטחים',
};

function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, v);
  });
  return sp.toString();
}

async function jergisFetch(path) {
  const res = await fetch(`${JERGIS_BASE}${path}`);
  if (!res.ok) throw new Error(`Jerusalem GIS ${path} failed: ${res.status}`);
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export function buildJergisUiUrl({ gush, helka, ...rest }) {
  return `${JERGIS_UI_BASE}?${buildQuery({ gush, helka, ...rest })}`;
}

export async function getGeneralInfo(params) {
  return jergisFetch(`/GetGeneralInfo?${buildQuery(params)}`);
}

export async function getAvailableCategories(params) {
  const list = await jergisFetch(`/MetaDataObjects?${buildQuery(params)}`);
  return Array.isArray(list) ? list.map((x) => x.IdInformMain) : [];
}

export async function getCategory(id, params) {
  const [details, fields, subTopics] = await Promise.all([
    jergisFetch(`/MetaDataObjectsDetails/${id}?${buildQuery(params)}`),
    jergisFetch(`/MetaDataFields/${id}`),
    jergisFetch(`/GetSubTopic/${id}`).catch(() => null),
  ]);
  return {
    id,
    name: details?.gisObjectName || CATEGORY_META[id]?.name,
    label: details?.gisObjectAlias || CATEGORY_META[id]?.label,
    showByDefault: details?.gisShowTableByDefault ?? true,
    records: details?.gisDataObject || [],
    fields: fields || [],
    subTopics: subTopics || [],
  };
}

// Convert a raw sub-topic UrlPage like:
//   javascript:window.open('https://ykpubdata.jerusalem.muni.il/...?TikNum={0}&SystemCode=26400001','');
// into a plain HTTPS URL with placeholders substituted from `record`.
function resolveSubTopicUrl(subTopic, record) {
  const raw = (subTopic.UrlPage || '').trim();
  const m = raw.match(/window\.open\('([^']+)'/);
  let url = m ? m[1] : raw;
  (subTopic.gisParams || []).forEach((p, idx) => {
    const order = p.gisParamOrder ?? idx;
    const value = record?.[p.gisParamName] ?? '';
    url = url.split(`{${idx}}`).join(encodeURIComponent(value));
    url = url.split(`{${order}}`).join(encodeURIComponent(value));
  });
  return url;
}

export function buildRecordLinks(subTopics, record) {
  return (subTopics || []).map((st) => {
    const kindMatch = (st.UrlPage || '').match(/#\/Rishui\/(\w+)/);
    const kind = kindMatch?.[1];
    return {
      id: st.gisIdSubTopic,
      label: SUB_TOPIC_LABELS[kind] || st.InformSubTopicName,
      kind,
      url: resolveSubTopicUrl(st, record),
      sortOrder: st.SortOrder ?? 99,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

// ---- Document API (jerbasicserviceapi.jerusalem.muni.il) ----
// POST endpoint that returns direct PDF URLs (urlDoc) for plans, processes, and committee decisions.
// Casing of parameter keys is inconsistent across stored procs — copy from the table verbatim.

async function callProc(procName, parameters) {
  const res = await fetch(JERBASIC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ProcName: procName, Cnn: 'cnnGisYk', Parameters: parameters }),
  });
  if (!res.ok) throw new Error(`jerbasicserviceapi ProcName=${procName} failed: ${res.status}`);
  return res.json();
}

const DOC_DESC_PRIORITY = { 'תקנון': 1, 'תשריט': 2, 'נספח': 3 };

export async function getPlanDocuments(sysId, tikNum) {
  const list = await callProc(242700452, { sysId: String(sysId), tikNum: String(tikNum) });
  return (list || []).map((d) => ({
    tikNum: d.tikNum,
    description: d.documentDescr,
    url: d.urlDoc,
    extension: d.docExtension || null,
    date: d.documentFullDate || d.documentDate || d.dateIn || null,
  })).sort((a, b) => (DOC_DESC_PRIORITY[a.description] ?? 99) - (DOC_DESC_PRIORITY[b.description] ?? 99));
}

export async function getProcessInfo(systemId, tikNum) {
  const params = { SystemID: String(systemId), TikNum: String(tikNum) };
  const [stages, details] = await Promise.all([
    callProc(242700448, params).catch(() => []),
    callProc(242700451, params).catch(() => []),
  ]);
  return { stages: stages || [], details: details || [] };
}

export async function getCommitteeDecisions(systemId, tikNum) {
  return callProc(242700453, { systemID: String(systemId), tikNum: String(tikNum) });
}

// Map category -> record field name holding the tikNum identifier.
const CATEGORY_TIKNUM_FIELD = {
  1:  'tik_num',     // רישוי בנייה
  6:  'tik_num',     // פיקוח
  12: 'mezahe',      // תב"ע
  14: 'tik_num',     // מידע להיתר
  16: 'tazar_num',   // תצ"ר
  23: 'tikNum',      // אתרים לשימור
  84: 'tik_num',     // חוות דעת שימור
};

// Resolve a record (any category) to the right sysId + tikNum for the document API.
// Returns null if this category doesn't have documents (e.g. plot/zoning categories).
export function getRecordDocumentKey(categoryId, record) {
  // Prefer the systemCode embedded in the record (categories 1, 6 expose it).
  const sysId = record?.systemCode ?? CATEGORY_SYSTEM_CODE[categoryId];
  if (!sysId) return null;
  const field = CATEGORY_TIKNUM_FIELD[categoryId];
  const tikNum = field ? record?.[field] : null;
  if (!tikNum) return null;
  return { sysId: String(sysId), tikNum: String(tikNum) };
}

// One-shot: given gush/helka, fetch all available categories with their records.
export async function fetchAllPlanningInfo({ gush, helka, ...rest }) {
  const params = { gush, helka, ...rest };

  const [generalInfo, availableIds] = await Promise.all([
    getGeneralInfo(params).catch(() => null),
    getAvailableCategories(params),
  ]);

  const categories = await Promise.all(
    availableIds.map((id) =>
      getCategory(id, params).catch((err) => ({ id, error: err.message, records: [], fields: [], subTopics: [] }))
    )
  );

  categories.sort((a, b) => (CATEGORY_META[a.id]?.priority ?? 99) - (CATEGORY_META[b.id]?.priority ?? 99));

  return {
    query: { gush, helka },
    generalInfo,
    uiUrl: buildJergisUiUrl(params),
    categories,
  };
}
