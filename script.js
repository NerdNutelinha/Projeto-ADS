/* VotoSim — simulação local. Dados iniciais são fictícios. */
const fmt = new Intl.NumberFormat('pt-BR');
const pctFmt = new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const $ = id => document.getElementById(id);
const initial = {flavio:520000,lula:480000};
let votes = {...initial};
let localScenario = {name:'Brasil',flavio:5200,lula:4800};
let selectedState = '';
let stateLayer = null, municipalityLayer = null, markerLayer = null;
let statesGeo = null, municipalities = [], officialRows = [];
const stateNames = {AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins'};
const stateCodes = Object.keys(stateNames);
const stateSelect = $('stateSelect');
stateCodes.forEach(code=>{const o=document.createElement('option');o.value=code;o.textContent=`${stateNames[code]} (${code})`;stateSelect.appendChild(o)});
$('year').textContent = new Date().getFullYear();
const map = L.map('map',{scrollWheelZoom:true}).setView([-14.5,-52.5],4);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap &copy; CARTO',subdomains:'abcd',maxZoom:19}).addTo(map);
const geoUrl = 'https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-uf.json';
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)}
function totals(){const total=votes.flavio+votes.lula;return {total,fp:total?votes.flavio/total*100:0,lp:total?votes.lula/total*100:0,margin:Math.abs(votes.flavio-votes.lula),winner:votes.flavio===votes.lula?'Empate':votes.flavio>votes.lula?'Flávio Bolsonaro':'Lula'}}
function updateDashboard(){
 const t=totals();$('heroTotal').textContent=fmt.format(t.total);$('flavioPct').textContent=pctFmt.format(t.fp)+'%';$('lulaPct').textContent=pctFmt.format(t.lp)+'%';
 $('flavioVotes').textContent=fmt.format(votes.flavio);$('lulaVotes').textContent=fmt.format(votes.lula);$('totalVotes').textContent=fmt.format(t.total);$('marginVotes').textContent=fmt.format(t.margin);$('marginPct').textContent=pctFmt.format(Math.abs(t.fp-t.lp))+' pontos percentuais';
 $('flavioBar').style.width=t.fp+'%';$('lulaBar').style.width=t.lp+'%';
 $('flavioLead').textContent=t.winner==='Flávio Bolsonaro'?'À FRENTE':t.winner==='Empate'?'EMPATE':'CENÁRIO';$('lulaLead').textContent=t.winner==='Lula'?'À FRENTE':t.winner==='Empate'?'EMPATE':'CENÁRIO';
 $('flavioInputValue').textContent=fmt.format(votes.flavio);$('lulaInputValue').textContent=fmt.format(votes.lula);
 $('flavioInput').value=Math.min(2000000,votes.flavio);$('lulaInput').value=Math.min(2000000,votes.lula);$('flavioNumber').value=votes.flavio;$('lulaNumber').value=votes.lula;
 updateRegionPanel();
}
function updateRegionPanel(){
 const total=localScenario.flavio+localScenario.lula, fp=total?localScenario.flavio/total*100:0, lp=total?localScenario.lula/total*100:0;
 $('regionName').textContent=localScenario.name;$('regionDescription').textContent=localScenario.name==='Brasil'?'Resumo do cenário nacional':'Cenário simulado para esta localidade';
 $('regionFlavio').textContent=pctFmt.format(fp)+'%';$('regionLula').textContent=pctFmt.format(lp)+'%';$('regionFlavioVotes').textContent=fmt.format(localScenario.flavio)+' votos';$('regionLulaVotes').textContent=fmt.format(localScenario.lula)+' votos';
 const winner=localScenario.flavio===localScenario.lula?'Empate no cenário':localScenario.flavio>localScenario.lula?'Vantagem simulada de Flávio Bolsonaro':'Vantagem simulada de Lula';
 $('regionWinner').textContent=winner;$('regionWinner').style.background=localScenario.flavio===localScenario.lula?'#f0f2f0':localScenario.flavio>localScenario.lula?'#e8f4ec':'#fff0ef';$('regionWinner').style.color=localScenario.flavio===localScenario.lula?'#657168':localScenario.flavio>localScenario.lula?'#187747':'#c62828';
 $('localFlavio').value=localScenario.flavio;$('localLula').value=localScenario.lula;
}
function colorFor(f,l){return f===l?'#bfc9c0':f>l?'#258452':'#d54a45'}
function styleFeature(feature){const code=feature.properties.sigla||feature.properties.SIGLA||feature.properties.abbrev||feature.properties.UF||'';const sc=localForState(code);return {fillColor:colorFor(sc.flavio,sc.lula),weight:1.1,opacity:1,color:'#fff',fillOpacity:.78}}
function localForState(code){let seed=0;for(let i=0;i<code.length;i++)seed+=code.charCodeAt(i);return {flavio:5000+(seed*137)%6000,lula:5000+(seed*193)%6000}}
function featureName(f){const p=f.properties||{};return p.nome||p.NOME||p.name||p.NM_UF||p.estado||'Estado'}
function featureCode(f){const p=f.properties||{};return p.sigla||p.SIGLA||p.abbrev||p.UF||''}
function onEachState(feature,layer){const code=featureCode(feature),name=featureName(feature);layer.bindTooltip(`${name} (${code})`,{sticky:true});layer.on('click',()=>selectState(code,name));}
function renderStateMap(data){statesGeo=data;if(stateLayer)map.removeLayer(stateLayer);stateLayer=L.geoJSON(data,{style:styleFeature,onEachFeature:onEachState}).addTo(map);try{map.fitBounds(stateLayer.getBounds(),{padding:[15,15]})}catch(e){}}
async function loadStates(){try{const r=await fetch(geoUrl);if(!r.ok)throw new Error('Não foi possível baixar o mapa');renderStateMap(await r.json())}catch(e){toast('Não foi possível carregar o mapa de estados. Confira sua conexão.');console.error(e)}}
async function selectState(code,name){
 selectedState=code;stateSelect.value=code;localScenario=code?{name:`${name} (${code})`,...localForState(code)}:{name:'Brasil',flavio:initial.flavio/100,lula:initial.lula/100};updateRegionPanel();$('municipalitySearch').value='';
 if(!code){map.setView([-14.5,-52.5],4);$('municipalityList').innerHTML='<p>Escolha um estado para carregar a lista de municípios.</p>';if(municipalityLayer){map.removeLayer(municipalityLayer);municipalityLayer=null}return}
 const url=`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${code}/municipios`;
 $('municipalityList').innerHTML='<p>Carregando municípios do IBGE...</p>';
 try{const r=await fetch(url);if(!r.ok)throw new Error('IBGE indisponível');municipalities=await r.json();renderMunicipalities();await loadMunicipalityPoints()}catch(e){$('municipalityList').innerHTML='<p>Não foi possível carregar a lista agora. Tente novamente.</p>';toast('Falha ao consultar municípios do IBGE.')}
}
function renderMunicipalities(filter=''){const list=$('municipalityList');const q=filter.toLocaleLowerCase('pt-BR');const found=municipalities.filter(m=>m.nome.toLocaleLowerCase('pt-BR').includes(q));if(!found.length){list.innerHTML='<p>Nenhum município encontrado.</p>';return}list.innerHTML='';found.forEach(m=>{const b=document.createElement('button');b.className='municipality-item';b.innerHTML=`<span>${escapeHtml(m.nome)}</span><small>Ver cenário ↗</small>`;b.addEventListener('click',()=>selectMunicipality(m));list.appendChild(b)})}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function hashValue(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}
function municipalityVotes(name){const h=hashValue(name);return {flavio:1000+(h*17)%15000,lula:1000+(h*29)%15000}}
function selectMunicipality(m){const v=municipalityVotes(m.nome);localScenario={name:m.nome,flavio:v.flavio,lula:v.lula};updateRegionPanel();toast(`${m.nome}: cenário municipal selecionado`);if(m._lat&&m._lon)map.setView([m._lat,m._lon],9)}
async function loadMunicipalityPoints(){
 // IBGE provides the municipality catalogue; centroid locations are requested separately when available.
 try{const r=await fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/estados/${selectedState}?formato=application/vnd.geo+json&qualidade=intermediaria`);if(!r.ok)return;const geo=await r.json();if(municipalityLayer)map.removeLayer(municipalityLayer);municipalityLayer=L.geoJSON(geo,{style:{color:'#758b7b',weight:.6,fillColor:'#e6eee7',fillOpacity:.1}}).addTo(map);map.fitBounds(municipalityLayer.getBounds(),{padding:[12,12]})}catch(e){console.info('Camada municipal não disponível nesta tentativa',e)}
}
stateSelect.addEventListener('change',()=>{const code=stateSelect.value;if(!code){selectState('','Brasil');return}const f=statesGeo?.features?.find(x=>featureCode(x)===code);selectState(code,f?featureName(f):stateNames[code])});
$('municipalitySearch').addEventListener('input',e=>renderMunicipalities(e.target.value));
$('fitMap').addEventListener('click',()=>{if(selectedState&&municipalityLayer)map.fitBounds(municipalityLayer.getBounds(),{padding:[12,12]});else if(stateLayer)map.fitBounds(stateLayer.getBounds(),{padding:[12,12]});else map.setView([-14.5,-52.5],4)});
function bindVoteControls(rangeId,numId,key){$(rangeId).addEventListener('input',e=>{votes[key]=Math.max(0,Number(e.target.value)||0);updateDashboard()});$(numId).addEventListener('change',e=>{votes[key]=Math.max(0,Math.floor(Number(e.target.value)||0));updateDashboard()})}
bindVoteControls('flavioInput','flavioNumber','flavio');bindVoteControls('lulaInput','lulaNumber','lula');
$('saveLocal').addEventListener('click',()=>{localScenario.flavio=Math.max(0,Math.floor(Number($('localFlavio').value)||0));localScenario.lula=Math.max(0,Math.floor(Number($('localLula').value)||0));updateRegionPanel();toast('Cenário local atualizado.')});
$('resetBtn').addEventListener('click',()=>{votes={...initial};localScenario={name:'Brasil',flavio:5200,lula:4800};selectedState='';stateSelect.value='';updateDashboard();if(stateLayer)map.fitBounds(stateLayer.getBounds(),{padding:[15,15]});toast('Exemplo restaurado.')});
function csvEscape(v){return '"'+String(v).replace(/"/g,'""')+'"'}
function download(name,content,type='text/csv;charset=utf-8;'){const blob=new Blob(['\ufeff',content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function exportCSV(){const t=totals();const rows=[['VotoSim - relatório de SIMULAÇÃO'],['Aviso','Dados simulados; não representam pesquisa ou resultado oficial.'],['Candidato','Votos simulados','Percentual'],['Flávio Bolsonaro',votes.flavio,t.fp.toFixed(2).replace('.',',')+'%'],['Luiz Inácio Lula da Silva',votes.lula,t.lp.toFixed(2).replace('.',',')+'%'],['Total',t.total,'100%'],['Diferença de votos',t.margin,''],['Vantagem no cenário',t.winner,''],[],['Região local',localScenario.name],['Flávio Bolsonaro',localScenario.flavio],['Lula',localScenario.lula],['Fonte oficial importada',officialRows.length?'Sim — conferir origem no arquivo':'Não']];download('votosim-relatorio-simulacao.csv',rows.map(r=>r.map(csvEscape).join(';')).join('\r\n'))}
$('exportCsv').addEventListener('click',exportCSV);$('exportCsvBottom').addEventListener('click',exportCSV);$('exportPrint').addEventListener('click',()=>window.print());$('exportPrintBottom').addEventListener('click',()=>window.print());
$('downloadTemplate').addEventListener('click',()=>download('modelo-dados-oficiais-votosim.csv',[['estado','municipio','candidato','votos','eleicao','ano','fonte'],['MG','Belo Horizonte','Flávio Bolsonaro','1000','Exemplo — substituir pelos dados oficiais','2026','TSE'],['MG','Belo Horizonte','Luiz Inácio Lula da Silva','1200','Exemplo — substituir pelos dados oficiais','2026','TSE']].map(r=>r.map(csvEscape).join(';')).join('\r\n')));
function parseCSV(text){const first=text.split(/\r?\n/).find(x=>x.trim())||'';const delimiter=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';return text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim()).map(line=>{const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'&&quoted){cur+='"';i++}else if(c==='"')quoted=!quoted;else if(c===delimiter&&!quoted){out.push(cur.trim());cur=''}else cur+=c}out.push(cur.trim());return out})}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
$('officialFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const rows=parseCSV(await file.text());const header=rows.shift().map(norm);const findIndex=names=>header.findIndex(h=>names.some(n=>h===n||h.includes(n)));const ci=findIndex(['candidato','nome candidato','nm_votavel','nm votavel']);const vi=findIndex(['votos','votacao','qt_votos','votos nominais','quantidade de votos']);const si=findIndex(['estado','uf','sg_uf']);const mi=findIndex(['municipio','nm_municipio','município']);if(ci<0||vi<0)throw new Error('O CSV precisa ter colunas de candidato e votos.');officialRows=rows.map(r=>({candidate:r[ci]||'',votes:Number(String(r[vi]||'0').replace(/\./g,'').replace(',','.'))||0,state:si>=0?r[si]:'',municipality:mi>=0?r[mi]:'',raw:r}));$('uploadStatus').textContent=`Arquivo lido: ${file.name} (${officialRows.length} linhas).`;renderOfficialComparison();toast('CSV importado para comparação. Confira o cabeçalho e a origem.')}catch(err){officialRows=[];$('uploadStatus').textContent='Erro: '+err.message;renderOfficialComparison();toast('Não foi possível interpretar o CSV.') }});
function renderOfficialComparison(){const box=$('officialCompare');if(!officialRows.length){$('officialSummary').textContent='Ainda não há dados oficiais importados.';box.innerHTML='<span>Importe um CSV para comparar.</span>';return}const flav=officialRows.filter(r=>norm(r.candidate).includes('flavio')).reduce((a,r)=>a+r.votes,0);const lula=officialRows.filter(r=>norm(r.candidate).includes('lula')).reduce((a,r)=>a+r.votes,0);const total=flav+lula;$('officialSummary').textContent=`${officialRows.length} linhas importadas. Os nomes dos candidatos são reconhecidos por correspondência de texto.`;box.innerHTML='';[['Flávio Bolsonaro',flav],['Lula',lula],['Total reconhecido',total]].forEach(([name,value])=>{const div=document.createElement('div');div.className='compare-row';div.innerHTML=`<span>${escapeHtml(name)}</span><strong>${fmt.format(value)}</strong>`;box.appendChild(div)});const p=total?`Flávio ${pctFmt.format(flav/total*100)}% · Lula ${pctFmt.format(lula/total*100)}%`:'Não foi possível reconhecer os candidatos pelos nomes';const div=document.createElement('div');div.className='compare-row';div.innerHTML=`<span>Percentuais no arquivo</span><strong>${p}</strong>`;box.appendChild(div)}
updateDashboard();loadStates();
