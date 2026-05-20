// Jerusalem Municipality GIS client.
// Documentation: src/api/jerusalemGis.api.md

const JERGIS_BASE = import.meta.env.DEV
  ? '/jergis'
  : 'https://jergisinfohub.jerusalem.muni.il/Services/api';

const JERGIS_UI_BASE = 'https://jergisinfohub.jerusalem.muni.il/UI/GisMeidaT/index.html';
const YKPUB_BASE = 'https://ykpubdata.jerusalem.muni.il/#/Rishui';

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
