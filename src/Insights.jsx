import { useState, useMemo } from "react";

const ACCT_COLOR = { RRSP: "#1B4F8A", LIRA: "#0A8A50", TFSA: "#96780A", RESP: "#6B3FA0" };

const f = (n, d=2) => n.toLocaleString("en-CA", {minimumFractionDigits:d, maximumFractionDigits:d});
const fC = n => (n<0?"-$":"$")+f(Math.abs(n));
const fP = (n,plus=true) => (plus&&n>0?"+":"")+f(n)+"%";

// Approximate beta values by ticker (market beta relative to S&P 500)
const BETAS = {
  AMAT: 1.85, AAPL: 1.20, GOOG: 1.15, AMZN: 1.25, ARKK: 1.90,
  VOOG: 1.10, IRM: 0.85, AXP: 1.30, LOW: 1.10, LMT: 0.75,
  XBI: 1.60, SMH: 1.75, JEF: 1.40, VTS: 0.90, DOL: 0.65,
  TD: 0.85, "GRT.UN": 0.70, "CGL.C": 0.10, "IBIT": 1.80,
  "PG": 0.55, XEQT: 0.95, "CASH.TO": 0.00, TGRO: 0.85,
};

// Sector/theme groupings
const THEMES = {
  "US Tech & AI": ["AMAT", "AAPL", "GOOG", "AMZN", "SMH", "ARKK"],
  "US Growth ETF": ["VOOG"],
  "Global Passive": ["XEQT", "TGRO"],
  "Financials": ["AXP", "JEF", "TD"],
  "Real Assets": ["IRM", "GRT.UN"],
  "Defensive": ["DOL", "LOW", "LMT", "PG"],
  "Alternatives": ["CGL.C", "IBIT", "CASH.TO"],
  "Biotech": ["XBI"],
  "Energy": ["VTS"],
};

const ALERTS_KEY = "pf_alerts_v1";
function loadAlerts() {
  try { const r = localStorage.getItem(ALERTS_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveAlerts(data) { try { localStorage.setItem(ALERTS_KEY, JSON.stringify(data)); } catch {} }

export default function Insights({ rows, totalVal, quotes, fx }) {
  const [alerts, setAlerts] = useState(loadAlerts);
  const [alertDraft, setAlertDraft] = useState({});
  const [editingAlert, setEditingAlert] = useState(null);
  const [concThreshold, setConcThreshold] = useState(10);
  const [whatIfSell, setWhatIfSell] = useState("");
  const [whatIfBuy, setWhatIfBuy] = useState("");
  const [whatIfAmt, setWhatIfAmt] = useState(0);

  const validRows = rows.filter(r => r.mv != null);

  // Portfolio beta (weighted average)
  const portfolioBeta = useMemo(() => {
    let weightedBeta = 0;
    let totalWeight = 0;
    validRows.forEach(r => {
      const beta = BETAS[r.displayTicker] ?? 1.0;
      const w = (r.mv ?? r.cb) / totalVal;
      weightedBeta += beta * w;
      totalWeight += w;
    });
    return totalWeight > 0 ? weightedBeta / totalWeight : 1.0;
  }, [validRows, totalVal]);

  // 52-week proximity flags
  const nearHigh = validRows.filter(r => r.rP != null && r.rP >= 90);
  const nearLow = validRows.filter(r => r.rP != null && r.rP <= 10);

  // Concentration warnings
  const concentrated = validRows.filter(r => r.w >= concThreshold);

  // Unusual volume
  const unusualVol = validRows.filter(r => r.vR != null && r.vR >= 1.5).sort((a,b)=>(b.vR??0)-(a.vR??0));

  // Price alerts triggered
  const triggeredAlerts = validRows.filter(r => {
    const alert = alerts[r.displayTicker];
    if (!alert || !r.pC) return false;
    if (alert.above && r.pC >= alert.above) return true;
    if (alert.below && r.pC <= alert.below) return true;
    return false;
  });

  // Theme breakdown
  const themeData = Object.entries(THEMES).map(([theme, tickers]) => {
    const themeRows = validRows.filter(r => tickers.includes(r.displayTicker));
    const val = themeRows.reduce((s,r) => s+(r.mv??r.cb), 0);
    const pct = totalVal > 0 ? (val/totalVal)*100 : 0;
    const dayChg = themeRows.reduce((s,r) => s+(r.dA??0), 0);
    return { theme, val, pct, dayChg, count: themeRows.length };
  }).filter(t => t.val > 0).sort((a,b) => b.val-a.val);

  // What-if analysis
  const whatIfRows = useMemo(() => {
    if (!whatIfSell && !whatIfBuy) return null;
    return validRows.map(r => {
      let newMv = r.mv ?? r.cb;
      if (r.displayTicker === whatIfSell) newMv = Math.max(0, newMv - whatIfAmt);
      if (r.displayTicker === whatIfBuy) newMv = newMv + whatIfAmt;
      const newTotal = totalVal + (whatIfBuy ? whatIfAmt : 0) - (whatIfSell ? whatIfAmt : 0);
      return { ...r, newMv, newW: newTotal > 0 ? (newMv/newTotal)*100 : 0 };
    }).filter(r => r.newMv > 0).sort((a,b) => b.newMv-a.newMv);
  }, [whatIfSell, whatIfBuy, whatIfAmt, validRows, totalVal]);

  const saveAlert = (ticker) => {
    const updated = { ...alerts, [ticker]: alertDraft[ticker] || {} };
    if (!updated[ticker].above && !updated[ticker].below) {
      delete updated[ticker];
    }
    setAlerts(updated);
    saveAlerts(updated);
    setEditingAlert(null);
  };

  const Section = ({ title, badge, badgeColor, children }) => (
    <div style={{background:"#FFF",borderRadius:10,border:"1px solid #E2E8F0",marginBottom:20,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
      <div style={{padding:"14px 20px",borderBottom:"1px solid #F0EDE8",display:"flex",alignItems:"center",gap:10,background:"#FAFAF8"}}>
        <span style={{fontSize:12,fontWeight:800,color:"#0B2447",letterSpacing:"0.08em"}}>{title}</span>
        {badge!=null&&<span style={{background:(badgeColor||"#0B2447")+"18",color:badgeColor||"#0B2447",border:`1px solid ${badgeColor||"#0B2447"}30`,borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700}}>{badge}</span>}
      </div>
      <div style={{padding:"16px 20px"}}>{children}</div>
    </div>
  );

  const StatCard = ({ label, value, sub, color }) => (
    <div style={{background:"#F8F9FA",borderRadius:8,padding:"14px 16px",border:"1px solid #EEE"}}>
      <div style={{fontSize:10,fontWeight:700,color:"#AAA",letterSpacing:"0.1em",marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color:color||"#0B2447"}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#999",marginTop:4}}>{sub}</div>}
    </div>
  );

  const TickerBadge = ({ r }) => (
    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:ACCT_COLOR[r.account]+"12",border:`1px solid ${ACCT_COLOR[r.account]}30`,borderRadius:4,padding:"4px 10px",margin:"2px"}}>
      <div style={{width:6,height:6,borderRadius:"50%",background:ACCT_COLOR[r.account]}}/>
      <span style={{fontSize:12,fontWeight:700,color:"#0B2447"}}>{r.displayTicker}</span>
      <span style={{fontSize:11,color:"#999"}}>{f(r.w)}%</span>
    </div>
  );

  return (
    <div style={{fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif",background:"#F4F2EE",minHeight:"100vh",padding:"28px"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:800,color:"#0B2447",marginBottom:4}}>Portfolio Insights</h1>
          <p style={{fontSize:13,color:"#999"}}>Risk analysis, alerts, and portfolio intelligence</p>
        </div>

        {/* PORTFOLIO OVERVIEW STATS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          <StatCard label="PORTFOLIO BETA" value={f(portfolioBeta)} sub={portfolioBeta > 1.2 ? "High market sensitivity" : portfolioBeta < 0.8 ? "Defensive posture" : "Near market neutral"} color={portfolioBeta > 1.3 ? "#B33A3A" : portfolioBeta < 0.8 ? "#1A6B3C" : "#0B2447"}/>
          <StatCard label="POSITIONS" value={validRows.length} sub={`Across ${[...new Set(validRows.map(r=>r.account))].length} accounts`}/>
          <StatCard label="NEAR 52W HIGH" value={nearHigh.length} sub={nearHigh.map(r=>r.displayTicker).join(", ")||"None"} color={nearHigh.length>0?"#1A6B3C":"#AAA"}/>
          <StatCard label="NEAR 52W LOW" value={nearLow.length} sub={nearLow.map(r=>r.displayTicker).join(", ")||"None"} color={nearLow.length>0?"#B33A3A":"#AAA"}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div>
            {/* ALERTS */}
            <Section title="PRICE ALERTS" badge={Object.keys(alerts).length||null} badgeColor="#96780A">
              {triggeredAlerts.length > 0 && (
                <div style={{background:"#FFF8E1",border:"1px solid #F59E0B",borderRadius:6,padding:"10px 14px",marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#92400E",marginBottom:6}}>⚡ ALERTS TRIGGERED</div>
                  {triggeredAlerts.map(r => {
                    const alert = alerts[r.displayTicker];
                    return (
                      <div key={r.displayTicker} style={{fontSize:12,color:"#92400E",marginBottom:2}}>
                        <strong>{r.displayTicker}</strong> at {fC(r.pC)} — {alert.above && r.pC >= alert.above ? `above target ${fC(alert.above)}` : `below target ${fC(alert.below)}`}
                      </div>
                    );
                  })}
                </div>
              )}
              {validRows.map(r => {
                const alert = alerts[r.displayTicker] || {};
                const isEditing = editingAlert === r.displayTicker;
                return (
                  <div key={r.displayTicker} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #F5F5F5"}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#0B2447",width:60}}>{r.displayTicker}</span>
                    <span style={{fontSize:11,color:"#AAA",flex:1}}>{fC(r.pC||0)}</span>
                    {!isEditing ? (
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        {alert.above&&<span style={{fontSize:10,color:"#1A6B3C",background:"#1A6B3C18",padding:"2px 6px",borderRadius:3}}>↑ {fC(alert.above)}</span>}
                        {alert.below&&<span style={{fontSize:10,color:"#B33A3A",background:"#B33A3A18",padding:"2px 6px",borderRadius:3}}>↓ {fC(alert.below)}</span>}
                        <button onClick={()=>{setEditingAlert(r.displayTicker);setAlertDraft({...alertDraft,[r.displayTicker]:{...alert}});}} style={{background:"#F4F2EE",border:"1px solid #DDD",borderRadius:3,padding:"3px 8px",fontSize:10,cursor:"pointer",color:"#666"}}>
                          {alert.above||alert.below?"Edit":"+ Alert"}
                        </button>
                      </div>
                    ) : (
                      <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:"#1A6B3C"}}>↑$</span>
                        <input type="number" placeholder="Above" value={alertDraft[r.displayTicker]?.above||""} onFocus={e=>e.target.select()}
                          onChange={e=>setAlertDraft(d=>({...d,[r.displayTicker]:{...d[r.displayTicker],above:parseFloat(e.target.value)||undefined}}))}
                          style={{width:70,border:"1px solid #DDD",borderRadius:3,padding:"3px 5px",fontSize:11,fontFamily:"inherit"}}/>
                        <span style={{fontSize:10,color:"#B33A3A"}}>↓$</span>
                        <input type="number" placeholder="Below" value={alertDraft[r.displayTicker]?.below||""} onFocus={e=>e.target.select()}
                          onChange={e=>setAlertDraft(d=>({...d,[r.displayTicker]:{...d[r.displayTicker],below:parseFloat(e.target.value)||undefined}}))}
                          style={{width:70,border:"1px solid #DDD",borderRadius:3,padding:"3px 5px",fontSize:11,fontFamily:"inherit"}}/>
                        <button onClick={()=>saveAlert(r.displayTicker)} style={{background:"#0B2447",color:"#FFF",border:"none",borderRadius:3,padding:"3px 8px",fontSize:10,cursor:"pointer"}}>Save</button>
                        <button onClick={()=>setEditingAlert(null)} style={{background:"none",border:"1px solid #DDD",borderRadius:3,padding:"3px 6px",fontSize:10,cursor:"pointer",color:"#999"}}>✕</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </Section>

            {/* UNUSUAL VOLUME */}
            <Section title="UNUSUAL VOLUME TODAY" badge={unusualVol.length||null} badgeColor="#96780A">
              {unusualVol.length === 0 ? (
                <div style={{fontSize:13,color:"#AAA",textAlign:"center",padding:"12px 0"}}>No unusual volume detected</div>
              ) : unusualVol.map(r => (
                <div key={r.displayTicker} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #F5F5F5"}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#0B2447",width:60}}>{r.displayTicker}</span>
                  <div style={{flex:1}}>
                    <div style={{height:6,background:"#EEE",borderRadius:3}}>
                      <div style={{height:6,background:"#96780A",borderRadius:3,width:`${Math.min(100,(r.vR??1)*33)}%`}}/>
                    </div>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:"#96780A"}}>{f(r.vR??0,1)}× avg</span>
                  <span style={{fontSize:11,color:"#AAA"}}>{((r.q?.vol||0)/1e6).toFixed(1)}M</span>
                </div>
              ))}
            </Section>

            {/* WHAT-IF */}
            <Section title="WHAT-IF SIMULATOR">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                <div>
                  <div style={{fontSize:10,color:"#AAA",fontWeight:700,marginBottom:4}}>SELL</div>
                  <select value={whatIfSell} onChange={e=>setWhatIfSell(e.target.value)} style={{width:"100%",border:"1px solid #DDD",borderRadius:4,padding:"6px 8px",fontSize:12,fontFamily:"inherit"}}>
                    <option value="">Select...</option>
                    {validRows.map(r=><option key={r.displayTicker} value={r.displayTicker}>{r.displayTicker}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#AAA",fontWeight:700,marginBottom:4}}>BUY</div>
                  <select value={whatIfBuy} onChange={e=>setWhatIfBuy(e.target.value)} style={{width:"100%",border:"1px solid #DDD",borderRadius:4,padding:"6px 8px",fontSize:12,fontFamily:"inherit"}}>
                    <option value="">Select...</option>
                    {validRows.map(r=><option key={r.displayTicker} value={r.displayTicker}>{r.displayTicker}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,color:"#AAA",fontWeight:700,marginBottom:4}}>AMOUNT ($)</div>
                  <input type="number" value={whatIfAmt} onChange={e=>setWhatIfAmt(parseFloat(e.target.value)||0)} onFocus={e=>e.target.select()}
                    style={{width:"100%",border:"1px solid #DDD",borderRadius:4,padding:"6px 8px",fontSize:12,fontFamily:"inherit"}}/>
                </div>
              </div>
              {whatIfRows && (
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#0B2447",marginBottom:8}}>Resulting top positions:</div>
                  {whatIfRows.slice(0,8).map(r=>(
                    <div key={r.displayTicker} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#0B2447",width:60}}>{r.displayTicker}</span>
                      <div style={{flex:1,position:"relative"}}>
                        <div style={{height:4,background:"#EEE",borderRadius:2}}/>
                        <div style={{position:"absolute",top:0,height:4,background:ACCT_COLOR[r.account],borderRadius:2,width:`${Math.min(100,r.w*3)}%`,opacity:0.4}}/>
                        <div style={{position:"absolute",top:0,height:4,background:ACCT_COLOR[r.account],borderRadius:2,width:`${Math.min(100,r.newW*3)}%`}}/>
                      </div>
                      <span style={{fontSize:11,color:r.newW>r.w?"#1A6B3C":r.newW<r.w?"#B33A3A":"#AAA",width:45,textAlign:"right"}}>{f(r.newW)}%</span>
                      {r.newW!==r.w&&<span style={{fontSize:10,color:r.newW>r.w?"#1A6B3C":"#B33A3A"}}>{r.newW>r.w?"+":""}{f(r.newW-r.w,1)}%</span>}
                    </div>
                  ))}
                </div>
              )}
              {!whatIfRows&&<div style={{fontSize:13,color:"#AAA",textAlign:"center",padding:"12px 0"}}>Select positions and amount to simulate a trade</div>}
            </Section>
          </div>

          <div>
            {/* CONCENTRATION */}
            <Section title="CONCENTRATION" badge={concentrated.length>0?`${concentrated.length} over ${concThreshold}%`:null} badgeColor="#B33A3A">
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <span style={{fontSize:11,color:"#666"}}>Flag positions over</span>
                <input type="number" value={concThreshold} onChange={e=>setConcThreshold(Number(e.target.value))} min={1} max={50}
                  style={{width:55,border:"1px solid #DDD",borderRadius:4,padding:"4px 8px",fontSize:13,fontWeight:700,fontFamily:"inherit",color:"#0B2447"}}/>
                <span style={{fontSize:11,color:"#666"}}>% of portfolio</span>
              </div>
              {validRows.sort((a,b)=>b.w-a.w).map(r=>(
                <div key={r.displayTicker} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:12,fontWeight:700,color:r.w>=concThreshold?"#B33A3A":"#0B2447",width:60}}>{r.displayTicker}</span>
                  <div style={{flex:1,position:"relative",height:6}}>
                    <div style={{height:6,background:"#EEE",borderRadius:3}}/>
                    <div style={{position:"absolute",top:0,height:6,borderRadius:3,width:`${Math.min(100,r.w*1.5)}%`,background:r.w>=concThreshold?"#B33A3A":ACCT_COLOR[r.account],opacity:r.w>=concThreshold?1:0.6}}/>
                    <div style={{position:"absolute",top:-2,height:10,width:2,background:"#B33A3A",left:`${Math.min(100,concThreshold*1.5)}%`}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:r.w>=concThreshold?"#B33A3A":"#555",width:40,textAlign:"right"}}>{f(r.w)}%</span>
                </div>
              ))}
            </Section>

            {/* THEME BREAKDOWN */}
            <Section title="THEME EXPOSURE">
              {themeData.map(t=>(
                <div key={t.theme} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#0B2447"}}>{t.theme}</span>
                    <div style={{display:"flex",gap:10}}>
                      {t.dayChg!==0&&<span style={{fontSize:11,color:t.dayChg>=0?"#1A6B3C":"#B33A3A"}}>{t.dayChg>=0?"+":""}{fC(t.dayChg)} today</span>}
                      <span style={{fontSize:12,fontWeight:700,color:"#555"}}>{f(t.pct)}%</span>
                    </div>
                  </div>
                  <div style={{height:6,background:"#EEE",borderRadius:3,marginBottom:4}}>
                    <div style={{height:6,background:"#0B2447",borderRadius:3,width:`${Math.min(100,t.pct)}%`,opacity:0.7}}/>
                  </div>
                  <div style={{fontSize:11,color:"#999"}}>{fC(t.val)} · {t.count} position{t.count!==1?"s":""}</div>
                </div>
              ))}
            </Section>

            {/* BETA TABLE */}
            <Section title="POSITION BETA" badge={`Portfolio β ${f(portfolioBeta)}`} badgeColor={portfolioBeta>1.3?"#B33A3A":portfolioBeta<0.8?"#1A6B3C":"#0B2447"}>
              <div style={{fontSize:11,color:"#999",marginBottom:12}}>Beta measures sensitivity to market moves. β=1.0 moves with the market, β=2.0 moves twice as much.</div>
              {validRows.sort((a,b)=>(BETAS[b.displayTicker]??1)-(BETAS[a.displayTicker]??1)).map(r=>{
                const beta = BETAS[r.displayTicker] ?? 1.0;
                const col = beta>1.5?"#B33A3A":beta>1.0?"#96780A":beta<0.5?"#1A6B3C":"#555";
                return (
                  <div key={r.displayTicker} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#0B2447",width:60}}>{r.displayTicker}</span>
                    <div style={{flex:1,position:"relative",height:4}}>
                      <div style={{height:4,background:"#EEE",borderRadius:2}}/>
                      <div style={{position:"absolute",top:0,height:4,background:col,borderRadius:2,width:`${Math.min(100,beta*40)}%`}}/>
                      <div style={{position:"absolute",top:-3,height:10,width:2,background:"#CCC",left:"40%"}}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:col,width:35,textAlign:"right"}}>{f(beta)}</span>
                    <span style={{fontSize:10,color:"#AAA",width:60}}>{r.w>=1?f(r.w)+"% wt":""}</span>
                  </div>
                );
              })}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
