const v = id => { const el = document.getElementById(id); return el ? parseFloat(el.value) : 0; };
const fmt = (n, d=4) => isNaN(n) ? '—' : n.toFixed(d);
const fmt2 = n => fmt(n, 2);

function calculate() {
  const M=v('M'),A=v('A'),VM=v('VM'),FC=v('FC'),GCV=v('GCV'),S=v('S');
  const O2in=v('O2in'),O2out=v('O2out'),COout=v('COout'),COin=v('COin');
  const Tgi=v('Tgi'),Tgo=v('Tgo'),Tpai=v('Tpai'),Tpao=v('Tpao');
  const Tsai=v('Tsai'),Tsao=v('Tsao'),Fsa=v('Fsa'),Fpa=v('Fpa');
  const Cba=v('Cba'),Cfa=v('Cfa'),Pfa=v('Pfa'),Pba=v('Pba');
  const Lrad=v('Lrad');
  const Cp=30.6,CVc=8077.8,CVco=2415,Mwv=0.0166;
  const CO2in=v('CO2in'), CO2out=v('CO2out'), COoutp=(COout/1000000)*100;
  const FcDc=FC/(1-(1.1*A/100)-M/100), VmDf=100-FcDc;
  const Cdf=FcDc+0.9*(VmDf-14), Hdf=VmDf*((7.35/(VmDf+10))-0.013);
  const Ndf=2.1-(0.012*VmDf), k=(VM+FC)/(VmDf+FcDc);
  const Ca=Cdf*k, H=Hdf*k, N=Ndf*k, O=100-Ca-S-H-M-N-A;
  const Fta=Fsa+Fpa, Rsa=Fsa/Fta, Rpa=Fpa/Fta;
  const Trai=Tsai*Rsa+Tpai*Rpa;
  const Cash=Pfa/100*Cfa+Pba/100*Cba, U=A/100*Cash/(100-Cash);
  const N2out=100-(O2out+CO2out+COoutp);
  const Sa=(2.66*(Ca-U*100)+7.937*H+0.996*S-O)/23.2;
  const Ea=1+(O2out-COoutp/2)/(0.2682*N2out-(O2out-COoutp));
  const Ma=Sa*Ea*Mwv;
  const Wd=(Ca+S/2.67-100*U)/(12*CO2out);
  const Sh=Wd*Cp*(Tgo-Trai), Sw=1.88*(Tgo-25)+2442+4.2*(25-Trai);
  const Ldg=Sh*100/(GCV*4.186);
  const Luc=U*CVc*100/GCV;
  const Lmf=Sw*M/(GCV*4.186);
  const Lhf=9*H*Sw/(GCV*4.186);
  const Lco=COoutp*7*CVco*(Ca-100*U)/3/(CO2out+COoutp)/GCV;
  const Lma=Ma*1.88*(Tgo-Trai)*100/(GCV*4.186);
  const BoilerEff=100-(Ldg+Luc+Lmf+Lhf+Lco+Lma+Lrad);
  window._results={CO2in,CO2out,COoutp,Trai,Cash,U,Fta,Rsa,Rpa,
    N2out,Sa,Ea,Ma,Wd,Sh,Sw,
    Ldg,Luc,Lmf,Lhf,Lco,Lma,BoilerEff,
    inputs:collectInputs()};
  renderOutput(window._results);
  showTab('output');
}

function collectInputs() {
  const ids=['L','Ffw','Fin','Cba','Cfa','Pfa','Pba','M','A','VM','FC','GCV','S',
    'O2in','CO2in','COin','O2out','CO2out','COout','Tgi','Tgo','Tpai','Tpao',
    'Tsai','Tsao','Fsa','Fpa','Tref','Lrad'];
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
    Fsa:'SA Flow (TPH)',Fpa:'PA Flow (TPH)',
    Tref:'Ambient Temp (°C)',Lrad:'Radiation Loss (%)'
  };
  return ids.map(id=>({id,label:labels[id]||id,value:document.getElementById(id)?document.getElementById(id).value:'N/A'}));
}

function renderOutput(r) {
  document.getElementById('kpi-area').innerHTML=`
    <div class="kpi-card kpi-green"><div class="kpi-label">Boiler Efficiency</div><div class="kpi-value boiler-eff-val">${fmt2(r.BoilerEff)}<span class="kpi-unit">%</span></div><div class="kpi-sub">Indirect method — as-tested</div></div>
    <div class="kpi-card kpi-red"><div class="kpi-label">Dry Gas Loss</div><div class="kpi-value">${fmt2(r.Ldg)}<span class="kpi-unit">%</span></div><div class="kpi-sub"></div></div>
    <div class="kpi-card kpi-amber"><div class="kpi-label">Loss — Unburnt Carbon</div><div class="kpi-value">${fmt2(r.Luc)}<span class="kpi-unit">%</span></div><div class="kpi-sub"></div></div>
    <div class="kpi-card kpi-blue"><div class="kpi-label">Loss — Moisture in Fuel</div><div class="kpi-value">${fmt2(r.Lmf)}<span class="kpi-unit">%</span></div><div class="kpi-sub"></div></div>
    <div class="kpi-card kpi-green"><div class="kpi-label">Loss — Hydrogen in Fuel</div><div class="kpi-value">${fmt2(r.Lhf)}<span class="kpi-unit">%</span></div><div class="kpi-sub"></div></div>
    <div class="kpi-card kpi-amber"><div class="kpi-label">Loss — Carbon Monoxide</div><div class="kpi-value">${fmt(r.Lco)}<span class="kpi-unit">%</span></div><div class="kpi-sub"></div></div>
    <div class="kpi-card kpi-blue"><div class="kpi-label">Loss — Moisture in Air</div><div class="kpi-value">${fmt2(r.Lma)}<span class="kpi-unit">%</span></div><div class="kpi-sub"></div></div>
    <div class="kpi-card kpi-red" style="grid-column:span 2;">
      <div class="kpi-label">Radiation &amp; Unaccounted Loss</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
        <input type="number" id="Lrad" value="1.2" oninput="recalculate()"
          style="background:var(--bg);border:1px solid var(--accent);border-radius:6px;padding:6px 10px;font-family:'DM Mono',monospace;font-size:24px;color:var(--text-bright);width:120px;outline:none;"/>
        <span style="font-size:14px;color:var(--muted);font-family:'DM Mono',monospace;">%</span>
      </div>
      <div class="kpi-sub">Enter value and recalculate</div>
    </div>`;

  document.getElementById('output-tables').innerHTML='';
}

function showTab(tab) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+tab).classList.add('active');
  document.querySelectorAll('.tab-btn')[tab==='input'?0:1].classList.add('active');
}

function resetInputs() {
  const d={L:210,Ffw:615,Fin:140,Cba:1.2,Cfa:0.4,Pfa:80,Pba:20,
    M:12.2,A:40,VM:22.9,FC:24.9,GCV:3320,S:0.6,
    O2in:3.5,COin:39,O2out:5,COout:50,
    Tgi:350,Tgo:135,Tpai:40,Tpao:325,Tsai:34,Tsao:325,
    Fsa:450,Fpa:250,Tref:30,Lrad:1.2};
  Object.entries(d).forEach(([id,val])=>{
    if(document.getElementById(id))document.getElementById(id).value=val;
  });
}

function downloadCSV() {
  if(!window._results){alert('Please calculate first.');return;}
  const r=window._results, now=new Date().toISOString().slice(0,19).replace('T',' ');
  let csv=`CENPEEP Boiler Efficiency Report\nGenerated:,${now}\n\nINPUTS\nParameter,Value\n`;
  r.inputs.forEach(i=>{csv+=`"${i.label}",${i.value}\n`;});
  csv+='\nOUTPUTS\nParameter,Symbol,Value,UoM\n';
  [['CO₂ APH In','CO2in',r.CO2in,'%'],
   ['CO₂ APH Out','CO2out',r.CO2out,'%'],
   ['Weighted Air Temp In','Trai',r.Trai,'°C'],
   ['Dry Gas Loss','Ldg',r.Ldg,'%'],
   ['Unburnt Carbon Loss','Luc',r.Luc,'%'],
   ['Moisture Fuel Loss','Lmf',r.Lmf,'%'],
   ['Hydrogen Fuel Loss','Lhf',r.Lhf,'%'],
   ['CO Loss','Lco',r.Lco,'%'],
   ['Moisture Air Loss','Lma',r.Lma,'%'],
   ['Radiation Loss','Lrad',v('Lrad'),'%'],
   ['Boiler Efficiency','eta',r.BoilerEff,'%']
  ].forEach(([n,s,val,u])=>{csv+=`"${n}","${s}",${val},"${u}"\n`;});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`cenpeep_report_${now.replace(/[: ]/g,'_')}.csv`;a.click();
}

function downloadPDF() {
  if(!window._results){alert('Please calculate first.');return;}
  const r=window._results, now=new Date().toLocaleString();
  const win=window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>CENPEEP Report</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;margin:30px}h1{font-size:18px}
  h2{font-size:13px;margin:18px 0 5px;border-bottom:1px solid #ccc}
  table{width:100%;border-collapse:collapse}th{background:#1e3a5f;color:#fff;padding:5px 8px;text-align:left;font-size:11px}
  td{padding:4px 8px;border-bottom:1px solid #eee;font-size:11px}tr:nth-child(even)td{background:#f5f8ff}
  .hl{background:#e6fff5!important;font-weight:bold}.meta{color:#666;font-size:11px;margin-bottom:16px}</style>
  </head><body>
  <h1>CENPEEP Boiler Efficiency Report</h1><p class="meta">Generated: ${now}</p>
  <h2>Inputs</h2><table><tr><th>Parameter</th><th>Value</th></tr>
  ${r.inputs.map(i=>`<tr><td>${i.label}</td><td>${i.value}</td></tr>`).join('')}</table>
  <h2>Losses</h2><table><tr><th>Parameter</th><th>Symbol</th><th>Value</th><th>UoM</th></tr>
  <tr><td>CO₂ APH In</td><td>CO₂in</td><td>${fmt2(r.CO2in)}</td><td>%</td></tr>
  <tr><td>CO₂ APH Out</td><td>CO₂out</td><td>${fmt2(r.CO2out)}</td><td>%</td></tr>
  <tr><td>Weighted Air Temp In</td><td>Trai</td><td>${fmt2(r.Trai)}</td><td>°C</td></tr>
  <tr><td>Dry Gas Loss</td><td>Ldg</td><td>${fmt2(r.Ldg)}</td><td>%</td></tr>
  <tr><td>Unburnt Carbon Loss</td><td>Luc</td><td>${fmt2(r.Luc)}</td><td>%</td></tr>
  <tr><td>Moisture in Fuel Loss</td><td>Lmf</td><td>${fmt2(r.Lmf)}</td><td>%</td></tr>
  <tr><td>Hydrogen in Fuel Loss</td><td>Lhf</td><td>${fmt2(r.Lhf)}</td><td>%</td></tr>
  <tr><td>CO Loss</td><td>Lco</td><td>${fmt(r.Lco)}</td><td>%</td></tr>
  <tr><td>Moisture in Air Loss</td><td>Lma</td><td>${fmt2(r.Lma)}</td><td>%</td></tr>
  <tr><td>Radiation Loss</td><td>Lrad</td><td>${v('Lrad').toFixed(2)}</td><td>%</td></tr>
  <tr class="hl"><td>Boiler Efficiency</td><td>η</td><td>${fmt2(r.BoilerEff)}</td><td>%</td></tr></table>
  <script>window.print();<\/script></body></html>`);
  win.document.close();
}

function autoCalcCO2() {
  const O2in = v('O2in');
  const O2out = v('O2out');
  const co2in = document.getElementById('CO2in');
  const co2out = document.getElementById('CO2out');
  if(co2in) co2in.value = (19.3 - O2in).toFixed(2);
  if(co2out) co2out.value = (19.3 - O2out).toFixed(2);
}

function recalculate() {
  if (!window._results) return;
  const Lrad = parseFloat(document.getElementById('Lrad').value) || 0;
  const r = window._results;
  const BoilerEff = 100 - (r.Ldg + r.Luc + r.Lmf + r.Lhf + r.Lco + r.Lma + Lrad);
  window._results.BoilerEff = BoilerEff;

  // Update only the boiler efficiency values without re-rendering everything
  document.querySelectorAll('.boiler-eff-val').forEach(el => {
    el.textContent = fmt2(BoilerEff);
  });
}
document.getElementById('O2in').addEventListener('input', autoCalcCO2);
document.getElementById('O2out').addEventListener('input', autoCalcCO2);

// Run on page load
autoCalcCO2();