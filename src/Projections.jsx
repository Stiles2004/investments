import { useState, useMemo } from "react";

const ACCT_COLOR = { RRSP: "#1B4F8A", LIRA: "#0A8A50", TFSA: "#96780A", RESP: "#6B3FA0" };

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
  const points = [];
  for (let y = 0; y <= years; y++) {
    const age = currentAge + y;
    let total = 0;
    Object.entries(accounts).forEach(([acct, {val, contrib}]) => {
      total += project(val, annualReturn, y, contrib/12);
    });
    points.push({ age, value: total });
  }
  return points;
}

function MilestoneTag({ label, color }) {
  return <span style={{background:color+"18",color,border:`1px solid ${color}40`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,marginRight:6}}>{label}</span>;
}

function GrowthChart({ curves, currentAge, retirementAge }) {
  const allValues = curves.flatMap(c => c.points.map(p => p.value));
  const maxVal = Math.max(...allValues) * 1.05;
  const minVal = 0;
  const range = maxVal - minVal;
  const W = 800; const H = 200;
  const XPAD = 50; const YPAD = 20;
  const chartW = W - XPAD; const chartH = H - YPAD;
  const years = retirementAge - currentAge;

  const toX = age => XPAD + ((age - currentAge) / years) * chartW;
  const toY = val => H - YPAD - ((val - minVal) / range) * chartH;

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
      {/* Retirement age line */}
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
  const [currentAge, setCurrentAge] = useState(41);
  const [retirementAge, setRetirementAge] = useState(67);
  const [returnRate, setReturnRate] = useState(7);
  const [contribs, setContribs] = useState({ RRSP: 0, LIRA: 0, TFSA: 400, RESP: 100 });

  // Fallback to approximate values if live data not loaded yet
  const FALLBACK = { RRSP: 124047, LIRA: 197438, TFSA: 20006, RESP: 3277 };

  const accounts = useMemo(() => {
    const accts = { RRSP: 0, LIRA: 0, TFSA: 0, RESP: 0 };
    if (portfolioData) {
      Object.entries(portfolioData).forEach(([acct, val]) => {
        if (accts[acct] !== undefined) accts[acct] = val > 1000 ? val : FALLBACK[acct];
      });
    }
    // If all zeros, use fallbacks
    if (Object.values(accts).every(v => v === 0)) {
      return { ...FALLBACK };
    }
    return accts;
  }, [portfolioData]);

  const years = retirementAge - currentAge;

  const projectAccount = (acct, rate) => {
    return project(accounts[acct] || 0, rate, years, contribs[acct]/12);
  };

  const baseResults = { RRSP: projectAccount("RRSP", returnRate), LIRA: projectAccount("LIRA", returnRate), TFSA: projectAccount("TFSA", returnRate), RESP: projectAccount("RESP", returnRate) };
  const pessResults = { RRSP: projectAccount("RRSP", 5), LIRA: projectAccount("LIRA", 5), TFSA: projectAccount("TFSA", 5), RESP: projectAccount("RESP", 5) };
  const optResults = { RRSP: projectAccount("RRSP", 9), LIRA: projectAccount("LIRA", 9), TFSA: projectAccount("TFSA", 9), RESP: projectAccount("RESP", 9) };

  const baseTotal = Object.values(baseResults).reduce((s,v)=>s+v,0);
  const pessTotal = Object.values(pessResults).reduce((s,v)=>s+v,0);
  const optTotal = Object.values(optResults).reduce((s,v)=>s+v,0);

  // Find milestone ages
  const findMilestoneAge = (target, rate) => {
    for (let y = 0; y <= 40; y++) {
      let total = 0;
      ["RRSP","LIRA","TFSA","RESP"].forEach(acct => {
        total += project(accounts[acct]||0, rate, y, contribs[acct]/12);
      });
      if (total >= target) return currentAge + y;
    }
    return null;
  };

  const milestones = [1000000, 2000000, 3000000].map(m => ({
    target: m,
    age: findMilestoneAge(m, returnRate)
  })).filter(m => m.age !== null && m.age <= 85);

  // Build growth curves
  const acctDataForCurve = Object.fromEntries(
    ["RRSP","LIRA","TFSA","RESP"].map(a => [a, {val: accounts[a]||0, contrib: contribs[a]}])
  );
  const baseCurve = buildGrowthCurve(acctDataForCurve, returnRate, currentAge, retirementAge);
  const pessCurve = buildGrowthCurve(acctDataForCurve, 5, currentAge, retirementAge);
  const optCurve = buildGrowthCurve(acctDataForCurve, 9, currentAge, retirementAge);

  const curves = [
    { points: optCurve, color: "#1A6B3C", dashed: true, main: false },
    { points: baseCurve, color: "#0B2447", dashed: false, main: true },
    { points: pessCurve, color: "#B33A3A", dashed: true, main: false },
  ];

  return (
    <div style={{fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif",background:"#F4F2EE",minHeight:"100vh",padding:"28px"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:800,color:"#0B2447",marginBottom:4}}>Retirement Projections</h1>
          <p style={{fontSize:13,color:"#999"}}>Based on current portfolio values. Pessimistic 5% · Base {returnRate}% · Optimistic 9%</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:24,alignItems:"start"}}>
          {/* INPUTS */}
          <div style={{background:"#FFF",borderRadius:10,border:"1px solid #E2E8F0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#0B2447",letterSpacing:"0.08em",marginBottom:16}}>ASSUMPTIONS</div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:6}}>Current Age</label>
              <input type="number" value={currentAge} onChange={e=>setCurrentAge(Number(e.target.value))} min={25} max={70}
                style={{width:"100%",border:"1px solid #DDD",borderRadius:4,padding:"8px 10px",fontSize:14,fontWeight:600,color:"#0B2447",fontFamily:"inherit"}}/>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:6}}>Retirement Age</label>
              <input type="number" value={retirementAge} onChange={e=>setRetirementAge(Number(e.target.value))} min={50} max={80}
                style={{width:"100%",border:"1px solid #DDD",borderRadius:4,padding:"8px 10px",fontSize:14,fontWeight:600,color:"#0B2447",fontFamily:"inherit"}}/>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:6}}>
                Annual Return: <span style={{color:"#0B2447"}}>{returnRate}%</span>
              </label>
              <input type="range" min={3} max={12} step={0.5} value={returnRate} onChange={e=>setReturnRate(Number(e.target.value))}
                style={{width:"100%",accentColor:"#0B2447"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#AAA",marginTop:2}}>
                <span>3%</span><span>12%</span>
              </div>
            </div>

            <div style={{borderTop:"1px solid #EEE",paddingTop:16,marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"#0B2447",letterSpacing:"0.08em",marginBottom:12}}>MONTHLY CONTRIBUTIONS</div>
              {["RRSP","LIRA","TFSA","RESP"].map(acct=>(
                <div key={acct} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:ACCT_COLOR[acct],width:40}}>{acct}</span>
                  <div style={{position:"relative",flex:1}}>
                    <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#999"}}>$</span>
                    <input type="number" value={contribs[acct]} onChange={e=>setContribs(c=>({...c,[acct]:Number(e.target.value)}))} min={0}
                      style={{width:"100%",border:"1px solid #DDD",borderRadius:4,padding:"6px 8px 6px 20px",fontSize:13,fontFamily:"inherit"}}/>
                  </div>
                  <span style={{fontSize:10,color:"#AAA"}}>/mo</span>
                </div>
              ))}
            </div>

            <div style={{borderTop:"1px solid #EEE",paddingTop:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>