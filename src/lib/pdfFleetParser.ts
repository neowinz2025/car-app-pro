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
  const part1 = m[1].padStart(2, '0');
  const part2 = m[2].padStart(2, '0');
  return `${part1}/${part2}/${m[3]}`;
}

export function isoToDisplayDate(iso: string): string {
  if (!iso) return '';
  const [y, mo, d] = iso.split('-');
  return `${d}/${mo}/${y}`;
}

function isoToAmericanDate(iso: string): string {
  if (!iso) return '';
  const [y, mo, d] = iso.split('-');
  return `${mo}/${d}/${y}`;
}

function brDateToISO(br: string): string {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  return `${m[3]}-${m[2]}-${m[1]}`;
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

function parseRowsByAllDates(
  allPageRows: PageRow[][],
  headerPageIdx: number,
  headerRowIdx: number,
  headerTokens: string[]
): Record<string, Record<string, number>> {
  const grupoIdx = headerTokens.indexOf('Grupo');

  const dateColNames = ['Data Ret.', 'Data Dev.', 'Data Res.'];
  let dateIdx = -1;
  for (const name of dateColNames) {
    const idx = headerTokens.indexOf(name);
    if (idx !== -1) { dateIdx = idx; break; }
  }

  const byDate: Record<string, Record<string, number>> = {};

  for (let pi = headerPageIdx; pi < allPageRows.length; pi++) {
    const startRow = pi === headerPageIdx ? headerRowIdx + 1 : 0;
    for (let ri = startRow; ri < allPageRows[pi].length; ri++) {
      const tokens = rowToTokens(allPageRows[pi][ri]);
      if (tokens.length <= grupoIdx) continue;
      const grupo = tokens[grupoIdx];
      if (!KNOWN_GRUPOS.includes(grupo)) continue;

      let dateISO = 'sem-data';
      if (dateIdx !== -1 && tokens.length > dateIdx) {
        const rawDate = normalizeDateToken(tokens[dateIdx]);
        if (rawDate) {
          const converted = brDateToISO(rawDate);
          if (converted) dateISO = converted;
        }
      }

      if (!byDate[dateISO]) byDate[dateISO] = {};
      byDate[dateISO][grupo] = (byDate[dateISO][grupo] ?? 0) + 1;
    }
  }

  return byDate;
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

function fallbackExtractAllDates(allPageRows: PageRow[][]): Record<string, Record<string, number>> {
  const byDate: Record<string, Record<string, number>> = {};
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

        const dateToken = tokens.find((t) => normalizeDateToken(t) !== '');
        let dateISO = 'sem-data';
        if (dateToken) {
          const normalized = normalizeDateToken(dateToken);
          const converted = brDateToISO(normalized);
          if (converted) dateISO = converted;
        }

        if (!byDate[dateISO]) byDate[dateISO] = {};
        byDate[dateISO][token] = (byDate[dateISO][token] ?? 0) + 1;
      }
    }
  }
  return byDate;
}

export async function parsePDFByGrupo(
  buffer: ArrayBuffer,
  filterDateISO: string | null = null
): Promise<Record<string, number>> {
  const filterDate = filterDateISO ? isoToAmericanDate(filterDateISO) : null;

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

export async function parsePDFByGrupoAllDates(
  buffer: ArrayBuffer
): Promise<Record<string, Record<string, number>>> {
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  const allPageRows: PageRow[][] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    allPageRows.push(await extractPageRows(pdf, pageNum));
  }

  const header = findHeaderRow(allPageRows);

  if (!header) {
    return fallbackExtractAllDates(allPageRows);
  }

  const byDate = parseRowsByAllDates(
    allPageRows,
    header.pageIdx,
    header.rowIdx,
    header.tokens
  );

  const total = Object.values(byDate).reduce(
    (s, counts) => s + Object.values(counts).reduce((a, b) => a + b, 0),
    0
  );

  if (total === 0) {
    return fallbackExtractAllDates(allPageRows);
  }

  return byDate;
}

export function parseSpreadsheetRowsByDate(
  rows: Record<string, string>[],
  dateColumnKey: string,
  filterDateISO: string | null
): Record<string, number> {
  const filterDateBR = filterDateISO ? isoToDisplayDate(filterDateISO) : null;
  const filterDateUS = filterDateISO ? isoToAmericanDate(filterDateISO) : null;
  const counts: Record<string, number> = {};

  for (const row of rows) {
    const grupo = (row['Grupo'] ?? '').trim();
    if (!grupo) continue;

    if (filterDateBR && dateColumnKey) {
      const rawDate = (row[dateColumnKey] ?? '').trim();
      const normalized = normalizeDateToken(rawDate) || rawDate;
      if (normalized !== filterDateBR && normalized !== filterDateUS) continue;
    }

    counts[grupo] = (counts[grupo] ?? 0) + 1;
  }

  return counts;
}

export function parseSpreadsheetRowsByAllDates(
  rows: Record<string, string>[],
  dateColumnKey: string
): Record<string, Record<string, number>> {
  const byDate: Record<string, Record<string, number>> = {};

  for (const row of rows) {
    const grupo = (row['Grupo'] ?? '').trim();
    if (!grupo) continue;

    let dateISO = 'sem-data';
    if (dateColumnKey) {
      const rawDate = (row[dateColumnKey] ?? '').trim();
      const normalized = normalizeDateToken(rawDate) || rawDate;
      const converted = brDateToISO(normalized);
      if (converted) {
        dateISO = converted;
      } else if (rawDate) {
        const usMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (usMatch) {
          const asBR = `${usMatch[2].padStart(2,'0')}/${usMatch[1].padStart(2,'0')}/${usMatch[3]}`;
          const isoFromUS = brDateToISO(asBR);
          if (isoFromUS) dateISO = isoFromUS;
        }
      }
    }

    if (!byDate[dateISO]) byDate[dateISO] = {};
    byDate[dateISO][grupo] = (byDate[dateISO][grupo] ?? 0) + 1;
  }

  return byDate;
}
