import { useState, useCallback } from "react";

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
  { ticker: "IBIT.TO",   displayTicker: "IBIT",    shares: 11.89983,  avgCostCAD: 49.4419,  account: "RRSP", currency: "CAD", purchaseDate: "2024-06-01", name: "iShares Bitcoin ETF" },
  { ticker: "AMZN",      displayTicker: "AMZN",    shares: 20,        avgCostCAD: 89.0355,  account: "RRSP", currency: "USD", purchaseDate: "2022-11-01", name: "Amazon" },
  { ticker: "XEQT.TO",  displayTicker: "XEQT",    shares: 4413,      avgCostCAD: 41.5648,  account: "LIRA", currency: "CAD", purchaseDate: "2025-02-01", name: "iShares Core Equity ETF" },
  { ticker: "CASH.TO",   displayTicker: "CASH.TO", shares: 399.76014, avgCostCAD: 50.055,   account: "TFSA", currency: "CAD", purchaseDate: "2026-05-13", name: "Global X High Int Savings" },
  { ticker: "TGRO.TO",   displayTicker: "TGRO",    shares: 113.27841, avgCostCAD: 25.5268,  account: "RESP", currency: "CAD", purchaseDate: "2025-03-01", name: "TD Growth ETF Portfolio" },
];

const ACCT_COLOR = { RRSP: "#1B4F8A", LIRA: "#0A8A50", TFSA: "#96780A", RESP: "#6B3FA0" };
const ACCT_ORDER = ["RRSP", "LIRA", "TFSA", "RESP"];
const PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?url=",
];
const YF_CHART = "https://query1.finance.yahoo.com/v8/finance/chart/";
const YF_QUOTE = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=";
const RANGE_MAP = { "1W": "5d", "1M": "1mo", "3M": "3mo", "6M": "6mo", "1Y": "1y" };
const INTERVAL_MAP = { "1W": "1d", "1M": "1d", "3M": "1d", "6M": "1wk", "1Y": "1wk" };

const f = (n, d=2) => n.toLocaleString("en-CA", {minimumFractionDigits:d, maximumFractionDigits:d});
const fC = n => (n<0?"-$":"$")+f(Math.abs(n));
const fP = (n,plus=true) => (plus&&n>0?"+":"")+f(n)+"%";
const daysSince = d => Math.floor((Date.now()-new Date(d))/86400000);

async function fetchWithProxy(url) {
  for (const proxy of PROXIES) {
    try {
      const r = await fetch(proxy + encodeURIComponent(url), { signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        const text = await r.text();
        if (text && text.length > 100) return JSON.parse(text);
      }
    } catch { continue; }
  }
  return null;
}

async function fetchQ(ticker) {
  try {
    const quoteUrl = YF_QUOTE + encodeURIComponent(ticker) + "&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,averageDailyVolume3Month,trailingPE,fiftyTwoWeekHigh,fiftyTwoWeekLow,previousClose";
    const qj = await fetchWithProxy(quoteUrl);
    const q = qj?.quoteResponse?.result?.[0];
    if (q && q.regularMarketPrice) {
      return {
        price: q.regularMarketPrice,
        changePct: q.regularMarketChangePercent ?? null,
        changeAmt: q.regularMarketChange ?? null,
        hi52: q.fiftyTwoWeekHigh ?? null,
        lo52: q.fiftyTwoWeekLow ?? null,
        vol: q.regularMarketVolume ?? null,
        avgVol: q.averageDailyVolume3Month ?? null,
      };
    }
    const chartUrl = YF_CHART + ticker + "?interval=1d&range=5d";
    const cj = await fetchWithProxy(chartUrl);
    const m = cj?.chart?.result?.[0]?.meta;
    const closes = cj?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const valid = closes.filter(c => c != null);
    const prev = valid.length >= 2 ? valid[valid.length-2] : null;
    const curr = m?.regularMarketPrice ?? null;
    const chgAmt = (curr!=null&&prev!=null) ? curr-prev : null;
    const chgPct = (chgAmt!=null&&prev) ? (chgAmt/prev)*100 : null;
    if (!m) return null;
    return {
      price: curr,
      changePct: chgPct,
      changeAmt: chgAmt,
      hi52: m.fiftyTwoWeekHigh ?? null,
      lo52: m.fiftyTwoWeekLow ?? null,
      vol: m.regularMarketVolume ?? null,
      avgVol: m.averageDailyVolume3Month ?? m.averageDailyVolume10Day ?? null,
    };
  } catch { return null; }
}

async function fetchHistory(ticker, range) {
  try {
    const url = YF_CHART + ticker + "?interval=" + INTERVAL_MAP[range] + "&range=" + RANGE_MAP[range];
    const j = await fetchWithProxy(url);
    const result = j?.chart?.result?.[0];
    if (!result) return null;
    const timestamps = result.timestamp ?? [];
    const closes = result.indicators?.quote?.[0]?.close ?? [];
    const points = [];
    timestamps.forEach((ts, i) => {
      if (closes[i] != null) points.push({ ts: ts * 1000, price: closes[i] });
    });
    return points;
  } catch { return null; }
}

const SORTS = [
  ["weight","Value"],["dGA","Day $ \u25b2"],["dLA","Day $ \u25bc"],
  ["dGP","Day % \u25b2"],["dLP","Day % \u25bc"],["total","Total Return"],["az","A\u2013Z"]
];

export default function App() {
  const [quotes, setQuotes] = useState({});
  const [fx, setFx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(null);
  const [err, setErr] = useState(null);
  const [sortBy, setSortBy] = useState("weight");
  const [collapsed, setCollapsed] = useState({});
  const [chartRange, setChartRange] = useState("1M");
  const [histData, setHistData] = useState({});
  const [chartLoading, setChartLoading] = useState(false);

  const fetchCharts = useCallback(async (range) => {
    setChartLoading(true);
    try {
      const tickers = [...new Set(HOLDINGS.map(h => h.ticker))];
      const results = await Promise.allSettled(tickers.map(t => fetchHistory(t, range)));
      const h = {};
      tickers.forEach((t, i) => { if (results[i].status === "fulfilled" && results[i].value) h[t] = results[i].value; });
      setHistData(h);
    } catch {}
    setChartLoading(false);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const tickers = [...HOLDINGS.map(h=>h.ticker), "CADUSD=X"];
      const res = await Promise.allSettled(tickers.map(fetchQ));
      const q = {};
      tickers.forEach((t,i)=>{ if(res[i].status==="fulfilled"&&res[i].value) q[t]=res[i].value; });
      if(q["CADUSD=X"]) setFx(q["CADUSD=X"].price);
      setQuotes(q); setUpdated(new Date());
    } catch { setErr("Some prices failed. Try refreshing."); }
    setLoading(false);
    fetchCharts(chartRange);
  }, [chartRange, fetchCharts]);

  const handleRangeChange = (range) => {
    setChartRange(range);
    fetchCharts(range);
  };

  const toCAD = p => fx ? p/fx : null;

  const rows = HOLDINGS.map(h => {
    const q = quotes[h.ticker];
    const pN = q?.price ?? null;
    const pC = pN===null ? null : h.currency==="USD" ? toCAD(pN) : pN;
    const mv = pC!==null ? pC*h.shares : null;
    const cb = h.avgCostCAD*h.shares;
    const dP = q?.changePct ?? null;
    const dANative = q?.changeAmt ?? null;
    const dA = (dANative!==null && h.currency==="USD" && pC!==null && pN!==null)
      ? dANative*(pC/pN)*h.shares
      : dANative!==null ? dANative*h.shares : null;
    const dAusd = (dANative!==null && h.currency==="USD") ? dANative*h.shares : null;
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

  const totalVal = rows.reduce((s,r)=>s+(r.mv??r.cb),0);
  const loaded = rows.filter(r=>r.mv!==null);
  const totalDay = loaded.reduce((s,r)=>s+(r.dA??0),0);
  const totalDayP = totalVal>0 ? (totalDay/(totalVal-totalDay))*100 : 0;
  const withW = rows.map(r=>({...r, w:((r.mv??r.cb)/totalVal)*100}));
  const loadedW = withW.filter(r=>r.mv!==null);
  const best = loadedW.length ? [...loadedW].sort((a,b)=>(b.dP??0)-(a.dP??0))[0] : null;
  const worst = loadedW.length ? [...loadedW].sort((a,b)=>(a.dP??0)-(b.dP??0))[0] : null;
  const dayUp = totalDay>=0;

  const sortFn = (a,b) => {
    if(sortBy==="weight") return (b.mv??b.cb)-(a.mv??a.cb);
    if(sortBy==="dGA") return (b.dA??0)-(a.dA??0);
    if(sortBy==="dLA") return (a.dA??0)-(b.dA??0);
    if(sortBy==="dGP") return (b.dP??0)-(a.dP??0);
    if(sortBy==="dLP") return (a.dP??0)-(b.dP??0);
    if(sortBy==="total") return (b.tP??0)-(a.tP??0);
    if(sortBy==="az") return a.displayTicker.localeCompare(b.displayTicker);
    return 0;
  };

  const toggleCollapse = a => setCollapsed(c=>({...c,[a]:!c[a]}));

  // Build portfolio history from per-ticker history
  const buildPortfolioHistory = (accountFilter) => {
    try {
      const holdings = accountFilter==="ALL" ? HOLDINGS : HOLDINGS.filter(h=>h.account===accountFilter);
      if (!holdings.length || !Object.keys(histData).length || !fx) return [];
      const tsMap = {};
      holdings.forEach(h => {
        const hist = histData[h.ticker];
        if (!hist) return;
        hist.forEach(pt => {
          if (!tsMap[pt.ts]) tsMap[pt.ts] = {};
          tsMap[pt.ts][h.ticker] = pt.price;
        });
      });
      const timestamps = Object.keys(tsMap).map(Number).sort((a,b)=>a-b);
      return timestamps.map(ts => {
        let total = 0;
        holdings.forEach(h => {
          const price = tsMap[ts][h.ticker];
          if (price!=null) {
            total += (h.currency==="USD" ? price/fx : price) * h.shares;
          } else {
            total += h.avgCostCAD * h.shares;
          }
        });
        return { ts, value: total };
      });
    } catch { return []; }
  };

  const MiniChart = ({ data, height, gradId }) => {
    if (!data || data.length < 2) return (
      <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:"#AAA",fontSize:11}}>
        {chartLoading ? "Loading..." : "No data"}
      </div>
    );
    const values = data.map(d=>d.value);
    const min = Math.min(...values)*0.999;
    const max = Math.max(...values)*1.001;
    const range = max-min||1;
    const W=800; const H=height;
    const pts = data.map((d,i)=>{
      const x=(i/(data.length-1))*W;
      const y=H-((d.value-min)/range)*H;
      return [x,y];
    });
    const firstVal=data[0].value;
    const lastVal=data[data.length-1].value;
    const isUp=lastVal>=firstVal;
    const col=isUp?"#1A6B3C":"#B33A3A";
    const polyStr=pts.map(p=>p.join(",")).join(" ");
    const areaStr=`0,${H} ${polyStr} ${pts[pts.length-1][0]},${H}`;
    const pct=((lastVal-firstVal)/firstVal)*100;
    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:10,color:"#999"}}>
            {new Date(data[0].ts).toLocaleDateString("en-CA",{month:"short",day:"numeric"})} \u2013 {new Date(data[data.length-1].ts).toLocaleDateString("en-CA",{month:"short",day:"numeric"})}
          </span>
          <span style={{fontSize:11,fontWeight:700,color:col}}>{isUp?"+":""}{f(pct)}%</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height,display:"block"}}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={col} stopOpacity="0.2"/>
              <stop offset="100%" stopColor={col} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <polygon points={areaStr} fill={`url(#${gradId})`}/>
          <polyline points={polyStr} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
          <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="4" fill={col}/>
        </svg>
      </div>
    );
  };

  const acctTotals = ACCT_ORDER.reduce((acc,a)=>{
    const h=withW.filter(r=>r.account===a);
    acc[a]={
      val:h.reduce((s,r)=>s+(r.mv??r.cb),0),
      cost:h.reduce((s,r)=>s+r.cb,0),
      day:h.reduce((s,r)=>s+(r.dA??0),0),
    };
    return acc;
  },{});

  const COLS = [
    {label:"Security",     align:"left",  cls:"",   sort:"az"},
    {label:"Price",        align:"right", cls:"",   sort:null},
    {label:"Today \u25b2\u25bc",align:"right",cls:"",sort:"dGP"},
    {label:"Market Value", align:"right", cls:"",   sort:"weight"},
    {label:"Weight",       align:"right", cls:"hm", sort:"weight"},
    {label:"52-Week Range",align:"center",cls:"hm", sort:null},
    {label:"Total Return", align:"right", cls:"",   sort:"total"},
    {label:"Ann. Return",  align:"right", cls:"hm2",sort:null},
    {label:"Vol / Avg",    align:"right", cls:"hm2",sort:null},
  ];

  return (
    <div style={{fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif",background:"#F4F2EE",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body, * { font-family:'Inter','Helvetica Neue',Arial,sans-serif; }
        .up { color:#1A6B3C; } .dn { color:#B33A3A; } .mu { color:#888; }
        tr.hr:hover td { background:#EEF0F8 !important; }
        button { font-family:inherit; cursor:pointer; }
        ::-webkit-scrollbar { height:4px; width:4px; }
        ::-webkit-scrollbar-thumb { background:#CCC; border-radius:4px; }
        .acct-head { cursor:pointer; user-select:none; }
        .acct-head:hover { opacity:0.85; }
        @media(max-width:1100px){ .hm { display:none !important; } }
        @media(max-width:800px){ .hm2 { display:none !important; } }
        .col-sort:hover { color:#0B2447 !important; cursor:pointer; }
        .col-sort.active { color:#0B2447 !important; font-weight:700; }
      `}</style>

      {/* NAV */}
      <div style={{background:"#0B2447",borderBottom:"3px solid #C9A84C"}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:2,height:24,background:"#C9A84C"}}/>
            <span style={{fontSize:16,fontWeight:700,color:"#FFF",letterSpacing:"0.04em"}}>Portfolio</span>
            {fx&&<span style={{fontSize:11,color:"#8FA8C8",marginLeft:4}}>USD/CAD {(1/fx).toFixed(4)}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            {updated&&<span style={{fontSize:11,color:"#8FA8C8"}}>Updated {updated.toLocaleTimeString("en-CA",{hour:"2-digit",minute:"2-digit"})}</span>}
            <button onClick={refreshAll} disabled={loading||chartLoading} style={{
              background:(loading||chartLoading)?"#1A3A6A":"#C9A84C",
              color:(loading||chartLoading)?"#8FA8C8":"#0B2447",
              border:"none",borderRadius:4,padding:"8px 20px",fontSize:12,fontWeight:700,letterSpacing:"0.06em"
            }}>{loading?"LOADING\u2026":chartLoading?"CHARTING\u2026":"\u21bb  REFRESH"}</button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{background:"#0B2447",paddingBottom:24}}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"20px 28px 0"}}>
          <div style={{marginBottom:20,borderBottom:"1px solid rgba(255,255,255,0.08)",paddingBottom:20}}>
            <div style={{fontSize:10,color:"#8FA8C8",letterSpacing:"0.16em",fontWeight:600,marginBottom:6}}>TOTAL PORTFOLIO \u00b7 CANADIAN DOLLARS</div>
            <div style={{display:"flex",alignItems:"baseline",gap:20,flexWrap:"wrap"}}>
              <span style={{fontSize:48,fontWeight:800,color:"#FFF",letterSpacing:"-0.02em"}}>{fC(totalVal)}</span>
              {updated&&<span style={{fontSize:20,fontWeight:700,color:dayUp?"#4ADE80":"#F87171"}}>
                {dayUp?"\u25b2":"\u25bc"} {fC(Math.abs(totalDay))}
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
              const t=acctTotals[a];
              const g=t.val-t.cost; const gp=t.cost>0?(g/t.cost)*100:0;
              const isUp=t.day>=0;
              return <div key={a} onClick={()=>toggleCollapse(a)} style={{
                background:"rgba(255,255,255,0.07)",
                border:"1px solid rgba(255,255,255,0.1)",
                borderTop:`3px solid ${ACCT_COLOR[a]}`,
                borderRadius:6,padding:"13px 15px",cursor:"pointer"
              }}>
                <div style={{fontSize:10,fontWeight:800,color:"#8FA8C8",letterSpacing:"0.1em",marginBottom:7}}>{a}</div>
                <div style={{fontSize:17,fontWeight:800,color:"#FFF",marginBottom:5}}>{fC(t.val)}</div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}>
                  <span style={{color:isUp?"#4ADE80":"#F87171"}}>{isUp?"+":""}{fC(t.day)} today</span>
                  <span style={{color:g>=0?"#4ADE80":"#F87171"}}>{fP(gp)} all-time</span>
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div style={{background:"#FFF",borderBottom:"1px solid #E0DDD8",padding:"24px 28px"}}>
        <div style={{maxWidth:1440,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={{fontSize:13,fontWeight:700,color:"#0B2447"}}>Portfolio Balance History</span>
            <div style={{display:"flex",gap:4}}>
              {["1W","1M","3M","6M","1Y"].map(r=>(
                <button key={r} onClick={()=>handleRangeChange(r)} style={{
                  background:chartRange===r?"#0B2447":"#F4F2EE",
                  color:chartRange===r?"#FFF":"#666",
                  border:`1px solid ${chartRange===r?"#0B2447":"#DDD"}`,
                  borderRadius:3,padding:"4px 12px",fontSize:11,fontWeight:700
                }}>{r}</button>
              ))}
            </div>
          </div>

          {/* Combined chart */}
          <div style={{marginBottom:24,padding:"16px",background:"#FAFAF8",borderRadius:8,border:"1px solid #EEE"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
              <span style={{fontSize:11,color:"#999",fontWeight:700,letterSpacing:"0.08em"}}>ALL ACCOUNTS</span>
              <span style={{fontSize:18,fontWeight:700,color:"#0B2447"}}>{fC(totalVal)}</span>
            </div>
            <MiniChart data={buildPortfolioHistory("ALL")} height={140} gradId="grad-all"/>
            {!updated&&!chartLoading&&<div style={{textAlign:"center",padding:"20px",color:"#AAA",fontSize:12}}>Press Refresh to load chart data</div>}
          </div>

          {/* Per-account charts */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {ACCT_ORDER.map(a=>{
              const t=acctTotals[a];
              return <div key={a} style={{background:"#FAFAF8",borderRadius:8,padding:"14px",border:"1px solid #EEE",borderTop:`3px solid ${ACCT_COLOR[a]}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                  <span style={{fontSize:10,fontWeight:800,color:ACCT_COLOR[a],letterSpacing:"0.1em"}}>{a}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#0B2447"}}>{fC(t.val)}</span>
                </div>
                <MiniChart data={buildPortfolioHistory(a)} height={65} gradId={"grad-"+a}/>
              </div>;
            })}
          </div>
        </div>
      </div>

      {/* SORT BAR */}
      <div style={{background:"#FFF",borderBottom:"1px solid #E0DDD8",padding:"10px 28px",position:"sticky",top:0,zIndex:20,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:1440,margin:"0 auto",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#AAA",fontWeight:700,letterSpacing:"0.12em",marginRight:6}}>ORDER BY</span>
          {SORTS.map(([v,l])=>(
            <button key={v} onClick={()=>setSortBy(v)} style={{
              background:sortBy===v?"#0B2447":"#F4F2EE",
              color:sortBy===v?"#FFF":"#666",
              border:`1px solid ${sortBy===v?"#0B2447":"#DDD"}`,
              borderRadius:3,padding:"5px 12px",fontSize:11,fontWeight:600
            }}>{l}</button>
          ))}
          <span style={{marginLeft:"auto",fontSize:11,color:"#AAA"}}>{HOLDINGS.length} positions</span>
        </div>
      </div>

      {err&&<div style={{background:"#FFFBEB",padding:"10px 28px",fontSize:13,color:"#92400E",borderBottom:"1px solid #FCD34D"}}>\u26a0 {err}</div>}

      {!updated&&!loading&&<div style={{textAlign:"center",padding:"60px 24px"}}>
        <div style={{fontSize:28,fontWeight:700,color:"#0B2447",marginBottom:8}}>Ready</div>
        <div style={{fontSize:14,color:"#999",marginBottom:24}}>Press Refresh to fetch live prices</div>
        <button onClick={refreshAll} style={{background:"#0B2447",color:"#FFF",border:"none",borderRadius:4,padding:"12px 32px",fontSize:13,fontWeight:700}}>\u21bb Load Prices</button>
      </div>}

      {/* GROUPED TABLE */}
      {(updated||loading)&&<div style={{maxWidth:1440,margin:"0 auto",padding:"20px 28px 40px"}}>
        {ACCT_ORDER.map(acct=>{
          const acctRows=withW.filter(r=>r.account===acct).sort(sortFn);
          const acctVal=acctRows.reduce((s,r)=>s+(r.mv??r.cb),0);
          const acctDay=acctRows.reduce((s,r)=>s+(r.dA??0),0);
          const acctCost=acctRows.reduce((s,r)=>s+r.cb,0);
          const acctGain=acctVal-acctCost;
          const acctGainP=acctCost>0?(acctGain/acctCost)*100:0;
          const acctDayUp=acctDay>=0;
          const isCollapsed=collapsed[acct];

          return <div key={acct} style={{marginBottom:24}}>
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
                  <div style={{fontSize:17,fontWeight:700,color:"#0B2447"}}>{fC(acctVal)}</div>
                  <div style={{fontSize:11,color:acctGain>=0?"#1A6B3C":"#B33A3A"}}>{fP(acctGainP)} all-time</div>
                </div>
                {updated&&<div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:600,color:acctDayUp?"#1A6B3C":"#B33A3A"}}>
                    {acctDayUp?"\u25b2":"\u25bc"} {fC(Math.abs(acctDay))}
                  </div>
                  <div style={{fontSize:11,color:acctDayUp?"#1A6B3C":"#B33A3A"}}>today</div>
                </div>}
                <span style={{fontSize:14,color:"#CCC"}}>{isCollapsed?"\u25bc":"\u25b2"}</span>
              </div>
            </div>

            {!isCollapsed&&<div style={{background:"#FFF",borderRadius:"0 0 6px 6px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid #F0EDE8",background:"#FAFAF8"}}>
                      {COLS.map(({label,align,cls,sort})=>(
                        <th key={label} className={cls+(sort?" col-sort"+(sortBy===sort?" active":""):"")}
                          onClick={sort?()=>setSortBy(sort):undefined}
                          style={{padding:"9px 16px",textAlign:align,fontSize:10,fontWeight:700,
                            color:sort&&sortBy===sort?"#0B2447":"#AAA",letterSpacing:"0.1em",whiteSpace:"nowrap"}}>
                          {label.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {acctRows.map((r,i)=>{
                      const mv=r.mv??r.cb;
                      const dUp=(r.dP??0)>=0;
                      const tUp=(r.tP??0)>=0;
                      return <tr key={r.ticker} className="hr" style={{borderBottom:"1px solid #F5F3EF",background:i%2===0?"#FFF":"#FDFCFA"}}>
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
                            <div style={{fontSize:13,fontWeight:700,color:dUp?"#1A6B3C":"#B33A3A"}}>{dUp?"\u25b2":"\u25bc"} {fP(Math.abs(r.dP),false)}</div>
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
                            {r.vR&&<div style={{fontSize:10,color:r.vR>1.5?"#96780A":"#BBB",fontWeight:r.vR>1.5?700:400}}>{f(r.vR,1)}\u00d7 avg</div>}
                          </>:<span style={{color:"#DDD"}}>—</span>}
                        </td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>}
          </div>;
        })}
        <div style={{textAlign:"center",fontSize:11,color:"#BBB",marginTop:8}}>
          Data via Yahoo Finance \u00b7 Prices delayed ~15 min \u00b7 All values in CAD \u00b7 Not financial advice
        </div>
      </div>}
    </div>
  );
}
