/* 共有: データのみ表示（ポータル/市ページ共通）タブ・経年グラフ(本市/県平均/全国平均・指数)・複合・割合の県内比較
   前提: COLS,ROWS,ci,get,fmt,COLMETA?,POPSERIES?,SIM?,TSDATA?,TSMETA?,NATAVG? */
(function(){
var CM=(typeof COLMETA!=='undefined')?COLMETA:{};
var PS=(typeof POPSERIES!=='undefined')?POPSERIES:{};
var SM=(typeof SIM!=='undefined')?SIM:{};
var TS=(typeof TSDATA!=='undefined')?TSDATA:{};
var TSM=(typeof TSMETA!=='undefined')?TSMETA:{axis:{},cat:{}};
var NA=(typeof NATAVG!=='undefined')?NATAVG:{};
var CR=(typeof CITYRANKS!=='undefined')?CITYRANKS:null;
var RI=(typeof RATEINFO!=='undefined')?RATEINFO:null;
var PA=(typeof PREFAVG!=='undefined')?PREFAVG:null;
var SA=(typeof STANDALONE!=='undefined')&&STANDALONE;
function rankOf(col,peers,val){if(CR&&CR[col]){var a=CR[col];return {rank:a[0],n:a[1],med:a[2]};}return rankIn(peers,col,val);}
function cityHref(code,name,pref){return SA?('../../'+pref+'/'+name+'/'):('#'+code);}
var SSDS=COLS.filter(c=>c.indexOf(':')>=0&&c.indexOf('実数:')!==0);
var isRatio=nm=>/率|割合|当たり|あたり|密度|比率|指数|１人|1人|比/.test(nm);
var C_CITY='var(--navy)',C_PREF='var(--gold)',C_NAT='#9aa3b2';
var _PU='県',_SL='本市';
function prefUnit(p){return p==='北海道'?'道':p==='東京都'?'都':(p==='大阪府'||p==='京都府')?'府':'県';}
function selfLabel(t){return t==='町'?'本町':t==='村'?'本村':(t==='特別区'||t==='区')?'本区':'本市';}
var DEFS=(typeof TERMDEFS!=='undefined')?TERMDEFS:{};
var DEFKEYS=Object.keys(DEFS).sort((a,b)=>b.length-a.length);
function stripLab(l){return l.replace(/^[A-K]:/,'').replace(/^実数:/,'').replace(/[（(][^（）()]*[)）]$/,'');}
function defOf(label){var s2=label.replace(/^[A-K]:/,'').replace(/^実数:/,'');if(DEFS[s2])return DEFS[s2];var base=stripLab(label);if(DEFS[base])return DEFS[base];for(var i=0;i<DEFKEYS.length;i++){var k=DEFKEYS[i];if(s2.indexOf(k)>=0||base.indexOf(k)>=0)return DEFS[k];}return null;}
function polArrow(p){return p==='up'?'<span style="color:var(--good)">▲ 大きいほど活発／高い</span>':p==='down'?'<span style="color:var(--bad)">▽ 小さいほど良好</span>':'<span style="color:var(--mut)">― 規模・構成（優劣なし）</span>';}
function dirText(p){return p==='up'?'▲ 大きいほど活発/高い':p==='down'?'▽ 小さいほど良好':'― 規模・構成（優劣なし）';}
function tipAttr(label){var d=defOf(label);if(!d)return '';var t=(d[0]+'　【'+dirText(d[1])+'】').replace(/"/g,'&quot;').replace(/</g,'&lt;');return ' class="hasdef" data-tip="'+t+'"';}
function tabDefs(t,R,code){
 var labels=[];
 if(t.grp){Object.keys(TSM.cat).forEach(function(c){if(TSM.cat[c].g===t.grp&&tsArr(code,c))labels.push(TSM.cat[c].l);});}
 SSDS.forEach(function(c){if(t.chap.indexOf(c.charAt(0))>=0)labels.push(c.replace(/^[A-K]:/,''));});
 var extra={jin:['高齢化率','年少率','人口増減率','人口密度','将来推計人口','人口指数','社会増減率','自然増減率','出生率','婚姻率'],zai:['財政力指数','経常収支比率','実質公債費比率','将来負担比率','実質収支比率']};
 (extra[t.key]||[]).forEach(function(l){labels.push(l);});
 var seen={},rows='';
 labels.forEach(function(l){var d=defOf(l);if(!d||seen[d[0]])return;seen[d[0]]=1;rows+='<tr><td class="nm" style="font-weight:700;white-space:normal;min-width:120px">'+l+'</td><td class="nm" style="white-space:normal">'+d[0]+'</td><td class="nm" style="white-space:normal;min-width:140px;font-size:11px">'+polArrow(d[1])+'</td></tr>';});
 if(!rows)return '';
 return '<div class="sub2">用語の定義（この分野）<div class="hint">順位は<b>値の大きい順（1位＝最大値）</b>。「評価の向き」は一般的な望ましさの目安です。</div></div><div class="tablecard"><div class="tscroll" style="max-height:none"><table><thead><tr><th class="nm">用語</th><th class="nm">定義</th><th class="nm">評価の向き</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function unitOf(col){var m=col.match(/[（(]([^（）()]+)[)）]$/);return m?m[1]:'';}
function peersOf(pref){return ROWS.filter(r=>get(r,'prefecture')===pref);}
function rankIn(peers,col,val){if(val==null)return null;var a=peers.map(r=>get(r,col)).filter(x=>typeof x==='number');if(!a.length)return null;a.sort((x,y)=>y-x);return {rank:a.filter(x=>x>val).length+1,n:a.length,med:a[Math.floor(a.length/2)]};}
function rc(rk,n){if(n<2)return 'var(--mut)';var p=(n-rk)/(n-1);return p>.66?'var(--good)':p>.33?'var(--mid)':'var(--bad)';}
function rw(rk,n){if(n<2)return '';var p=(n-rk)/(n-1);return p>.66?'上位':p>.33?'中位':'下位';}
/* nice 軸 */
function niceNum(x,round){if(x<=0)return 1;var exp=Math.floor(Math.log(x)/Math.LN10),f=x/Math.pow(10,exp),nf;if(round){nf=f<1.5?1:f<3?2:f<7?5:10;}else{nf=f<=1?1:f<=2?2:f<=5?5:10;}return nf*Math.pow(10,exp);}
function niceScale(mn,mx,n){if(mn===mx){mx=mn+(mn===0?1:Math.abs(mn)*0.1);}var rng=niceNum(mx-mn,false);var step=niceNum(rng/(n-1),true);var lo=Math.floor(mn/step)*step,hi=Math.ceil(mx/step)*step;var ticks=[];for(var v=lo;v<=hi+step/2;v+=step)ticks.push(Math.round(v/step*1e6)/1e6*step);return {lo:lo,hi:hi,step:step,ticks:ticks};}
function fmtTick(v){var a=Math.abs(v);if(a>=1e8)return Math.round(v/1e7)/10+'億';if(a>=1e4)return Math.round(v/1000)/10+'万';if(a!==0&&a<10)return Math.round(v*100)/100;return Math.round(v);}
/* TS */
function tsAxis(code){return TSM.axis[code]||[];}
function tsArr(mc,code){var r=TS[mc];return r?r[code]:null;}
function tsVal(mc,code,y){var ax=tsAxis(code),a=tsArr(mc,code);if(!a)return null;var i=ax.indexOf(y);return i<0?null:a[i];}
function tsLatest(mc,code){var ax=tsAxis(code),a=tsArr(mc,code);if(!a)return null;for(var i=a.length-1;i>=0;i--)if(a[i]!=null)return {y:ax[i],v:a[i]};return null;}
function avgPref(code,peers){var ax=tsAxis(code);return ax.map(function(y){var s=0,c=0;peers.forEach(function(p){var v=tsVal(get(p,'code'),code,y);if(v!=null){s+=v;c++;}});return c?s/c:null;});}
function idxArr(a){var base=null;for(var i=0;i<a.length;i++){if(a[i]!=null){base=a[i];break;}}if(!base)return a.map(_=>null);return a.map(v=>v==null?null:Math.round(v/base*1000)/10);}

/* ===== SVG折れ線(複数系列・nice軸) ===== */
function svgLine(series,xlabels,opt){
 opt=opt||{};var W=opt.w||340,H=opt.h||170,pl=44,pr=10,pt=12,pb=24;
 var iw=W-pl-pr,ih=H-pt-pb,n=xlabels.length,all=[];
 series.forEach(s=>s.pts.forEach(p=>{if(p.v!=null)all.push(p.v);}));
 if(!all.length)return '<div style="color:#9aa3b2;font-size:12px;padding:18px">データなし</div>';
 var rmx=Math.max.apply(null,all),rmn=Math.min.apply(null,all);
 if(opt.zero)rmn=Math.min(0,rmn);
 var ns=niceScale(rmn,rmx,5),lo=ns.lo,hi=ns.hi;if(hi===lo)hi=lo+1;
 var X=i=>pl+(n<=1?iw/2:iw*i/(n-1)),Y=v=>pt+ih-(v-lo)/(hi-lo)*ih;
 var g='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;font-family:inherit">';
 ns.ticks.forEach(function(tv){if(tv<lo-1e-9||tv>hi+1e-9)return;var yy=Y(tv);var z=(Math.abs(tv)<1e-9);g+='<line x1="'+pl+'" y1="'+yy+'" x2="'+(W-pr)+'" y2="'+yy+'" stroke="'+(z?'#b9c4d2':'#eef1f7')+'" stroke-width="'+(z?1.2:1)+'"/><text x="'+(pl-5)+'" y="'+(yy+3)+'" text-anchor="end" font-size="9.5" fill="#9aa3b2">'+(opt.fmtY?opt.fmtY(tv):fmtTick(tv))+'</text>';});
 var step=Math.ceil(n/8);
 xlabels.forEach((lb,i)=>{if(i%step===0||i===n-1)g+='<text x="'+X(i)+'" y="'+(H-7)+'" text-anchor="middle" font-size="9.5" fill="#7a8494">'+lb+'</text>';});
 series.forEach(function(s){var solid=[],dash=[];for(var i=0;i<s.pts.length;i++){var p=s.pts[i];if(p.v==null)continue;var seg=p.future?dash:solid;seg.push(X(i)+','+Y(p.v));if(p.future&&i>0&&s.pts[i-1].v!=null&&!s.pts[i-1].future)dash.unshift(X(i-1)+','+Y(s.pts[i-1].v));}
   if(solid.length)g+='<polyline points="'+solid.join(' ')+'" fill="none" stroke="'+s.color+'" stroke-width="'+(s.w||2)+'"/>';
   if(dash.length)g+='<polyline points="'+dash.join(' ')+'" fill="none" stroke="'+s.color+'" stroke-width="'+(s.w||2)+'" stroke-dasharray="5 4" opacity=".85"/>';
   if(s.dots!==false)s.pts.forEach((p,i)=>{if(p.v!=null)g+='<circle cx="'+X(i)+'" cy="'+Y(p.v)+'" r="'+(s.w?2.4:2)+'" fill="'+s.color+'"/>';});});
 g+='</svg>';
 var leg=series.filter(s=>s.name).map(s=>'<span style="display:inline-flex;align-items:center;gap:4px;margin-right:9px;font-size:10.5px"><span style="width:12px;height:3px;background:'+s.color+';display:inline-block;border-radius:2px"></span>'+s.name+'</span>').join('');
 return g+(leg?'<div style="margin-top:1px">'+leg+'</div>':'');
}

/* ===== 複合: 上段=総数(折線) 下段=自然/社会増減(棒) ===== */
function svgCombo(years,pop,nat,soc){
 var W=660,H=300,pl=54,pr=14,n=years.length;
 var iw=W-pl-pr;
 var X=i=>pl+(n<=1?iw/2:iw*i/(n-1));
 var pv=pop.filter(v=>v!=null);if(!pv.length)return '';
 // 上段 人口
 var t1=14,h1=150; // population panel
 var ns=niceScale(Math.min.apply(null,pv),Math.max.apply(null,pv),4),plo=ns.lo,phi=ns.hi;if(phi===plo)phi=plo+1;
 var YP=v=>t1+h1-(v-plo)/(phi-plo)*h1;
 // 下段 増減
 var t2=190,h2=86; var zc=t2+h2/2;
 var bv=[].concat(nat,soc).filter(v=>v!=null);if(!bv.length)bv=[0];
 var bm=Math.max(Math.abs(Math.max.apply(null,bv)),Math.abs(Math.min.apply(null,bv)))||1;var bs=niceScale(0,bm,2),bmax=bs.hi;
 var YB=v=>zc-(v/bmax)*(h2/2);
 var g='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;font-family:inherit">';
 // 上段グリッド
 ns.ticks.forEach(function(tv){if(tv<plo-1e-9||tv>phi+1e-9)return;var yy=YP(tv);g+='<line x1="'+pl+'" y1="'+yy+'" x2="'+(W-pr)+'" y2="'+yy+'" stroke="#eef1f7"/><text x="'+(pl-5)+'" y="'+(yy+3)+'" text-anchor="end" font-size="9.5" fill="#9aa3b2">'+fmtTick(tv)+'</text>';});
 g+='<text x="'+pl+'" y="10" font-size="10" fill="#7a8494" font-weight="700">住民基本台帳人口（人）</text>';
 // 上段 線
 var pts=[];pop.forEach((v,i)=>{if(v!=null)pts.push(X(i)+','+YP(v));});
 g+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="var(--navy)" stroke-width="2.4"/>';
 pop.forEach((v,i)=>{if(v!=null)g+='<circle cx="'+X(i)+'" cy="'+YP(v)+'" r="2.6" fill="var(--navy)"/>';});
 // 下段 目盛り
 [bmax,bmax/2,0,-bmax/2,-bmax].forEach(function(v){var yy=YB(v);g+='<line x1="'+pl+'" y1="'+yy+'" x2="'+(W-pr)+'" y2="'+yy+'" stroke="'+(v===0?'#b9c4d2':'#f0f2f7')+'" stroke-width="'+(v===0?1.2:1)+'"/><text x="'+(pl-5)+'" y="'+(yy+3)+'" text-anchor="end" font-size="9" fill="#9aa3b2">'+(v>0?'+':'')+fmtTick(v)+'</text>';});
 g+='<text x="'+pl+'" y="'+(t2-4)+'" font-size="10" fill="#7a8494" font-weight="700">自然増減・社会増減（人／年）</text>';
 var bw=Math.max(3,iw/n/3);
 years.forEach(function(yr,i){var cx=X(i);
   if(nat[i]!=null){var y0=YB(0),y1=YB(nat[i]);g+='<rect x="'+(cx-bw-1)+'" y="'+Math.min(y0,y1)+'" width="'+bw+'" height="'+Math.abs(y1-y0)+'" fill="var(--bad)" opacity=".85"/>';}
   if(soc[i]!=null){var z0=YB(0),z1=YB(soc[i]);g+='<rect x="'+(cx+1)+'" y="'+Math.min(z0,z1)+'" width="'+bw+'" height="'+Math.abs(z1-z0)+'" fill="var(--blue)" opacity=".85"/>';}
   if(i%Math.ceil(n/9)===0||i===n-1)g+='<text x="'+cx+'" y="'+(H-7)+'" text-anchor="middle" font-size="9.5" fill="#7a8494">'+yr+'</text>';});
 g+='</svg>';
 var leg='<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:11px"><span style="width:12px;height:3px;background:var(--navy);display:inline-block"></span>住基人口</span><span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:11px"><span style="width:10px;height:10px;background:var(--bad);display:inline-block"></span>自然増減</span><span style="display:inline-flex;align-items:center;gap:4px;font-size:11px"><span style="width:10px;height:10px;background:var(--blue);display:inline-block"></span>社会増減</span>';
 return g+'<div style="margin-top:2px">'+leg+'</div>';
}
function dynCombo(mc){var ax=tsAxis('A2301');if(!ax.length)return '';var pop=ax.map(y=>tsVal(mc,'A2301',y));if(pop.every(v=>v==null))return '';var nat=ax.map(function(y){var b=tsVal(mc,'A4101',y),d=tsVal(mc,'A4200',y);return (b!=null&&d!=null)?b-d:null;});var soc=ax.map(function(y){var i=tsVal(mc,'A5103',y),o=tsVal(mc,'A5104',y);return (i!=null&&o!=null)?i-o:null;});return svgCombo(ax,pop,nat,soc);}

/* ===== 二軸折れ線: 右=指数(基準年100) 左=本市の実数。本市は1本で両軸共有、県/全国は指数 ===== */
function svgDual(xlabels,seriesA,baseIdx,unit){
 var W=348,H=168,pl=46,pr=40,pt=14,pb=24,iw=W-pl-pr,ih=H-pt-pb,n=xlabels.length;
 // 各系列を baseIdx 年の値=100 で指数化（無ければ各自の初出非null）
 function baseOf(a){if(a[baseIdx]!=null)return a[baseIdx];for(var i=0;i<a.length;i++)if(a[i]!=null)return a[i];return null;}
 var idxSeries=seriesA.map(function(s){var b=baseOf(s.a);return {name:s.name,color:s.color,w:s.w,dots:s.dots,base:b,idx:s.a.map(v=>(v==null||!b)?null:v/b*100)};});
 var all=[];idxSeries.forEach(s=>s.idx.forEach(v=>{if(v!=null)all.push(v);}));
 if(!all.length)return '<div style="color:#9aa3b2;font-size:12px;padding:18px">データなし</div>';
 var ns=niceScale(Math.min.apply(null,all),Math.max.apply(null,all),5),lo=ns.lo,hi=ns.hi;if(hi===lo)hi=lo+1;
 var baseCity=idxSeries[0].base;
 var X=i=>pl+(n<=1?iw/2:iw*i/(n-1)),Y=v=>pt+ih-(v-lo)/(hi-lo)*ih;
 var g='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;font-family:inherit">';
 ns.ticks.forEach(function(tv){if(tv<lo-1e-9||tv>hi+1e-9)return;var yy=Y(tv);var b100=(Math.abs(tv-100)<1e-9);g+='<line x1="'+pl+'" y1="'+yy+'" x2="'+(W-pr)+'" y2="'+yy+'" stroke="'+(b100?'#cdd6e4':'#eef1f7')+'" stroke-width="'+(b100?1.2:1)+'"/>';
   g+='<text x="'+(pl-5)+'" y="'+(yy+3)+'" text-anchor="end" font-size="9" fill="#7a8494">'+Math.round(tv)+'</text>';
   g+='<text x="'+(W-pr+4)+'" y="'+(yy+3)+'" font-size="9" fill="#9aa3b2">'+(baseCity?fmtTick(baseCity*tv/100):'')+'</text>';});
 var step=Math.ceil(n/8);
 xlabels.forEach((lb,i)=>{if(i%step===0||i===n-1)g+='<text x="'+X(i)+'" y="'+(H-7)+'" text-anchor="middle" font-size="9.5" fill="#7a8494">'+lb+'</text>';});
 g+='<text x="'+(pl-2)+'" y="9" text-anchor="start" font-size="8.5" fill="#9aa3b2">指数</text><text x="'+(W-pr+2)+'" y="9" text-anchor="end" font-size="8.5" fill="#9aa3b2">'+_SL+'の実数'+(unit?'('+unit+')':'')+'</text>';
 idxSeries.forEach(function(s){var pts=[];s.idx.forEach((v,i)=>{if(v!=null)pts.push(X(i)+','+Y(v));});if(pts.length)g+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="'+s.color+'" stroke-width="'+(s.w||2)+'"/>';if(s.dots!==false)s.idx.forEach((v,i)=>{if(v!=null)g+='<circle cx="'+X(i)+'" cy="'+Y(v)+'" r="'+(s.w?2.4:2)+'" fill="'+s.color+'"/>';});});
 g+='</svg>';
 var leg=idxSeries.map(s=>'<span style="display:inline-flex;align-items:center;gap:4px;margin-right:9px;font-size:10.5px"><span style="width:12px;height:3px;background:'+s.color+';display:inline-block;border-radius:2px"></span>'+s.name+'</span>').join('');
 return g+'<div style="margin-top:1px">'+leg+'<span style="font-size:10px;color:#9aa3b2;margin-left:4px">左=指数(基準年100)／右='+_SL+'の実数</span></div>';
}
/* ===== 経年グラフ ===== */
function tsChart(mc,code,peers,mode){
 var ax=tsAxis(code),a=tsArr(mc,code);if(!a)return '';
 var cat=TSM.cat[code]||{l:code,u:''};var lat=tsLatest(mc,code);
 var city=a.slice(),pref=((PA&&PA[code])?PA[code].slice():avgPref(code,peers)),nat=(NA[code]||[]).slice();
 var first=null,fi=0;for(var i=0;i<a.length;i++){if(a[i]!=null){first=a[i];fi=i;break;}}
 var chart;
 if(mode==='real'){
   var P=arr=>arr.map(v=>({v:v,future:false}));
   chart=svgLine([{name:_SL,color:C_CITY,pts:P(city),w:2.4},{name:_PU+'平均',color:C_PREF,pts:P(pref),dots:false},{name:'全国平均',color:C_NAT,pts:P(nat),dots:false}],ax.map(String),{w:336,h:158,zero:true});
 }else{
   chart=svgDual(ax.map(String),[{name:_SL,color:C_CITY,a:city,w:2.4},{name:_PU+'平均',color:C_PREF,a:pref,dots:false},{name:'全国平均',color:C_NAT,a:nat,dots:false}],fi,cat.u);
 }
 var chg='';if(first!=null&&lat){var d=lat.v-first,p=first?Math.round(d/first*1000)/10:0;chg=ax[fi]+'→'+lat.y+'年 '+(d>=0?'+':'')+p+'%';}
 return '<div class="tsbox"><div class="tsh"'+tipAttr(cat.l)+'>'+cat.l+'<span class="tsu">'+(cat.u||'')+'</span></div>'+chart+'<div class="tsf">最新 <b>'+(lat?fmt(lat.v):'–')+'</b>'+(lat?' ('+lat.y+')':'')+(chg?'　<span style="color:#9aa3b2">'+_SL+' '+chg+'</span>':'')+'</div></div>';
}
function tsCharts(mc,peers,group,mode){var codes=Object.keys(TSM.cat).filter(c=>TSM.cat[c].g===group&&tsArr(mc,c));return codes.map(c=>tsChart(mc,c,peers,mode)).join('');}
function tsGroup(mc,peers,group,gid){
 var codes=Object.keys(TSM.cat).filter(c=>TSM.cat[c].g===group&&tsArr(mc,c));if(!codes.length)return '';
 var bar='';
 return '<div class="sub2">経年データ（'+group+'・'+codes.length+'指標）'+bar+'<div class="hint">'+_SL+'＝紺／'+_PU+'平均＝金／全国平均＝灰。左軸=指数(基準年100)で伸びを比較、右軸='+_SL+'の実数。出典: 社会・人口統計体系 基礎(年次)</div></div><div class="tsgrid" id="tsgrid_'+gid+'">'+tsCharts(mc,peers,group,'dual')+'</div>';
}

/* ===== 割合の県内比較 ===== */
function derivedRates(R,pref,code){
 var peers=peersOf(pref);
 var defs=[{l:'社会増減率',u:'‰',num:'A5103',num2:'A5104',den:'A2301',k:1000,desc:'(転入−転出)/住基人口×1000'},{l:'自然増減率',u:'‰',num:'A4101',num2:'A4200',den:'A2301',k:1000,desc:'(出生−死亡)/住基人口×1000'},{l:'出生率',u:'‰',num:'A4101',den:'A2301',k:1000,desc:'出生数/住基人口×1000'},{l:'婚姻率',u:'‰',num:'A9101',den:'A2301',k:1000,desc:'婚姻件数/住基人口×1000'}];
 function calc(mc,d){var ax=tsAxis(d.num);for(var i=ax.length-1;i>=0;i--){var y=ax[i];var n1=tsVal(mc,d.num,y);var n2=d.num2?tsVal(mc,d.num2,y):0;var de=tsVal(mc,d.den,y);if(n1!=null&&(!d.num2||n2!=null)&&de){return {v:(n1-(d.num2?n2:0))/de*d.k,y:y};}}return null;}
 var rows=defs.map(function(d){var mine,rank,n,med;
   if(RI&&RI[d.l]){var a=RI[d.l];mine={v:a[0],y:a[1]};rank=a[2];n=a[3];med=a[4];}
   else{mine=calc(code,d);if(!mine)return '';var arr=peers.map(p=>{var c=calc(get(p,'code'),d);return c?c.v:null;}).filter(x=>x!=null);arr.sort((a,b)=>b-a);rank=arr.filter(x=>x>mine.v).length+1;n=arr.length;med=arr[Math.floor(n/2)];}
   if(!mine)return '';
   return '<tr><td class="nm"'+tipAttr(d.l)+'>'+d.l+' <span class="tsu">'+d.u+'</span><div style="font-size:10.5px;color:#9aa3b2">'+d.desc+'</div></td><td class="say">'+(Math.round(mine.v*10)/10)+'</td><td>'+mine.y+'</td><td><b style="color:'+rc(rank,n)+'">'+rank+'/'+n+'</b> '+rw(rank,n)+'</td><td>'+(Math.round(med*10)/10)+'</td></tr>';}).filter(Boolean).join('');
 if(!rows)return '';
 return '<div class="sub2">人口の割合指標（'+_PU+'内比較・自動算出）<div class="hint">人口千人当たり等で規模差を補正。順位＝値の大きい順(1位=最大)</div></div><div class="tablecard"><div class="tscroll"><table><thead><tr><th class="nm">指標</th><th>'+_SL+'</th><th>年</th><th>'+_PU+'内順位</th><th>'+_PU+'内中央値</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}

/* ===== SSDS指標(章別) ===== */
function ssdsTable(R,pref,code,chapters,tid){
 var peers=peersOf(pref);var cols=SSDS.filter(c=>chapters.indexOf(c.charAt(0))>=0);if(!cols.length)return null;
 var data=cols.map(function(c){var v=get(R,c);var ratio=isRatio(c);var ri=(v!=null&&ratio)?rankOf(c,peers,v):null;return {col:c,v:v,ri:ri,ratio:ratio};});
 function row(d){var rk='–';if(d.ri)rk='<b style="color:'+rc(d.ri.rank,d.ri.n)+'">'+d.ri.rank+'/'+d.ri.n+'</b> '+rw(d.ri.rank,d.ri.n);else if(d.v!=null&&!d.ratio)rk='<span style="color:#aab">規模</span>';var btn=(typeof d.v==='number')?'<span class="dbchart" data-col="'+encodeURIComponent(d.col)+'" style="cursor:pointer;color:var(--blue);font-weight:800">📊</span>':'';return '<tr><td class="nm"'+tipAttr(d.col)+'>'+d.col.replace(/^[A-K]:/,'')+'</td><td class="say">'+fmt(d.v)+'</td><td>'+rk+'</td><td>'+(d.ri?fmt(d.ri.med):'–')+'</td><td style="text-align:center">'+btn+'</td></tr>';}
 var html='<div class="sub2">'+_PU+'内比較指標（'+cols.length+'項目・割合/密度中心）<div class="hint">見出しクリックで並べ替え／📊で'+_PU+'内ランキング。順位＝値の大きい順(1位=最大)</div></div><div class="tablecard"><div class="tscroll"><table id="'+tid+'"><thead><tr><th class="nm sortable" data-k="col">指標</th><th class="sortable" data-k="val">値 ▾</th><th class="sortable" data-k="rank">'+_PU+'内順位</th><th>'+_PU+'内中央値</th><th>図</th></tr></thead><tbody>'+data.map(row).join('')+'</tbody></table></div></div>';
 return {html:html,data:data,row:row,tid:tid,code:code,pref:pref};
}
function wireTable(spec){if(!spec)return;var tbl=document.getElementById(spec.tid);if(!tbl)return;var tb=tbl.querySelector('tbody');var dir={};tbl.querySelectorAll('th.sortable').forEach(function(th){th.style.cursor='pointer';th.onclick=function(){var k=th.dataset.k;dir[k]=!dir[k];var s=dir[k]?1:-1;spec.data.sort(function(a,b){if(k==='col')return s*a.col.localeCompare(b.col,'ja');if(k==='val'){var av=(typeof a.v==='number')?a.v:-Infinity,bv=(typeof b.v==='number')?b.v:-Infinity;return s*(bv-av);}var ar=a.ri?a.ri.rank:Infinity,br=b.ri?b.ri.rank:Infinity;return s*(ar-br);});tb.innerHTML=spec.data.map(spec.row).join('');wireChart(spec);};});wireChart(spec);}
function wireChart(spec){document.getElementById(spec.tid).querySelectorAll('.dbchart').forEach(function(el){el.onclick=function(){openChart(spec.pref,decodeURIComponent(el.dataset.col),spec.code);};});}

/* ===== ランキング棒グラフ ===== */
function ensureModal(){var m=document.getElementById('dbChartModal');if(m)return m;m=document.createElement('div');m.id='dbChartModal';m.style.cssText='position:fixed;inset:0;background:rgba(20,28,49,.55);z-index:9999;display:none;align-items:center;justify-content:center;padding:18px';m.innerHTML='<div style="background:#fff;border-radius:14px;max-width:760px;width:100%;max-height:86vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.3)"><div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line)"><div id="dbChartTitle" style="font-weight:800;color:var(--navy);font-size:15px"></div><div id="dbChartX" style="cursor:pointer;font-size:22px;color:var(--mut);padding:0 4px">×</div></div><div id="dbChartBody" style="overflow:auto;padding:14px 18px"></div><div id="dbChartFoot" style="padding:9px 18px;border-top:1px solid var(--line);font-size:11px;color:var(--mut)"></div></div>';document.body.appendChild(m);m.addEventListener('click',function(e){if(e.target===m)m.style.display='none';});document.getElementById('dbChartX').onclick=function(){m.style.display='none';};return m;}
function openChart(pref,col,code){var peers=peersOf(pref);var arr=peers.map(r=>({nm:get(r,'name'),cd:get(r,'code'),v:get(r,col)})).filter(o=>typeof o.v==='number');if(!arr.length)return;arr.sort((a,b)=>b.v-a.v);var max=arr[0].v,min=arr[arr.length-1].v,base=Math.min(0,min),span=(max-base)||1,u=unitOf(col);var m=ensureModal();document.getElementById('dbChartTitle').textContent=col.replace(/^実数:|^[A-K]:/,'')+'（'+pref+' '+prefUnit(pref)+'内ランキング）';document.getElementById('dbChartBody').innerHTML=arr.map(function(o,idx){var w=Math.max(1,(o.v-base)/span*100),me=o.cd===code,bc=me?'var(--gold)':'var(--blue)';return '<div style="display:flex;align-items:center;gap:8px;margin:3px 0;'+(me?'background:#fff7e0;border-radius:6px;padding:2px 4px':'')+'"><div style="width:30px;text-align:right;color:var(--mut);font-size:11px">'+(idx+1)+'</div><div style="width:92px;font-size:12px;font-weight:'+(me?'800':'600')+';color:'+(me?'var(--navy)':'#333')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+o.nm+'</div><div style="flex:1;background:#eef1f7;border-radius:4px;overflow:hidden"><div style="width:'+w+'%;height:15px;background:'+bc+';border-radius:4px"></div></div><div style="width:92px;text-align:right;font-size:11.5px;font-weight:'+(me?'800':'600')+'">'+fmt(o.v)+'</div></div>';}).join('');document.getElementById('dbChartFoot').textContent='棒＝値の大きさ（金=当該自治体）。単位:'+(u||'—')+'｜'+arr.length+'市区町村';m.style.display='flex';setTimeout(function(){var me=document.querySelector('#dbChartBody div[style*="fff7e0"]');if(me)me.scrollIntoView({block:'center'});},30);}
window.DB={openChart:openChart};

function card(R,pref,k,col,unit,ratio){var peers=peersOf(pref);var v=get(R,col);var rk='';if(v!=null&&ratio){var ri=rankOf(col,peers,v);if(ri)rk='<div class="r"><span class="rkbadge" style="background:'+rc(ri.rank,ri.n)+'">'+_PU+'内 '+ri.rank+'/'+ri.n+'位 '+rw(ri.rank,ri.n)+'</span></div>';}return '<div class="card"><div class="k"'+tipAttr(k)+'>'+k+'</div><div class="v">'+fmt(v)+' <small>'+(unit||'')+'</small></div>'+rk+'</div>';}

function popTrend(R,pref,code){var s=PS[code];if(!s)return '';var fy=['2025','2030','2035','2040','2045','2050'],fp={'2025':get(R,'人口_2025')};['2030','2035','2040','2045','2050'].forEach(y=>fp[y]=get(R,'A:将来推計人口（'+y+'年）'));var px=s.y.map(String).concat(fy),pp=[];s.p.forEach(v=>pp.push({v:v,future:false}));fy.forEach((y,k)=>pp.push({v:(typeof fp[y]==='number'?fp[y]:null),future:k>0}));var ax=s.y.map(String).concat(['2050']);var ag=s.a.map(v=>({v:v,future:false}));ag.push({v:get(R,'高齢化率_2050'),future:true});var yg=s.j.map(v=>({v:v,future:false}));yg.push({v:get(R,'年少率_2050'),future:true});return '<div class="tsgrid"><div class="tsbox"><div class="tsh">総人口の推移（国勢2000-2025＋社人研推計-2050）</div>'+svgLine([{name:'総人口',color:'var(--blue)',pts:pp,w:2.4}],px,{w:336,h:160,zero:true})+'<div class="tsf" style="color:#9aa3b2">実線=実績／点線=推計</div></div><div class="tsbox"><div class="tsh">高齢化率・年少率の推移（%）</div>'+svgLine([{name:'高齢化率',color:'var(--bad)',pts:ag},{name:'年少率',color:'var(--good)',pts:yg}],ax,{w:336,h:160,fmtY:v=>Math.round(v)+'%'})+'</div></div>';}

function similar(R,pref,code){var lst=SM[code];if(!lst||!lst.length)return '';var names=lst.slice(0,3).map(o=>o.n+'（'+o.pref+'）').join('、');var top=lst[0];var rows=lst.map(function(o,i){var link=o.c?('<a href="'+cityHref(o.c,o.n,o.pref)+'" style="color:var(--blue);font-weight:700;text-decoration:none">'+o.n+'</a>'):o.n;return '<tr><td style="text-align:center;color:var(--mut)">'+(i+1)+'</td><td class="nm">'+link+'</td><td class="nm" style="color:var(--mut)">'+o.pref+'</td><td>'+fmt(o.pop)+'</td><td>'+(o.aged!=null?o.aged+'%':'–')+'</td><td>'+(o.fin!=null?fmt(o.fin):'–')+'</td><td style="color:#9aa3b2">'+o.d+'</td></tr>';}).join('');return '<div class="sub2">似ている自治体（全国・自動算出）</div><div class="note" style="background:#fbf8ef;border-left-color:var(--gold)">人口規模・密度・高齢化率・人口増減率・財政力指数・産業構成・昼夜間人口比率を標準化し全国1,741から距離が近い順に抽出。最も近いのは <b>'+top.n+'（'+top.pref+'）</b>。ほか '+names+' など。</div><div class="tablecard"><div class="tscroll"><table><thead><tr><th style="width:30px">#</th><th class="nm">自治体</th><th class="nm">都道府県</th><th>人口2025</th><th>高齢化率2050</th><th>財政力指数</th><th>類似度</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';}

function sourcesBlock(){var S=[['人口・人口動態','国勢調査(2000-2025)・社会人口統計体系 基礎A(住基/出生死亡/転入転出 年次)','e-Stat 0004050397・0000020101','2000-2025'],['将来推計人口','社人研 地域別将来推計人口(令和5年推計)','結果表Excel','2023推計-2050'],['経済/教育/労働/医療福祉/財政の経年','社会・人口統計体系 基礎データ(年次)','e-Stat 0000020103/04/05/06/07/09/10','2010-2023'],['全国平均・'+_PU+'平均','上記を全自治体平均(全国)／同一'+_PU+'平均で算出','自動集計','各年'],[_PU+'内比較指標','社会・人口統計体系 指標','e-Stat 0000020301-11','各最新'],['似ている自治体','正規化特徴量のz-score最近傍(自動算出)','similar.json','2026-06']];return '<div class="sub2">出典</div><div class="tablecard" style="padding:0"><table style="font-size:12px"><thead><tr><th class="nm">データ群</th><th class="nm">出典</th><th class="nm">ID</th><th>年次</th></tr></thead><tbody>'+S.map(s=>'<tr><td class="nm" style="font-weight:700">'+s[0]+'</td><td class="nm">'+s[1]+'</td><td class="nm" style="color:var(--mut);font-size:11px">'+s[2]+'</td><td>'+s[3]+'</td></tr>').join('')+'</tbody></table></div><div class="note" style="margin-top:8px">e-Stat API・社人研Excelから一括取得し5桁団体コードで結合。経年は2010年以降（国勢由来は5年刻み）。'+_PU+'平均=同一'+_PU+'の市区町村平均、全国平均=全1,741市区町村平均。</div>';}

var TABS=[{key:'jin',label:'人口',chap:['A','B'],grp:'人口'},{key:'kei',label:'経済・産業',chap:['C'],grp:'経済'},{key:'rou',label:'労働',chap:['F'],grp:'労働'},{key:'kyo',label:'教育・文化',chap:['E','G'],grp:'教育・文化'},{key:'iryo',label:'医療・福祉',chap:['I','J'],grp:'医療・福祉'},{key:'zai',label:'財政',chap:['D'],grp:'財政'},{key:'kur',label:'居住・安全',chap:['H','K'],grp:null}];

var STYLE='<style>.tabbar{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 4px;border-bottom:2px solid var(--line)}.tabbtn{padding:8px 14px;border:1px solid var(--line);border-bottom:none;background:#eef1f7;color:var(--mut);font-weight:700;font-size:13px;border-radius:8px 8px 0 0;cursor:pointer}.tabbtn.on{background:#fff;color:var(--navy);box-shadow:0 -2px 0 var(--gold) inset}.tabpane{display:none}.tabpane.on{display:block}.tsgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:12px}.tsbox{background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 12px}.tsh{font-size:12.5px;font-weight:700;color:var(--navy);margin-bottom:2px}.tsu{color:#9aa3b2;font-weight:400;font-size:11px;margin-left:4px}.tsf{font-size:11.5px;color:var(--mut);margin-top:3px}.hint{font-weight:400;font-size:11px;color:var(--mut);margin-top:2px}.hasdef{cursor:help}.hasdef:hover{border-bottom:1px dotted var(--mut)}.tstoggle{margin-left:10px;font-size:0}.tsmode{display:inline-block;font-size:11.5px;font-weight:700;padding:3px 9px;border:1px solid var(--line);cursor:pointer;color:var(--mut);background:#fff}.tsmode:first-child{border-radius:6px 0 0 6px}.tsmode:last-child{border-radius:0 6px 6px 0;border-left:none}.tsmode.on{background:var(--blue);color:#fff;border-color:var(--blue)}</style>';

function tabPane(R,pref,code,t,specs){
 var peers=peersOf(pref);var h='';
 if(t.key==='jin'){
   h+='<div class="sub2">人口・世帯（国勢2025速報）</div><div class="cards">'+card(R,pref,'人口(2025)','人口_2025','人',false)+card(R,pref,'人口増減率(20→25)','人口増減率_20_25','％',true)+card(R,pref,'世帯数(2025)','世帯数_2025','世帯',false)+card(R,pref,'人口密度','人口密度_2025','人/km2',true)+'</div>';
   h+='<div class="sub2">人口の長期推移</div>'+popTrend(R,pref,code);
   h+='<div class="sub2">人口動態：総数（上）と自然増減・社会増減（下）<div class="hint">上段＝住基人口の折れ線／下段＝増減の棒（ゼロ基準）</div></div><div class="tsbox" style="max-width:680px">'+dynCombo(code)+'</div>';
   h+=derivedRates(R,pref,code);
   h+='<div class="sub2">将来推計（社人研 令和5年）</div><div class="cards">'+card(R,pref,'将来人口(2050)','将来人口_2050','人',false)+card(R,pref,'高齢化率(2050)','高齢化率_2050','％',true)+card(R,pref,'年少率(2050)','年少率_2050','％',true)+card(R,pref,'人口指数(2020=100)','人口指数_2050','',true)+'</div>';
 }
 if(t.key==='zai'){h+='<div class="sub2">財政（R5決算）</div><div class="cards">'+['財政力指数','経常収支比率','実質公債費比率','将来負担比率','実質収支比率'].map(x=>card(R,pref,x,x,x==='財政力指数'?'':'％',true)).join('')+'</div>';}
 if(t.grp){h+=tsGroup(code,peers,t.grp,t.key);}
 if(t.key==='kur'){h+='<div class="note">居住(住宅・土地統計調査は5年ごと・人口1.5万人以上が対象)と安全(交通事故・刑法犯のSSDS基礎データは2009年で更新停止)は、全自治体を毎年そろえた連続系列が取れないため、経年グラフは設けず最新の指標のみを掲載しています。</div>';}
 var sp=specs[t.key];if(sp)h+=sp.html;
 h+=tabDefs(t,R,code);
 if(!h)h='<div class="note">この分野の該当データはありません。</div>';
 return h;
}

function initTip(){if(window._dbTipInit)return;window._dbTipInit=1;var e=document.createElement('div');e.id='dbTip';e.style.cssText='position:fixed;z-index:10000;max-width:300px;background:#1c2331;color:#fff;font-size:11.5px;line-height:1.55;padding:8px 11px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.32);pointer-events:none;display:none;opacity:0;transition:opacity .12s';document.body.appendChild(e);
 var timer=null,cur=null;
 function show(t){cur=t;e.textContent=t.getAttribute('data-tip');e.style.display='block';var r=t.getBoundingClientRect();var ew=e.offsetWidth||280,eh=e.offsetHeight||40;var x=r.left;if(x+ew>window.innerWidth-6)x=window.innerWidth-ew-6;if(x<6)x=6;var y=r.top-eh-8;if(y<6)y=r.bottom+8;e.style.left=x+'px';e.style.top=y+'px';e.style.opacity='1';}
 function hide(){clearTimeout(timer);e.style.opacity='0';e.style.display='none';cur=null;}
 document.addEventListener('mouseover',function(ev){var t=ev.target.closest&&ev.target.closest('[data-tip]');if(!t||t===cur)return;clearTimeout(timer);timer=setTimeout(function(){show(t);},350);});
 document.addEventListener('mouseout',function(ev){var t=ev.target.closest&&ev.target.closest('[data-tip]');if(t&&(!ev.relatedTarget||!t.contains(ev.relatedTarget)))hide();});
 document.addEventListener('click',function(ev){if(!(ev.target.closest&&ev.target.closest('[data-tip]')))hide();},true);}
function render(host,R,pref,code){
 initTip();var peers=peersOf(pref);_PU=prefUnit(pref);_SL=selfLabel(get(R,'type'));
 var specs={};TABS.forEach(function(t){var sp=ssdsTable(R,pref,code,t.chap,'tbl_'+t.key);if(sp)specs[t.key]=sp;});
 var bar='<div class="tabbar">'+TABS.map((t,i)=>'<div class="tabbtn'+(i===0?' on':'')+'" data-tab="'+t.key+'">'+t.label+'</div>').join('')+'<div class="tabbtn" data-tab="sim">似ている自治体</div><div class="tabbtn" data-tab="src">出典</div></div>';
 var panes=TABS.map((t,i)=>'<div class="tabpane'+(i===0?' on':'')+'" id="pane_'+t.key+'">'+tabPane(R,pref,code,t,specs)+'</div>').join('');
 panes+='<div class="tabpane" id="pane_sim">'+similar(R,pref,code)+'</div><div class="tabpane" id="pane_src">'+sourcesBlock()+'</div>';
 host.innerHTML=STYLE+bar+panes;
 var btns=host.querySelectorAll('.tabbtn');
 btns.forEach(function(b){b.onclick=function(){btns.forEach(x=>x.classList.remove('on'));b.classList.add('on');host.querySelectorAll('.tabpane').forEach(p=>p.classList.remove('on'));var pane=host.querySelector('#pane_'+b.dataset.tab);if(pane)pane.classList.add('on');};});
 Object.keys(specs).forEach(k=>wireTable(specs[k]));
}
window.DB.render=render;
})();
