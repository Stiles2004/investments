import { useState, useMemo } from "react";

const ACCT_COLOR = { RRSP: "#1B4F8A", LIRA: "#0A8A50", TFSA: "#96780A", RESP: "#6B3FA0" };
const PROJ_KEY = "pf_projections_v1";
function loadProj() {
  try { const r = localStorage.getItem(PROJ_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveProj(data) { try { localStorage.setItem(PROJ_KEY, JSON.stringify(data)); } catch {} }

const f = (n, d=2) => n.toLocaleString("en-CA", {minimumFractionDigits:d, maximumFractionDigits:d});
const fC = n => (n<0?"-$":"$")+f(Math.abs(n));
const fP = (n,plus=true) => (plus&&n>0?"+":"")+f(n)+"%";

function project(startVal, annualReturn, years, monthlyContrib=0) {
  const monthlyRate = annualReturn / 100 / 12;
  let val = startVal;
  for (let i = 0; i < years * 12; i++) {
    val = val * (1 + monthlyRate) + monthlyContrib;
  }
  return val;
}

function buildGrowthCurve(accounts, annualReturn, currentAge, retirementAge) {
  const years = retirementAge - currentAge;

  // Persist inputs on any change
  const updateAge = v => { setCurrentAge(v); saveProj({currentAge:v, retirementAge, returnRate, contribs}); };
  const updateRetAge = v => { setRetirementAge(v); saveProj({currentAge, retirementAge:v, returnRate, contribs}); };
  const updateReturn = v => { setReturnRate(v); saveProj({currentAge, retirementAge, returnRate:v, contribs}); };
  const updateContribs = (acct, val) => { const c={...contribs,[acct]:val}; setContribs(c); saveProj({currentAge, retirementAge, returnRate, contribs:c}); };
  const points = [];
  for (let y = 0; y <= years; y++) {
    let total = 0;
    Object.entries(accounts).forEach(([acct, {val, contrib}]) => {
      total += project(val, annualReturn, y, contrib/12);
    });
    points.push({ age: currentAge + y, value: total });
  }
  return points;
}

function GrowthChart({ curves, currentAge, retirementAge }) {
  const allValues = curves.flatMap(c => c.points.map(p => p.value));
  const maxVal = Math.max(...allValues) * 1.05;
  const W = 800; const H = 200;
  const XPAD = 50; const YPAD = 20;
  const chartW = W - XPAD; const chartH = H - YPAD;
  const years = retirementAge - currentAge;

  // Persist inputs on any change
  const updateAge = v => { setCurrentAge(v); saveProj({currentAge:v, retirementAge, returnRate, contribs}); };
  const updateRetAge = v => { setRetirementAge(v); saveProj({currentAge, retirementAge:v, returnRate, contribs}); };
  const updateReturn = v => { setReturnRate(v); saveProj({currentAge, retirementAge, returnRate:v, contribs}); };
  const updateContribs = (acct, val) => { const c={...contribs,[acct]:val}; setContribs(c); saveProj({currentAge, retirementAge, returnRate, contribs:c}); };
  const toX = age => XPAD + ((age - currentAge) / years) * chartW;
  const toY = val => H - YPAD - (val / maxVal) * chartH;
  const fmtVal = v => v >= 1000000 ? "$"+f(v/1000000,1)+"M" : "$"+f(v/1000,0)+"K";
  const yTicks = [0, maxVal*0.25, maxVal*0.5, maxVal*0.75, maxVal];
  const xTicks = Array.from({length: years+1}, (_,i) => currentAge+i).filter(a => (a-currentAge)%5===0);

  return (
    <svg viewBox={`0 0 ${W} ${H+20}`} style={{width:"100%",height:H+20,display:"block"}}>
      {yTicks.map((v,i) => {
        const y = toY(v);
        return <g key={i}>
          <line x1={XPAD} y1={y} x2={W} y2={y} stroke="#EEE" strokeWidth="1"/>
          <text x={XPAD-6} y={y+4} textAnchor="end" fontSize="9" fill="#AAA">{fmtVal(v)}</text>
        </g>;
      })}
      {xTicks.map(age => {
        const x = toX(age);
        return <g key={age}>
          <line x1={x} y1={0} x2={x} y2={H-YPAD} stroke="#F0F0F0" strokeWidth="1"/>
          <text x={x} y={H-YPAD+14} textAnchor="middle" fontSize="9" fill="#AAA">{age}</text>
        </g>;
      })}
      <line x1={toX(retirementAge)} y1={0} x2={toX(retirementAge)} y2={H-YPAD} stroke="#C9A84C" strokeWidth="1.5" strokeDasharray="4,3"/>
      <text x={toX(retirementAge)+4} y={16} fontSize="9" fill="#C9A84C" fontWeight="700">Retirement</text>
      {curves.map((curve, ci) => {
        const pts = curve.points.map(p => `${toX(p.age)},${toY(p.value)}`).join(" ");
        return <polyline key={ci} points={pts} fill="none" stroke={curve.color} strokeWidth={curve.main?2.5:1.5} strokeDasharray={curve.dashed?"4,3":undefined} strokeLinejoin="round" strokeLinecap="round" opacity={curve.main?1:0.5}/>;
      })}
    </svg>
  );
}

export default function Projections({ portfolioData }) {
  const FALLBACK = { RRSP: 124047, LIRA: 197438, TFSA: 20006, RESP: 3277 };

  const accounts = useMemo(() => {
    const accts = { RRSP: 0, LIRA: 0, TFSA: 0, RESP: 0 };
    if (portfolioData) {
      Object.entries(portfolioData).forEach(([acct, val]) => {
        if (accts[acct] !== undefined) accts[acct] = val > 1000 ? val : FALLBACK[acct];
      });
    }
    if (Object.values(accts).every(v => v === 0)) return { ...FALLBACK };
    return accts;
  }, [portfolioData]);

  const saved = loadProj();
  const [currentAge, setCurrentAge] = useState(saved?.currentAge ?? 41);
  const [retirementAge, setRetirementAge] = useState(saved?.retirementAge ?? 67);
  const [returnRate, setReturnRate] = useState(saved?.returnRate ?? 7);
  const [contribs, setContribs] = useState(saved?.contribs ?? { RRSP: 0, LIRA: 0, TFSA: 400, RESP: 100 });

  const years = retirementAge - currentAge;

  // Persist inputs on any change
  const updateAge = v => { setCurrentAge(v); saveProj({currentAge:v, retirementAge, returnRate, contribs}); };
  const updateRetAge = v => { setRetirementAge(v); saveProj({currentAge, retirementAge:v, returnRate, contribs}); };
  const updateReturn = v => { setReturnRate(v); saveProj({currentAge, retirementAge, returnRate:v, contribs}); };
  const updateContribs = (acct, val) => { const c={...contribs,[acct]:val}; setContribs(c); saveProj({currentAge, retirementAge, returnRate, contribs:c}); };

  const projectAccount = (acct, rate) => project(accounts[acct] || 0, rate, years, contribs[acct]/12);

  const baseResults = { RRSP: projectAccount("RRSP", returnRate), LIRA: projectAccount("LIRA", returnRate), TFSA: projectAccount("TFSA", returnRate), RESP: projectAccount("RESP", returnRate) };
  const pessResults = { RRSP: projectAccount("RRSP", 5), LIRA: projectAccount("LIRA", 5), TFSA: projectAccount("TFSA", 5), RESP: projectAccount("RESP", 5) };
  const optResults  = { RRSP: projectAccount("RRSP", 9), LIRA: projectAccount("LIRA", 9), TFSA: projectAccount("TFSA", 9), RESP: projectAccount("RESP", 9) };

  const baseTotal = Object.values(baseResults).reduce((s,v)=>s+v,0);
  const pessTotal = Object.values(pessResults).reduce((s,v)=>s+v,0);
  const optTotal  = Object.values(optResults).reduce((s,v)=>s+v,0);
  const currentTotal = Object.values(accounts).reduce((s,v)=>s+v,0);

  const findMilestoneAge = (target, rate) => {
    for (let y = 0; y <= 40; y++) {
      let total = 0;
      ["RRSP","LIRA","TFSA","RESP"].forEach(acct => { total += project(accounts[acct]||0, rate, y, contribs[acct]/12); });
      if (total >= target) return currentAge + y;
    }
    return null;
  };

  const milestones = [1000000, 2000000, 3000000].map(m => ({ target: m, age: findMilestoneAge(m, returnRate) })).filter(m => m.age !== null && m.age <= 85);

  const acctDataForCurve = Object.fromEntries(["RRSP","LIRA","TFSA","RESP"].map(a => [a, {val: accounts[a]||0, contrib: contribs[a]}]));
  const curves = [
    { points: buildGrowthCurve(acctDataForCurve, 9,          currentAge, retirementAge), color: "#1A6B3C", dashed: true,  main: false },
    { points: buildGrowthCurve(acctDataForCurve, returnRate,  currentAge, retirementAge), color: "#0B2447", dashed: false, main: true  },
    { points: buildGrowthCurve(acctDataForCurve, 5,          currentAge, retirementAge), color: "#B33A3A", dashed: true,  main: false },
  ];

  return (
    <div style={{fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif",background:"#F4F2EE",minHeight:"100vh",padding:"28px"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:800,color:"#0B2447",marginBottom:4}}>Retirement Projections</h1>
          <p style={{fontSize:13,color:"#999"}}>Based on current portfolio values. Pessimistic 5% · Base {returnRate}% · Optimistic 9%</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:24,alignItems:"start"}}>

          {/* INPUTS */}
          <div style={{background:"#FFF",borderRadius:10,border:"1px solid #E2E8F0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#0B2447",letterSpacing:"0.08em",marginBottom:16}}>ASSUMPTIONS</div>

            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:5}}>Current Age</label>
              <input type="number" value={currentAge} onChange={e=>updateAge(Number(e.target.value))} min={25} max={70}
                style={{width:"100%",border:"1px solid #DDD",borderRadius:4,padding:"8px 10px",fontSize:14,fontWeight:600,color:"#0B2447",fontFamily:"inherit"}}/>
            </div>

            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:5}}>Retirement Age</label>
              <input type="number" value={retirementAge} onChange={e=>updateRetAge(Number(e.target.value))} min={50} max={80}
                style={{width:"100%",border:"1px solid #DDD",borderRadius:4,padding:"8px 10px",fontSize:14,fontWeight:600,color:"#0B2447",fontFamily:"inherit"}}/>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:5}}>
                Annual Return: <span style={{color:"#0B2447",fontWeight:800}}>{returnRate}%</span>
              </label>
              <input type="range" min={3} max={12} step={0.5} value={returnRate} onChange={e=>updateReturn(Number(e.target.value))}
                style={{width:"100%",accentColor:"#0B2447"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#AAA",marginTop:2}}>
                <span>3%</span><span>12%</span>
              </div>
            </div>

            <div style={{borderTop:"1px solid #EEE",paddingTop:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"#0B2447",letterSpacing:"0.08em",marginBottom:12}}>MONTHLY CONTRIBUTIONS</div>
              {["RRSP","LIRA","TFSA","RESP"].map(acct=>(
                <div key={acct} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:ACCT_COLOR[acct],width:38}}>{acct}</span>
                  <div style={{position:"relative",flex:1}}>
                    <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#999"}}>$</span>
                    <input type="number" value={contribs[acct]} min={0}
                      onChange={e=>updateContribs(acct,Number(e.target.value))}
                      onFocus={e=>e.target.select()}
                      style={{width:"100%",border:"1px solid #DDD",borderRadius:4,padding:"6px 8px 6px 20px",fontSize:13,fontFamily:"inherit"}}/>
                  </div>
                  <span style={{fontSize:10,color:"#AAA"}}>/mo</span>
                </div>
              ))}
            </div>
          </div>

          {/* RESULTS */}
          <div>
            {/* Milestones */}
            {milestones.length > 0 && (
              <div style={{background:"#0B2447",borderRadius:10,padding:"14px 20px",marginBottom:16,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:11,color:"#8FA8C8",fontWeight:700,letterSpacing:"0.08em"}}>MILESTONES</span>
                {milestones.map(m=>(
                  <div key={m.target} style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,color:"#C9A84C",fontWeight:700}}>{fC(m.target)}</span>
                    <span style={{fontSize:12,color:"#FFF"}}>at age <span style={{fontWeight:700,color:"#4ADE80"}}>{m.age}</span></span>
                    <span style={{color:"rgba(255,255,255,0.2)"}}>|</span>
                  </div>
                ))}
              </div>
            )}

            {/* Scenario totals */}
            <div style={{background:"#FFF",borderRadius:10,border:"1px solid #E2E8F0",padding:"20px",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:11,color:"#999",fontWeight:700,letterSpacing:"0.08em",marginBottom:14}}>TOTAL REGISTERED ASSETS AT {retirementAge}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
                {[["Pessimistic","5%",pessTotal,"#B33A3A"],["Base",returnRate+"%",baseTotal,"#0B2447"],["Optimistic","9%",optTotal,"#1A6B3C"]].map(([label,rate,val,col])=>(
                  <div key={label} style={{textAlign:"center",padding:"14px",background:"#F8F9FA",borderRadius:8,border:`2px solid ${label==="Base"?col:"#EEE"}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#AAA",letterSpacing:"0.06em",marginBottom:6}}>{label.toUpperCase()} · {rate}</div>
                    <div style={{fontSize:22,fontWeight:800,color:col}}>{fC(val)}</div>
                    <div style={{fontSize:11,color:"#999",marginTop:4}}>{fP((val-currentTotal)/currentTotal*100)} growth</div>
                  </div>
                ))}
              </div>

              <GrowthChart curves={curves} currentAge={currentAge} retirementAge={retirementAge}/>
              <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:8}}>
                {[["Optimistic 9%","#1A6B3C"],["Base "+returnRate+"%","#0B2447"],["Pessimistic 5%","#B33A3A"]].map(([l,c])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#666"}}>
                    <div style={{width:20,height:2,background:c,borderRadius:1}}/>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per account */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {["RRSP","LIRA","TFSA","RESP"].map(acct=>(
                <div key={acct} style={{background:"#FFF",borderRadius:8,border:"1px solid #E2E8F0",padding:"16px",borderTop:`3px solid ${ACCT_COLOR[acct]}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                  <div style={{fontSize:10,fontWeight:800,color:ACCT_COLOR[acct],letterSpacing:"0.1em",marginBottom:8}}>{acct}</div>
                  <div style={{fontSize:11,color:"#AAA",marginBottom:4}}>Today: <span style={{color:"#333",fontWeight:600}}>{fC(accounts[acct]||0)}</span></div>
                  <div style={{fontSize:15,fontWeight:700,color:"#0B2447",marginBottom:4}}>{fC(baseResults[acct])}</div>
                  <div style={{fontSize:11,color:"#999"}}>
                    <span style={{color:"#B33A3A"}}>{fC(pessResults[acct])}</span> – <span style={{color:"#1A6B3C"}}>{fC(optResults[acct])}</span>
                  </div>
                  {contribs[acct]>0&&<div style={{fontSize:10,color:"#AAA",marginTop:4}}>${contribs[acct]}/mo</div>}
                </div>
              ))}
            </div>

            <div style={{marginTop:12,fontSize:11,color:"#BBB",textAlign:"center"}}>
              Projections assume consistent returns and contributions. Not financial advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



