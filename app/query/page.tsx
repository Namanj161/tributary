'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

const TC: Record<string,{bg:string;color:string;border:string}> = {
  framework:{bg:'rgba(108,92,231,.12)',color:'#a78bfa',border:'rgba(108,92,231,.2)'},
  tactic:{bg:'rgba(0,229,160,.08)',color:'#00e5a0',border:'rgba(0,229,160,.15)'},
  claim:{bg:'rgba(96,165,250,.1)',color:'#60a5fa',border:'rgba(96,165,250,.18)'},
  insight:{bg:'rgba(245,166,35,.1)',color:'#f5a623',border:'rgba(245,166,35,.18)'},
  story:{bg:'rgba(244,114,182,.1)',color:'#f472b6',border:'rgba(244,114,182,.18)'},
  number:{bg:'rgba(45,212,191,.1)',color:'#2dd4bf',border:'rgba(45,212,191,.18)'},
  question:{bg:'rgba(255,107,107,.1)',color:'#ff6b6b',border:'rgba(255,107,107,.18)'},
  principle:{bg:'rgba(212,180,45,.1)',color:'#d4b42d',border:'rgba(212,180,45,.18)'},
  example:{bg:'rgba(103,183,247,.1)',color:'#67b7f7',border:'rgba(103,183,247,.18)'},
  warning:{bg:'rgba(251,146,60,.1)',color:'#fb923c',border:'rgba(251,146,60,.18)'},
};
const CONF_COLORS: Record<string,string> = { high:'#00e5a0', medium:'#f5a623', low:'#ff6b6b' };

interface QueryResult {
  answer: string;
  confidence: string;
  units_cited: number[];
  cited_units: any[];
  follow_up_questions: string[];
  gaps: string|null;
  total_units_searched: number;
  units_used: number;
}

export default function QueryPage(){
  const [question,setQuestion]=useState('');
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState<QueryResult|null>(null);
  const [error,setError]=useState('');
  const [history,setHistory]=useState<{q:string;a:QueryResult}[]>([]);
  const [focused,setFocused]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);

  async function handleQuery(){
    if(!question.trim())return;
    const q=question.trim();
    setLoading(true); setError(''); setResult(null);
    try{
      const res=await fetch('/api/query',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({question:q}),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Query failed');
      setResult(data);
      setHistory(prev=>[{q,a:data},...prev]);
      setQuestion('');
    }catch(err:any){setError(err.message);}
    finally{setLoading(false);}
  }

  function askFollowUp(q:string){
    setQuestion(q);
    setResult(null);
    setTimeout(()=>inputRef.current?.focus(),100);
  }

  // Render answer with citation highlights
  function renderAnswer(text:string){
    const parts=text.split(/(\[\d+\])/g);
    return parts.map((part,i)=>{
      const citMatch=part.match(/^\[(\d+)\]$/);
      if(citMatch){
        const num=parseInt(citMatch[1]);
        return <span key={i} style={{
          display:'inline-block',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,
          background:'rgba(0,229,160,.12)',color:'#00e5a0',cursor:'pointer',
          fontFamily:"'JetBrains Mono',monospace",verticalAlign:'super',marginLeft:2,marginRight:1,
        }}>{num}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return(
    <div style={{minHeight:'100vh',background:'#06070b',fontFamily:"'DM Sans',sans-serif",color:'#e8eaf0'}}>
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'radial-gradient(ellipse at 50% 30%,rgba(108,92,231,.04) 0%,transparent 50%)',pointerEvents:'none'}}/>
      <header style={{position:'fixed',top:0,left:0,right:0,zIndex:50,background:'rgba(6,7,11,.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid #1c2035'}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',color:'inherit'}}>
            <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#00e5a0,#6c5ce7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#06070b',fontFamily:"'Syne',sans-serif"}}>T</div>
            <span style={{fontSize:15,fontWeight:700,fontFamily:"'Syne',sans-serif"}}>TPIC</span>
          </Link>
          <nav style={{display:'flex',gap:4}}>
            <Link href="/" style={{padding:'6px 14px',borderRadius:8,fontSize:13,color:'#8b90a8',textDecoration:'none'}}>Intake</Link>
            <Link href="/knowledge" style={{padding:'6px 14px',borderRadius:8,fontSize:13,color:'#8b90a8',textDecoration:'none'}}>Knowledge Base</Link>
            <Link href="/graph" style={{padding:'6px 14px',borderRadius:8,fontSize:13,color:'#8b90a8',textDecoration:'none'}}>Graph</Link>
            <span style={{padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:600,color:'#6c5ce7',background:'rgba(108,92,231,.1)'}}>Query</span>
          </nav>
        </div>
      </header>

      <main style={{maxWidth:720,margin:'0 auto',padding:'120px 24px 80px'}}>
        {/* Hero */}
        {!result&&!loading&&(
          <div style={{marginBottom:48,textAlign:'center' as const}}>
            <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:38,fontWeight:800,lineHeight:1.1,marginBottom:14,letterSpacing:'-.02em'}}>
              Ask your<br/><span style={{color:'#6c5ce7'}}>knowledge base.</span>
            </h1>
            <p style={{fontSize:15,color:'#8b90a8',lineHeight:1.65,maxWidth:420,margin:'0 auto'}}>
              Get synthesized answers drawn from everything you've fed into TPIC — with citations back to the original units.
            </p>
          </div>
        )}

        {/* Input */}
        <div style={{
          borderRadius:14,overflow:'hidden',background:'#10131e',
          border:`1px solid ${focused?'#6c5ce7':'#1c2035'}`,
          boxShadow:focused?'0 0 0 1px #6c5ce7,0 0 40px rgba(108,92,231,.08)':'none',
          transition:'all .2s',display:'flex',
        }}>
          <input ref={inputRef} value={question} onChange={e=>setQuestion(e.target.value)}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            onKeyDown={e=>{if(e.key==='Enter')handleQuery();}}
            placeholder="What patterns exist around AI safety in my knowledge base?"
            disabled={loading}
            style={{flex:1,padding:'16px 20px',fontSize:15,outline:'none',background:'transparent',color:'#e8eaf0',border:'none',fontFamily:"'DM Sans',sans-serif"}}
          />
          <button onClick={handleQuery} disabled={loading||!question.trim()} style={{
            padding:'12px 24px',fontSize:13,fontWeight:700,border:'none',
            cursor:loading||!question.trim()?'not-allowed':'pointer',
            fontFamily:"'Syne',sans-serif",letterSpacing:'.02em',
            background:loading||!question.trim()?'#1e2340':'linear-gradient(135deg,#6c5ce7,#a78bfa)',
            color:loading||!question.trim()?'#4e5370':'#fff',transition:'all .2s',
          }}>{loading?'Thinking...':'Ask'}</button>
        </div>

        {error&&<div style={{marginTop:20,padding:16,borderRadius:12,fontSize:14,background:'rgba(255,107,107,.08)',border:'1px solid rgba(255,107,107,.15)',color:'#ff6b6b'}}>{error}</div>}

        {/* Loading */}
        {loading&&(
          <div style={{marginTop:48,display:'flex',alignItems:'center',gap:16}}>
            <div style={{display:'flex',gap:3}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:4,height:20+i*5,borderRadius:2,background:'#6c5ce7',opacity:.3+i*.15,animation:`pulse 1s ease-in-out ${i*.15}s infinite`}}/>
              ))}
            </div>
            <span style={{fontSize:13,color:'#8b90a8',fontFamily:"'JetBrains Mono',monospace"}}>Searching {'>'}50 units and synthesizing...</span>
          </div>
        )}

        {/* Result */}
        {result&&(
          <div style={{marginTop:32}}>
            {/* Confidence + stats */}
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:6,
                background:`${CONF_COLORS[result.confidence]||'#f5a623'}15`,
                color:CONF_COLORS[result.confidence]||'#f5a623',
                fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase' as const,
              }}>{result.confidence} confidence</span>
              <span style={{fontSize:10,color:'#4e5370',fontFamily:"'JetBrains Mono',monospace"}}>
                {result.cited_units?.length||0} units cited · {result.total_units_searched} searched
              </span>
            </div>

            {/* Answer */}
            <div style={{padding:24,borderRadius:14,background:'#10131e',border:'1px solid #1c2035',marginBottom:24}}>
              <p style={{fontSize:15,lineHeight:1.8,color:'#e8eaf0'}}>{renderAnswer(result.answer)}</p>
            </div>

            {/* Gaps */}
            {result.gaps&&(
              <div style={{padding:16,borderRadius:12,background:'rgba(245,166,35,.06)',border:'1px solid rgba(245,166,35,.15)',marginBottom:24}}>
                <div style={{fontSize:10,fontWeight:700,color:'#f5a623',fontFamily:"'JetBrains Mono',monospace",marginBottom:6,textTransform:'uppercase' as const}}>Knowledge gap</div>
                <p style={{fontSize:13,color:'#c8cade',lineHeight:1.6}}>{result.gaps}</p>
              </div>
            )}

            {/* Cited units */}
            {result.cited_units&&result.cited_units.length>0&&(
              <div style={{marginBottom:24}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                  <span style={{fontSize:10,fontWeight:700,color:'#4e5370',fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase' as const,letterSpacing:'.1em'}}>Sources cited</span>
                  <div style={{flex:1,height:1,background:'#1c2035'}}/>
                </div>
                {result.cited_units.map((u:any)=>{
                  const c=TC[u.type]||TC.claim;
                  return(
                    <div key={u.id} style={{padding:14,borderRadius:10,background:'#151929',border:'1px solid #1c2035',marginBottom:6,display:'flex',gap:10,alignItems:'flex-start'}}>
                      <span style={{fontSize:11,fontWeight:800,color:'#00e5a0',fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>[{u.index}]</span>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                          <span style={{fontSize:9,fontWeight:600,padding:'2px 8px',borderRadius:4,background:c.bg,color:c.color,border:`1px solid ${c.border}`,fontFamily:"'JetBrains Mono',monospace"}}>{u.type}</span>
                          <span style={{fontSize:9,color:'#3a3f5a',fontFamily:"'JetBrains Mono',monospace"}}>{u.source?.title?.slice(0,40)}</span>
                        </div>
                        <p style={{fontSize:13,lineHeight:1.6,color:'#c8cade'}}>{u.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Follow-up questions */}
            {result.follow_up_questions&&result.follow_up_questions.length>0&&(
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#4e5370',fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:10}}>Go deeper</div>
                <div style={{display:'flex',flexDirection:'column' as const,gap:6}}>
                  {result.follow_up_questions.map((q,i)=>(
                    <button key={i} onClick={()=>askFollowUp(q)} style={{
                      padding:'10px 16px',borderRadius:10,fontSize:13,textAlign:'left' as const,
                      background:'#151929',border:'1px solid #1c2035',color:'#8b90a8',cursor:'pointer',
                      fontFamily:"'DM Sans',sans-serif",lineHeight:1.5,transition:'border-color .2s',
                    }}>{q}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {!result&&!loading&&history.length>0&&(
          <div style={{marginTop:48}}>
            <div style={{fontSize:10,fontWeight:700,color:'#4e5370',fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:12}}>Recent queries</div>
            {history.slice(0,5).map((h,i)=>(
              <div key={i} onClick={()=>setResult(h.a)} style={{
                padding:14,borderRadius:10,background:'#151929',border:'1px solid #1c2035',marginBottom:6,cursor:'pointer',
              }}>
                <p style={{fontSize:14,color:'#e8eaf0',marginBottom:4}}>{h.q}</p>
                <span style={{fontSize:10,color:'#4e5370',fontFamily:"'JetBrains Mono',monospace"}}>{h.a.cited_units?.length||0} units cited · {h.a.confidence} confidence</span>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes pulse{0%,100%{opacity:.3;}50%{opacity:.7;}}
        input::placeholder{color:#3a3f5a;}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:#2a3050;border-radius:3px;}
      `}</style>
    </div>
  );
}
