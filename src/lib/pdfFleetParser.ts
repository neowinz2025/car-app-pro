import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export const KNOWN_GRUPOS = [
  'AM','AT','B','BS','C','CA','CX','CG','E','EA',
  'G1','G2','I','IE','J','J2','LX','SG','SM','SP',
  'SU','SV','T','TS','TT','VU','VC',
];

function normalizeDateToken(raw: string): string {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const day = m[1].padStart(2, '0');
  const month = m[2].padStart(2, '0');
  return `${day}/${month}/${m[3]}`;
}

export function isoToDisplayDate(iso: string): string {
  if (!iso) return '';
  const [y, mo, d] = iso.split('-');
  return `${d}/${mo}/${y}`;
}

type PageRow = { x: number; str: string }[];

async function extractPageRows(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<PageRow[]> {
  const page = await pdf.getPage(pageNum);
  const content = await page.getTextContent();

  const byY: Record<number, PageRow> = {};
  for (const item of content.items) {
    if (!('str' in item) || !item.str.trim()) continue;
    const y = Math.round((item as { transform: number[] }).transform[5]);
    const x = Math.round((item as { transform: number[] }).transform[4]);
    if (!byY[y]) byY[y] = [];
    byY[y].push({ x, str: item.str });
  }

  return Object.keys(byY)
    .map(Number)
    .sort((a, b) => b - a)
    .map((y) => byY[y].sort((a, b) => a.x - b.x));
}

function rowToTokens(row: PageRow): string[] {
  return row.map((r) => r.str.trim()).filter(Boolean);
}

function findHeaderRow(rows: PageRow[][]): { rowIdx: number; pageIdx: number; tokens: string[] } | null {
  for (let pi = 0; pi < rows.length; pi++) {
    for (let ri = 0; ri < rows[pi].length; ri++) {
      const tokens = rowToTokens(rows[pi][ri]);
      if (tokens.includes('Grupo')) {
        return { pageIdx: pi, rowIdx: ri, tokens };
      }
    }
  }
  return null;
}

function parseRowsWithDateFilter(
  allPageRows: PageRow[][],
  headerPageIdx: number,
  headerRowIdx: number,
  headerTokens: string[],
  filterDate: string | null
): Record<string, number> {
  const grupoIdx = headerTokens.indexOf('Grupo');

  const dateColNames = ['Data Ret.', 'Data Dev.', 'Data Res.'];
  let dateIdx = -1;
  for (const name of dateColNames) {
    const idx = headerTokens.indexOf(name);
    if (idx !== -1) { dateIdx = idx; break; }
  }

  const counts: Record<string, number> = {};

  for (let pi = headerPageIdx; pi < allPageRows.length; pi++) {
    const startRow = pi === headerPageIdx ? headerRowIdx + 1 : 0;
    for (let ri = startRow; ri < allPageRows[pi].length; ri++) {
      const tokens = rowToTokens(allPageRows[pi][ri]);
      if (tokens.length <= grupoIdx) continue;
      const grupo = tokens[grupoIdx];
      if (!KNOWN_GRUPOS.includes(grupo)) continue;

      if (filterDate && dateIdx !== -1 && tokens.length > dateIdx) {
        const rowDate = normalizeDateToken(tokens[dateIdx]);
        if (rowDate !== filterDate) continue;
      }

      counts[grupo] = (counts[grupo] ?? 0) + 1;
    }
  }

  return counts;
}

function fallbackExtract(allPageRows: PageRow[][], filterDate: string | null): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const rows of allPageRows) {
    for (const row of rows) {
      const tokens = rowToTokens(row);
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!KNOWN_GRUPOS.includes(token)) continue;
        const prev = tokens[i - 1] ?? '';
        const next = tokens[i + 1] ?? '';
        const looksLikePlate =
          /^[A-Z]{3}\d[A-Z\d]\d{2}$/.test(prev) || /^[A-Z]{3}\d{4}$/.test(prev);
        const nextIsModel = /^[A-Z]/.test(next) && next.length > 2;
        if (!looksLikePlate && !nextIsModel) continue;

        if (filterDate) {
          const dateInRow = tokens.find((t) => normalizeDateToken(t) === filterDate);
          if (!dateInRow) continue;
        }

        counts[token] = (counts[token] ?? 0) + 1;
      }
    }
  }
  return counts;
}

export async function parsePDFByGrupo(
  buffer: ArrayBuffer,
  filterDateISO: string | null = null
): Promise<Record<string, number>> {
  const filterDate = filterDateISO ? isoToDisplayDate(filterDateISO) : null;

  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  const allPageRows: PageRow[][] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    allPageRows.push(await extractPageRows(pdf, pageNum));
  }

  const header = findHeaderRow(allPageRows);

  if (!header) {
    return fallbackExtract(allPageRows, filterDate);
  }

  const counts = parseRowsWithDateFilter(
    allPageRows,
    header.pageIdx,
    header.rowIdx,
    header.tokens,
    filterDate
  );

  if (Object.values(counts).reduce((s, v) => s + v, 0) === 0) {
    return fallbackExtract(allPageRows, filterDate);
  }

  return counts;
}

export function parseSpreadsheetRowsByDate(
  rows: Record<string, string>[],
  dateColumnKey: string,
  filterDateISO: string | null
): Record<string, number> {
  const filterDate = filterDateISO ? isoToDisplayDate(filterDateISO) : null;
  const counts: Record<string, number> = {};

  for (const row of rows) {
    const grupo = (row['Grupo'] ?? '').trim();
    if (!grupo) continue;

    if (filterDate && dateColumnKey) {
      const rawDate = (row[dateColumnKey] ?? '').trim();
      const normalized = normalizeDateToken(rawDate) || rawDate;
      if (normalized !== filterDate) continue;
    }

    counts[grupo] = (counts[grupo] ?? 0) + 1;
  }


  return counts;
}
