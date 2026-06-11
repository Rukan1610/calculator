/* ════════════════════════════════════════════════════════════════════
   CENPEEP  —  script.js
   Handles: calculation · Excel upload → auto-populate · DB save · toast
   ════════════════════════════════════════════════════════════════════ */

// ── Tiny helpers ─────────────────────────────────────────────────────────────
const v    = id => { const el = document.getElementById(id); return el ? parseFloat(el.value) || 0 : 0; };
const fmt  = (n, d=4) => (typeof n === 'number' && !isNaN(n)) ? n.toFixed(d) : '—';
const fmt2 = n => fmt(n, 2);

// ── DB health pill ────────────────────────────────────────────────────────────
async function checkDB() {
  const pill = document.getElementById('db-pill');
  if (!pill) return;
  try {
    const res  = await fetch('/api/health');
    const data = await res.json();
    if (data.db === 'connected') {
      pill.textContent = 'DB Online';
      pill.className   = 'db-pill online';
    } else {
      pill.textContent = 'DB Offline';
      pill.className   = 'db-pill offline';
    }
  } catch {
    pill.textContent = 'DB Offline';
    pill.className   = 'db-pill offline';
  }
}

// ── Toast notification ────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent  = msg;
  t.className    = `toast toast-${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3200);
}

// ── Excel upload → auto-populate ─────────────────────────────────────────────
window._uploadedFilename = null;

function initUpload() {
  const input = document.getElementById('upload-file-input');
  if (!input) return;
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('upload-status');
    statusEl.style.display = 'inline-block';
    statusEl.className      = 'upload-status loading';
    statusEl.textContent    = '⏳ Parsing sheet…';

    const form = new FormData();
    form.append('file', file);

    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || 'Upload failed');

      // Populate every returned field id
      const extracted = data.extracted || {};
      let   populated = 0;
      for (const [fieldId, val] of Object.entries(extracted)) {
        const el = document.getElementById(fieldId);
        if (el && !el.readOnly) {
          el.value = val;
          // Flash the field so users see it changed
          el.style.transition = 'background 0.4s';
          el.style.background = 'rgba(5,150,105,0.12)';
          setTimeout(() => { el.style.background = ''; }, 1200);
          populated++;
        }
      }

      // Recalc CO2 auto-fields
      autoCalcCO2();

      window._uploadedFilename = data.filename;

      statusEl.className   = 'upload-status success';
      statusEl.textContent = `✓ ${populated} fields loaded from "${data.filename}"`;
      showToast(`Excel imported — ${populated} fields auto-populated`, 'success');

    } catch (err) {
      statusEl.className   = 'upload-status error';
      statusEl.textContent = `✗ ${err.message}`;
      showToast(err.message, 'error');
    }

    // Reset the file input so the same file can be re-uploaded
    input.value = '';
  });
}

// ── Core calculation ──────────────────────────────────────────────────────────
function calculate() {
  const M=v('M'),A=v('A'),VM=v('VM'),FC=v('FC'),GCV=v('GCV'),S=v('S');
  const O2in=v('O2in'),O2out=v('O2out'),COout=v('COout'),COin=v('COin');
  const Tgi=v('Tgi'),Tgo=v('Tgo'),Tpai=v('Tpai'),Tpao=v('Tpao');
  const Tsai=v('Tsai'),Tsao=v('Tsao'),Fsa=v('Fsa'),Fpa=v('Fpa');
  const Cba=v('Cba'),Cfa=v('Cfa'),Pfa=v('Pfa'),Pba=v('Pba');
  const Lrad=v('Lrad') || 1.2;
  const Cp=30.6, CVc=8077.8, CVco=2415, Mwv=0.0166;
  const CO2in=v('CO2in'), CO2out=v('CO2out'), COoutp=(COout/1000000)*100;

  // Ultimate analysis
  const FcDc=FC/(1-(1.1*A/100)-M/100), VmDf=100-FcDc;
  const Cdf=FcDc+0.9*(VmDf-14), Hdf=VmDf*((7.35/(VmDf+10))-0.013);
  const Ndf=2.1-(0.012*VmDf), k=(VM+FC)/(VmDf+FcDc);
  const Ca=Cdf*k, H=Hdf*k, N=Ndf*k, O=100-Ca-S-H-M-N-A;

  // Air flow
  const Fta=Fsa+Fpa, Rsa=Fsa/Fta, Rpa=Fpa/Fta;
  const Trai=Tsai*Rsa+Tpai*Rpa;

  // Ash & carbon
  const Cash=Pfa/100*Cfa+Pba/100*Cba, U=A/100*Cash/(100-Cash);
  const N2out=100-(O2out+CO2out+COoutp);

  // Air calculations
  const Sa=(2.66*(Ca-U*100)+7.937*H+0.996*S-O)/23.2;
  const Ea=1+(O2out-COoutp/2)/(0.2682*N2out-(O2out-COoutp));
  const Ma=Sa*Ea*Mwv;

  // Heat
  const Wd=(Ca+S/2.67-100*U)/(12*CO2out);
  const Sh=Wd*Cp*(Tgo-Trai), Sw=1.88*(Tgo-25)+2442+4.2*(25-Trai);

  // Test losses
  const Ldg=Sh*100/(GCV*4.186);
  const Luc=U*CVc*100/GCV;
  const Lmf=Sw*M/(GCV*4.186);
  const Lhf=9*H*Sw/(GCV*4.186);
  const Lco=COoutp*7*CVco*(Ca-100*U)/3/(CO2out+COoutp)/GCV;
  const Lma=Ma*1.88*(Tgo-Trai)*100/(GCV*4.186);
  const BoilerEff=100-(Ldg+Luc+Lmf+Lhf+Lco+Lma+Lrad);

  // Design conditions
  const Cd=v('Cd'),Sd=v('Sd'),Hd=v('Hd'),Od=v('Od');
  const Ad2=v('Ad2'),GCVd=v('GCVd'),Trad=v('Trad'),Mwvd=v('Mwvd');
  const Md=v('Md2');

  // Corrected gas temp
  const AL=(CO2in-CO2out)*0.9*100/CO2out;
  const Tgnl=((AL*Cp*(Tgo-Trai))/(100*Cp))+Tgo;
  const Tgc=(Trad*(Tgi-Tgo)+Tgi*(Tgo-Trai))/(Tgi-Trai);

  // Corrected losses
  const Wdc=(Cd+Sd/2.67-100*U)/(12*CO2out);
  const Shc=Wdc*Cp*(Tgc-Trad);
  const Ldgc=Shc*100/(GCVd*4.186);

  const Kc=Math.exp(0.225*Cd/Hd)-Math.exp(0.225*Ca/H);
  const V_corr=(v('VMd')<17)?0.013*(Ad2*GCV/(A*GCVd))*Kc:0;
  const Lucc=Luc*((Ad2*GCV)/(A*GCVd))+V_corr;

  const Swd=1.88*(Tgc-25)+2442+4.2*(25-Trad);
  const Lmfc=Swd*Md/(GCVd*4.186);
  const Lhfc=9*Hd*Swd/(GCVd*4.186);
  const Lcoc=COoutp*7*CVco*(Cd-100*U)/3/(CO2out+COoutp)/GCVd;

  const Sad=(2.66*(Cd-U*100)+7.937*Hd+0.996*Sd-Od)/23.2;
  const Ead=1+(O2out-COoutp/2)/(0.2682*N2out-(O2out-COoutp));
  const Mad=Sad*Ead*Mwvd;
  const Lmac=Mad*1.88*(Tgc-Trad)*100/(GCVd*4.186);

  const BoilerEffCorr=100-(Ldgc+Lucc+Lmfc+Lhfc+Lcoc+Lmac+Lrad);

  window._results = {
    CO2in,CO2out,COoutp,Trai,Cash,U,Fta,Rsa,Rpa,
    N2out,Sa,Ea,Ma,Wd,Sh,Sw,
    Ldg,Luc,Lmf,Lhf,Lco,Lma,Lrad,BoilerEff,
    AL,Tgnl,Tgc,Ldgc,Lucc,Lmfc,Lhfc,Lcoc,Lmac,BoilerEffCorr,
    inputs: collectInputs()
  };

  renderOutput(window._results);
  showTab('output');
}

// ── Collect input snapshot ────────────────────────────────────────────────────
function collectInputs() {
  const ids=['L','Ffw','Fin','Cba','Cfa','Pfa','Pba','M','A','VM','FC','GCV','S',
    'O2in','CO2in','COin','O2out','CO2out','COout','Tgi','Tgo','Tpai','Tpao',
    'Tsai','Tsao','Fsa','Fpa','Tref',
    'Md','Ad','VMd','FCd','Cd','Sd','Hd','Md2','Nd','Od','Ad2','GCVd','Trad','Mwvd'];
  const labels={
    L:'Unit Load (MW)',Ffw:'Steam Flow (T/hr)',Fin:'Total Coal Flow (T/hr)',
    Cba:'Unburnt C Bottom Ash (%)',Cfa:'Unburnt C Fly Ash (%)',
    Pfa:'% Fly Ash',Pba:'% Bottom Ash',
    M:'Moisture (%)',A:'Ash (%)',VM:'Volatile Matter (%)',
    FC:'Fixed Carbon (%)',GCV:'GCV (kcal/kg)',S:'Sulfur (%)',
    O2in:'O2 APH In (%)',CO2in:'CO2 APH In (%)',COin:'CO APH In (ppm)',
    O2out:'O2 APH Out (%)',CO2out:'CO2 APH Out (%)',COout:'CO APH Out (ppm)',
    Tgi:'FG Temp APH In (°C)',Tgo:'FG Temp APH Out (°C)',
    Tpai:'PA Temp In (°C)',Tpao:'PA Temp Out (°C)',
    Tsai:'SA Temp In (°C)',Tsao:'SA Temp Out (°C)',
    Fsa:'SA Flow (TPH)',Fpa:'PA Flow (TPH)',Tref:'Ambient Temp (°C)',
    Md:'Moisture Design (%)',Ad:'Ash Design (%)',VMd:'VM Design (%)',FCd:'FC Design (%)',
    Cd:'Carbon Design (%)',Sd:'Sulfur Design (%)',Hd:'Hydrogen Design (%)',
    Md2:'Moisture Design Ultimate (%)',Nd:'Nitrogen Design (%)',Od:'Oxygen Design (%)',
    Ad2:'Ash Design Ultimate (%)',GCVd:'GCV Design (kcal/kg)',
    Trad:'Ref Air Temp Design (°C)',Mwvd:'Moisture in Air Design (kg/kg)'
  };
  return ids.map(id => ({
    id,
    label: labels[id] || id,
    value: document.getElementById(id) ? document.getElementById(id).value : 'N/A'
  }));
}

// ── Render output KPIs ────────────────────────────────────────────────────────
function renderOutput(r) {
  document.getElementById('kpi-area').innerHTML = `
    <div class="kpi-card kpi-green">
      <div class="kpi-label">Boiler Efficiency</div>
      <div class="kpi-value boiler-eff-val">${fmt2(r.BoilerEff)}<span class="kpi-unit">%</span></div>
      <div class="kpi-sub">Indirect method — as-tested</div>
    </div>
    <div class="kpi-card kpi-blue">
      <div class="kpi-label">Boiler Efficiency Corrected</div>
      <div class="kpi-value boiler-eff-corr-val">${fmt2(r.BoilerEffCorr)}<span class="kpi-unit">%</span></div>
      <div class="kpi-sub">Corrected to design conditions</div>
    </div>
    <div class="kpi-card kpi-red">
      <div class="kpi-label">Dry Gas Loss</div>
      <div class="kpi-value">${fmt2(r.Ldg)}<span class="kpi-unit">%</span></div>
    </div>
    <div class="kpi-card kpi-amber">
      <div class="kpi-label">Loss — Unburnt Carbon</div>
      <div class="kpi-value">${fmt2(r.Luc)}<span class="kpi-unit">%</span></div>
    </div>
    <div class="kpi-card kpi-blue">
      <div class="kpi-label">Loss — Moisture in Fuel</div>
      <div class="kpi-value">${fmt2(r.Lmf)}<span class="kpi-unit">%</span></div>
    </div>
    <div class="kpi-card kpi-green">
      <div class="kpi-label">Loss — Hydrogen in Fuel</div>
      <div class="kpi-value">${fmt2(r.Lhf)}<span class="kpi-unit">%</span></div>
    </div>
    <div class="kpi-card kpi-amber">
      <div class="kpi-label">Loss — Carbon Monoxide</div>
      <div class="kpi-value">${fmt(r.Lco)}<span class="kpi-unit">%</span></div>
    </div>
    <div class="kpi-card kpi-blue">
      <div class="kpi-label">Loss — Moisture in Air</div>
      <div class="kpi-value">${fmt2(r.Lma)}<span class="kpi-unit">%</span></div>
    </div>
    <div class="kpi-card kpi-red" style="grid-column:span 2;">
      <div class="kpi-label">Radiation &amp; Unaccounted Loss</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
        <input type="number" id="Lrad" value="${r.Lrad||1.2}" oninput="recalculate()"
          style="background:var(--bg);border:1px solid var(--accent);border-radius:6px;padding:6px 10px;
                 font-family:'JetBrains Mono',monospace;font-size:24px;color:var(--text-bright);width:120px;outline:none;"/>
        <span style="font-size:14px;color:var(--muted);font-family:'JetBrains Mono',monospace;">%</span>
      </div>
      <div class="kpi-sub">Enter value and recalculate</div>
    </div>`;

  document.getElementById('output-tables').innerHTML = `
    <div class="output-section">
      <div class="output-section-head"><span>Corrected Losses</span></div>
      <div class="output-row header-row">
        <span>Parameter</span><span style="text-align:right">Symbol</span>
        <span style="text-align:right">Value</span><span style="text-align:right">UoM</span>
      </div>
      ${oRow('Dry Gas Loss (Corrected)',         'Ldgc',  r.Ldgc,  '%')}
      ${oRow('Unburnt Carbon Loss (Corrected)',  'Lucc',  r.Lucc,  '%')}
      ${oRow('Moisture Fuel Loss (Corrected)',   'Lmfc',  r.Lmfc,  '%')}
      ${oRow('Hydrogen Fuel Loss (Corrected)',   'Lhfc',  r.Lhfc,  '%')}
      ${oRow('CO Loss (Corrected)',              'Lcoc',  r.Lcoc,  '%')}
      ${oRow('Moisture Air Loss (Corrected)',    'Lmac',  r.Lmac,  '%')}
      <div class="output-row highlight-row2">
        <span class="out-name">Boiler Efficiency — Corrected</span>
        <span class="out-sym">η<sub>corr</sub></span>
        <span class="out-val">${fmt2(r.BoilerEffCorr)}</span>
        <span class="out-uom">%</span>
      </div>
    </div>
    <div class="output-section">
      <div class="output-section-head"><span>Intermediate Values</span></div>
      <div class="output-row header-row">
        <span>Parameter</span><span style="text-align:right">Symbol</span>
        <span style="text-align:right">Value</span><span style="text-align:right">UoM</span>
      </div>
      ${oRow('CO₂ — APH In',               'CO₂in',  r.CO2in,  '%')}
      ${oRow('CO₂ — APH Out',              'CO₂out', r.CO2out, '%')}
      ${oRow('Weighted Air Temp In',        'Trai',   r.Trai,   '°C')}
      ${oRow('AH Leakage',                 'AL',     r.AL,     '%')}
      ${oRow('Gas Temp — Corrected',       'Tgc',    r.Tgc,   '°C')}
      ${oRow('Stoichiometric Air',          'Sa',     r.Sa,     'kg/kg')}
      ${oRow('Excess Air',                 'Ea',     r.Ea,     '—')}
    </div>`;
}

function oRow(name, sym, val, uom) {
  return `<div class="output-row">
    <span class="out-name">${name}</span>
    <span class="out-sym">${sym}</span>
    <span class="out-val">${fmt2(val)}</span>
    <span class="out-uom">${uom}</span>
  </div>`;
}

// ── Save session to MongoDB ───────────────────────────────────────────────────
async function saveSession() {
  if (!window._results) { showToast('Calculate first before saving.', 'error'); return; }

  const r    = window._results;
  const name = prompt('Session name (optional):', window._uploadedFilename || '');
  if (name === null) return;   // user cancelled

  const payload = {
    sessionName: name.trim(),
    sourceFile:  window._uploadedFilename || 'Manual Entry',
    inputs:      r.inputs,
    results: {
      BoilerEff: r.BoilerEff, BoilerEffCorr: r.BoilerEffCorr,
      Ldg: r.Ldg, Luc: r.Luc, Lmf: r.Lmf, Lhf: r.Lhf,
      Lco: r.Lco, Lma: r.Lma, Lrad: r.Lrad,
      CO2in: r.CO2in, CO2out: r.CO2out, Trai: r.Trai,
      AL: r.AL, Tgc: r.Tgc,
      Ldgc: r.Ldgc, Lucc: r.Lucc, Lmfc: r.Lmfc,
      Lhfc: r.Lhfc, Lcoc: r.Lcoc, Lmac: r.Lmac
    }
  };

  try {
    const res  = await fetch('/api/sessions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    showToast('✓ Session saved to MongoDB!', 'success');
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
  }
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function showTab(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-'+tab).classList.add('active');
  document.querySelectorAll('.tab-btn')[tab === 'input' ? 0 : 1].classList.add('active');
}

// ── Reset inputs ──────────────────────────────────────────────────────────────
function resetInputs() {
  const d={L:210,Ffw:615,Fin:140,Cba:1.2,Cfa:0.4,Pfa:80,Pba:20,
    M:12.2,A:40,VM:22.9,FC:24.9,GCV:3320,S:0.6,
    O2in:3.5,COin:39,O2out:5,COout:50,
    Tgi:350,Tgo:135,Tpai:40,Tpao:325,Tsai:34,Tsao:325,
    Fsa:450,Fpa:250,Tref:30,
    Md:13,Ad:40,VMd:24,FCd:23,
    Cd:37,Sd:0.3,Hd:2.3,Md2:12,Nd:0.8,Od:7.6,Ad2:40,
    GCVd:3300,Trad:38,Mwvd:0.013};
  Object.entries(d).forEach(([id,val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
  window._uploadedFilename = null;
  const st = document.getElementById('upload-status');
  if (st) { st.style.display='none'; st.textContent=''; }
  autoCalcCO2();
}

// ── CO₂ auto-calc ─────────────────────────────────────────────────────────────
function autoCalcCO2() {
  const O2in  = v('O2in'),  O2out = v('O2out');
  const co2in = document.getElementById('CO2in');
  const co2out= document.getElementById('CO2out');
  if (co2in)  co2in.value  = (19.3 - O2in).toFixed(2);
  if (co2out) co2out.value = (19.3 - O2out).toFixed(2);
}

function recalculate() {
  if (!window._results) return;
  const Lrad = parseFloat(document.getElementById('Lrad').value) || 0;
  const r = window._results;
  
  const BoilerEff = 100 - (r.Ldg + r.Luc + r.Lmf + r.Lhf + r.Lco + r.Lma + Lrad);
  const BoilerEffCorr = 100 - (r.Ldgc + r.Lucc + r.Lmfc + r.Lhfc + r.Lcoc + r.Lmac + Lrad);
  
  window._results.BoilerEff = BoilerEff;
  window._results.BoilerEffCorr = BoilerEffCorr;

  document.querySelectorAll('.boiler-eff-val').forEach(el => {
    el.textContent = fmt2(BoilerEff);
  });
  document.querySelectorAll('.boiler-eff-corr-val').forEach(el => {
    el.textContent = fmt2(BoilerEffCorr);
  });
}

// ── CSV / PDF download ────────────────────────────────────────────────────────
function downloadCSV() {
  if (!window._results) { showToast('Calculate first.', 'error'); return; }
  const r=window._results, now=new Date().toISOString().slice(0,19).replace('T',' ');
  let csv=`CENPEEP Boiler Efficiency Report\nGenerated:,${now}\n\nINPUTS\nParameter,Value\n`;
  r.inputs.forEach(i=>{ csv+=`"${i.label}",${i.value}\n`; });
  csv+='\nOUTPUTS\nParameter,Symbol,Value,UoM\n';
  [
    ['CO₂ APH In','CO2in',r.CO2in,'%'],
    ['CO₂ APH Out','CO2out',r.CO2out,'%'],
    ['Weighted Air Temp In','Trai',r.Trai,'°C'],
    ['Dry Gas Loss','Ldg',r.Ldg,'%'],
    ['Unburnt Carbon Loss','Luc',r.Luc,'%'],
    ['Moisture Fuel Loss','Lmf',r.Lmf,'%'],
    ['Hydrogen Fuel Loss','Lhf',r.Lhf,'%'],
    ['CO Loss','Lco',r.Lco,'%'],
    ['Moisture Air Loss','Lma',r.Lma,'%'],
    ['Radiation Loss','Lrad',r.Lrad,'%'],
    ['Boiler Efficiency','eta',r.BoilerEff,'%'],
    ['Boiler Efficiency Corrected','eta_corr',r.BoilerEffCorr,'%']
  ].forEach(([n,s,val,u])=>{ csv+=`"${n}","${s}",${typeof val==='number'?val.toFixed(4):''},,"${u}"\n`; });
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`cenpeep_report_${now.replace(/[: ]/g,'_')}.csv`;
  a.click();
}

function downloadPDF() {
  if (!window._results) { showToast('Calculate first.', 'error'); return; }
  const r=window._results, now=new Date().toLocaleString();
  const win=window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>CENPEEP Report</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;margin:30px}h1{font-size:18px}
  h2{font-size:13px;margin:18px 0 5px;border-bottom:1px solid #ccc}
  table{width:100%;border-collapse:collapse}th{background:#1e3a5f;color:#fff;padding:5px 8px;text-align:left;font-size:11px}
  td{padding:4px 8px;border-bottom:1px solid #eee;font-size:11px}tr:nth-child(even)td{background:#f5f8ff}
  .hl{background:#e6fff5!important;font-weight:bold}.meta{color:#666;font-size:11px;margin-bottom:16px}
  </style></head><body>
  <h1>CENPEEP Boiler Efficiency Report</h1><p class="meta">Generated: ${now}</p>
  <h2>Inputs</h2><table><tr><th>Parameter</th><th>Value</th></tr>
  ${r.inputs.map(i=>`<tr><td>${i.label}</td><td>${i.value}</td></tr>`).join('')}</table>
  <h2>Losses</h2><table><tr><th>Parameter</th><th>Symbol</th><th>Value</th><th>UoM</th></tr>
  <tr><td>CO₂ APH In</td><td>CO₂in</td><td>${fmt2(r.CO2in)}</td><td>%</td></tr>
  <tr><td>CO₂ APH Out</td><td>CO₂out</td><td>${fmt2(r.CO2out)}</td><td>%</td></tr>
  <tr><td>Dry Gas Loss</td><td>Ldg</td><td>${fmt2(r.Ldg)}</td><td>%</td></tr>
  <tr><td>Unburnt Carbon Loss</td><td>Luc</td><td>${fmt2(r.Luc)}</td><td>%</td></tr>
  <tr><td>Moisture Fuel Loss</td><td>Lmf</td><td>${fmt2(r.Lmf)}</td><td>%</td></tr>
  <tr><td>Hydrogen Fuel Loss</td><td>Lhf</td><td>${fmt2(r.Lhf)}</td><td>%</td></tr>
  <tr><td>CO Loss</td><td>Lco</td><td>${fmt(r.Lco)}</td><td>%</td></tr>
  <tr><td>Moisture Air Loss</td><td>Lma</td><td>${fmt2(r.Lma)}</td><td>%</td></tr>
  <tr><td>Radiation Loss</td><td>Lrad</td><td>${fmt2(r.Lrad)}</td><td>%</td></tr>
  <tr class="hl"><td><b>Boiler Efficiency</b></td><td>η</td><td><b>${fmt2(r.BoilerEff)}</b></td><td>%</td></tr>
  <tr class="hl"><td><b>Boiler Efficiency Corrected</b></td><td>η_corr</td><td><b>${fmt2(r.BoilerEffCorr)}</b></td><td>%</td></tr>
  </table><script>window.print();<\/script></body></html>`);
  win.document.close();
}

// ── Event listeners + init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const o2in  = document.getElementById('O2in');
  const o2out = document.getElementById('O2out');
  if (o2in)  o2in.addEventListener('input',  autoCalcCO2);
  if (o2out) o2out.addEventListener('input', autoCalcCO2);
  autoCalcCO2();
  initUpload();
  checkDB();
});
