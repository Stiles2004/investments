import { useState, useCallback, useEffect } from "react";
import Projections from "./Projections.jsx";
import Insights from "./Insights.jsx";

const HOLDINGS = [
  { ticker: "AMAT",      displayTicker: "AMAT",    shares: 30,        avgCostCAD: 53.864,   account: "RRSP", currency: "USD", purchaseDate: "2018-04-15", name: "Applied Materials" },
  { ticker: "AAPL",      displayTicker: "AAPL",    shares: 40,        avgCostCAD: 56.8765,  account: "RRSP", currency: "USD", purchaseDate: "2018-06-01", name: "Apple Inc." },
  { ticker: "DOL.TO",    displayTicker: "DOL",     shares: 30,        avgCostCAD: 50.3497,  account: "RRSP", currency: "CAD", purchaseDate: "2018-09-01", name: "Dollarama" },
  { ticker: "GOOG",      displayTicker: "GOOG",    shares: 20,        avgCostCAD: 74.373,   account: "RRSP", currency: "USD", purchaseDate: "2018-06-01", name: "Alphabet Inc." },
  { ticker: "IRM",       displayTicker: "IRM",     shares: 50,        avgCostCAD: 45.0762,  account: "RRSP", currency: "USD", purchaseDate: "2020-11-01", name: "Iron Mountain" },
  { ticker: "AXP",       displayTicker: "AXP",     shares: 10,        avgCostCAD: 130.951,  account: "RRSP", currency: "USD", purchaseDate: "2020-09-01", name: "American Express" },
  { ticker: "LOW",       displayTicker: "LOW",     shares: 10,        avgCostCAD: 119.371,  account: "RRSP", currency: "USD", purchaseDate: "2020-04-01", name: "Lowes Companies" },
  { ticker: "VOOG",      displayTicker: "VOOG",    shares: 210,       avgCostCAD: 101.9896, account: "RRSP", currency: "USD", purchaseDate: "2021-03-01", name: "Vanguard S&P 500 Growth" },
  { ticker: "TD.TO",     displayTicker: "TD",      shares: 20,        avgCostCAD: 74.9195,  account: "RRSP", currency: "CAD", purchaseDate: "2021-02-01", name: "TD Bank" },
  { ticker: "ARKK",      displayTicker: "ARKK",    shares: 65.59485,  avgCostCAD: 107.365,  account: "RRSP", currency: "USD", purchaseDate: "2026-05-06", name: "ARK Innovation ETF" },
  { ticker: "PG.TO",     displayTicker: "PG",      shares: 81,        avgCostCAD: 24.6133,  account: "RRSP", currency: "CAD", purchaseDate: "2025-06-01", name: "P&G CDR Hedged" },
  { ticker: "CGL-C.TO",  displayTicker: "CGL.C",   shares: 52,        avgCostCAD: 38.6921,  account: "RRSP", currency: "CAD", purchaseDate: "2021-08-01", name: "iShares Gold Bullion" },
  { ticker: "LMT",       displayTicker: "LMT",     shares: 4,         avgCostCAD: 603.8825, account: "RRSP", currency: "USD", purchaseDate: "2024-02-01", name: "Lockheed Martin" },
  { ticker: "XBI",       displayTicker: "XBI",     shares: 20,        avgCostCAD: 186.68,   account: "RRSP", currency: "USD", purchaseDate: "2026-05-05", name: "SPDR S&P Biotech" },
  { ticker: "SMH",       displayTicker: "SMH",     shares: 2,         avgCostCAD: 716.095,  account: "RRSP", currency: "USD", purchaseDate: "2026-05-05", name: "VanEck Semiconductor" },
  { ticker: "GRT-UN.TO", displayTicker: "GRT.UN",  shares: 15,        avgCostCAD: 81.2767,  account: "RRSP", currency: "CAD", purchaseDate: "2022-03-01", name: "Granite REIT" },
  { ticker: "JEF",       displayTicker: "JEF",     shares: 18,        avgCostCAD: 51.5606,  account: "RRSP", currency: "USD", purchaseDate: "2022-06-01", name: "Jefferies Financial" },
  { ticker: "VTS",       displayTicker: "VTS",     shares: 2,         avgCostCAD: 20.455,   account: "RRSP", currency: "USD", purchaseDate: "2023-09-01", name: "Vitesse Energy" },
  { ticker: "IBIT.NE",   displayTicker: "IBIT",    shares: 11.89983,  avgCostCAD: 49.4419,  account: "RRSP", currency: "CAD", purchaseDate: "2024-06-01", name: "iShares Bitcoin ETF" },
  { ticker: "AMZN",      displayTicker: "AMZN",    shares: 20,        avgCostCAD: 89.0355,  account: "RRSP", currency: "USD", purchaseDate: "2022-11-01", name: "Amazon" },
  { ticker: "XEQT.TO",  displayTicker: "XEQT",    shares: 4413,      avgCostCAD: 41.5648,  account: "LIRA", currency: "CAD", purchaseDate: "2025-02-01", name: "iShares Core Equity ETF" },
  { ticker: "CASH.TO",   displayTicker: "CASH.TO", shares: 399.76014, avgCostCAD: 50.055,   account: "TFSA", currency: "CAD", purchaseDate: "2026-05-13", name: "Global X High Int Savings" },
  { ticker: "TGRO.TO",   displayTicker: "TGRO",    shares: 113.27841, avgCostCAD: 25.5268,  account: "RESP", currency: "CAD", purchaseDate: "2025-03-01", name: "TD Growth ETF Portfolio" },
];

const ACCT_COLOR = { RRSP: "#1B4F8A", LIRA: "#0A8A50", TFSA: "#96780A", RESP: "#6B3FA0" };
const ACCT_ORDER = ["RRSP", "LIRA", "TFSA", "RESP"];
const CACHE_KEY_QUOTES = "pf_quotes_v1";
const CACHE_KEY_FX = "pf_fx_v1";
const CASH_KEY = "pf_cash_v1";
const YF_CHART = "https://query1.finance.yahoo.com/v8/finance/chart/";

const f = (n, d=2) => n.toLocaleString("en-CA", {minimumFractionDigits:d, maximumFractionDigits:d});
const fC = n => (n<0?"-$":"$")+f(Math.abs(n));
const fP = (n,plus=true) => (plus&&n>0?"+":"")+f(n)+"%";
const daysSince = d => Math.floor((Date.now()-new Date(d))/86400000);

function isMarketOpen() {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", {timeZone:"America/New_York"}));
  const day = et.getDay(); const mins = et.getHours()*60+et.getMinutes();
  return day>=1 && day<=5 && mins>=570 && mins<=960;
}

function getCacheTTL() { return isMarketOpen() ? 15*60*1000 : 4*60*60*1000; }

function saveCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ts:Date.now(), data})); } catch {}
}
function loadCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const {ts, data} = JSON.parse(raw);
    if (Date.now()-ts > getCacheTTL()) return null;
    return data;
  } catch { return null; }
}
function loadCacheStale(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw).data : null; } catch { return null; }
}
function loadCash() {
  try { const r = localStorage.getItem(CASH_KEY); return r ? JSON.parse(r) : {RRSP:100.43, LIRA:0, TFSA:0, RESP:0}; } catch { return {RRSP:100.43, LIRA:0, TFSA:0, RESP:0}; }
}
function saveCash(data) { try { localStorage.setItem(CASH_KEY, JSON.stringify(data)); } catch {} }

async function fetchYahoo(url) {
  try {
    const r = await fetch("/api/quote?url="+encodeURIComponent(url), {signal:AbortSignal.timeout(12000)});
    if (r.ok) return await r.json();
    return null;
  } catch { return null; }
}

async function fetchChartData(ticker) {
  const url = YF_CHART+ticker+"?interval=1d&range=5d";
  const j = await fetchYahoo(url);
  const m = j?.chart?.result?.[0]?.meta;
  const closes = j?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
  const curr = m?.regularMarketPrice ?? null;
  // Use native change fields when available, fall back to calculating from closes
  let chgPct = (m?.regularMarketChangePercent != null && m.regularMarketChangePercent !== 0)
    ? m.regularMarketChangePercent : null;
  let chgAmt = (m?.regularMarketChange != null && m.regularMarketChange !== 0)
    ? m.regularMarketChange : null;
  // Fallback: calculate from last two valid closes
  if (chgPct === null) {
    const valid = closes.filter(c=>c!=null);
    const prev = valid.length>=2 ? valid[valid.length-2] : null;
    if (curr!=null && prev!=null) {
      chgAmt = curr - prev;
      chgPct = (chgAmt / prev) * 100;
    }
  }
  if (m && curr) {
    return {
      price: curr, changePct: chgPct, changeAmt: chgAmt,
      hi52: m.fiftyTwoWeekHigh??null, lo52: m.fiftyTwoWeekLow??null,
      vol: m.regularMarketVolume??null, avgVol: m.averageDailyVolume3Month??m.averageDailyVolume10Day??null,
    };
  }
  return null;
}

async function fetchAllQuotes(force=false) {
  if (!force) { const cached = loadCache(CACHE_KEY_QUOTES); if (cached) return cached; }
  const allTickers = [...HOLDINGS.map(h=>h.ticker), "CADUSD=X"];
  const results = {};
  await Promise.all(allTickers.map(async ticker => {
    try {
      let data = await fetchChartData(ticker);
      if (!data && ticker.endsWith('.TO')) { data = await fetchChartData(ticker.replace('.TO','').replace('-UN','').replace('-C','')); }
      if (data) results[ticker] = data;
    } catch {}
  }));
  saveCache(CACHE_KEY_QUOTES, results);
  return results;
}

const SORTS = [
  ["weight","Value"],["dGA","Day $ ▲"],["dLA","Day $ ▼"],
  ["dGP","Day % ▲"],["dLP","Day % ▼"],["total","Total Return"],["az","A–Z"]
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quotes, setQuotes] = useState(() => loadCacheStale(CACHE_KEY_QUOTES) || {});
  const [fx, setFx] = useState(() => { const c=loadCacheStale(CACHE_KEY_FX); return c||null; });
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(null);
  const [cacheAge, setCacheAge] = useState(null);
  const [err, setErr] = useState(null);
  const [sortBy, setSortBy] = useState("weight");
  const [sortDir, setSortDir] = useState("desc");
  const [collapsed, setCollapsed] = useState({});
  const [cashBalances, setCashBalances] = useState(loadCash);
  const [indices, setIndices] = useState({});
  const [editingCash, setEditingCash] = useState(false);
  const [cashDraft, setCashDraft] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY_QUOTES);
      if (raw) { const {ts} = JSON.parse(raw); setCacheAge(ts); }
    } catch {}
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const q = await fetchAllQuotes(true);
      const fxRate = q["CADUSD=X"]?.price ?? null;
      if (fxRate) { setFx(fxRate); saveCache(CACHE_KEY_FX, fxRate); }
      setQuotes(q); setUpdated(new Date()); setCacheAge(Date.now());
      // Fetch market indices in background
      const indexTickers = ["^GSPTSE","^IXIC","^DJI","CL=F"];
      const idxResults = await Promise.allSettled(indexTickers.map(t => fetchChartData(t)));
      const idx = {};
      indexTickers.forEach((t,i) => { if(idxResults[i].status==="fulfilled"&&idxResults[i].value) idx[t]=idxResults[i].value; });
      setIndices(idx);
    } catch { setErr("Price fetch failed. Showing cached data."); }
    setLoading(false);
  }, []);

  const toCAD = p => fx ? p/fx : null;

  const rows = HOLDINGS.map(h => {
    const q = quotes[h.ticker];
    const pN = q?.price ?? null;
    const pC = pN===null ? null : h.currency==="USD" ? toCAD(pN) : pN;
    const mv = pC!==null ? pC*h.shares : null;
    const cb = h.avgCostCAD*h.shares;
    const dP = q?.changePct ?? null;
    const dANative = q?.changeAmt ?? null;
    const dA = (dANative!==null&&h.currency==="USD"&&pC!==null&&pN!==null) ? dANative*(pC/pN)*h.shares : dANative!==null ? dANative*h.shares : null;
    const dAusd = (dANative!==null&&h.currency==="USD") ? dANative*h.shares : null;
    const tG = mv!==null ? mv-cb : null;
    const tP = tG!==null ? (tG/cb)*100 : null;
    const hi = q?.hi52!=null ? (h.currency==="USD"?toCAD(q.hi52):q.hi52) : null;
    const lo = q?.lo52!=null ? (h.currency==="USD"?toCAD(q.lo52):q.lo52) : null;
    const rP = (pC&&hi&&lo&&hi!==lo) ? Math.max(0,Math.min(100,((pC-lo)/(hi-lo))*100)) : null;
    const days = daysSince(h.purchaseDate);
    const ann = (mv&&days>60) ? (Math.pow(mv/cb,365/days)-1)*100 : null;
    const vR = q?.vol&&q?.avgVol ? q.vol/q.avgVol : null;
    return {...h, q, pC, pN, mv, cb, dA, dP, dAusd, tG, tP, hi, lo, rP, days, ann, vR};
  });

  const totalVal = rows.reduce((s,r)=>s+(r.mv??r.cb),0) + Object.values(cashBalances).reduce((s,v)=>s+v,0);
  const loaded = rows.filter(r=>r.mv!==null);
  const totalDay = loaded.reduce((s,r)=>s+(r.dA??0),0);
  const totalDayP = totalVal>0?(totalDay/(totalVal-totalDay))*100:0;
  const withW = rows.map(r=>({...r,w:((r.mv??r.cb)/totalVal)*100}));
  const loadedW = withW.filter(r=>r.mv!==null);
  const best = loadedW.length?[...loadedW].sort((a,b)=>(b.dP??0)-(a.dP??0))[0]:null;
  const worst = loadedW.length?[...loadedW].sort((a,b)=>(a.dP??0)-(b.dP??0))[0]:null;
  const dayUp = totalDay>=0;
  const hasData = Object.keys(quotes).length > 0;

  const handleSort = col => {
    if (sortBy===col) { setSortDir(d=>d==="desc"?"asc":"desc"); }
    else { setSortBy(col); setSortDir("desc"); }
  };

  const sortFn = (a,b) => {
    let v = 0;
    if(sortBy==="weight") v=(b.mv??b.cb)-(a.mv??a.cb);
    else if(sortBy==="dGA") v=(b.dA??0)-(a.dA??0);
    else if(sortBy==="dLA") v=(a.dA??0)-(b.dA??0);
    else if(sortBy==="dGP") v=(b.dP??0)-(a.dP??0);
    else if(sortBy==="dLP") v=(a.dP??0)-(b.dP??0);
    else if(sortBy==="total") v=(b.tP??0)-(a.tP??0);
    else if(sortBy==="ann") v=(b.ann??-9999)-(a.ann??-9999);
    else if(sortBy==="price") v=(b.pC??0)-(a.pC??0);
    else if(sortBy==="vol") v=(b.q?.vol??0)-(a.q?.vol??0);
    else if(sortBy==="az") v=a.displayTicker.localeCompare(b.displayTicker);
    return sortDir==="asc"?-v:v;
  };

  const toggleCollapse = a => setCollapsed(c=>({...c,[a]:!c[a]}));

  const acctTotals = ACCT_ORDER.reduce((acc,a)=>{
    const h=withW.filter(r=>r.account===a);
    const cash=cashBalances[a]||0;
    acc[a]={
      val: h.reduce((s,r)=>s+(r.mv??r.cb),0)+cash,
      cost: h.reduce((s,r)=>s+r.cb,0)+cash,
      day: h.reduce((s,r)=>s+(r.dA??0),0),
      cash
    };
    return acc;
  },{});

  const cacheAgeStr = cacheAge ? (() => {
    const mins=Math.floor((Date.now()-cacheAge)/60000);
    if(mins<1) return "just now";
    if(mins<60) return `${mins}m ago`;
    return `${Math.floor(mins/60)}h ago`;
  })() : null;

  const COLS = [
    {label:"Security",      align:"left",  cls:"",   sort:"az"},
    {label:"Price",         align:"right", cls:"",   sort:"price"},
    {label:"Today",         align:"right", cls:"",   sort:"dGP"},
    {label:"Market Value",  align:"right", cls:"",   sort:"weight"},
    {label:"Weight",        align:"right", cls:"hm", sort:"weight"},
    {label:"52-Week Range", align:"center",cls:"hm", sort:null},
    {label:"Total Return",  align:"right", cls:"",   sort:"total"},
    {label:"Ann. Return",   align:"right", cls:"hm2",sort:"ann"},
    {label:"Vol / Avg",     align:"right", cls:"hm2",sort:"vol"},
  ];

  const portfolioForProjections = {
    RRSP: acctTotals.RRSP?.val||0,
    LIRA: acctTotals.LIRA?.val||0,
    TFSA: acctTotals.TFSA?.val||0,
    RESP: acctTotals.RESP?.val||0,
  };

  const NAV = (
    <div style={{background:"#0B2447",borderBottom:"3px solid #C9A84C"}}>
      <div style={{maxWidth:1440,margin:"0 auto",padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:2,height:24,background:"#C9A84C"}}/>
          <span style={{fontSize:16,fontWeight:700,color:"#FFF",letterSpacing:"0.04em"}}>Portfolio</span>
          {fx&&<span style={{fontSize:11,color:"#8FA8C8",marginLeft:4}}>CAD/USD {fx.toFixed(4)}</span>}
          <div style={{display:"flex",gap:2,marginLeft:16}}>
            {["dashboard","projections","insights"].map(tab=>(
              <button key={tab} onClick={()=>setActiveTab(tab)} style={{
                background:activeTab===tab?"rgba(201,168,76,0.2)":"none",
                color:activeTab===tab?"#C9A84C":"#8FA8C8",
                border:`1px solid ${activeTab===tab?"#C9A84C":"transparent"}`,
                borderRadius:4,padding:"4px 12px",fontSize:11,fontWeight:700,
                letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"
              }}>{tab}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {cacheAgeStr&&<span style={{fontSize:11,color:"#8FA8C8"}}>
            {loading?"Refreshing...":"Data: "+cacheAgeStr}
            {!isMarketOpen()&&" · Market closed"}
          </span>}
          <button onClick={refreshAll} disabled={loading} style={{
            background:loading?"#1A3A6A":"#C9A84C",
            color:loading?"#8FA8C8":"#0B2447",
            border:"none",borderRadius:4,padding:"8px 20px",fontSize:12,fontWeight:700,letterSpacing:"0.06em"
          }}>{loading?"LOADING\u2026":"↻  REFRESH"}</button>
        </div>
      </div>
    </div>
  );

  if (activeTab==="projections") {
    return (
      <div style={{fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif",minHeight:"100vh"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} body,*{font-family:'Inter','Helvetica Neue',Arial,sans-serif;}`}</style>
        {NAV}
        <Projections portfolioData={portfolioForProjections}/>
      </div>
    );
  }

  if (activeTab==="insights") {
    return (
      <div style={{fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif",minHeight:"100vh"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} body,*{font-family:'Inter','Helvetica Neue',Arial,sans-serif;}`}</style>
        {NAV}
        <Insights rows={withW} totalVal={totalVal} quotes={quotes} fx={fx}/>
      </div>
    );
  }

  return (
    <div style={{fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif",background:"#F4F2EE",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body,*{font-family:'Inter','Helvetica Neue',Arial,sans-serif;}
        .up{color:#1A6B3C;} .dn{color:#B33A3A;} .mu{color:#888;}
        tr.hr:hover td{background:#EEF0F8 !important;}
        button{font-family:inherit;cursor:pointer;}
        ::-webkit-scrollbar{height:4px;width:4px;}
        ::-webkit-scrollbar-thumb{background:#CCC;border-radius:4px;}
        .acct-head{cursor:pointer;user-select:none;}
        .acct-head:hover{opacity:0.85;}
        @media(max-width:1100px){.hm{display:none !important;}}
        @media(max-width:800px){.hm2{display:none !important;}}
        .col-sort:hover{color:#0B2447 !important;cursor:pointer;}
        .col-sort.active{color:#0B2447 !important;font-weight:700;}
      `}</style>

      {NAV}

      {/* HERO */}
      <div style={{background:"#0B2447",paddingBottom:24}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"20px 28px 0"}}>
          <div style={{marginBottom:20,borderBottom:"1px solid rgba(255,255,255,0.08)",paddingBottom:20}}>
            <div style={{fontSize:10,color:"#8FA8C8",letterSpacing:"0.16em",fontWeight:600,marginBottom:6}}>TOTAL PORTFOLIO · CANADIAN DOLLARS</div>
            <div style={{display:"flex",alignItems:"baseline",gap:20,flexWrap:"wrap"}}>
              <span style={{fontSize:48,fontWeight:800,color:"#FFF",letterSpacing:"-0.02em"}}>{fC(totalVal)}</span>
              {hasData&&<span style={{fontSize:20,fontWeight:700,color:dayUp?"#4ADE80":"#F87171"}}>
                {dayUp?"▲":"▼"} {fC(Math.abs(totalDay))}
                <span style={{fontSize:14,marginLeft:8,opacity:0.85}}>({fP(Math.abs(totalDayP),false)}) today</span>
              </span>}
            </div>
            {best&&worst&&<div style={{marginTop:8,fontSize:12,color:"#8FA8C8",display:"flex",gap:16,flexWrap:"wrap"}}>
              <span>Best: <span style={{color:"#4ADE80",fontWeight:600}}>{best.displayTicker} {fP(best.dP??0)}</span></span>
              <span style={{opacity:0.3}}>|</span>
              <span>Worst: <span style={{color:"#F87171",fontWeight:600}}>{worst.displayTicker} {fP(worst.dP??0)}</span></span>
            </div>}
          </div>

          {/* ACCOUNT CARDS */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {ACCT_ORDER.map(a=>{
              const t=acctTotals[a]; const g=t.val-t.cost; const gp=t.cost>0?(g/t.cost)*100:0; const isUp=t.day>=0;
              return (
                <div key={a} onClick={()=>toggleCollapse(a)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderTop:`3px solid ${ACCT_COLOR[a]}`,borderRadius:6,padding:"13px 15px",cursor:"pointer"}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#8FA8C8",letterSpacing:"0.1em",marginBottom:7}}>{a}</div>
                  <div style={{fontSize:17,fontWeight:800,color:"#FFF",marginBottom:5}}>{fC(t.val)}</div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}>
                    <span style={{color:isUp?"#4ADE80":"#F87171"}}>{isUp?"+":""}{fC(t.day)}</span>
                    <span style={{color:isUp?"#4ADE80":"#F87171"}}>{isUp?"+":""}{fP(t.cost>0?(t.day/(t.val-t.day))*100:0,false)}</span>
                  </div>
                  {t.cash>0&&<div style={{marginTop:4,fontSize:10,color:"#8FA8C8"}}>Cash: {fC(t.cash)}</div>}
                </div>
              );
            })}
          </div>

          {/* CASH EDITOR */}
          <div style={{marginTop:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {!editingCash ? (
              <button onClick={()=>{setCashDraft({...cashBalances});setEditingCash(true);}} style={{
                background:"rgba(255,255,255,0.1)",color:"#8FA8C8",border:"1px solid rgba(255,255,255,0.15)",
                borderRadius:4,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer"
              }}>+ Edit Cash Balances</button>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:"rgba(0,0,0,0.2)",padding:"10px 14px",borderRadius:6,width:"100%"}}>
                <span style={{fontSize:11,color:"#8FA8C8",fontWeight:700,letterSpacing:"0.06em"}}>CASH</span>
                {["RRSP","LIRA","TFSA","RESP"].map(a=>(
                  <div key={a} style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:11,fontWeight:700,color:ACCT_COLOR[a]}}>{a}</span>
                    <span style={{fontSize:11,color:"#8FA8C8"}}>$</span>
                    <input type="number" value={cashDraft[a]??0} min={0} step={0.01}
                      onChange={e=>setCashDraft(d=>({...d,[a]:parseFloat(e.target.value)||0}))}
                      onFocus={e=>e.target.select()}
                      style={{width:80,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",
                        borderRadius:3,padding:"4px 6px",fontSize:12,color:"#FFF",fontFamily:"inherit"}}/>
                  </div>
                ))}
                <button onClick={()=>{saveCash(cashDraft);setCashBalances({...cashDraft});setEditingCash(false);}} style={{
                  background:"#C9A84C",color:"#0B2447",border:"none",borderRadius:3,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"
                }}>Save</button>
                <button onClick={()=>setEditingCash(false)} style={{
                  background:"none",color:"#8FA8C8",border:"1px solid rgba(255,255,255,0.15)",borderRadius:3,padding:"5px 12px",fontSize:11,cursor:"pointer"
                }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MARKET INDICES BAR */}
      {Object.keys(indices).length>0&&(
        <div style={{background:"#0D1B35",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"8px 28px"}}>
          <div style={{maxWidth:1440,margin:"0 auto",display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
            {[
              {key:"^GSPTSE",label:"TSX",format:v=>v.toFixed(0)},
              {key:"^IXIC",label:"NASDAQ",format:v=>v.toFixed(0)},
              {key:"^DJI",label:"DJIA",format:v=>v.toFixed(0)},
              {key:"CL=F",label:"WTI Crude",format:v=>"$"+v.toFixed(2)},
            ].map(({key,label,format})=>{
              const q=indices[key];
              if(!q) return null;
              const up=(q.changePct??0)>=0;
              return (
                <div key={key} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:"#8FA8C8",fontWeight:600}}>{label}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#FFF"}}>{format(q.price)}</span>
                  <span style={{fontSize:11,fontWeight:600,color:up?"#4ADE80":"#F87171"}}>
                    {up?"▲":"▼"} {Math.abs(q.changePct??0).toFixed(2)}%
                  </span>
                </div>
              );
            })}
            <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
              <span style={{fontSize:11,color:"#8FA8C8",fontWeight:600}}>CAD/USD</span>
              <span style={{fontSize:12,fontWeight:700,color:"#FFF"}}>{fx?.toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* SORT BAR */}
      <div style={{background:"#FFF",borderBottom:"1px solid #E0DDD8",padding:"10px 28px",position:"sticky",top:0,zIndex:20,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:1440,margin:"0 auto",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#AAA",fontWeight:700,letterSpacing:"0.12em",marginRight:6}}>ORDER BY</span>
          {SORTS.map(([v,l])=>(
            <button key={v} onClick={()=>handleSort(v)} style={{
              background:sortBy===v?"#0B2447":"#F4F2EE",color:sortBy===v?"#FFF":"#666",
              border:`1px solid ${sortBy===v?"#0B2447":"#DDD"}`,borderRadius:3,padding:"5px 12px",fontSize:11,fontWeight:600
            }}>{l}{sortBy===v?(sortDir==="desc"?" ▼":" ▲"):""}</button>
          ))}
          <span style={{marginLeft:"auto",fontSize:11,color:"#AAA"}}>{HOLDINGS.length} positions</span>
        </div>
      </div>

      {err&&<div style={{background:"#FFFBEB",padding:"10px 28px",fontSize:13,color:"#92400E",borderBottom:"1px solid #FCD34D"}}>⚠ {err}</div>}

      {!hasData&&!loading&&(
        <div style={{textAlign:"center",padding:"60px 24px"}}>
          <div style={{fontSize:28,fontWeight:700,color:"#0B2447",marginBottom:8}}>Ready</div>
          <div style={{fontSize:14,color:"#999",marginBottom:24}}>Press Refresh to fetch live prices</div>
          <button onClick={refreshAll} style={{background:"#0B2447",color:"#FFF",border:"none",borderRadius:4,padding:"12px 32px",fontSize:13,fontWeight:700}}>↻ Load Prices</button>
        </div>
      )}

      {/* TABLE */}
      {hasData&&(
        <div style={{maxWidth:1440,margin:"0 auto",padding:"20px 28px 40px"}}>
          {ACCT_ORDER.map(acct=>{
            const acctRows=withW.filter(r=>r.account===acct).sort(sortFn);
            const acctVal=acctRows.reduce((s,r)=>s+(r.mv??r.cb),0);
            const acctDay=acctRows.reduce((s,r)=>s+(r.dA??0),0);
            const acctCost=acctRows.reduce((s,r)=>s+r.cb,0);
            const acctGain=acctVal-acctCost;
            const acctGainP=acctCost>0?(acctGain/acctCost)*100:0;
            const acctDayUp=acctDay>=0;
            const isCollapsed=collapsed[acct];
            return (
              <div key={acct} style={{marginBottom:24}}>
                <div className="acct-head" onClick={()=>toggleCollapse(acct)} style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"14px 20px",background:"#FFF",
                  borderRadius:isCollapsed?"6px":"6px 6px 0 0",
                  borderLeft:`4px solid ${ACCT_COLOR[acct]}`,
                  boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                  borderBottom:isCollapsed?"none":"1px solid #EEE"
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <span style={{fontSize:17,fontWeight:700,color:"#0B2447"}}>{acct}</span>
                    <span style={{fontSize:12,color:"#999"}}>{acctRows.length} position{acctRows.length!==1?"s":""}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:17,fontWeight:700,color:"#0B2447"}}>{fC(acctTotals[acct].val)}</div>
                      <div style={{fontSize:11,color:acctGain>=0?"#1A6B3C":"#B33A3A"}}>{fP(acctGainP)} all-time</div>
                    </div>
                    {hasData&&(
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:13,fontWeight:600,color:acctDayUp?"#1A6B3C":"#B33A3A"}}>{acctDayUp?"▲":"▼"} {fC(Math.abs(acctDay))}</div>
                        <div style={{fontSize:11,color:acctDayUp?"#1A6B3C":"#B33A3A"}}>today</div>
                      </div>
                    )}
                    <span style={{fontSize:14,color:"#CCC"}}>{isCollapsed?"▼":"▲"}</span>
                  </div>
                </div>

                {!isCollapsed&&(
                  <div style={{background:"#FFF",borderRadius:"0 0 6px 6px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",overflow:"hidden"}}>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
                        <thead>
                          <tr style={{borderBottom:"1px solid #F0EDE8",background:"#FAFAF8"}}>
                            {COLS.map(({label,align,cls,sort})=>{
                              const isActive=sort&&sortBy===sort;
                              const arrow=isActive?(sortDir==="desc"?" ▼":" ▲"):(sort?" ↕":"");
                              return (
                                <th key={label} className={cls+(sort?" col-sort"+(isActive?" active":""):"")}
                                  onClick={sort?()=>handleSort(sort):undefined}
                                  style={{padding:"9px 16px",textAlign:align,fontSize:10,fontWeight:700,color:isActive?"#0B2447":"#AAA",letterSpacing:"0.1em",whiteSpace:"nowrap"}}>
                                  {label.toUpperCase()}{arrow}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {acctRows.map((r,i)=>{
                            const mv=r.mv??r.cb; const dUp=(r.dP??0)>=0; const tUp=(r.tP??0)>=0;
                            return (
                              <tr key={r.ticker} className="hr" style={{borderBottom:"1px solid #F5F3EF",background:i%2===0?"#FFF":"#FDFCFA"}}>
                                <td style={{padding:"13px 16px",minWidth:180}}>
                                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                                    <div style={{width:3,height:34,borderRadius:2,background:ACCT_COLOR[r.account],flexShrink:0}}/>
                                    <div>
                                      <div style={{fontWeight:700,fontSize:14,color:"#0B2447"}}>{r.displayTicker}</div>
                                      <div style={{fontSize:11,color:"#AAA",marginTop:1,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                                      {r.currency==="USD"&&<span style={{fontSize:9,color:"#CCC",fontWeight:600,letterSpacing:"0.06em"}}>USD</span>}
                                    </div>
                                  </div>
                                </td>
                                <td style={{padding:"13px 16px",textAlign:"right"}}>
                                  {r.pC!=null?<>
                                    <div style={{fontSize:14,fontWeight:600,color:"#111"}}>{fC(r.pC)}</div>
                                    {r.currency==="USD"&&r.pN!=null&&<div style={{fontSize:10,color:"#BBB"}}>USD {f(r.pN)}</div>}
                                  </>:<span style={{color:"#DDD"}}>—</span>}
                                </td>
                                <td style={{padding:"13px 16px",textAlign:"right"}}>
                                  {r.dP!=null?<>
                                    <div style={{fontSize:13,fontWeight:700,color:dUp?"#1A6B3C":"#B33A3A"}}>{dUp?"▲":"▼"} {fP(Math.abs(r.dP),false)}</div>
                                    <div style={{fontSize:11,color:dUp?"#1A6B3C":"#B33A3A"}}>{(r.dA??0)>=0?"+":""}{fC(r.dA??0)} CAD</div>
                                    {r.dAusd!=null&&<div style={{fontSize:10,color:"#BBB"}}>{(r.dAusd??0)>=0?"+":""}{fC(r.dAusd??0)} USD</div>}
                                  </>:<span style={{color:"#DDD"}}>—</span>}
                                </td>
                                <td style={{padding:"13px 16px",textAlign:"right"}}>
                                  <div style={{fontSize:14,fontWeight:700,color:"#111"}}>{fC(mv)}</div>
                                  <div style={{fontSize:10,color:"#BBB",marginTop:1}}>{r.shares%1===0?r.shares:f(r.shares,2)} shares</div>
                                </td>
                                <td className="hm" style={{padding:"13px 16px",textAlign:"right"}}>
                                  <div style={{fontSize:12,color:"#555"}}>{f(r.w)}%</div>
                                  <div style={{height:2,background:"#EEE",borderRadius:1,marginTop:4,minWidth:48}}>
                                    <div style={{height:2,background:ACCT_COLOR[r.account],borderRadius:1,width:`${Math.min(100,r.w*5)}%`,opacity:0.6}}/>
                                  </div>
                                </td>
                                <td className="hm" style={{padding:"13px 20px",minWidth:140}}>
                                  {r.rP!=null?<>
                                    <div style={{position:"relative",height:4,background:"linear-gradient(to right,#FCA5A5,#E5E7EB,#86EFAC)",borderRadius:2,marginBottom:4}}>
                                      <div style={{position:"absolute",top:"50%",left:`${r.rP}%`,transform:"translate(-50%,-50%)",width:10,height:10,borderRadius:"50%",background:"#0B2447",border:"2px solid #FFF",boxShadow:"0 1px 3px rgba(11,36,71,0.25)"}}/>
                                    </div>
                                    <div style={{display:"flex",justifyContent:"space-between"}}>
                                      <span style={{fontSize:9,color:"#B33A3A"}}>{fC(r.lo)}</span>
                                      <span style={{fontSize:9,color:"#1A6B3C"}}>{fC(r.hi)}</span>
                                    </div>
                                  </>:<span style={{color:"#DDD",fontSize:11}}>—</span>}
                                </td>
                                <td style={{padding:"13px 16px",textAlign:"right"}}>
                                  {r.tG!=null?<>
                                    <div style={{fontSize:13,fontWeight:700,color:tUp?"#1A6B3C":"#B33A3A"}}>{fP(r.tP??0)}</div>
                                    <div style={{fontSize:11,color:tUp?"#1A6B3C":"#B33A3A"}}>{(r.tG??0)>=0?"+":""}{fC(r.tG??0)}</div>
                                  </>:<span style={{color:"#DDD"}}>—</span>}
                                </td>
                                <td className="hm2" style={{padding:"13px 16px",textAlign:"right"}}>
                                  {r.ann!=null?<span style={{fontSize:12,fontWeight:600,color:r.ann>=0?"#1A6B3C":"#B33A3A"}}>{fP(r.ann)}/yr</span>:<span style={{color:"#DDD"}}>—</span>}
                                </td>
                                <td className="hm2" style={{padding:"13px 16px",textAlign:"right"}}>
                                  {r.q?.vol?<>
                                    <div style={{fontSize:12,color:"#444"}}>{(r.q.vol/1e6).toFixed(2)}M</div>
                                    {r.vR&&<div style={{fontSize:10,color:r.vR>1.5?"#96780A":"#BBB",fontWeight:r.vR>1.5?700:400}}>{f(r.vR,1)}× avg</div>}
                                  </>:<span style={{color:"#DDD"}}>—</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {acctTotals[acct]?.cash>0&&(
                      <div style={{borderTop:"1px solid #F0EDE8",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FAFAF8"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:3,height:24,borderRadius:2,background:"#AAA",flexShrink:0}}/>
                          <div>
                            <div style={{fontWeight:600,fontSize:13,color:"#555"}}>Cash</div>
                            <div style={{fontSize:11,color:"#AAA"}}>Settlement balance</div>
                          </div>
                        </div>
                        <div style={{fontSize:14,fontWeight:600,color:"#555"}}>{fC(acctTotals[acct].cash)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{textAlign:"center",fontSize:11,color:"#BBB",marginTop:8}}>
            Data via Yahoo Finance · Prices delayed ~15 min · All values in CAD · Not financial advice
          </div>
        </div>
      )}
    </div>
  );
}
