let xlsxModulePromise = null;
const getXlsx = () => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx');
  }
  return xlsxModulePromise;
};

const MAX_ROW_COUNT = 200;
const MAX_COL_COUNT = 60;
const MAX_CELL_TEXT = 500;

const clampInt = (value, fallback, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
};

const cellText = (cell) => {
  if (!cell) return null;
  const raw = cell.w ?? (cell.v !== undefined && cell.v !== null ? String(cell.v) : null);
  if (raw === null || raw === '') return null;
  return raw.length > MAX_CELL_TEXT ? raw.slice(0, MAX_CELL_TEXT) : raw;
};

export const buildSheetWindow = (XLSX, workbook, request) => {
  const sheets = workbook.SheetNames;
  if (sheets.length === 0) throw new Error('File không có sheet nào');
  const sheet = request.sheet || sheets[0];
  const worksheet = workbook.Sheets[sheet];
  if (!worksheet) throw new Error(`Không tìm thấy sheet "${sheet}"`);

  const ref = worksheet['!ref'];
  const range = ref ? XLSX.utils.decode_range(ref) : null;
  const maxRow = range ? range.e.r + 1 : 0;
  const maxCol = range ? range.e.c + 1 : 0;

  const rowCount = clampInt(request.rowCount, 40, 1, MAX_ROW_COUNT);
  const colCount = clampInt(request.colCount, 14, 1, MAX_COL_COUNT);
  const rowStart = clampInt(request.rowStart, 1, 1, 1048576);
  const colStart = clampInt(request.colStart, 1, 1, 16384);

  const rows = [];
  for (let r = rowStart; r < rowStart + rowCount; r += 1) {
    const line = [];
    for (let c = colStart; c < colStart + colCount; c += 1) {
      line.push(cellText(worksheet[XLSX.utils.encode_cell({ r: r - 1, c: c - 1 })]));
    }
    rows.push(line);
  }

  const rowEnd = rowStart + rowCount - 1;
  const colEnd = colStart + colCount - 1;
  const merges = (worksheet['!merges'] || [])
    .map((m) => ({ startRow: m.s.r + 1, startCol: m.s.c + 1, endRow: m.e.r + 1, endCol: m.e.c + 1 }))
    .filter((m) => m.endRow >= rowStart && m.startRow <= rowEnd && m.endCol >= colStart && m.startCol <= colEnd);

  return { sheets, sheet, maxRow, maxCol, rowStart, colStart, rows, merges };
};

export const createFileSource = (file) => {
  let workbookPromise = null;
  const getWorkbook = async () => {
    const XLSX = await getXlsx();
    if (!workbookPromise) {
      workbookPromise = file
        .arrayBuffer()
        .then((buffer) => ({
          XLSX,
          workbook: XLSX.read(buffer, { type: 'array', cellStyles: false, cellDates: false })
        }))
        .catch((err) => {
          workbookPromise = null;
          throw err;
        });
    }
    return workbookPromise;
  };
  return {
    key: `file:${file.name}:${file.size}:${file.lastModified}`,
    load: async (request) => {
      const { XLSX, workbook } = await getWorkbook();
      return buildSheetWindow(XLSX, workbook, request);
    },
  };
};
