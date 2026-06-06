const v = id => parseFloat(document.getElementById(id).value);
const fmt = (n, d=4) => isNaN(n) ? '—' : n.toFixed(d);
const fmt2 = n => fmt(n, 2);

function calculate() {
  const M=v('M'),A=v('A'),VM=v('VM'),FC=v('FC'),GCV=v('GCV'),S=v('S');
  const O2in=v('O2in'),O2out=v('O2out'),COout=v('COout'),COin=v('COin');
  const Tgi=v('Tgi'),Tgo=v('Tgo'),Tpai=v('Tpai'),Tpao=v('Tpao');
  const Tsai=v('Tsai'),Tsao=v('Tsao'),Fsa=v('Fsa'),Fpa=v('Fpa');
  const Cba=v('Cba'),Cfa=v('Cfa'),Pfa=v('Pfa'),Pba=v('Pba');
  const Md=v('Md'),Ad=v('Ad'),VMd=v('VMd'),FCd=v('FCd');
  const Cd=v('Cd'),Sd=v('Sd'),Hd=v('Hd'),Nd=v('Nd'),Od=v('Od'),Ad2=v('Ad2'),GCVd=v('GCVd');
  const Tadd=v('Tadd'),Trad=v('Trad'),Mwvd=v('Mwvd'),Lrad=v('Lrad');
  const Cp=30.6,CVc=8077.8,CVco=2415,Mwv=0.0166;

  const CO2in=19.3-O2in, CO2out=19.3-O2out, COoutp=(COout/1000000)*100;
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
  const Ldg=Sh*100/(GCV*4.186), Luc=U*CVc*100/GCV;
  const Lmf=Sw*M/(GCV*4.186), Lhf=9*H*Sw/(GCV*4.186);
  const Lco=COoutp*7*CVco*(Ca-100*U)/3/(CO2out+COoutp)/GCV;
  const Lma=Ma*1.88*(Tgo-Trai)*100/(GCV*4.186);
  const BoilerEff=100-(Ldg+Luc+Lmf+Lhf+Lco+Lma+Lrad);
  const AL=(CO2in-CO2out)*0.9*100/CO2out;
  const Tgnl=((AL*Cp*(Tgo-Trai))/(100*Cp))+Tgo;
  const Tgc=(Trad*(Tgi-Tgo)+Tgi*(Tgo-Trai))/(Tgi-Trai);
  const Wdc=(Cd+Sd/2.67-100*U)/(12*CO2out), Shc=Wdc*Cp*(Tgc-Trad);
  const Ldgc=Shc*100/(GCVd*4.186);
  const Kc=Math.exp(0.225*Cd/Hd)-Math.exp(0.225*Ca/H);
  const V_corr=(VMd<17)?0.013*(Ad2*GCV/(A*GCVd))*Kc:0;
  const Lucc=Luc*((Ad2*GCV)/(A*GCVd))+V_corr;
  const Swd=1.88*(Tgc-25)+2442+4.2*(25-Trad);
  const Lmfc=Swd*Md/(GCVd*4.186), Lhfc=9*Hd*Swd/(GCVd*4.186);
  const Lcoc=COoutp*7*CVco*(Cd-100*U)/3/(CO2out+COoutp)/GCVd;
  const Sad=(2.66*(Cd-U*100)+7.937*Hd+0.996*Sd-Od)/23.2;
  const Ead=1+(O2out-COoutp/2)/(0.2682*N2out-(O2out-COoutp));
  const Mad=Sad*Ead*Mwvd;
  const Lmac=Mad*1.88*(Tgc-Trad)*100/(GCVd*4.186);
  const BoilerEffCorr=100-(Ldgc+Lucc+Lmfc+Lhfc+Lcoc+Lmac+Lrad);

  window._results={CO2in,CO2out,COoutp,FcDc,VmDf,Cdf,Hdf,Ndf,k,Ca,H,N,O,
    Fta,Rsa,Rpa,Trai,N2out,Sa,Ea,Ma,Cash,U,Wd,Sh,Sw,
    Ldg,Luc,Lmf,Lhf,Lco,Lma,BoilerEff,AL,Tgnl,Tgc,
    Wdc,Shc,Ldgc,Lucc,Lmfc,Swd,Lhfc,Lcoc,Mad,Lmac,BoilerEffCorr,
    inputs:collectInputs()};

  renderOutput(window._results);
  showTab('output');
}

function collectInputs() {
  const ids=['L','Ffw','Fin','Cba','Cfa','Pfa','Pba','M','A','VM','FC','GCV','S',
    'O2in','COin','O2out','COout','Tgi','Tgo','Tpai','Tpao','Tsai','Tsao','Fsa','Fpa','Tref',
    'Md','Ad','VMd','FCd','Cd','Sd','Hd','Md2','Nd','Od','Ad2','GCVd','Tadd','RH','Trad','Mwvd','Lrad'];
  const labels={L:'Unit Load (MW)',Ffw:'Steam Flow (T/hr)',Fin:'Total Coal Flow (T/hr)',
    Cba:'Unburnt C Bottom Ash (%)',Cfa:'Unburnt C Fly Ash (%)',Pfa:'% Fly Ash',Pba:'% Bottom Ash',
    M:'Moisture (%)',A:'Ash (%)',VM:'Volatile Matter (%)',FC:'Fixed Carbon (%)',GCV:'GCV (kcal/kg)',S:'Sulfur (%)',
    O2in:'O2 APH In (%)',COin:'CO APH In (ppm)',O2out:'O2 APH Out (%)',COout:'CO APH Out (ppm)',
    Tgi:'FG Temp APH In (°C)',Tgo:'FG Temp APH Out (°C)',Tpai:'PA Temp In (°C)',Tpao:'PA Temp Out (°C)',
    Tsai:'SA Temp In (°C)',Tsao:'SA Temp Out (°C)',Fsa:'SA Flow (TPH)',Fpa:'PA Flow (TPH)',Tref:'Ambient Temp (°C)',
    Md:'Moisture Design (%)',Ad:'Ash Design (%)',VMd:'VM Design (%)',FCd:'FC Design (%)',
    Cd:'Carbon Design (%)',Sd:'Sulfur Design (%)',Hd:'Hydrogen Design (%)',Md2:'Moisture Ult Design (%)',
    Nd:'Nitrogen Design (%)',Od:'Oxygen Design (%)',Ad2:'Ash Ult Design (%)',GCVd:'GCV Design (kcal/kg)',
    Tadd:'Ambient Temp Design (°C)',RH:'Rel. Humidity (%)',Trad:'Ref Air Temp Design (°C)',
    Mwvd:'Moisture Air Design (kg/kg)',Lrad:'Radiation Loss (%)'};
  return ids.map(id=>({id,label:labels[id]||id,value:document.getElementById(id).value}));
}

function renderOutput(r) {
  document.getElementById('kpi-area').innerHTML=`
    <div class="kpi-card kpi-green"><div class="kpi-label">Boiler Efficiency (Test)</div><div class="kpi-value">${fmt2(r.BoilerEff)}<span class="kpi-unit">%</span></div><div class="kpi-sub">Indirect method — as-tested</div></div>
    <div class="kpi-card kpi-blue"><div class="kpi-label">Boiler Efficiency (Corrected)</div><div class="kpi-value">${fmt2(r.BoilerEffCorr)}<span class="kpi-unit">%</span></div><div class="kpi-sub">Corrected to design conditions</div></div>
    <div class="kpi-card kpi-amber"><div class="kpi-label">AH Leakage</div><div class="kpi-value">${fmt2(r.AL)}<span class="kpi-unit">%</span></div><div class="kpi-sub">CO₂ method</div></div>
    <div class="kpi-card kpi-red"><div class="kpi-label">Dry Gas Loss (Test)</div><div class="kpi-value">${fmt2(r.Ldg)}<span class="kpi-unit">%</span></div><div class="kpi-sub">Dominant loss component</div></div>`;

  const row=(name,sym,val,uom,cls='')=>`<div class="output-row ${cls}"><span class="out-name">${name}</span><span class="out-sym">${sym}</span><span class="out-val">${val}</span><span class="out-uom">${uom}</span></div>`;
  const hdr=`<div class="output-row header-row"><span>Parameter</span><span>Symbol</span><span style="text-align:right">Value</span><span style="text-align:right">UoM</span></div>`;

  document.getElementById('output-tables').innerHTML=`
    <div class="output-section"><div class="output-section-head"><span>Test Losses</span></div>${hdr}
    ${row('CO₂ at APH In','CO₂in',fmt2(r.CO2in),'%')}
    ${row('CO₂ at APH Out','CO₂out',fmt2(r.CO2out),'%')}
    ${row('Weighted Air Temp In','Trai',fmt2(r.Trai),'°C')}
    ${row('Carbon in Ash','Cash',fmt(r.Cash),'%')}
    ${row('Carbon per kg fuel','U',r.U.toExponential(4),'kg/kg')}
    ${row('Weight of Dry Gas','Wd',fmt(r.Wd),'kg/kg')}
    ${row('Sensible Heat Dry Gas','Sh',fmt(r.Sh),'kJ/kg')}
    ${row('Sensible Heat Water Vapor','Sw',fmt2(r.Sw),'kJ/kg')}
    ${row('Stoichiometric Air','Sa',fmt(r.Sa),'kg/kg')}
    ${row('Excess Air','Ea',fmt(r.Ea),'')}
    ${row('Total Moisture in Air','Ma',fmt(r.Ma),'kg/kg')}
    ${row('Dry Gas Loss','Ldg',fmt2(r.Ldg),'%','highlight-row2')}
    ${row('Loss — Unburnt Carbon','Luc',fmt2(r.Luc),'%','highlight-row2')}
    ${row('Loss — Moisture in Fuel','Lmf',fmt2(r.Lmf),'%','highlight-row2')}
    ${row('Loss — Hydrogen in Fuel','Lhf',fmt2(r.Lhf),'%','highlight-row2')}
    ${row('Loss — Carbon Monoxide','Lco',fmt(r.Lco),'%','highlight-row2')}
    ${row('Loss — Moisture in Air','Lma',fmt2(r.Lma),'%','highlight-row2')}
    ${row('Radiation & Unaccounted','Lrad',v('Lrad').toFixed(2),'%','highlight-row2')}
    ${row('Boiler Efficiency (Test)','η',fmt2(r.BoilerEff),'%','highlight-row')}</div>

    <div class="output-section"><div class="output-section-head"><span>APH Corrections</span></div>${hdr}
    ${row('Air Heater Leakage','AL',fmt2(r.AL),'%','highlight-row2')}
    ${row('FG Temp leaving AH (corr. to AL)','Tgnl',fmt2(r.Tgnl),'°C','highlight-row2')}
    ${row('FG Temp leaving AH (corr. to Ref Air)','Tgc',fmt2(r.Tgc),'°C','highlight-row2')}</div>

    <div class="output-section"><div class="output-section-head"><span>Corrected Losses (Design Conditions)</span></div>${hdr}
    ${row('Weight of Dry Gas — Corrected','Wdc',fmt(r.Wdc),'kg/kg')}
    ${row('Sensible Heat Dry Gas — Corrected','Shc',fmt2(r.Shc),'kJ/kg')}
    ${row('Sensible Heat Water Vapor — Corrected','Swd',fmt2(r.Swd),'kJ/kg')}
    ${row('Total Moisture in Air — Corrected','Mad',fmt(r.Mad),'kg/kg')}
    ${row('Dry Gas Loss — Corrected','Ldgc',fmt2(r.Ldgc),'%','highlight-row2')}
    ${row('Unburnt Carbon — Corrected','Lucc',fmt2(r.Lucc),'%','highlight-row2')}
    ${row('Moisture in Fuel — Corrected','Lmfc',fmt2(r.Lmfc),'%','highlight-row2')}
    ${row('Hydrogen in Fuel — Corrected','Lhfc',fmt2(r.Lhfc),'%','highlight-row2')}
    ${row('CO Loss — Corrected','Lcoc',fmt(r.Lcoc),'%','highlight-row2')}
    ${row('Moisture in Air — Corrected','Lmac',fmt2(r.Lmac),'%','highlight-row2')}
    ${row('Radiation & Unaccounted','Lrad',v('Lrad').toFixed(2),'%','highlight-row2')}
    ${row('Boiler Efficiency — Corrected','η_corr',fmt2(r.BoilerEffCorr),'%','highlight-row')}</div>`;
}

function showTab(tab) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+tab).classList.add('active');
  document.querySelectorAll('.tab-btn')[tab==='input'?0:1].classList.add('active');
}

function resetInputs() {
  const d={L:210,Ffw:615,Fin:140,Cba:1.2,Cfa:0.4,Pfa:80,Pba:20,M:12.2,A:40,VM:22.9,FC:24.9,GCV:3320,S:0.6,
    O2in:3.5,COin:39,O2out:5,COout:50,Tgi:350,Tgo:135,Tpai:40,Tpao:325,Tsai:34,Tsao:325,Fsa:450,Fpa:250,Tref:30,
    Md:13,Ad:40,VMd:24,FCd:23,Cd:37,Sd:0.3,Hd:2.3,Md2:12,Nd:0.8,Od:7.6,Ad2:40,GCVd:3300,
    Tadd:30,RH:60,Trad:38,Mwvd:0.013,Lrad:1.2};
  Object.entries(d).forEach(([id,val])=>{if(document.getElementById(id))document.getElementById(id).value=val;});
}

function downloadCSV() {
  if(!window._results){alert('Please calculate first.');return;}
  const r=window._results, now=new Date().toISOString().slice(0,19).replace('T',' ');
  let csv=`CENPEEP Boiler Efficiency Report\nGenerated:,${now}\n\nINPUTS\nParameter,Value\n`;
  r.inputs.forEach(i=>{csv+=`"${i.label}",${i.value}\n`;});
  csv+='\nOUTPUTS\nParameter,Symbol,Value,UoM\n';
  [['CO₂ APH In','CO2in',r.CO2in,'%'],['CO₂ APH Out','CO2out',r.CO2out,'%'],
   ['Weighted Air Temp In','Trai',r.Trai,'°C'],['Dry Gas Loss','Ldg',r.Ldg,'%'],
   ['Unburnt Carbon Loss','Luc',r.Luc,'%'],['Moisture Fuel Loss','Lmf',r.Lmf,'%'],
   ['Hydrogen Fuel Loss','Lhf',r.Lhf,'%'],['CO Loss','Lco',r.Lco,'%'],
   ['Moisture Air Loss','Lma',r.Lma,'%'],['Radiation Loss','Lrad',v('Lrad'),'%'],
   ['Boiler Efficiency Test','eta',r.BoilerEff,'%'],['AH Leakage','AL',r.AL,'%'],
   ['Tgc','Tgc',r.Tgc,'°C'],['Tgnl','Tgnl',r.Tgnl,'°C'],
   ['Dry Gas Loss Corrected','Ldgc',r.Ldgc,'%'],['Unburnt C Corrected','Lucc',r.Lucc,'%'],
   ['Moisture Fuel Corrected','Lmfc',r.Lmfc,'%'],['Hydrogen Corrected','Lhfc',r.Lhfc,'%'],
   ['CO Loss Corrected','Lcoc',r.Lcoc,'%'],['Moisture Air Corrected','Lmac',r.Lmac,'%'],
   ['Boiler Efficiency Corrected','eta_corr',r.BoilerEffCorr,'%']
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
  <h2>Test Losses</h2><table><tr><th>Parameter</th><th>Symbol</th><th>Value</th><th>UoM</th></tr>
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
  <tr class="hl"><td>Boiler Efficiency (Test)</td><td>η</td><td>${fmt2(r.BoilerEff)}</td><td>%</td></tr></table>
  <h2>APH Corrections</h2><table><tr><th>Parameter</th><th>Symbol</th><th>Value</th><th>UoM</th></tr>
  <tr class="hl"><td>AH Leakage</td><td>AL</td><td>${fmt2(r.AL)}</td><td>%</td></tr>
  <tr class="hl"><td>FG Temp corr. to AL</td><td>Tgnl</td><td>${fmt2(r.Tgnl)}</td><td>°C</td></tr>
  <tr class="hl"><td>FG Temp corr. to Ref Air</td><td>Tgc</td><td>${fmt2(r.Tgc)}</td><td>°C</td></tr></table>
  <h2>Corrected Losses</h2><table><tr><th>Parameter</th><th>Symbol</th><th>Value</th><th>UoM</th></tr>
  <tr><td>Dry Gas Loss Corr.</td><td>Ldgc</td><td>${fmt2(r.Ldgc)}</td><td>%</td></tr>
  <tr><td>Unburnt Carbon Corr.</td><td>Lucc</td><td>${fmt2(r.Lucc)}</td><td>%</td></tr>
  <tr><td>Moisture Fuel Corr.</td><td>Lmfc</td><td>${fmt2(r.Lmfc)}</td><td>%</td></tr>
  <tr><td>Hydrogen Corr.</td><td>Lhfc</td><td>${fmt2(r.Lhfc)}</td><td>%</td></tr>
  <tr><td>CO Loss Corr.</td><td>Lcoc</td><td>${fmt(r.Lcoc)}</td><td>%</td></tr>
  <tr><td>Moisture Air Corr.</td><td>Lmac</td><td>${fmt2(r.Lmac)}</td><td>%</td></tr>
  <tr><td>Radiation Loss</td><td>Lrad</td><td>${v('Lrad').toFixed(2)}</td><td>%</td></tr>
  <tr class="hl"><td>Boiler Efficiency Corrected</td><td>η_corr</td><td>${fmt2(r.BoilerEffCorr)}</td><td>%</td></tr></table>
  <script>window.print();<\/script></body></html>`);
  win.document.close();
}