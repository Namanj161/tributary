'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const TC: Record<string,string> = { framework:'#a78bfa',tactic:'#00e5a0',claim:'#60a5fa',insight:'#f5a623',story:'#f472b6',number:'#2dd4bf',question:'#ff6b6b',principle:'#d4b42d',example:'#67b7f7',warning:'#fb923c' };
const RC: Record<string,string> = { reinforces:'#00e5a0',contradicts:'#ff6b6b',extends:'#6c5ce7',contextualizes:'#f5a623',parallels:'#2dd4bf' };
const SC = ['#00e5a0','#6c5ce7','#f5a623','#ff6b6b','#2dd4bf','#f472b6','#60a5fa','#fb923c','#a78bfa','#d4b42d'];

interface GNode { id:string;type:string;content:string;fullContent:string;tags:string[];sourceId:string;sourceTitle:string;sourceType:string; }
interface GEdge { id:string;source:string;target:string;relationship:string;note:string; }
interface SrcInfo { id:string;title:string;type:string;unitCount:number; }

export default function GraphView(){
  const [graphData,setGraphData]=useState<{nodes:GNode[];links:GEdge[]}>({nodes:[],links:[]});
  const [sources,setSources]=useState<SrcInfo[]>([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState<GNode|null>(null);
  const [colorBy,setColorBy]=useState<'type'|'source'>('source');
  const [hovered,setHovered]=useState<GNode|null>(null);
  const [wikiTopic,setWikiTopic]=useState<string|null>(null);
  const fgRef=useRef<any>(null);
  const srcMap=useRef<Map<string,string>>(new Map());
  const [dims,setDims]=useState({w:800,h:600});

  useEffect(()=>{
    setDims({w:window.innerWidth,h:window.innerHeight});
    const r=()=>setDims({w:window.innerWidth,h:window.innerHeight});
    window.addEventListener('resize',r);
    return()=>window.removeEventListener('resize',r);
  },[]);

  useEffect(()=>{
    fetch('/api/graph').then(r=>r.json()).then(d=>{
      d.sources.forEach((s:SrcInfo,i:number)=>srcMap.current.set(s.id,SC[i%SC.length]));
      setGraphData({nodes:d.nodes,links:d.edges});
      setSources(d.sources);
      setLoading(false);
      setTimeout(()=>fgRef.current?.zoomToFit(400,60),500);
    });
  },[]);

  const getColor=useCallback((node:any)=>{
    if(colorBy==='type')return TC[node.type]||'#8b90a8';
    return srcMap.current.get(node.sourceId)||'#8b90a8';
  },[colorBy]);

  const paintNode=useCallback((node:any,ctx:CanvasRenderingContext2D,globalScale:number)=>{
    const r=selected?(selected.id===node.id?6:
      graphData.links.some((l:any)=>(l.source?.id||l.source)===selected.id&&(l.target?.id||l.target)===node.id||(l.target?.id||l.target)===selected.id&&(l.source?.id||l.source)===node.id)?5:3):
      hovered?.id===node.id?6:4;
    const col=getColor(node);
    const alpha=selected?(selected.id===node.id||graphData.links.some((l:any)=>(l.source?.id||l.source)===selected.id&&(l.target?.id||l.target)===node.id||(l.target?.id||l.target)===selected.id&&(l.source?.id||l.source)===node.id)?1:.08):1;

    // Glow
    if(selected?.id===node.id||hovered?.id===node.id){
      ctx.globalAlpha=.12;
      ctx.beginPath();ctx.arc(node.x,node.y,r*3,0,Math.PI*2);
      ctx.fillStyle=col;ctx.fill();
    }

    ctx.globalAlpha=alpha;
    ctx.beginPath();ctx.arc(node.x,node.y,r,0,Math.PI*2);
    ctx.fillStyle=col;ctx.fill();

    if(selected?.id===node.id){
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
    }

    // Label on hover or selected
    if((hovered?.id===node.id||selected?.id===node.id)&&globalScale>.5){
      const label=node.content.slice(0,60)+(node.content.length>60?'...':'');
      const fs=11/globalScale;
      ctx.font=`500 ${fs}px sans-serif`;
      const tw=ctx.measureText(label).width;
      const bx=node.x+r+4, by=node.y-fs/2-3;
      ctx.globalAlpha=.9;
      ctx.fillStyle='rgba(10,12,20,.92)';
      ctx.beginPath();ctx.roundRect(bx-3,by-2,tw+10,fs+8,4);ctx.fill();
      ctx.fillStyle='#e8eaf0';
      ctx.fillText(label,bx+2,node.y+fs/3);
    }

    ctx.globalAlpha=1;
  },[colorBy,selected,hovered,getColor,graphData.links]);

  const paintLink=useCallback((link:any,ctx:CanvasRenderingContext2D)=>{
    const isSel=selected&&((link.source?.id||link.source)===selected.id||(link.target?.id||link.target)===selected.id);
    ctx.strokeStyle=isSel?(RC[link.relationship]||'#f5a623'):'rgba(80,90,130,.3)';
    ctx.lineWidth=isSel?2:.6;
    ctx.beginPath();
    ctx.moveTo(link.source.x,link.source.y);
    ctx.lineTo(link.target.x,link.target.y);
    ctx.stroke();
  },[selected]);

  // When selection changes, figure out the most common tag and check if a wiki article exists
  useEffect(()=>{
    setWikiTopic(null);
    if(!selected?.tags?.length)return;
    const counts=new Map<string,number>();
    selected.tags.forEach(t=>counts.set(t,(counts.get(t)||0)+1));
    const topTag=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0][0];
    let cancelled=false;
    fetch(`/api/wiki/check?topic=${encodeURIComponent(topTag)}`)
      .then(r=>r.json())
      .then(d=>{ if(!cancelled&&d.exists)setWikiTopic(topTag); })
      .catch(()=>{});
    return()=>{cancelled=true;};
  },[selected]);

  const connEdges=selected?graphData.links.filter(l=>{
    const sid=typeof l.source==='string'?l.source:(l.source as any)?.id;
    const tid=typeof l.target==='string'?l.target:(l.target as any)?.id;
    return sid===selected.id||tid===selected.id;
  }):[];

  return(
    <div style={{height:'100vh',background:'#06070b',fontFamily:"'DM Sans',sans-serif",color:'#e8eaf0',overflow:'hidden'}}>
      <header style={{position:'fixed',top:0,left:0,right:0,zIndex:50,background:'rgba(6,7,11,.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid #1c2035'}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',color:'inherit'}}>
            <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#00e5a0,#6c5ce7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#06070b',fontFamily:"'Syne',sans-serif"}}>T</div>
            <span style={{fontSize:15,fontWeight:700,fontFamily:"'Syne',sans-serif"}}>TPIC</span>
          </Link>
          <nav style={{display:'flex',gap:4}}>
            <Link href="/" style={{padding:'6px 14px',borderRadius:8,fontSize:13,color:'#8b90a8',textDecoration:'none'}}>Intake</Link>
            <Link href="/knowledge" style={{padding:'6px 14px',borderRadius:8,fontSize:13,color:'#8b90a8',textDecoration:'none'}}>Knowledge Base</Link>
            <span style={{padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:600,color:'#00e5a0',background:'rgba(0,229,160,.1)'}}>Graph</span>
          <Link href="/query" style={{padding:"6px 14px",borderRadius:8,fontSize:13,color:"#8b90a8",textDecoration:"none"}}>Query</Link>
            <Link href="/profile" style={{padding:"6px 14px",borderRadius:8,fontSize:13,color:"#8b90a8",textDecoration:"none"}}>Profile</Link>
            <Link href="/actions" style={{padding:"6px 14px",borderRadius:8,fontSize:13,color:"#8b90a8",textDecoration:"none"}}>Actions</Link>
            <Link href="/setup" style={{padding:"6px 14px",borderRadius:8,fontSize:13,color:"#8b90a8",textDecoration:"none"}}>Capture</Link>
            <Link href="/wiki" style={{padding:"6px 14px",borderRadius:8,fontSize:13,color:"#8b90a8",textDecoration:"none"}}>Wiki</Link>
            </nav>
        </div>
      </header>

      {/* Controls */}
      <div style={{position:'fixed',top:72,left:24,zIndex:40,display:'flex',flexDirection:'column' as const,gap:8}}>
        <div style={{padding:12,borderRadius:12,background:'rgba(16,19,30,.9)',border:'1px solid #1c2035'}}>
          <div style={{fontSize:9,color:'#4e5370',fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:8}}>Color by</div>
          <div style={{display:'flex',gap:4}}>
            {(['source','type'] as const).map(m=>(
              <button key={m} onClick={()=>setColorBy(m)} style={{padding:'4px 12px',borderRadius:6,fontSize:11,fontWeight:600,border:'none',cursor:'pointer',background:colorBy===m?'rgba(0,229,160,.15)':'transparent',color:colorBy===m?'#00e5a0':'#4e5370',fontFamily:"'JetBrains Mono',monospace"}}>{m}</button>
            ))}
          </div>
        </div>
        <div style={{padding:12,borderRadius:12,background:'rgba(16,19,30,.9)',border:'1px solid #1c2035',maxHeight:280,overflowY:'auto' as const}}>
          <div style={{fontSize:9,color:'#4e5370',fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:8}}>{colorBy==='source'?'Sources':'Types'}</div>
          {colorBy==='source'?sources.map((s,i)=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:SC[i%SC.length],flexShrink:0}}/>
              <span style={{fontSize:10,color:'#8b90a8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,maxWidth:150}}>{s.title.slice(0,28)}{s.title.length>28?'...':''} ({s.unitCount})</span>
            </div>
          )):Object.entries(TC).map(([t,c])=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:c,flexShrink:0}}/>
              <span style={{fontSize:10,color:'#8b90a8',fontFamily:"'JetBrains Mono',monospace"}}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{padding:8,borderRadius:8,background:'rgba(16,19,30,.9)',border:'1px solid #1c2035'}}>
          <span style={{fontSize:10,color:'#4e5370',fontFamily:"'JetBrains Mono',monospace"}}>{graphData.nodes.length} nodes · {graphData.links.length} edges</span>
        </div>
        <button onClick={()=>fgRef.current?.zoomToFit(400,60)} style={{padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,border:'1px solid #1c2035',cursor:'pointer',background:'rgba(16,19,30,.9)',color:'#8b90a8',fontFamily:"'JetBrains Mono',monospace"}}>⟲ Fit view</button>
      </div>

      {/* Detail panel */}
      {selected&&(
        <div style={{position:'fixed',top:72,right:24,width:340,maxHeight:'calc(100vh - 96px)',overflowY:'auto' as const,zIndex:40,padding:20,borderRadius:14,background:'rgba(16,19,30,.95)',border:'1px solid #1c2035'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
            <span style={{fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:6,background:(TC[selected.type]||'#888')+'20',color:TC[selected.type]||'#888',fontFamily:"'JetBrains Mono',monospace"}}>{selected.type}</span>
            <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#4e5370',cursor:'pointer',fontSize:16}}>✕</button>
          </div>
          <p style={{fontSize:14,lineHeight:1.7,color:'#e8eaf0',marginBottom:12}}>{selected.fullContent}</p>
          <div style={{fontSize:11,color:'#4e5370',marginBottom:8}}><span style={{fontFamily:"'JetBrains Mono',monospace"}}>Source:</span> {selected.sourceTitle}</div>
          {selected.tags?.length>0&&<div style={{display:'flex',flexWrap:'wrap' as const,gap:4,marginBottom:16}}>{selected.tags.map(t=><span key={t} style={{fontSize:10,padding:'2px 8px',borderRadius:4,background:'#1e2340',color:'#4e5370',fontFamily:"'JetBrains Mono',monospace"}}>#{t}</span>)}</div>}
          {wikiTopic&&<Link href={`/wiki?topic=${encodeURIComponent(wikiTopic)}`} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:700,textDecoration:'none',background:'rgba(45,212,191,.1)',border:'1px solid rgba(45,212,191,.25)',color:'#2dd4bf',fontFamily:"'JetBrains Mono',monospace",marginBottom:16}}>📖 View in Wiki → {wikiTopic}</Link>}
          {connEdges.length>0&&<div>
            <div style={{fontSize:10,color:'#4e5370',fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:8}}>{connEdges.length} connection{connEdges.length>1?'s':''}</div>
            {connEdges.map(e=>{
              const sid=typeof e.source==='string'?e.source:(e.source as any)?.id;
              const tid=typeof e.target==='string'?e.target:(e.target as any)?.id;
              const oid=sid===selected.id?tid:sid;
              const o=graphData.nodes.find(n=>n.id===oid);
              const rc=RC[e.relationship]||'#f5a623';
              return o?(
                <div key={e.id} onClick={()=>{setSelected(o);fgRef.current?.centerAt(o.x,o.y,400);}} style={{padding:10,borderRadius:8,marginBottom:6,cursor:'pointer',background:'#151929',border:'1px solid #1c2035'}}>
                  <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:4,background:rc+'15',color:rc,fontFamily:"'JetBrains Mono',monospace"}}>{e.relationship}</span>
                  <p style={{fontSize:12,color:'#c8cade',marginTop:6,lineHeight:1.5}}>{o.content}</p>
                  {e.note&&<p style={{fontSize:10,color:'#4e5370',marginTop:4,fontStyle:'italic' as const}}>{e.note}</p>}
                </div>
              ):null;
            })}
          </div>}
        </div>
      )}

      {/* Graph */}
      {loading?
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><span style={{fontSize:14,color:'#4e5370',fontFamily:"'JetBrains Mono',monospace"}}>Loading graph...</span></div>
      :
        <ForceGraph2D
          ref={fgRef}
          width={dims.w}
          height={dims.h}
          graphData={graphData}
          backgroundColor="#06070b"
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          nodeRelSize={4}
          linkWidth={1}
          onNodeClick={(node:any)=>setSelected(prev=>prev?.id===node.id?null:node)}
          onNodeHover={(node:any)=>setHovered(node||null)}
          onBackgroundClick={()=>setSelected(null)}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          cooldownTicks={100}
          enableNodeDrag={true}
          enableZoomPanInteraction={true}
        />
      }

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#2a3050;border-radius:2px;}`}</style>
    </div>
  );
}
