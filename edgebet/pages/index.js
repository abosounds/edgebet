import { useState, useEffect } from 'react';
import Head from 'next/head';

const fmt = n => '$' + Math.round(n).toLocaleString('es-CO');
const CAP0 = 750000;
const G='#05d48a',R='#ff4060',A='#f0a500',B='#4090ff';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [bets, setBets] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState({ capital:750000, liga:'todas', riesgo:'conservador' });
  const [reg, setReg] = useState({ partido:'',liga:'',mercado:'',cuota:'',monto:'',resultado:'pendiente',notas:'' });
  const [toast, setToast] = useState('');
  const [riskPct, setRiskPct] = useState(2.5);
  const [stopPct, setStopPct] = useState(10);

  useEffect(() => {
    const s = localStorage.getItem('eb3');
    if (s) setBets(JSON.parse(s));
  }, []);

  const save = b => { setBets(b); localStorage.setItem('eb3', JSON.stringify(b)); };
  const toast_ = m => { setToast(m); setTimeout(()=>setToast(''),3000); };

  const stats = () => {
    let cap=CAP0, ganado=0, perdido=0;
    bets.forEach(b => {
      if(b.resultado==='ganada'){const g=(b.cuota-1)*b.monto;ganado+=g;cap+=g;}
      else if(b.resultado==='perdida'){perdido+=b.monto;cap-=b.monto;}
    });
    const gan=bets.filter(b=>b.resultado==='ganada').length;
    const per=bets.filter(b=>b.resultado==='perdida').length;
    return {cap,ganado,perdido,pnl:ganado-perdido,gan,per,roi:((cap-CAP0)/CAP0)*100};
  };

  const st = stats();
  const base = Math.round(st.cap * riskPct / 100);
  const stopLim = Math.round(st.cap * stopPct / 100);

  const analyze = async () => {
    setLoading(true); setAnalysis(null); setStep(0);
    const iv = setInterval(()=>setStep(s=>s<5?s+1:s), 4000);
    try {
      const res = await fetch('/api/analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(cfg)
      });
      const data = await res.json();
      clearInterval(iv); setStep(6);
      if(data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch(e) { clearInterval(iv); toast_('Error: '+e.message); }
    setLoading(false);
  };

  const registrar = () => {
    if(!reg.partido||!reg.mercado||!reg.cuota||!reg.monto){toast_('⚠ Completa todos los campos');return;}
    if(parseFloat(reg.cuota)<1.65){toast_('⚠ Cuota mínima: 1.65');return;}
    save([...bets,{...reg,cuota:parseFloat(reg.cuota),monto:parseFloat(reg.monto),fecha:new Date().toLocaleDateString('es-CO')}]);
    setReg({partido:'',liga:'',mercado:'',cuota:'',monto:'',resultado:'pendiente',notas:''});
    toast_('✓ Apuesta registrada');
  };

  const updateRes = (i,r) => { const b=[...bets]; b[i]={...b[i],resultado:r}; save(b); toast_('✓ Actualizado'); };

  const mono = "'IBM Plex Mono',monospace";
  const sans = "'IBM Plex Sans',sans-serif";

  const inp = {width:'100%',background:'#121820',border:'1px solid rgba(255,255,255,0.11)',borderRadius:7,padding:'9px 12px',color:'#dde4ee',fontSize:13,fontFamily:sans,outline:'none',boxSizing:'border-box'};
  const lbl = {fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:1.5,textTransform:'uppercase',display:'block',marginBottom:6};
  const card = {background:'#0c1018',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,overflow:'hidden'};
  const ch = {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)'};
  const ct = {fontFamily:mono,fontSize:12,fontWeight:600,letterSpacing:0.3};
  const rr = {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',fontSize:12.5};
  const navI = (id,icon,label) => (
    <div onClick={()=>setPage(id)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:6,fontSize:13,color:page===id?G:'#6a7a8e',cursor:'pointer',background:page===id?'rgba(5,212,138,0.1)':'transparent',border:`1px solid ${page===id?'rgba(5,212,138,0.25)':'transparent'}`,marginBottom:1}}>
      <span style={{fontSize:14}}>{icon}</span>{label}
    </div>
  );

  const badge = (color,text) => <span style={{display:'inline-flex',alignItems:'center',fontFamily:mono,fontSize:9,padding:'3px 7px',borderRadius:4,letterSpacing:0.5,fontWeight:500,color,background:color+'1a',border:`1px solid ${color}40`}}>{text}</span>;

  const metric = (color,label,val,sub) => (
    <div style={{background:'#0c1018',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:16,borderTop:`2px solid ${color}`}}>
      <div style={{fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:1.5,textTransform:'uppercase',marginBottom:8}}>{label}</div>
      <div style={{fontFamily:mono,fontSize:22,fontWeight:600,color,marginBottom:5}}>{val}</div>
      <div style={{fontFamily:mono,fontSize:10,color:'#38485a'}}>{sub}</div>
    </div>
  );

  const stepLabels=['Buscando partidos del día...','Revisando lesiones y bajas...','Analizando forma reciente...','Evaluando mercados con valor...','Calculando apuestas con Kelly...'];
  const confC = c=>c==='ALTA'?G:c==='MEDIA'?A:R;

  return (
    <>
      <Head>
        <title>EdgeBet</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#06080b;color:#dde4ee;font-family:'IBM Plex Sans',sans-serif}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </Head>
      <div style={{display:'flex',minHeight:'100vh'}}>

        {/* SIDEBAR */}
        <nav style={{width:200,background:'#0c1018',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',position:'fixed',top:0,bottom:0,left:0,zIndex:100}}>
          <div style={{padding:'22px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{fontFamily:mono,fontSize:17,fontWeight:600}}>Edge<span style={{color:G}}>Bet</span></div>
            <div style={{fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:2,textTransform:'uppercase',marginTop:3}}>Sports Analytics</div>
          </div>
          <div style={{padding:'10px 10px',flex:1}}>
            <div style={{fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:2,textTransform:'uppercase',padding:'14px 10px 5px'}}>Panel</div>
            {navI('dashboard','▦','Dashboard')}
            {navI('analisis','◎','Análisis IA')}
            <div style={{fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:2,textTransform:'uppercase',padding:'14px 10px 5px'}}>Registro</div>
            {navI('registro','✦','Registrar apuesta')}
            {navI('historial','◷','Historial')}
            <div style={{fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:2,textTransform:'uppercase',padding:'14px 10px 5px'}}>Sistema</div>
            {navI('capital','◇','Capital & Reglas')}
          </div>
          <div style={{padding:'14px 16px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{background:'rgba(5,212,138,0.1)',border:'1px solid rgba(5,212,138,0.25)',borderRadius:8,padding:'10px 12px'}}>
              <div style={{fontFamily:mono,fontSize:9,color:G,letterSpacing:1.5,textTransform:'uppercase',marginBottom:4}}>Capital actual</div>
              <div style={{fontFamily:mono,fontSize:15,fontWeight:600,color:G}}>{fmt(st.cap)}</div>
            </div>
          </div>
        </nav>

        {/* MAIN */}
        <div style={{marginLeft:200,flex:1,display:'flex',flexDirection:'column'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'15px 28px',borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(6,8,11,0.9)',position:'sticky',top:0,zIndex:50}}>
            <div style={{fontFamily:mono,fontSize:15,fontWeight:600}}>{{dashboard:'Dashboard',analisis:'Análisis IA',registro:'Registrar apuesta',historial:'Historial',capital:'Capital & Reglas'}[page]}</div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:6,fontFamily:mono,fontSize:10,color:'#6a7a8e',border:'1px solid rgba(255,255,255,0.11)',borderRadius:20,padding:'5px 10px'}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:G,display:'inline-block',boxShadow:`0 0 6px ${G}`}}></span>Sistema activo
              </div>
              <button onClick={()=>setPage('analisis')} style={{display:'flex',alignItems:'center',gap:6,background:G,color:'#000',border:'none',borderRadius:7,padding:'8px 14px',fontFamily:mono,fontSize:12,fontWeight:600,cursor:'pointer'}}>◎ Analizar hoy</button>
            </div>
          </div>

          <div style={{padding:'24px 28px'}}>

            {/* DASHBOARD */}
            {page==='dashboard' && <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
                {metric(G,'Capital actual',fmt(st.cap),'Capital inicial: '+fmt(CAP0))}
                {metric(st.roi>=0?G:R,'ROI acumulado',(st.roi>=0?'+':'')+st.roi.toFixed(2)+'%',(st.pnl>=0?'▲ ':'▼ ')+fmt(Math.abs(st.pnl))+' neto')}
                {metric(A,'Apuesta base',fmt(base),riskPct+'% del capital')}
                {metric(B,'Tasa de acierto',st.gan+st.per>0?Math.round(st.gan/(st.gan+st.per)*100)+'%':'—',st.gan+' gan / '+st.per+' perd')}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16}}>
                <div style={card}>
                  <div style={ch}><div style={ct}>ÚLTIMAS APUESTAS</div>{badge('#6a7a8e',bets.length+' registradas')}</div>
                  {bets.length===0?<div style={{padding:'40px 20px',textAlign:'center',color:'#38485a',fontSize:13}}>Sin apuestas aún. Usa "Registrar apuesta".</div>:
                    [...bets].reverse().slice(0,5).map((b,i)=>{
                      const c=b.resultado==='ganada'?G:b.resultado==='perdida'?R:A;
                      const pl=b.resultado==='ganada'?'+'+fmt((b.cuota-1)*b.monto):b.resultado==='perdida'?'-'+fmt(b.monto):'—';
                      return <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                        <div><div style={{fontSize:12.5,fontWeight:500}}>{b.partido}</div><div style={{fontFamily:mono,fontSize:10,color:'#6a7a8e',marginTop:2}}>{b.mercado} · {b.cuota}</div></div>
                        <div style={{textAlign:'right'}}>{badge(c,b.resultado.toUpperCase())}<div style={{fontFamily:mono,fontSize:12,marginTop:4,color:c}}>{pl}</div></div>
                      </div>;
                    })}
                </div>
                <div style={card}>
                  <div style={ch}><div style={ct}>REGLAS ACTIVAS</div>{badge(G,'Conservador')}</div>
                  {[['Apuesta por evento',riskPct+'% / '+fmt(base),A],['Stop-loss total','10% / '+fmt(stopLim),R],['Stop consecutivas','3 perdidas = parar',R],['Cuota mínima','1.65',null],['Cuota máxima','2.60',null],['Casa de apuestas','Stake',G]].map(([k,v,c],i)=>
                    <div key={i} style={rr}><span style={{color:'#6a7a8e'}}>{k}</span><span style={{fontFamily:mono,fontWeight:500,color:c||'#dde4ee'}}>{v}</span></div>)}
                </div>
              </div>
            </>}

            {/* ANÁLISIS */}
            {page==='analisis' && <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
              <div style={card}>
                <div style={ch}><div style={ct}>ANÁLISIS DEL DÍA</div>{badge(G,analysis?.fecha||'Pendiente')}</div>
                {loading && <div style={{padding:'32px 20px',textAlign:'center'}}>
                  <div style={{width:28,height:28,border:'2px solid rgba(255,255,255,0.11)',borderTopColor:G,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}></div>
                  <div style={{fontFamily:mono,fontSize:12,color:'#6a7a8e',marginBottom:16}}>Buscando en tiempo real...</div>
                  <div style={{display:'flex',flexDirection:'column',gap:6,maxWidth:280,margin:'0 auto',textAlign:'left'}}>
                    {stepLabels.map((l,i)=><div key={i} style={{fontFamily:mono,fontSize:10,display:'flex',alignItems:'center',gap:8,color:i<step?G:i===step?'#dde4ee':'#38485a'}}>
                      <span style={{width:5,height:5,borderRadius:'50%',background:'currentColor',flexShrink:0,display:'inline-block'}}></span>{l}
                    </div>)}
                  </div>
                </div>}
                {!loading && !analysis && <div style={{padding:'40px 20px',textAlign:'center',color:'#38485a',fontSize:13}}>
                  <div style={{fontSize:28,marginBottom:12,opacity:0.4}}>◎</div>
                  Configura y presiona <strong style={{color:'#6a7a8e'}}>"Analizar partidos de hoy"</strong>
                </div>}
                {!loading && analysis && <div style={{padding:18}}>
                  <div style={{background:'#121820',borderRadius:8,padding:'12px 14px',marginBottom:14,borderLeft:`3px solid ${G}`}}>
                    <div style={{fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:1.5,textTransform:'uppercase',marginBottom:6}}>PANORAMA DEL DÍA</div>
                    <div style={{fontSize:13,color:'#6a7a8e',lineHeight:1.7}}>{analysis.resumen_dia}</div>
                  </div>
                  {analysis.recomendaciones?.length===0 && <div style={{background:'rgba(240,165,0,0.1)',border:'1px solid rgba(240,165,0,0.2)',borderRadius:8,padding:14,fontSize:13,color:'#6a7a8e'}}>⚠ Sin apuestas con valor suficiente hoy. Mejor no forzar.</div>}
                  {analysis.recomendaciones?.map((rec,i)=><div key={i} style={{background:'#121820',border:'1px solid rgba(255,255,255,0.11)',borderRadius:8,marginBottom:12,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                      <div><div style={{fontSize:13,fontWeight:500}}>{rec.partido}</div><div style={{fontFamily:mono,fontSize:10,color:'#6a7a8e',marginTop:2}}>{rec.liga} · {rec.horario}</div></div>
                      {badge(confC(rec.confianza),rec.confianza)}
                    </div>
                    <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:10}}>
                      <div style={{background:'#1a2230',borderRadius:6,padding:'12px 14px'}}>
                        <div style={{fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:1.5,textTransform:'uppercase',marginBottom:6}}>RECOMENDACIÓN</div>
                        <div style={{fontSize:14,fontWeight:600,color:G,marginBottom:4}}>{rec.mercado}</div>
                        <div style={{fontFamily:mono,fontSize:11,color:'#6a7a8e'}}>Cuota mínima en Stake: <strong>{rec.cuota_minima}</strong></div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <div style={{background:'rgba(5,212,138,0.1)',border:'1px solid rgba(5,212,138,0.25)',borderRadius:6,padding:'10px 12px',textAlign:'center'}}>
                          <div style={{fontFamily:mono,fontSize:9,color:G,letterSpacing:1,marginBottom:4}}>APOSTAR</div>
                          <div style={{fontFamily:mono,fontSize:14,fontWeight:600,color:G}}>{fmt(rec.monto_cop)}</div>
                        </div>
                        <div style={{background:'#1a2230',borderRadius:6,padding:'10px 12px',textAlign:'center'}}>
                          <div style={{fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:1,marginBottom:4}}>RETORNO EST.</div>
                          <div style={{fontFamily:mono,fontSize:14,fontWeight:600}}>{fmt(rec.cuota_minima*rec.monto_cop)}</div>
                        </div>
                      </div>
                      <div style={{fontSize:12.5,color:'#6a7a8e',lineHeight:1.7,borderLeft:'2px solid rgba(5,212,138,0.25)',paddingLeft:10}}>{rec.analisis}</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <div style={{background:'rgba(255,64,96,0.08)',border:'1px solid rgba(255,64,96,0.15)',borderRadius:6,padding:'10px 12px'}}>
                          <div style={{fontFamily:mono,fontSize:9,color:R,letterSpacing:1,marginBottom:4}}>⚠ RIESGO</div>
                          <div style={{fontSize:11.5,color:'#6a7a8e'}}>{rec.riesgo_principal}</div>
                        </div>
                        <div style={{background:'rgba(240,165,0,0.08)',border:'1px solid rgba(240,165,0,0.15)',borderRadius:6,padding:'10px 12px'}}>
                          <div style={{fontFamily:mono,fontSize:9,color:A,letterSpacing:1,marginBottom:4}}>✗ EVITAR</div>
                          <div style={{fontSize:11.5,color:'#6a7a8e'}}>{rec.evitar}</div>
                        </div>
                      </div>
                      <button onClick={()=>{setReg(r=>({...r,partido:rec.partido,liga:rec.liga,mercado:rec.mercado,monto:rec.monto_cop}));setPage('registro');toast_('✓ Datos cargados');}} style={{background:'rgba(5,212,138,0.1)',color:G,border:'1px solid rgba(5,212,138,0.25)',borderRadius:7,padding:'8px',fontSize:11,fontFamily:mono,cursor:'pointer',width:'100%'}}>→ Cargar en registro</button>
                    </div>
                  </div>)}
                  {analysis.combinada?.recomendada && <div style={{background:'#121820',border:'1px solid rgba(5,212,138,0.25)',borderRadius:8,padding:'14px 16px',marginTop:4}}>
                    <div style={{fontFamily:mono,fontSize:10,color:G,letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>⚡ COMBINADA SUGERIDA</div>
                    <div style={{fontSize:12.5,color:'#6a7a8e',marginBottom:10}}>{analysis.combinada.razon}</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                      {[['CUOTA',analysis.combinada.cuota_total_estimada,'#dde4ee'],['APOSTAR',fmt(analysis.combinada.monto_cop),G],['RETORNO',fmt(analysis.combinada.cuota_total_estimada*analysis.combinada.monto_cop),'#dde4ee']].map(([l,v,c],i)=>
                        <div key={i} style={{background:'#1a2230',borderRadius:6,padding:'8px 10px',textAlign:'center'}}>
                          <div style={{fontFamily:mono,fontSize:9,color:'#38485a',marginBottom:3}}>{l}</div>
                          <div style={{fontFamily:mono,fontSize:14,fontWeight:600,color:c}}>{v}</div>
                        </div>)}
                    </div>
                  </div>}
                  {analysis.no_apostar?.length>0 && <div style={{background:'rgba(255,64,96,0.08)',border:'1px solid rgba(255,64,96,0.15)',borderRadius:8,padding:'12px 14px',marginTop:12}}>
                    <div style={{fontFamily:mono,fontSize:9,color:R,letterSpacing:1,textTransform:'uppercase',marginBottom:8}}>✗ NO APOSTAR HOY</div>
                    {analysis.no_apostar.map((x,i)=><div key={i} style={{fontSize:12,color:'#6a7a8e',padding:'2px 0'}}>· {x}</div>)}
                  </div>}
                  {analysis.advertencia_dia && <div style={{background:'rgba(240,165,0,0.08)',border:'1px solid rgba(240,165,0,0.15)',borderRadius:8,padding:'12px 14px',marginTop:12}}>
                    <div style={{fontFamily:mono,fontSize:9,color:A,letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>📌 NOTA</div>
                    <div style={{fontSize:12,color:'#6a7a8e'}}>{analysis.advertencia_dia}</div>
                  </div>}
                  <div style={{fontFamily:mono,fontSize:9,color:'#38485a',textAlign:'center',padding:'12px 0 0',borderTop:'1px solid rgba(255,255,255,0.06)',marginTop:14}}>Análisis en tiempo real. Verifica cuotas en Stake. No garantiza resultados.</div>
                </div>}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={card}>
                  <div style={ch}><div style={ct}>CONFIGURAR</div></div>
                  <div style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
                    <div><label style={lbl}>Capital (COP)</label><input style={inp} type="number" value={cfg.capital} onChange={e=>setCfg(c=>({...c,capital:parseInt(e.target.value)||750000}))}/></div>
                    <div><label style={lbl}>Ligas</label>
                      <select style={inp} value={cfg.liga} onChange={e=>setCfg(c=>({...c,liga:e.target.value}))}>
                        <option value="LaLiga">LaLiga</option>
                        <option value="Premier League">Premier League</option>
                        <option value="Champions League">Champions League</option>
                        <option value="Serie A">Serie A</option>
                        <option value="Bundesliga">Bundesliga</option>
                        <option value="todas">Todas las ligas</option>
                      </select>
                    </div>
                    <div><label style={lbl}>Perfil</label>
                      <select style={inp} value={cfg.riesgo} onChange={e=>setCfg(c=>({...c,riesgo:e.target.value}))}>
                        <option value="conservador">Conservador (2–3%)</option>
                        <option value="moderado">Moderado (3–5%)</option>
                      </select>
                    </div>
                    <button style={{background:G,color:'#000',border:'none',borderRadius:7,padding:11,fontFamily:mono,fontSize:12,fontWeight:600,cursor:'pointer',opacity:loading?0.6:1}} onClick={analyze} disabled={loading}>{loading?'Analizando...':'◎ Analizar partidos de hoy'}</button>
                  </div>
                </div>
                <div style={card}>
                  <div style={ch}><div style={ct}>¿CÓMO FUNCIONA?</div></div>
                  <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:8}}>
                    {['Busca partidos reales en internet','Analiza lesiones y estadísticas','Selecciona mercados con valor','Calcula apuesta con Kelly','Tú registras el resultado'].map((t,i)=>
                      <div key={i} style={{fontSize:11.5,color:'#6a7a8e',display:'flex',gap:8,alignItems:'flex-start'}}>
                        <span style={{color:G,fontFamily:mono,flexShrink:0}}>0{i+1}</span><span>{t}</span>
                      </div>)}
                  </div>
                </div>
              </div>
            </div>}

            {/* REGISTRO */}
            {page==='registro' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={card}>
                <div style={ch}><div style={ct}>REGISTRAR APUESTA</div></div>
                <div style={{padding:18}}>
                  {[['partido','Partido','Ej: Girona vs Real Sociedad'],['liga','Liga','Ej: LaLiga J36'],['mercado','Mercado','Ej: Under 2.5 goles'],['notas','Notas (opcional)','']].map(([k,l,p])=>
                    <div key={k} style={{marginBottom:14}}><label style={lbl}>{l}</label><input style={inp} value={reg[k]} onChange={e=>setReg(r=>({...r,[k]:e.target.value}))} placeholder={p}/></div>)}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                    <div><label style={lbl}>Cuota (Stake)</label><input style={inp} type="number" step="0.01" value={reg.cuota} onChange={e=>setReg(r=>({...r,cuota:e.target.value}))} placeholder="1.75"/></div>
                    <div><label style={lbl}>Monto (COP)</label><input style={inp} type="number" value={reg.monto} onChange={e=>setReg(r=>({...r,monto:e.target.value}))} placeholder={base}/></div>
                  </div>
                  <div style={{marginBottom:14}}><label style={lbl}>Resultado</label>
                    <select style={inp} value={reg.resultado} onChange={e=>setReg(r=>({...r,resultado:e.target.value}))}>
                      <option value="pendiente">Pendiente</option><option value="ganada">Ganada ✓</option><option value="perdida">Perdida ✗</option>
                    </select>
                  </div>
                  <button style={{background:G,color:'#000',border:'none',borderRadius:7,padding:11,fontFamily:mono,fontSize:12,fontWeight:600,cursor:'pointer',width:'100%'}} onClick={registrar}>✦ Registrar apuesta</button>
                </div>
              </div>
              <div style={card}>
                <div style={ch}><div style={ct}>RESUMEN</div></div>
                {[['Capital inicial',fmt(CAP0),null],['Capital actual',fmt(st.cap),G],['Ganado',fmt(st.ganado),G],['Perdido',fmt(st.perdido),R],['P&L',(st.pnl>=0?'+':'')+fmt(st.pnl),st.pnl>=0?G:R],['Apuestas',bets.length,B]].map(([k,v,c],i)=>
                  <div key={i} style={rr}><span style={{color:'#6a7a8e'}}>{k}</span><span style={{fontFamily:mono,fontWeight:500,color:c||'#dde4ee'}}>{v}</span></div>)}
                <div style={{padding:'14px 18px'}}>
                  <div style={{fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:1.5,textTransform:'uppercase',marginBottom:8}}>Stop-loss</div>
                  <div style={{fontSize:12,color:'#6a7a8e',marginBottom:6}}>Límite: <span style={{color:R,fontFamily:mono}}>{fmt(stopLim)}</span></div>
                  <div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',background:R,width:Math.min(st.perdido/stopLim*100,100)+'%',transition:'width 0.5s',borderRadius:2}}></div>
                  </div>
                </div>
              </div>
            </div>}

            {/* HISTORIAL */}
            {page==='historial' && <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
                {metric(G,'Ganadas',st.gan,st.gan+st.per>0?Math.round(st.gan/(st.gan+st.per)*100)+'% acierto':'—')}
                {metric(R,'Perdidas',st.per,st.gan+st.per>0?Math.round(st.per/(st.gan+st.per)*100)+'% error':'—')}
                {metric(st.pnl>=0?G:R,'P&L neto',(st.pnl>=0?'+':'')+fmt(st.pnl),'ROI: '+st.roi.toFixed(2)+'%')}
                {metric(B,'Total apostado',fmt(bets.reduce((s,b)=>s+b.monto,0)),bets.length+' apuestas')}
              </div>
              <div style={card}>
                <div style={ch}>
                  <div style={ct}>REGISTRO COMPLETO</div>
                  <button onClick={()=>{if(confirm('¿Eliminar todo?')){save([]);toast_('Historial eliminado');}}} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.11)',borderRadius:7,padding:'5px 12px',fontFamily:mono,fontSize:10,color:'#6a7a8e',cursor:'pointer'}}>Limpiar</button>
                </div>
                {bets.length===0?<div style={{padding:'40px 20px',textAlign:'center',color:'#38485a',fontSize:13}}>Sin apuestas registradas.</div>:<>
                  <div style={{display:'grid',gridTemplateColumns:'2fr 70px 90px 90px 80px 80px',padding:'8px 18px',fontFamily:mono,fontSize:9,color:'#38485a',letterSpacing:1.2,textTransform:'uppercase',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    <div>Partido</div><div>Cuota</div><div>Monto</div><div>Resultado</div><div>P&L</div><div>Fecha</div>
                  </div>
                  {[...bets].reverse().map((b,i)=>{
                    const oi=bets.length-1-i;
                    const c=b.resultado==='ganada'?G:b.resultado==='perdida'?R:A;
                    const pl=b.resultado==='ganada'?'+'+fmt((b.cuota-1)*b.monto):b.resultado==='perdida'?'-'+fmt(b.monto):'—';
                    return <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 70px 90px 90px 80px 80px',padding:'11px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',fontSize:12,alignItems:'center'}}>
                      <div><div style={{fontWeight:500,fontSize:12.5}}>{b.partido}</div><div style={{fontFamily:mono,fontSize:10,color:'#6a7a8e',marginTop:2}}>{b.mercado}</div></div>
                      <div style={{fontFamily:mono}}>{b.cuota}</div>
                      <div style={{fontFamily:mono}}>{fmt(b.monto)}</div>
                      <div>{b.resultado==='pendiente'?
                        <select style={{...inp,padding:'3px 6px',fontSize:10,fontFamily:mono}} value={b.resultado} onChange={e=>updateRes(oi,e.target.value)}>
                          <option value="pendiente">PEND.</option><option value="ganada">GANADA</option><option value="perdida">PERDIDA</option>
                        </select>:badge(c,b.resultado.toUpperCase())}
                      </div>
                      <div style={{fontFamily:mono,color:c}}>{pl}</div>
                      <div style={{fontFamily:mono,fontSize:10,color:'#38485a'}}>{b.fecha}</div>
                    </div>;
                  })}
                </>}
              </div>
            </>}

            {/* CAPITAL */}
            {page==='capital' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={card}>
                <div style={ch}><div style={ct}>CONFIGURACIÓN</div></div>
                <div style={{padding:18,display:'flex',flexDirection:'column',gap:14}}>
                  <div><label style={lbl}>Riesgo por apuesta: <span style={{color:A}}>{riskPct}%</span></label><input type="range" min="1" max="5" step="0.5" value={riskPct} onChange={e=>setRiskPct(parseFloat(e.target.value))} style={{width:'100%',marginTop:6}}/></div>
                  <div><label style={lbl}>Stop-loss total: <span style={{color:R}}>{stopPct}%</span></label><input type="range" min="5" max="20" step="1" value={stopPct} onChange={e=>setStopPct(parseInt(e.target.value))} style={{width:'100%',marginTop:6}}/></div>
                  <div style={{background:'#121820',borderRadius:8,padding:'12px 14px',border:'1px solid rgba(255,255,255,0.11)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12.5,marginBottom:6}}><span style={{color:'#6a7a8e'}}>Apuesta base</span><span style={{fontFamily:mono,color:A}}>{fmt(st.cap*riskPct/100)}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12.5}}><span style={{color:'#6a7a8e'}}>Pérdida máxima</span><span style={{fontFamily:mono,color:R}}>{fmt(st.cap*stopPct/100)}</span></div>
                  </div>
                </div>
              </div>
              <div style={card}>
                <div style={ch}><div style={ct}>REGLAS DEL SISTEMA</div></div>
                {[['Cuota mínima','1.65',null],['Cuota máxima','2.60',null],['Stop consecutivas','3 perdidas = parar',R],['Máx. simultáneas','3 eventos',null],['Casa de apuestas','Stake',G],['Reinversión','Mensual',G],['Mercados preferidos','Goles / Hándicap',null]].map(([k,v,c],i)=>
                  <div key={i} style={rr}><span style={{color:'#6a7a8e'}}>{k}</span><span style={{fontFamily:mono,fontWeight:500,color:c||'#dde4ee'}}>{v}</span></div>)}
              </div>
            </div>}

          </div>
        </div>

        {toast && <div style={{position:'fixed',bottom:24,right:24,background:'#121820',border:'1px solid rgba(5,212,138,0.25)',borderRadius:8,padding:'12px 18px',fontFamily:mono,fontSize:12,color:G,zIndex:999}}>{toast}</div>}
      </div>
    </>
  );
}
