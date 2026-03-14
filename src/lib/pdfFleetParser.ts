import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

const KNOWN_GRUPOS = [
  'AM','AT','B','BS','C','CA','CX','CG','E','EA',
  'G1','G2','I','IE','J','J2','LX','SG','SM','SP',
  'SU','SV','T','TS','TT','VU','VC',
];

function extractGrupoFromText(allText: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const lines = allText.split('\n').map(normalizeLine).filter(Boolean);

  let headerLineIdx = -1;
  let grupoColIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(' ');
    const gIdx = parts.findIndex((p) => p === 'Grupo');
    if (gIdx !== -1) {
      headerLineIdx = i;
      grupoColIdx = gIdx;
      break;
    }
  }

  if (headerLineIdx === -1) {
    return extractGrupoFallback(allText);
  }

  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const parts = lines[i].split(' ');
    if (grupoColIdx < parts.length) {
      const candidate = parts[grupoColIdx];
      if (KNOWN_GRUPOS.includes(candidate)) {
        counts[candidate] = (counts[candidate] ?? 0) + 1;
      }
    }
  }

  if (Object.values(counts).reduce((s, v) => s + v, 0) === 0) {
    return extractGrupoFallback(allText);
  }

  return counts;
}

function extractGrupoFallback(allText: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const tokens = allText.split(/\s+/);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (KNOWN_GRUPOS.includes(token)) {
      const prev = tokens[i - 1] ?? '';
      const next = tokens[i + 1] ?? '';
      const looksLikePlate = /^[A-Z]{3}\d[A-Z\d]\d{2}$/.test(prev) || /^[A-Z]{3}\d{4}$/.test(prev);
      const nextIsModel = /^[A-Z]/.test(next) && next.length > 2;
      if (looksLikePlate || nextIsModel) {
        counts[token] = (counts[token] ?? 0) + 1;
      }
    }
  }

  return counts;
}

export async function parsePDFByGrupo(buffer: ArrayBuffer): Promise<Record<string, number>> {
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  let fullText = '';

  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 2); pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const itemsByY: Record<number, { x: number; str: string }[]> = {};
    for (const item of content.items) {
      if ('str' in item && item.str.trim()) {
        const y = Math.round((item as { transform: number[] }).transform[5]);
        const x = Math.round((item as { transform: number[] }).transform[4]);
        if (!itemsByY[y]) itemsByY[y] = [];
        itemsByY[y].push({ x, str: item.str });
      }
    }

    const sortedYs = Object.keys(itemsByY)
      .map(Number)
      .sort((a, b) => b - a);

    for (const y of sortedYs) {
      const row = itemsByY[y].sort((a, b) => a.x - b.x);
      fullText += row.map((r) => r.str).join(' ') + '\n';
    }
  }

  return extractGrupoFromText(fullText);
}
