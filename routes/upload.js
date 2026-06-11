const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const XLSX    = require('xlsx');
const path    = require('path');
const fs      = require('fs');

// Store uploads in /uploads (temp)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({
  storage,
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
  // Design — ultimate (second Md/Ad map to Md2/Ad2)
  Cd: 'Cd', Sd: 'Sd', Hd: 'Hd', Nd: 'Nd', Od: 'Od',
  Gcvd: 'GCVd', GCVd: 'GCVd',
  Trad: 'Trad', Mwvd: 'Mwvd'
};

// Parse the CENPEEP Excel and extract all Input-row values
function parseSheet(filePath) {
  const wb = XLSX.readFile(filePath);
  // Try the known sheet name, fall back to first sheet
  const sheetName = wb.SheetNames.includes('CenPeep Corrected')
    ? 'CenPeep Corrected'
    : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const extracted = {};   // { fieldId: value }
  const rawRows   = [];   // [{ particulars, uom, symbol, value }]
  let   designMdSeen  = false;
  let   designAdSeen  = false;

  for (const row of rows) {
    const particulars = row[0];
    const uom         = row[1];
    const symbol      = row[2];
    const formula     = row[3];
    const value       = row[4];

    if (!symbol || value === null || value === undefined) continue;

    // Only pull "Input" rows (skip formula rows — the front-end recalculates those)
    const isInput = typeof formula === 'string' && formula.trim().toLowerCase() === 'input';
    // Also pull rows with a plain numeric value in col D (design conditions have null formula)
    const isPlainValue = (formula === null || formula === undefined) && typeof value === 'number';

    if (!isInput && !isPlainValue) continue;

    const sym = String(symbol).trim();
    let   fieldId = SYM_MAP[sym] || SYM_MAP[sym.toLowerCase()];

    // Handle duplicate Md / Ad symbols (design section re-uses same symbol names)
    if (sym === 'Md' && designMdSeen) fieldId = 'Md2';
    if (sym === 'Md' && !designMdSeen) { fieldId = 'Md'; designMdSeen = true; }
    if (sym === 'Ad' && designAdSeen) fieldId = 'Ad2';
    if (sym === 'Ad' && !designAdSeen) { fieldId = 'Ad'; designAdSeen = true; }

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
    if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });

    const { extracted, rawRows, sheetName } = parseSheet(req.file.path);

    // Clean up temp file
    fs.unlink(req.file.path, () => {});

    res.json({
      ok:           true,
      filename:     req.file.originalname,
      sheetName,
      extracted,          // { fieldId: value } — used by front-end to populate inputs
      rawRows,            // human-readable table for confirmation
      totalFields:  Object.keys(extracted).length
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
