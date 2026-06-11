const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');

// Use memory storage for Vercel/serverless
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) cb(null, true);
    else cb(new Error('Only .xlsx / .xls files are accepted'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Symbol → input field id mapping (matches the CENPEEP sheet)
const SYM_MAP = {
  L: 'L', Ffw: 'Ffw', Fin: 'Fin',
  Cba: 'Cba', Cfa: 'Cfa', Pfa: 'Pfa', Pba: 'Pba',
  M: 'M', A: 'A', VM: 'VM', FC: 'FC', GCV: 'GCV', S: 'S',
  O2in: 'O2in', COin: 'COin', O2out: 'O2out', COout: 'COout',
  Tgi: 'Tgi', Tgo: 'Tgo', Tpai: 'Tpai', Tpao: 'Tpao',
  Tsai: 'Tsai', Tsao: 'Tsao', Fsa: 'Fsa', Fpa: 'Fpa',
  Tref: 'Tref',
  // Design — proximate
  Md: 'Md', Ad: 'Ad', VMd: 'VMd', FCd: 'FCd',
  // Design — ultimate
  Cd: 'Cd', Sd: 'Sd', Hd: 'Hd', Nd: 'Nd', Od: 'Od',
  Gcvd: 'GCVd', GCVd: 'GCVd',
  Trad: 'Trad', Mwvd: 'Mwvd'
};

// Parse the CENPEEP Excel buffer and extract all Input-row values
function parseSheet(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });

  // Try the known sheet name, fall back to first sheet
  const sheetName = wb.SheetNames.includes('CenPeep Corrected')
    ? 'CenPeep Corrected'
    : wb.SheetNames[0];

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const extracted = {};
  const rawRows = [];
  let designMdSeen = false;
  let designAdSeen = false;

  for (const row of rows) {
    const particulars = row[0];
    const uom = row[1];
    const symbol = row[2];
    const formula = row[3];
    const value = row[4];

    if (!symbol || value === null || value === undefined) continue;

    // Only pull "Input" rows (skip formula rows)
    const isInput =
      typeof formula === 'string' && formula.trim().toLowerCase() === 'input';

    // Also pull rows with a plain numeric value in col D
    const isPlainValue = (formula === null || formula === undefined) && typeof value === 'number';

    if (!isInput && !isPlainValue) continue;

    const sym = String(symbol).trim();
    let fieldId = SYM_MAP[sym] || SYM_MAP[sym.toLowerCase()];

    // Handle duplicate Md / Ad symbols
    if (sym === 'Md' && designMdSeen) fieldId = 'Md2';
    if (sym === 'Md' && !designMdSeen) {
      fieldId = 'Md';
      designMdSeen = true;
    }

    if (sym === 'Ad' && designAdSeen) fieldId = 'Ad2';
    if (sym === 'Ad' && !designAdSeen) {
      fieldId = 'Ad';
      designAdSeen = true;
    }

    if (!fieldId) continue;

    const numVal = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numVal)) continue;

    extracted[fieldId] = numVal;
    rawRows.push({
      particulars: particulars || sym,
      uom: uom || '',
      symbol: sym,
      value: numVal
    });
  }

  return { extracted, rawRows, sheetName };
}

// POST /api/upload
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }

    const { extracted, rawRows, sheetName } = parseSheet(req.file.buffer);

    res.json({
      ok: true,
      filename: req.file.originalname,
      sheetName,
      extracted,
      rawRows,
      totalFields: Object.keys(extracted).length
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;