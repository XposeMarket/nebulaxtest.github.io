
      const { useEffect, useMemo, useRef, useState } = React;
      const cx=(...xs)=>xs.filter(Boolean).join(" ");
      const last=(a)=>a?.length?a[a.length-1]:undefined;
      const nf=new Intl.NumberFormat(undefined,{maximumFractionDigits:6});
      const usdFmt=new Intl.NumberFormat(undefined,{maximumFractionDigits:2});
      const theme={bg:"bg-transparent",panel:"cyberpunk-panel",text:"neon-text"};
      const LKEY="nebula_home_layout_v10";
// Put near the top of your Babel script
const DEX_EMBEDS = {
  "ETH/USDC": "https://dexscreener.com/ethereum/0x00b9edc1583bf6ef09ff3a09f6c23ecb57fd7d0bb75625717ec81eed181e22d7?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15",
  "BTC/USDC": "https://dexscreener.com/osmosis/1943-factory_osmo1z6r6qdknhgsc0zeracktgpcxf43j6sekq07nw8sxduc9lg0qjjlqfu25e3_alloyed_allBTC-ibc_498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15",
  "SOL/USDC": "https://dexscreener.com/bsc/0xbFFEc96e8f3b5058B1817c14E4380758Fada01EF?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15",
};



      /* Stop per-icon re-DOMing (was causing flicker). We call createIcons once at the end. */
      function Icon({name,className}){ return <i data-lucide={name} className={cx(className,"neon-text")} />; }
      const Pill=({children,className})=><span className={cx("rounded-full px-2 py-0.5 text-[11px] font-medium bg-[var(--cyberpunk-dark-secondary)] neon-text",className)}>{children}</span>;

    // ↓ it goes right after Button(...) and before UseWalletReadout(...)
function Input({ value, onChange, placeholder, right, ...rest }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "w-full rounded-xl border border-[var(--cyberpunk-border)] bg-[var(--cyberpunk-dark-secondary)] px-3 py-2 text-sm neon-text outline-none",
          "placeholder:text-zinc-500 focus:border-[var(--cyberpunk-neon-blue)]"
        )}
        {...rest}
      />
      {right && (
        <div className="absolute inset-y-0 right-2 flex items-center neon-text">
          {right}
        </div>
      )}
    </div>
  );
}


function UseWalletReadout(){
  const [addr, setAddr] = React.useState(null);
  const [bal,  setBal]  = React.useState(null);

  // poll lightly; React never calls Phantom directly
  React.useEffect(()=>{
    let alive = true;

    const tick = async () => {
      const a = window.NXWallet?.getAddress?.() || null;
      const b = window.NXWallet?.getBalance?.();
      setAddr(a);
      setBal(b == null ? null : b);

      // opportunistic refresh if balance is unknown
      if (a && b == null) {
        await window.NXWallet?.refreshBalance?.();
        const b2 = window.NXWallet?.getBalance?.();
        if (alive) setBal(b2 == null ? null : b2);
      }
    };

    tick();
    const id = setInterval(tick, 1500);
    return ()=>{ alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="text-xs">
      Address: {addr ? `${addr.slice(0,4)}…${addr.slice(-4)}` : '—'} •
      SOL: {bal == null ? '—' : bal.toFixed(4)}
    </div>
  );
}

      /* Card now accepts string OR node for title */
function Card({title,toolbar,children,className,onClick}){
  const titleNode = (typeof title === "string")
    ? <span className="text-sm font-semibold neon-text">{title}</span>
    : title;

  const clickable = typeof onClick === "function";

  return (
    <div
      className={cx(
        "h-full flex flex-col rounded-2xl p-3 shadow-[0_0_0_1px_var(--cyberpunk-border)_inset] overflow-hidden",
        theme.panel,
        clickable && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={clickable ? "link" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e)=>{ if(e.key==='Enter' || e.key===' ') onClick(); } : undefined}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">{titleNode}</div>
        <div className="relative flex items-center gap-2">{toolbar}</div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}


      /* ===== Mock data ===== */
      function seedCandles(n=300,start=1.0){
        const out=[]; let p=start;
        for(let i=n;i>0;i--){
          const t=Math.floor((Date.now()-i*60_000)/1000);
          const o=p; const c=Math.max(0.000001,o*(1+(Math.random()-0.5)*0.01));
          const h=Math.max(o,c)*(1+Math.random()*0.005);
          const l=Math.min(o,c)*(1-Math.random()*0.005);
          const v=100+Math.random()*1200;
          out.push({time:t,open:o,high:h,low:l,close:c,volume:v}); p=c;
        }
        return out;
      }
      const TRENDING_UNIVERSE=["WIF/SOL","BONK/SOL","MEW/SOL","POPCAT/SOL","BOME/SOL","GME/SOL","PENGU/SOL","CAT/SOL","MOG/SOL"];
      const ALERT_TYPES=[
        {id:"whale_buy",label:"Whale buy"},
        {id:"whale_sell",label:"Whale sell"},
        {id:"volume_spike",label:"Volume +"},
        {id:"buys_sells_ratio",label:"Buys>Sells"},
        {id:"holders_delta",label:"Holders +"},
        {id:"lp_change",label:"LP change"},
      ];
      const prettyTrigger=(t)=>`${(ALERT_TYPES.find(a=>a.id===t.type)?.label)||t.type} • ${new Date(t.ts).toLocaleTimeString()}`;

      /* ===== Robust ChartPanel (props) ===== */
function ChartPanel2({ symbol }) {
  const url = DEX_EMBEDS[symbol]; // undefined if not set yet

  return (
    <Card title="Chart">
      <div style={{ position:'relative', width:'100%', height:420, borderRadius:12, overflow:'hidden' }}>
        {url ? (
          <iframe
            title={`DexScreener ${symbol}`}
            src={url}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-zinc-400">
            No embed configured for {symbol}
          </div>
        )}
      </div>
    </Card>
  );
}



      /* ===== Layout model ===== */
      const DEFAULT_LAYOUT={
        wide:["ticker"],                      // top row shows a single panel (replace on drop)
        left:["chart","data-feed"],
        right:["portfolio","alerts","referrals","docs","selftest"],
        heights:{
          "ticker":130,
          "chart":420,
          "data-feed":240,
          "portfolio":280,
          "alerts":200,
          "referrals":140,"docs":140,"selftest":140,"signal":220,"explore":180
        },
        undockedSignal:false,
        undockedExplore:false,
        v:10
      };
      const PANEL_IDS=new Set(Object.keys(DEFAULT_LAYOUT.heights));
      const containersOrder=["wide","left","right"];
      const findLoc=(layout,id)=>{
        for(const k of containersOrder){
          const idx=layout[k].indexOf(id);
          if(idx!==-1) return {container:k,index:idx};
        }
        return null;
      };
      const cloneLayout=(l)=>({ ...l, wide:[...l.wide], left:[...l.left], right:[...l.right], heights:{...l.heights} });

      function loadLayout(){
        try{
          const raw=localStorage.getItem(LKEY);
          if(!raw) return DEFAULT_LAYOUT;
          const p=JSON.parse(raw);
          const clean=(arr)=>Array.isArray(arr)?arr.filter(id=>PANEL_IDS.has(id)):[];
          return {
            wide:clean(p.wide)||DEFAULT_LAYOUT.wide,
            left:clean(p.left)||DEFAULT_LAYOUT.left,
            right:clean(p.right)||DEFAULT_LAYOUT.right,
            heights:{...DEFAULT_LAYOUT.heights,...(p.heights||{})},
            undockedSignal:!!p.undockedSignal,
            undockedExplore:!!p.undockedExplore,
            v:10
          };
        }catch{return DEFAULT_LAYOUT;}
      }
      function saveLayout(layout){ try{localStorage.setItem(LKEY,JSON.stringify(layout));}catch{} }

      /* Remember last column for non-wide panels */
      const useLastColumn=()=>{
        const ref=useRef({});
        const set=(id,col)=>{ ref.current[id]=col; };
        const get=(id)=>ref.current[id]||"right";
        return [get,set];
      };

      /* Per-panel minimum heights (allow compact top row; ensure explore buttons visible) */
      function getMinHeight(id, containerId){
        const map={
          "ticker": containerId==="wide"?90:110,
          "alerts": 120,
          "portfolio": 180,
          "data-feed": 160,
          "chart": 220,
          "referrals": 120,
          "docs": 120,
          "selftest": 120,
          "signal": 140,
          "explore": containerId==="wide"?90:160 /* ensure 2x2 buttons fully visible when not top */
        };
        return map[id] ?? (containerId==="wide" ? 100 : 120);
      }

      /* ===== Draggable/Resizable Panel ===== */
      function DraggableResizablePanel({
        id, containerId, index,
        editMode,height,setHeight,isWide,setWide,
        onInsertAt, // (srcId, targetContainer, targetIndex)
        children
      }){
        const minH = getMinHeight(id, containerId);
        const ref=useRef(null);

        /* vertical resize */
        useEffect(()=>{
          if(!editMode) return;
          const el=ref.current; if(!el) return;
          const onDown=(e)=>{
            if(!e.target.closest(".resize-handle")) return;
            e.preventDefault();
            const startY=e.clientY, startH=el.offsetHeight;
            const move=(ev)=>{ el.style.height=Math.max(minH,startH+(ev.clientY-startY))+"px"; };
            const up=()=>{ setHeight(id,Math.max(minH,el.offsetHeight)); window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up); };
            window.addEventListener("mousemove",move);window.addEventListener("mouseup",up);
          };
          el.addEventListener("mousedown",onDown);
          return()=>el.removeEventListener("mousedown",onDown);
        },[editMode,id,setHeight,minH]);

        /* horizontal toggle (only for TOP row) */
        useEffect(()=>{
          if(!editMode || containerId!=="wide") return;
          const el=ref.current; if(!el) return;
          const onDown=(e)=>{
            if(!e.target.closest(".resize-handle-r")) return;
            e.preventDefault();
            const sx=e.clientX;
            const move=(ev)=>{
              const dx=ev.clientX-sx;
              if(dx<-40) setWide(id,false); // send back to last non-wide column
            };
            const up=()=>{ window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up); };
            window.addEventListener("mousemove",move);window.addEventListener("mouseup",up);
          };
          el.addEventListener("mousedown",onDown);
          return()=>el.removeEventListener("mousedown",onDown);
        },[editMode,id,setWide,containerId]);

        /* DnD: dragging the whole panel; drop BEFORE this panel */
        function onDragStart(e){
          e.dataTransfer.setData("text/panel-id",id);
          e.dataTransfer.effectAllowed="move";
        }
        function onDragOver(e){ if(!editMode) return; e.preventDefault(); e.currentTarget.classList.add("drag-over"); }
        function onDragLeave(e){ e.currentTarget.classList.remove("drag-over"); }
        function onDrop(e){
          if(!editMode) return;
          e.preventDefault(); e.currentTarget.classList.remove("drag-over");
          const src=e.dataTransfer.getData("text/panel-id");
          if(src && src!==id) onInsertAt(src, containerId, index);
        }

        return (
          <div
            ref={ref}
            className={cx("relative overflow-hidden", editMode && "edit-outline noselect")}
            style={{height:(Math.max(minH, height||minH))+"px"}}
            draggable={editMode}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {editMode && <div className="drag-handle">Drag</div>}
            <div className="h-full min-h-0">{children}</div>
            {editMode && (<>
              <div className="resize-handle"/>
              {/* show horizontal handle ONLY in top row */}
              {containerId==="wide" && <div className="resize-handle-r"/>}
            </>)}
          </div>
        );
      }

      /* Drop gutter between panels for precise insertion */
      function ColumnGutter({visible, onInsert, idx}){
        const ref=useRef(null);
        useEffect(()=>{
          if(!visible) return;
          const el=ref.current;
          const over=(e)=>{e.preventDefault();el.classList.add("hover");};
          const leave=()=>el.classList.remove("hover");
          const drop=(e)=>{e.preventDefault();el.classList.remove("hover"); const pid=e.dataTransfer.getData("text/panel-id"); if(pid) onInsert(pid, idx);};
          el.addEventListener("dragover",over); el.addEventListener("dragleave",leave); el.addEventListener("drop",drop);
          return()=>{el.removeEventListener("dragover",over);el.removeEventListener("dragleave",leave);el.removeEventListener("drop",drop);}
        },[visible,onInsert,idx]);
        if(!visible) return null;
        return <div ref={ref} className={cx("drop-gutter", idx===0 && "mt-3")} />;
      }

      /* Replace-top drop area (shows placeholder when empty in edit) */
      function DropArea({id,editMode,onDropReplace,children,placeholder}){
        const ref=useRef(null);
        useEffect(()=>{
          if(!editMode) return;
          const el=ref.current;
          const over=(e)=>{e.preventDefault();el.classList.add("drag-over");};
          const leave=()=>el.classList.remove("drag-over");
          const drop=(e)=>{e.preventDefault();el.classList.remove("drag-over"); const pid=e.dataTransfer.getData("text/panel-id"); if(pid) onDropReplace(pid,id);};
          el.addEventListener("dragover",over); el.addEventListener("dragleave",leave); el.addEventListener("drop",drop);
          return()=>{el.removeEventListener("dragover",over);el.removeEventListener("dragleave",leave);el.removeEventListener("drop",drop);}
        },[editMode,id,onDropReplace]);
        return (
          <div ref={ref}>
            {children}
            {editMode && placeholder}
          </div>
        );
      }

      function DropColumn({id,editMode,onDropAppend,children}){
        const ref=useRef(null);
        useEffect(()=>{
          if(!editMode) return;
          const el=ref.current;
          const over=(e)=>{e.preventDefault();el.classList.add("drag-over");};
          const leave=()=>el.classList.remove("drag-over");
          const drop=(e)=>{e.preventDefault();el.classList.remove("drag-over"); const pid=e.dataTransfer.getData("text/panel-id"); if(pid) onDropAppend(pid,id);};
          el.addEventListener("dragover",over); el.addEventListener("dragleave",leave); el.addEventListener("drop",drop);
          return()=>{el.removeEventListener("dragover",over);el.removeEventListener("dragleave",leave);el.removeEventListener("drop",drop);}
        },[editMode,id,onDropAppend]);
        return <div ref={ref}>{children}</div>;
      }

      /* =================== APP =================== */
      function NebulaXApp(){
        /* Markets */
        const majors=["BTC/USDC","ETH/USDC","SOL/USDC"];
        const [symbol,setSymbol]=useState("SOL/USDC");
        const [trending,setTrending]=useState(TRENDING_UNIVERSE.slice(0,5));

        /* Candles */
        const [candlesBySymbol,setCandlesBySymbol]=useState({
          "BTC/USDC":seedCandles(300,62000),
          "ETH/USDC":seedCandles(300,3200),
          "SOL/USDC":seedCandles(300,170),
        });
        useEffect(()=>{
          if(!candlesBySymbol[symbol]){
            const quote=symbol.split("/")[1];
            const start=quote==="SOL"?Math.random()*0.5+0.05:Math.random()*5+1;
            setCandlesBySymbol(p=>({...p,[symbol]:seedCandles(300,start)}));
          }
        },[symbol,candlesBySymbol]);

        /* Helper: pause intervals while editing (prevents “jumping”) */
        function usePausableInterval(fn, ms, deps, paused){
          useEffect(()=>{
            if(paused) return;
            const id=setInterval(fn, ms);
            return()=>clearInterval(id);
            // eslint-disable-next-line react-hooks/exhaustive-deps
          },[paused, ms, ...deps]);
        }

        const [editMode,setEditMode]=useState(false);

        /* Price ticks (paused in edit mode) */
        usePausableInterval(()=>{
          setCandlesBySymbol(prev=>{
            const next={...prev};
            Object.keys(next).forEach(sym=>{
              const series=next[sym], lb=last(series); if(!lb) return;
              const t=Math.floor(Date.now()/1000);
              const newMin=Math.random()<0.35;
              if(newMin){
                const c=+(lb.close*(1+(Math.random()-0.5)*0.004)).toFixed(6);
                const h=Math.max(lb.high,c)*(1+Math.random()*0.002);
                const l=Math.min(lb.low,c)*(1-Math.random()*0.002);
                const v=lb.volume*(0.8+Math.random()*0.5);
                next[sym]=[...series.slice(-299),{time:t,open:lb.close,high:h,low:l,close:c,volume:v}];
              }else{
                const c=+(lb.close*(1+(Math.random()-0.5)*0.0015)).toFixed(6);
                const h=Math.max(lb.high,c), l=Math.min(lb.low,c), v=lb.volume*(0.98+Math.random()*0.05);
                next[sym]=[...series.slice(0,-1),{...lb,high:h,low:l,close:c,volume:v}];
              }
            }); return next;
          });
        }, 1500, [], editMode);

        /* Trending shuffle (paused in edit mode) */
        usePausableInterval(()=>{
          const shuffled=TRENDING_UNIVERSE.map(t=>({t,k:Math.random()}))
            .sort((a,b)=>a.k-b.k).slice(0,5).map(x=>x.t);
          setTrending(shuffled);
        }, 10000, [], editMode);

        const candles=candlesBySymbol[symbol]||[];
        const mid=(last(candles)||{close:0}).close;
        const [base,quote]=symbol.split("/");

        /* Trades / Alerts / Feeds / Portfolio */
        const solUsd=(last(candlesBySymbol["SOL/USDC"])||{close:170}).close;
        const toUSD=(qAmt,q)=>q==="USDC"?qAmt:qAmt*solUsd;

        const [tradesBySymbol,setTradesBySymbol]=useState({});
        useEffect(()=>{ if(!tradesBySymbol[symbol]) setTradesBySymbol(p=>({...p,[symbol]:[]})); },[symbol,tradesBySymbol]);

        usePausableInterval(()=>{
          setTradesBySymbol(prev=>{
            const list=prev[symbol]||[];
            const side=Math.random()>0.5?"buy":"sell";
            const price=+(mid*(1+(Math.random()-0.5)*0.003)).toFixed(6);
            const amount=+(Math.random()*60000+5).toFixed(3);
            const totalQuote=amount*price;
            const usd=toUSD(totalQuote,quote);
            const wallets=["E1w...cLr","2SM...fhv","2Ki...sJj","9o9...BDF","6db...8xh"];
            const wallet=wallets[Math.floor(Math.random()*wallets.length)];
            const mc=`$${(45+Math.floor(Math.random()*5))}M`;
            const t={id:Date.now(),side,price,amount,usd,ts:Date.now(),wallet,mc};
            return {...prev,[symbol]:[t,...list].slice(0,120)};
          });
        }, 6500, [symbol,mid,quote,solUsd], editMode);

        const [lastFill,setLastFill]=useState(null);
        useEffect(()=>{
          if(!lastFill) return;
          setTradesBySymbol(prev=>{
            const list=prev[lastFill.symbol]||[];
            const usd=toUSD(Math.abs(lastFill.qty)*lastFill.price,lastFill.quote);
            const t={id:lastFill.ts,side:lastFill.side,price:lastFill.price,amount:Math.abs(lastFill.qty),usd,ts:lastFill.ts, wallet:"You", mc:"—"};
            return {...prev,[lastFill.symbol]:[t,...list].slice(0,120)};
          });
        },[lastFill]);

        const [alertsEnabled,setAlertsEnabled]=useState({});
        const [alertsConditions,setAlertsConditions]=useState({});
        const [alertsBySymbol,setAlertsBySymbol]=useState({});
        const [recentTriggers,setRecentTriggers]=useState([]);

        /* Small, fixed-position Alert menu (won’t be clipped) */
        const [alertMenuOpen,setAlertMenuOpen]=useState(false);
        const [alertMenuPos,setAlertMenuPos]=useState(null);
        useEffect(()=>{
          if(!alertMenuOpen) return;
          const onClick=(e)=>{
            const m=document.getElementById("alert-menu");
            if(m && !m.contains(e.target) && !e.target.closest("#alert-btn")) setAlertMenuOpen(false);
          };
          window.addEventListener("mousedown",onClick);
          return()=>window.removeEventListener("mousedown",onClick);
        },[alertMenuOpen]);

        function openAlertMenuFrom(btn){
          const r=btn.getBoundingClientRect();
          setAlertMenuPos({x:Math.min(window.innerWidth-240,Math.max(8,r.right-220)), y: r.bottom+6});
          setAlertMenuOpen(true);
        }

        const enabledSymbols=Object.keys(alertsEnabled).filter(s=>alertsEnabled[s]);
        function toggleCondition(sym,typeId){
          setAlertsConditions(prev=>{
            const cur=new Set(prev[sym]||[]);
            if(cur.has(typeId)) cur.delete(typeId); else cur.add(typeId);
            return {...prev,[sym]:cur};
          });
        }
        function saveAlertMenu(sym){
          const hasAny=(alertsConditions[sym]?.size||0)>0;
          setAlertsEnabled(prev=>({...prev,[sym]:hasAny}));
          setAlertMenuOpen(false);
        }
        function pushTrigger(sym,trig){
          setAlertsBySymbol(prev=>{
            const list=prev[sym]||[]; const next=[{...trig},...list].slice(0,10); return {...prev,[sym]:next};
          });
          setRecentTriggers(prev=>[{symbol:sym,...trig},...prev].slice(0,8));
        }
        usePausableInterval(()=>{
          const pool=enabledSymbols.filter(s=>(alertsConditions[s]?.size||0)>0);
          if(!pool.length) return;
          const pick=(arr)=>arr[Math.floor(Math.random()*arr.length)];
          const sym=pick(pool), t=Date.now();
          const types=Array.from(alertsConditions[sym]||[]);
          const type=pick(types.length?types:ALERT_TYPES.map(a=>a.id));
          const rand=(min,max)=>Math.random()*(max-min)+min;
          const magnitude= type==="volume_spike"?Math.round(rand(50,500))*1000
            : type==="buys_sells_ratio" ? (rand(1.5,3).toFixed(1)+":1")
            : type==="lp_change" ? (Math.random()<0.5?"-":"+")+(rand(5,25).toFixed(0))+"%"
            : type==="holders_delta" ? "+"+Math.round(rand(25,400))
            : "$"+Math.round(rand(5,120))+"k";
          pushTrigger(sym,{type,ts:t,meta:{magnitude}});
        }, 12000, [enabledSymbols.join(","), JSON.stringify([...Object.entries(alertsConditions)])], editMode);

        /* Signal Hub & Explore (undockable) */
        const [signalTab,setSignalTab]=useState("whales");
        const [whaleFeed,setWhaleFeed]=useState([]); const [xFeed,setXFeed]=useState([]);
        usePausableInterval(()=>{
          setWhaleFeed(prev=>{
            const item={id:Date.now(),wallet:["WhaleA","WhaleB","WhaleC"][Math.floor(Math.random()*3)],
              action:Math.random()>0.5?"BUY":"SELL", sym:(Math.random()>0.5?majors:trending)[Math.floor(Math.random()*(Math.random()>0.5?majors.length:trending.length))],
              size:+(Math.random()*5+0.1).toFixed(3), usd:Math.round(Math.random()*150000)+5000, ts:Date.now()};
            return [item,...prev].slice(0,24);
          });
        }, 11000, [trending.join(",")], editMode);

        usePausableInterval(()=>{
          setXFeed(prev=>{
            const item={id:Date.now(),user:["@alpha","@onchain","@dexwatch"][Math.floor(Math.random()*3)],
              text:["listing rumor","breakout","dev update","migration"].sort(()=>.5-Math.random())[0],
              sym:(Math.random()>0.6?majors:trending)[Math.floor(Math.random()*(Math.random()>0.6?majors.length:trending.length))], ts:Date.now()};
            return [item,...prev].slice(0,24);
          });
        }, 13000, [trending.join(",")], editMode);

function useSolBalance(pubkey){
  const [lamports, setLamports] = React.useState(null);
  React.useEffect(()=>{
    if (!pubkey){ setLamports(null); return; }
    let stop = false;
    (async ()=>{
      const RPCS = [
        "https://api.mainnet-beta.solana.com",
        "https://solana-mainnet.g.alchemy.com/v2/demo"
      ];
      for (const url of RPCS){
        try{
          const conn = new solanaWeb3.Connection(url, "confirmed");
          const lam = await conn.getBalance(pubkey);
          if (!stop) setLamports(lam);
          return;
        }catch(e){}
      }
      if (!stop) setLamports(null);
    })();
    return ()=>{ stop = true; };
  }, [pubkey?.toBase58?.()]);
  return lamports; // raw lamports
}

function formatSOL(x){
  return x == null ? "—" : Number(x).toFixed(4);
}

        /* Portfolio */
function LivePortfolioCard({ solUsd }) {
const pkObj   = window.NXWallet?.getPublicKey?.() || null; // may be a PublicKey or string
const pkBase58= typeof pkObj === "string" ? pkObj : pkObj?.toBase58?.();
const lamports= useSolBalance(pkObj && typeof pkObj !== "string" ? pkObj : (pkBase58 ? new solanaWeb3.PublicKey(pkBase58) : null));
const solBal  = lamports == null ? null : lamports / solanaWeb3.LAMPORTS_PER_SOL;
const addr    = pkBase58 || null;




  // local formatters (don’t rely on globals)
  const usdFmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  const nf     = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 });

  // SOL-only total for now (we’ll add token prices later)
  const totalUSD = (solBal != null && solUsd) ? solBal * solUsd : null;

  return (
    <Card
      title={
        <a
          href="portfolio_official_v_2_fixed.html"
          className="text-sm font-semibold neon-text underline decoration-[var(--cyberpunk-border)] decoration-1 underline-offset-4 hover:opacity-90"
          aria-label="Open Portfolio page"
        >
          Portfolio
        </a>
      }
      toolbar={
        <span className="text-[10px] px-2 py-1 rounded-full border border-[var(--cyberpunk-border)] bg-[var(--cyberpunk-dark-secondary)]">
          Local
        </span>
      }
    >
      {/* address line */}
      <div className="text-xs text-zinc-400 break-all mb-2">
        {addr ? `${addr.slice(0,4)}…${addr.slice(-4)}` : "—"}
      </div>

      {/* summary tiles – match look of the old panel */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
        <div className="rounded-xl bg-[var(--cyberpunk-dark-secondary)] p-2">
          <div className="text-xs text-zinc-400">Total Value</div>
          <div className="text-lg font-semibold neon-text">
            {addr ? (totalUSD != null ? usdFmt.format(totalUSD) : "—") : "—"}
          </div>
        </div>

        <div className="rounded-xl bg-[var(--cyberpunk-dark-secondary)] p-2">
          <div className="text-xs text-zinc-400">Unrealized PnL</div>
          <div className="text-lg font-semibold text-emerald-400">+ $0</div>
        </div>

        <div className="rounded-xl bg-[var(--cyberpunk-dark-secondary)] p-2">
          <div className="text-xs text-zinc-400">Available</div>
         <div className="text-lg font-semibold neon-text">
  {addr ? `${formatSOL(solBal)} SOL` : "— SOL"}
  <span className="text-zinc-400 text-xs"> &nbsp;• $0 USDC</span>
</div>

        </div>
      </div>

      {/* positions block – same copy as your old panel */}
      <div className="text-sm neon-text">
        <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Positions</div>
        <div className="rounded-xl border border-[var(--cyberpunk-border)] p-2">
          <div className="text-zinc-500 text-sm">No live positions (mock).</div>
        </div>
      </div>
    </Card>
  );
}
        /* Search */
        const [query,setQuery]=useState(""); const [recentSymbols,setRecentSymbols]=useState([]);
        const universe=useMemo(()=>Array.from(new Set([...majors,...TRENDING_UNIVERSE,...Object.keys(candlesBySymbol)])),[candlesBySymbol]);
        function getMarketMeta(s){ const mc=`$${(5+Math.floor(Math.random()*300))}M`; const vol=`$${(Math.floor(Math.random()*300)+1)}K`; const liq=`$${(Math.floor(Math.random()*1800)+10)}K`; const icon=s.includes("BTC")?"₿":s.includes("ETH")?"◇":s.includes("SOL")?"◎":"◈"; return {icon,name:s,mc,vol,liq}; }
        const matches=useMemo(()=>{ if(!query.trim()) return []; const q=query.trim().toLowerCase(); return universe.filter(s=>s.toLowerCase().includes(q)).slice(0,8).map(getMarketMeta); },[query,universe]);
        function selectSymbol(name){ setSymbol(name); setQuery(""); setRecentSymbols(prev=>[name,...prev.filter(x=>x!==name)].slice(0,5)); }

        /* Data feed (messages don’t overlap; panel is flex column) */
        const [feedUrlBySymbol,setFeedUrlBySymbol]=useState({});
        const feedUrl=feedUrlBySymbol[symbol]||`wss://feed.mock/${symbol.replace("/","-").toLowerCase()}`;
        const [feedStatus,setFeedStatus]=useState("Disconnected");
        const [feedLatency,setFeedLatency]=useState(null);
        const [feedMsgs,setFeedMsgs]=useState([]);
        function connectFeed(){ setFeedStatus("Connecting…"); setTimeout(()=>{ setFeedStatus("Connected"); setFeedLatency(Math.floor(Math.random()*20)+35); },350); }
        usePausableInterval(()=>{
          if(feedStatus!=="Connected") return;
          setFeedMsgs(prev=>[{id:Date.now(),text:`tick ${symbol} @ ${nf.format((last(candlesBySymbol[symbol])||{close:0}).close)}`,ts:Date.now()},...prev].slice(0,50));
        }, 1500, [feedStatus,symbol,JSON.stringify(candlesBySymbol[symbol]||[])], editMode);
        /* Edit mode & layout */
        const [layout,setLayout]=useState(loadLayout);
        const [getLastCol,setLastCol]=useLastColumn();

        // seed last-column tracker
        useEffect(()=>{
          [...layout.left,...layout.right].forEach(id=>setLastCol(id, layout.left.includes(id)?"left":"right"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
        },[]);

        /* Sidebar width */
        const [asideW,setAsideW]=useState(()=>getComputedStyle(document.documentElement).getPropertyValue("--aside-w").trim()||"19rem");
        useEffect(()=>{ document.documentElement.style.setProperty("--aside-w",asideW); },[asideW]);
        const asideDragRef=useRef({dragging:false,x:0,start:0});
        function startAsideResize(e){
          if(!editMode) return; e.preventDefault();
          asideDragRef.current={dragging:true,x:e.clientX,start:parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--aside-w"))||304};
          document.addEventListener("mousemove",onAsideMove); document.addEventListener("mouseup",stopAsideResize);
        }
        function onAsideMove(e){
          if(!asideDragRef.current.dragging) return;
          const dx=e.clientX-asideDragRef.current.x;
          const w=Math.max(260,Math.min(520,asideDragRef.current.start+dx)); // clamp so texts don't distort
          document.documentElement.style.setProperty("--aside-w",w+"px"); setAsideW(w+"px");
        }
        function stopAsideResize(){ asideDragRef.current.dragging=false; document.removeEventListener("mousemove",onAsideMove); document.removeEventListener("mouseup",stopAsideResize); }

        /* Center / Right divider width */
        const gridRef=useRef(null);
        const [centerPx,setCenterPx]=useState(860);
        useEffect(()=>{
          const el=gridRef.current;
          if(!el) return;
          const ro=new ResizeObserver(()=>{
            const w=el.clientWidth||1200;
            setCenterPx((p)=>Math.max(520,Math.min(w-360, p)));
          });
          ro.observe(el);
          return()=>ro.disconnect();
        },[]);
        useEffect(()=>{
          const el=gridRef.current;
          if(el) el.style.setProperty("--center-px", centerPx+"px");
        },[centerPx]);
        const centerDragRef=useRef({dragging:false,x:0,start:0});
        function startCenterRightResize(e){
          if(!editMode) return; e.preventDefault();
          const el=gridRef.current; if(!el) return;
          const w=el.clientWidth||1200;
          centerDragRef.current={dragging:true,x:e.clientX,start:centerPx,max:w-340,min:520};
          document.addEventListener("mousemove",onCenterMove); document.addEventListener("mouseup",stopCenterResize);
        }
        function onCenterMove(e){
          if(!centerDragRef.current.dragging) return;
          const dx=e.clientX-centerDragRef.current.x;
          const val=Math.max(centerDragRef.current.min,Math.min(centerDragRef.current.max,centerDragRef.current.start+dx));
          setCenterPx(val);
        }
        function stopCenterResize(){ centerDragRef.current.dragging=false; document.removeEventListener("mousemove",onCenterMove); document.removeEventListener("mouseup",stopCenterResize); }

        /* Heights + width lock (wide row) */
        const setPanelHeight=(id,h)=>setLayout(prev=>({ ...prev, heights:{...prev.heights,[id]:Math.max(getMinHeight(id,"left"),Math.round(h))} }));
        const setWide=(id,wide)=>setLayout(prev=>{
          const next=cloneLayout(prev);
          const currentTop=next.wide[0]||null;
          containersOrder.forEach(k=>{ const i=next[k].indexOf(id); if(i!==-1) next[k].splice(i,1); });
          if(wide){
            if(currentTop && currentTop!==id){
              const col=getLastCol(currentTop);
              if(!next[col].includes(currentTop)) next[col].splice(0,0,currentTop);
            }
            next.wide=[id];
          }else{
            const col=getLastCol(id);
            next[col].splice(0,0,id);
          }
          return next;
        });

        /* Insert & Append & Replace (top) */
        const onInsertAt=(srcId, targetContainer, targetIndex)=>{
          setLayout(prev=>{
            const next=cloneLayout(prev);
            containersOrder.forEach(k=>{ const i=next[k].indexOf(srcId); if(i!==-1) next[k].splice(i,1); });
            // also remove from wide to avoid duplicates
            next.wide = next.wide.filter(id=>id!==srcId);
            if(targetContainer==="wide"){
              const prevTop=next.wide[0]||null;
              next.wide=[srcId];
              if(prevTop && prevTop!==srcId){
                const col=getLastCol(prevTop);
                if(!next[col].includes(prevTop)) next[col].splice(0,0,prevTop);
              }
            }else{
              next[targetContainer].splice(targetIndex,0,srcId);
              setLastCol(srcId,targetContainer);
            }
            return next;
          });
        };
        const onDropAppend=(panelId,targetCol)=>{
          setLayout(prev=>{
            const next=cloneLayout(prev);
            containersOrder.forEach(k=>{ const i=next[k].indexOf(panelId); if(i!==-1) next[k].splice(i,1); });
            next.wide = next.wide.filter(id=>id!==panelId);
            next[targetCol].push(panelId);
            setLastCol(panelId,targetCol);
            return next;
          });
        };
        const onDropReplace=(panelId)=>{ onInsertAt(panelId,"wide",0); };

        /* ---------- Panels ---------- */

        // Market / Alerts — title shows symbol + price (left), toolbar keeps Alerts button
function MarketInfo(){
  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold neon-text">{symbol}</span>
<span className="text-sm neon-text tabular-nums">
  ${mid.toLocaleString(undefined,{maximumFractionDigits:2})}
</span>

        </div>
      }
      toolbar={
        <div className="relative">
          <Button id="alert-btn" variant="outline" onClick={(e)=>openAlertMenuFrom(e.currentTarget)}>
            <Icon name="bell-plus" className="w-4 h-4 mr-2"/> Alerts
          </Button>
        </div>
      }
    />
  );
}

        // Data feed panel: messages never overlap (flex + min-h-0)
        function DataFeedPanel(){
          return (
            <Card title="Data Feed" toolbar={<Pill>WS</Pill>}>
              <div className="h-full flex flex-col min-h-0">
                <div className="mb-2 flex items-center gap-2 shrink-0">
                  <Input value={feedUrl} onChange={(v)=>setFeedUrlBySymbol(p=>({...p,[symbol]:v}))} placeholder="wss://..." right={<Icon name="link" className="w-4 h-4"/>}/>


                  <Button variant="outline" onClick={connectFeed}>Connect</Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs shrink-0">
                  <div className="rounded-xl bg-[var(--cyberpunk-dark-secondary)] p-2">Latency<br/><span className="font-semibold neon-text">{feedLatency??"—"} {feedLatency?"ms":""}</span></div>
                  <div className="rounded-xl bg-[var(--cyberpunk-dark-secondary)] p-2">Status<br/><span className={cx("font-semibold",feedStatus==="Connected"?"text-emerald-400":"neon-text")}>{feedStatus}</span></div>
                  <div className="rounded-xl bg-[var(--cyberpunk-dark-secondary)] p-2">Market<br/><span className="font-semibold neon-text">{symbol}</span></div>
                </div>
                <div className="mt-2 flex-1 min-h-0 overflow-auto rounded-lg bg-[var(--cyberpunk-dark-secondary)] p-2 text-xs">
                  {feedMsgs.length===0 ? <div className="text-zinc-500">No messages yet.</div> :
                    feedMsgs.map(m=><div key={m.id} className="neon-text">{new Date(m.ts).toLocaleTimeString()} — {m.text}</div>)}
                </div>
              </div>
            </Card>
          );
        }

// Kill the legacy mock panel so it stops breaking the build:
function PortfolioPanel(){ return null }
           function AlertsPanel(){
          const enabled=Object.keys(alertsEnabled).filter(s=>alertsEnabled[s]);
          return (
            <Card title="Alerts" toolbar={<Pill>My Alerts</Pill>}>
              <div className="mb-2 rounded-xl border border-[var(--cyberpunk-border)] bg-[var(--cyberpunk-dark-secondary)] p-2 text-xs">
                <div className="mb-1 text-zinc-400">Recent triggers</div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-auto">
                  {recentTriggers.length===0 && <span className="text-zinc-500">No triggers yet</span>}
                  {recentTriggers.map((rt,i)=>(
                    <span key={rt.symbol+rt.ts+i} className="rounded-lg bg-[var(--cyberpunk-dark-secondary)] px-2 py-1 neon-text">
                      {rt.symbol}: {prettyTrigger(rt)}{rt.meta?.magnitude?` (${rt.meta.magnitude})`:""}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {enabled.length===0 && <div className="text-xs text-zinc-500">No coins enabled for alerts. Use the Alerts button in the ticker.</div>}
                {enabled.map(sym=>(
                  <div key={sym} className="rounded-xl border border-[var(--cyberpunk-border)] bg-[var(--cyberpunk-dark-secondary)] p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-sm font-semibold neon-text">{sym}</div>
                      <div className="text-xs text-emerald-400">Active</div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs max-h-16 overflow-auto">
                      {(alertsBySymbol[sym]||[]).slice(0,6).map((tr,i)=>(
                        <span key={i} className="rounded-lg bg-[var(--cyberpunk-dark-secondary)] px-2 py-1 neon-text">
                          {prettyTrigger(tr)}{tr.meta?.magnitude?` (${tr.meta.magnitude})`:""}
                        </span>
                      ))}
                      {(!alertsBySymbol[sym]||alertsBySymbol[sym].length===0)&&<span className="text-zinc-500">No triggers yet</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        }

        function ReferralsPanel(){ return <Card title="Referrals" toolbar={<Icon name="share-2" className="w-4 h-4" />}><div className="flex items-center justify-between rounded-xl border border-[var(--cyberpunk-border)] bg-[var(--cyberpunk-dark-secondary)] p-2 text-sm"><div><div className="neon-text">Invite friends, earn rebates</div><div className="text-xs text-zinc-500">Program TBD (framework ready)</div></div><Button variant="outline"><Icon name="copy" className="w-4 h-4 mr-2"/> Copy Link</Button></div></Card>; }
function DocsPanel(){
  return (
    <Card
      title="Documents"
      // Make the whole panel open Documents.html
      onClick={()=>{ location.href = "Documents.html"; }}
      toolbar={<Pill>Docs</Pill>}
    >
      <div className="text-sm space-y-2">
        <p className="text-zinc-300">
          Short, expandable guides for Order, Trending, Alerts, Referrals.
        </p>

        {/* Tiny themed button under the sentence */}
        <button
          className="rounded-2xl px-3 py-1.5 text-xs font-semibold border border-[var(--cyberpunk-border)] bg-[var(--cyberpunk-dark-secondary)] neon-text hover:bg-[rgba(18,21,42,.85)] active:translate-y-[1px]"
          onClick={(e)=>{ e.stopPropagation(); location.href = "Documents.html"; }}
          aria-label="See more docs"
        >
          See more
        </button>
      </div>
    </Card>
  );
}

        function SelfTestPanel(){ return <Card title="Self-Test" toolbar={<Pill>Diagnostics</Pill>}><div className="text-sm neon-text space-y-2"><button className="rounded-xl bg-[var(--cyberpunk-dark-secondary)] px-3 py-2 hover:bg-[var(--cyberpunk-dark-secondary)] active-glow" onClick={()=>{try{const okReact=!!window.React&&!!window.ReactDOM;const okTailwind=!!document.querySelector(".rounded-2xl");const okLucide=!!window.lucide;const okLW=!!(window.LightweightCharts&&typeof window.LightweightCharts.createChart==="function");alert(`React:${okReact} • Tailwind:${okTailwind} • Lucide:${okLucide} • LWC:${okLW}`);}catch(e){alert("Self-Test failed: "+e.message);}}}>Run Self-Test</button><div className="text-xs text-zinc-400">Runs quick client checks.</div></div></Card>; }

        /* Signal Hub: content scrolls inside the panel (no overflow outside) */
        function SignalHubPanel({dockBack}){
          return (
            <Card title="Signal Hub" toolbar={<Pill>Feed</Pill>}>
              <div className="h-full flex flex-col min-h-0">
                {editMode && <div className="mb-2 shrink-0"><Button variant="outline" className="px-2 py-1 text-xs" onClick={dockBack}><Icon name="move-horizontal" className="w-4 h-4 mr-2"/> Redock</Button></div>}
                <div className="mb-2 flex gap-2 shrink-0">
                  <button onClick={()=>setSignalTab("whales")} className={cx("w-1/2 rounded-xl px-3 py-1.5 text-sm",signalTab==="whales"?"bg-[var(--cyberpunk-dark-secondary)] active-glow":"bg-[var(--cyberpunk-dark-secondary)]")}>Whales</button>
                  <button onClick={()=>setSignalTab("x")} className={cx("w-1/2 rounded-xl px-3 py-1.5 text-sm",signalTab==="x"?"bg-[var(--cyberpunk-dark-secondary)] active-glow":"bg-[var(--cyberpunk-dark-secondary)]")}>X Posts</button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto space-y-1">
                  {signalTab==="whales" ? (
                    whaleFeed.length? whaleFeed.map(w=>(
                      <div key={w.id} className="flex justify-between rounded-lg bg-[var(--cyberpunk-dark-secondary)] px-2 py-1 text-xs">
                        <span className="neon-text">{w.wallet} {w.action} {w.sym}</span>
                        <span className="text-zinc-400">{w.size} • ${w.usd.toLocaleString()}</span>
                      </div>
                    )) : <div className="text-xs text-zinc-500">No whale activity yet</div>
                  ) : (
                    xFeed.length? xFeed.map(x=>(
                      <div key={x.id} className="rounded-lg bg-[var(--cyberpunk-dark-secondary)] px-2 py-1 text-xs">
                        <div className="neon-text">{x.user} — <span className="text-zinc-400">{x.text}</span></div>
                        <div className="text-zinc-500">{x.sym || "—"} • {new Date(x.ts).toLocaleTimeString()}</div>
                      </div>
                    )) : <div className="text-xs text-zinc-500">No posts yet</div>
                  )}
                </div>
              </div>
            </Card>
          );
        }

        /* Explore: adaptive when in top row (isTop) */
function ExplorePanel({dockBack, isTop}){
  const go = (file) => { window.location.href = file; };

  return (
    <Card title="Explore" toolbar={<Pill>Discover</Pill>}>
      <div className="h-full flex flex-col min-h-0">
        {editMode && dockBack && (
          <div className="mb-2 shrink-0">
            <Button variant="outline" className="px-2 py-1 text-xs" onClick={dockBack}>
              <Icon name="move-horizontal" className="w-4 h-4 mr-2" /> Redock
            </Button>
          </div>
        )}

       {/* Replace your 4 Button items with these 4 <a> links */}
<div className={cx(
  "grid gap-2 shrink-0",
  isTop ? "grid-cols-4" : "grid-cols-2"
)}>
<a
  href="Adrenaline-official.html"
  className="relative w-full px-2 py-1.5 text-sm rounded-2xl border border-[var(--cyberpunk-border)] bg-[var(--cyberpunk-dark-secondary)] neon-text hover:bg-[rgba(18,21,42,.85)] active:translate-y-[1px] flex items-center justify-center flame-btn flame-blue"
  onMouseDown={(e)=>{ e.stopPropagation(); }}
  onClick={(e)=>{ e.stopPropagation(); }}
  draggable="false"
>
  <i data-lucide="compass" className="w-4 h-4 mr-1.5 neon-text"></i>
  Adrenaline
</a>


<a
  href="Trending.html"
  className="w-full px-2 py-1.5 text-sm rounded-2xl border border-[var(--cyberpunk-border)] 
             bg-[var(--cyberpunk-dark-secondary)] neon-text hover:bg-[rgba(18,21,42,.85)] 
             active:translate-y-[1px] flex items-center justify-center text-center"
  onMouseDown={(e)=>e.stopPropagation()}
  onClick={(e)=>e.stopPropagation()}
  draggable="false"
>
  Trending
</a>

<a
  href="NewPairs-official.html"
  className="w-full px-2 py-1.5 text-sm rounded-2xl border border-[var(--cyberpunk-border)] 
             bg-[var(--cyberpunk-dark-secondary)] neon-text hover:bg-[rgba(18,21,42,.85)] 
             active:translate-y-[1px] flex items-center justify-center text-center"
  onMouseDown={(e)=>e.stopPropagation()}
  onClick={(e)=>e.stopPropagation()}
  draggable="false"
>
  New
</a>

<a
  href="watchlist_official_v_2.html"
  className="w-full px-2 py-1.5 text-sm rounded-2xl border border-[var(--cyberpunk-border)] 
             bg-[var(--cyberpunk-dark-secondary)] neon-text hover:bg-[rgba(18,21,42,.85)] 
             active:translate-y-[1px] flex items-center justify-center text-center"
  onMouseDown={(e)=>e.stopPropagation()}
  onClick={(e)=>e.stopPropagation()}
  draggable="false"
>
  Watchlist
</a>

</div>


        {!isTop && (
          <div className="mt-2 text-xs text-zinc-500 shrink-0">
            Tap a category to explore markets.
          </div>
        )}
      </div>
    </Card>
  );
}


        /* ====================== UI ====================== */
        return (
          <div className={cx("min-h-screen",theme.bg,theme.text)}>
            {/* Fixed alert dropdown (escapes overflow) */}
            {alertMenuOpen && alertMenuPos && (
              <div
                id="alert-menu"
                className="fixed z-[5000] w-56 rounded-lg border border-[var(--cyberpunk-border)] bg-[rgba(13,16,34,0.98)] p-2 text-xs shadow-2xl"
                style={{left: alertMenuPos.x+"px", top: alertMenuPos.y+"px"}}
              >
                <div className="mb-1 uppercase tracking-wide text-zinc-400">Alerts • {symbol}</div>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {ALERT_TYPES.map(t=>{
                    const checked=(alertsConditions[symbol]?.has(t.id))||false;
                    return (
                      <label key={t.id} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-[var(--cyberpunk-dark-secondary)]">
                        <span className="neon-text">{t.label}</span>
                        <input type="checkbox" checked={checked} onChange={()=>toggleCondition(symbol,t.id)} />
                      </label>
                    );
                  })}
                </div>
<div className="mt-2 grid grid-cols-2 gap-2">
  <button
    className="px-2 py-1 rounded-xl border border-[var(--cyberpunk-border)] bg-[var(--cyberpunk-dark-secondary)] hover:bg-[rgba(18,21,42,.85)] neon-text"
    onClick={()=>setAlertMenuOpen(false)}
  >
    Cancel
  </button>
  <button
    className="px-2 py-1 rounded-xl border border-[var(--cyberpunk-border)] bg-[var(--cyberpunk-dark-secondary)] hover:bg-[rgba(18,21,42,.85)] neon-text"
    onClick={()=>saveAlertMenu(symbol)}
  >
    Save
  </button>
</div>

              </div>
            )}

{/* Header */}
<div className="sticky top-0 z-[1000] isolate bg-[rgba(10,13,27,0.9)] backdrop-blur-sm border-b border-[var(--cyberpunk-border)] h-14 px-3 neon-text">
  <div className="h-full flex items-center gap-3">
    {/* LEFT: brand + search */}
    <img src="NebulaX-logo.png" alt="NebulaX" className="h-6 w-6 rounded-md" />
    <span className="font-bold tracking-wide">NEBULAX</span>
    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-[var(--cyberpunk-dark-secondary)] neon-text">ALPHA</span>

    {/* Search */}
    <div className="relative w-64 md:w-96 ml-2">
      <Input
        id="header-search"
        value={query}
        onChange={setQuery}
        placeholder="Search markets… /"
        right={<Icon name="search" className="w-4 h-4" />}
      />
      {(query || recentSymbols.length>0) && (
        <div className="absolute left-0 mt-1 w-full rounded-xl border border-[var(--cyberpunk-border)] bg-[rgba(13,16,34,0.95)] shadow-xl z-[1100] max-h-[28rem] overflow-auto cyberpunk-panel">
          {/* history + results (unchanged) */}
          {/* … keep your existing dropdown content here … */}
        </div>
      )}
    </div>

    {/* SPACER */}
    <div className="flex-1" />

    {/* RIGHT: quick actions + wallet readout */}
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="px-2 py-1 text-xs"
        onClick={() => {
          if (editMode) { saveLayout(layout); setEditMode(false); }
          else setEditMode(true);
        }}
      >
        {editMode ? "Save HomePage" : "Edit HomePage"}
      </Button>

      {editMode && (
        <Button
          variant="outline"
          className="px-2 py-1 text-xs"
          onClick={() => { setLayout(DEFAULT_LAYOUT); setEditMode(true); /* keep current aside width reset */ }}
        >
          <Icon name="rotate-ccw" className="w-4 h-4 mr-1" /> Reset
        </Button>
      )}

      <a href="nebula_x_store_official.html" id="nx-store" className="nx-btn">Store</a>

      {/* Neutral wallet button (no undefined vars here) */}
      <Button variant="outline" className="flex items-center gap-2">
        <i data-lucide="wallet" className="w-4 h-4" />
        Wallet
      </Button>

      {/* Live address/balance (reads from window.NXWallet) */}
      <UseWalletReadout />
    </div>
  </div>
</div>



        {/* Body: Sidebar + Canvas */}
            <div className="mx-auto max-w-[1600px] p-3 relative">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[var(--aside-w)_1fr]">
                {/* Sidebar */}
                <aside className={cx("hidden md:block rounded-2xl p-3 relative overflow-hidden",theme.panel)}>
                  {editMode && <div className="aside-resize" onMouseDown={startAsideResize}></div>}

                  <div className="mb-3">
                    <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Majors</div>
                    <div className="grid grid-cols-1 gap-2">
{["BTC/USDC","ETH/USDC","SOL/USDC"].map((s)=>(
  <button
    key={s}
    data-major={s}
    onClick={()=>setSymbol(s)}
    className={cx(
      "group flex items-center justify-between rounded-xl border border-[var(--cyberpunk-border)] px-3 py-2",
      symbol===s
        ? "bg-[var(--cyberpunk-dark-secondary)] active-glow is-selected"
        : "bg-[var(--cyberpunk-dark-secondary)] hover:bg-[var(--cyberpunk-dark-secondary)]"
    )}
  >
    <span className="text-sm neon-text truncate">{s}</span>
    <span className="text-xs text-zinc-400 shrink-0 ml-2">{symbol===s?"Selected":"View"}</span>
  </button>
))}

                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Trending</div>
                    <div className="grid grid-cols-1 gap-2">
{trending.slice(0,5).map((s)=>(
  <button
    key={s}
    onMouseDown={(e)=>e.stopPropagation()}
    onClick={(e)=>{ e.stopPropagation(); NX.goToCoin({ symbol: s }); }}
    className="group flex items-center justify-between rounded-xl border border-[var(--cyberpunk-border)] bg-[var(--cyberpunk-dark-secondary)] px-3 py-2 hover:bg-[var(--cyberpunk-dark-secondary)]"
  >
    <span className="text-sm neon-text truncate">{s}</span>
    <span className="text-xs text-emerald-400 group-hover:translate-x-0.5 transition shrink-0 ml-2">
      +{(Math.random()*5).toFixed(2)}%
    </span>
  </button>
))}

                    </div>

                    {/* Explore (undockable) */}
                    {!layout.undockedExplore && (
                      <div className="mt-3">
                        <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Explore</div>
                        <div className="grid grid-cols-2 gap-2">
<a
  href="Adrenaline-official.html"
  className="relative w-full px-2 py-1.5 text-sm rounded-2xl border border-[var(--cyberpunk-border)] 
             bg-[var(--cyberpunk-dark-secondary)] neon-text hover:bg-[rgba(18,21,42,.85)] 
             active:translate-y-[1px] flex items-center justify-center text-center flame-btn flame-blue sidebar-flame"
  onMouseDown={(e)=>e.stopPropagation()}
  onClick={(e)=>e.stopPropagation()}
  draggable="false"
>
  Adrenaline
</a>


<a
  href="Trending.html"
  className="w-full px-2 py-1.5 text-sm rounded-2xl border border-[var(--cyberpunk-border)] 
             bg-[var(--cyberpunk-dark-secondary)] neon-text hover:bg-[rgba(18,21,42,.85)] 
             active:translate-y-[1px] flex items-center justify-center text-center"
  onMouseDown={(e)=>e.stopPropagation()}
  onClick={(e)=>e.stopPropagation()}
  draggable="false"
>
  Trending
</a>

<a
  href="NewPairs-official.html"
  className="w-full px-2 py-1.5 text-sm rounded-2xl border border-[var(--cyberpunk-border)] 
             bg-[var(--cyberpunk-dark-secondary)] neon-text hover:bg-[rgba(18,21,42,.85)] 
             active:translate-y-[1px] flex items-center justify-center text-center"
  onMouseDown={(e)=>e.stopPropagation()}
  onClick={(e)=>e.stopPropagation()}
  draggable="false"
>
  New
</a>

<a
  href="watchlist_official_v_2.html"
  className="w-full px-2 py-1.5 text-sm rounded-2xl border border-[var(--cyberpunk-border)] 
             bg-[var(--cyberpunk-dark-secondary)] neon-text hover:bg-[rgba(18,21,42,.85)] 
             active:translate-y-[1px] flex items-center justify-center text-center"
  onMouseDown={(e)=>e.stopPropagation()}
  onClick={(e)=>e.stopPropagation()}
  draggable="false"
>
  Watchlist
</a>


                        </div>
                        {editMode && (
                          <div className="mt-2">
                            <Button variant="outline" className="px-2 py-1 text-xs" onClick={()=>setLayout(prev=>{
                              if(prev.undockedExplore) return prev;
                              const next=cloneLayout(prev);
                              next.undockedExplore=true;
                              next.wide = next.wide.filter(id=>id!=="explore");
                              if(!next.right.includes("explore")) next.right=[ "explore", ...next.right ];
                              return next;
                            })}>
                              <Icon name="move-horizontal" className="w-4 h-4 mr-2" /> Undock Explore
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Signal Hub in sidebar unless undocked */}
                    {!layout.undockedSignal && (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-sm font-semibold neon-text">Signal Hub</div>
                          {editMode && (
                            <Button variant="outline" className="px-2 py-1 text-xs" onClick={()=>setLayout(prev=>{
                              const next=cloneLayout(prev); next.undockedSignal=true;
                              next.wide = next.wide.filter(id=>id!=="signal");
                              if(!next.right.includes("signal")) next.right=[ "signal", ...next.right ]; return next;
                            })}>
                              <Icon name="move-horizontal" className="w-4 h-4 mr-2"/> Undock
                            </Button>
                          )}
                        </div>
                        <div className="mb-2 flex gap-2">
                          <button onClick={()=>setSignalTab("whales")} className={cx("w-1/2 rounded-xl px-3 py-1.5 text-sm",signalTab==="whales"?"bg-[var(--cyberpunk-dark-secondary)] active-glow":"bg-[var(--cyberpunk-dark-secondary)]")}>Whales</button>
                          <button onClick={()=>setSignalTab("x")} className={cx("w-1/2 rounded-xl px-3 py-1.5 text-sm",signalTab==="x"?"bg-[var(--cyberpunk-dark-secondary)] active-glow":"bg-[var(--cyberpunk-dark-secondary)]")}>X Posts</button>
                        </div>
                        <div className="space-y-1 max-h-56 overflow-auto">
                          {(signalTab==="whales"?whaleFeed:xFeed).slice(0,10).map(item=>(
                            <div key={item.id} className="rounded-lg bg-[var(--cyberpunk-dark-secondary)] px-2 py-1 text-xs">
                              {signalTab==="whales" ? (
                                <div className="flex justify-between">
                                  <span className="neon-text">{item.wallet} {item.action} {item.sym}</span>
                                  <span className="text-zinc-400">{item.size} • ${item.usd.toLocaleString()}</span>
                                </div>
                              ) : (
                                <>
                                  <div className="neon-text">{item.user} — <span className="text-zinc-400">{item.text}</span></div>
                                  <div className="text-zinc-500">{item.sym || "—"} • {new Date(item.ts).toLocaleTimeString()}</div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </aside>

                {/* Canvas (center + right) */}
                <main ref={gridRef} className="relative">
                  {/* Resizer hides if right column empty; perfectly aligned to seam */}
                  {editMode && layout.right.length>0 && <div className="center-right-resize" onMouseDown={startCenterRightResize}></div>}

                  {/* WIDE row (top) - drop to replace, spaced placeholder */}
                  <DropArea id="wide" editMode={editMode} onDropReplace={onDropReplace}
                    placeholder={(editMode && layout.wide.length===0) ? (
                      <div className="mt-2">
                        <div className="drop-gutter h-16 flex items-center justify-center text-[11px] text-zinc-400">Drop a panel here to pin it to the top</div>
                      </div>
                    ):null}
                  >
                    <div className="grid grid-cols-1 gap-3">
                      {layout.wide.map(pid=>(
                        <DraggableResizablePanel
                          key={pid}
                          id={pid}
                          containerId="wide"
                          index={0}
                          editMode={editMode}
                          height={layout.heights[pid]}
                          setHeight={setPanelHeight}
                          isWide={true}
                          setWide={setWide}
                          onInsertAt={onInsertAt}
                        >
                          {pid==="ticker" && <MarketInfo/>}
                          {pid==="chart" && <ChartPanel2 symbol={symbol} candlesBySymbol={candlesBySymbol}/>}
                          {pid==="data-feed" && <DataFeedPanel/>}
{pid==="portfolio" && <LivePortfolioCard solUsd={solUsd} />}
                          {pid==="alerts" && <AlertsPanel/>}
                          {pid==="referrals" && <ReferralsPanel/>}
                          {pid==="docs" && <DocsPanel/>}
                          {pid==="selftest" && <SelfTestPanel/>}
                          {pid==="signal" && <SignalHubPanel dockBack={()=>setLayout(prev=>{ const next=cloneLayout(prev); next.undockedSignal=false; next.wide=next.wide.filter(p=>p!=="signal"); next.left=next.left.filter(p=>p!=="signal"); next.right=next.right.filter(p=>p!=="signal"); return next; })}/>}
                          {pid==="explore" && <ExplorePanel isTop={true} dockBack={()=>setLayout(prev=>{ const next=cloneLayout(prev); next.undockedExplore=false; next.wide=next.wide.filter(p=>p!=="explore"); next.left=next.left.filter(p=>p!=="explore"); next.right=next.right.filter(p=>p!=="explore"); return next; })}/>}
                        </DraggableResizablePanel>
                      ))}
                    </div>
                  </DropArea>

                  {/* Two columns with adjustable center width; expands full if right empty */}
                  <div
                    className="mt-3 grid gap-3"
                    style={{ gridTemplateColumns: layout.right.length>0 ? `${centerPx}px 1fr` : `1fr` }}
                  >
                    {/* LEFT (center column) */}
                    <div>
                      {/* top gutter for insert at index 0 — spaced */}
                      <ColumnGutter visible={editMode} onInsert={(pid,idx)=>onInsertAt(pid,"left",0)} idx={0}/>
                      <div className="space-y-3">
                        {layout.left.map((pid,idx)=>(
                          <React.Fragment key={pid}>
                            <DraggableResizablePanel
                              id={pid}
                              containerId="left"
                              index={idx}
                              editMode={editMode}
                              height={layout.heights[pid]}
                              setHeight={setPanelHeight}
                              isWide={false}
                              setWide={setWide}
                              onInsertAt={(pid2)=>onInsertAt(pid2,"left",idx)}
                            >
                              {pid==="chart" && <ChartPanel2 symbol={symbol} candlesBySymbol={candlesBySymbol}/>}
                              {pid==="data-feed" && <DataFeedPanel/>}
                              {pid==="ticker" && <MarketInfo/>}
                              {pid==="signal" && <SignalHubPanel dockBack={()=>setLayout(prev=>{ const next=cloneLayout(prev); next.undockedSignal=false; next.wide=next.wide.filter(p=>p!=="signal"); next.left=next.left.filter(p=>p!=="signal"); next.right=next.right.filter(p=>p!=="signal"); return next; })}/>}
                              {pid==="explore" && <ExplorePanel isTop={false} dockBack={()=>setLayout(prev=>{ const next=cloneLayout(prev); next.undockedExplore=false; next.wide=next.wide.filter(p=>p!=="explore"); next.left=next.left.filter(p=>p!=="explore"); next.right=next.right.filter(p=>p!=="explore"); return next; })}/>}
                              {pid==="portfolio" && <LivePortfolioCard solUsd={solUsd} />}
                              {pid==="alerts" && <AlertsPanel/>}
                              {pid==="referrals" && <ReferralsPanel/>}
                              {pid==="docs" && <DocsPanel/>}
                              {pid==="selftest" && <SelfTestPanel/>}
                            </DraggableResizablePanel>
                            <ColumnGutter visible={editMode} onInsert={(pid2)=>onInsertAt(pid2,"left",idx+1)} idx={idx+1}/>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT (collapsible column) */}
                    <div>
                      {/* top gutter for insert at index 0 — spaced */}
                      <ColumnGutter visible={editMode} onInsert={(pid)=>onInsertAt(pid,"right",0)} idx={0}/>
                      <div className="space-y-3">
                        {layout.right.map((pid,idx)=>(
                          <React.Fragment key={pid}>
                            <DraggableResizablePanel
                              id={pid}
                              containerId="right"
                              index={idx}
                              editMode={editMode}
                              height={layout.heights[pid]}
                              setHeight={setPanelHeight}
                              isWide={false}
                              setWide={setWide}
                              onInsertAt={(pid2)=>onInsertAt(pid2,"right",idx)}
                            >
                              {pid==="chart" && <ChartPanel2 symbol={symbol} candlesBySymbol={candlesBySymbol}/>}
                              {pid==="data-feed" && <DataFeedPanel/>}
                              {pid==="ticker" && <MarketInfo/>}
                              {pid==="portfolio" && <LivePortfolioCard solUsd={solUsd} />}
                              {pid==="alerts" && <AlertsPanel/>}
                              {pid==="referrals" && <ReferralsPanel/>}
                              {pid==="docs" && <DocsPanel/>}
                              {pid==="selftest" && <SelfTestPanel/>}

                              {pid==="signal" && (
                                <SignalHubPanel
                                  dockBack={()=>setLayout(prev=>{
                                    const next=cloneLayout(prev);
                                    next.undockedSignal=false;
                                    next.wide=next.wide.filter(p=>p!=="signal");
                                    next.left=next.left.filter(p=>p!=="signal");
                                    next.right=next.right.filter(p=>p!=="signal");
                                    return next;
                                  })}
                                />
                              )}

                              {pid==="explore" && (
                                <ExplorePanel
                                  isTop={false}
                                  dockBack={()=>setLayout(prev=>{
                                    const next=cloneLayout(prev);
                                    next.undockedExplore=false;
                                    next.wide=next.wide.filter(p=>p!=="explore");
                                    next.left=next.left.filter(p=>p!=="explore");
                                    next.right=next.right.filter(p=>p!=="explore");
                                    return next;
                                  })}
                                />
                              )}
                            </DraggableResizablePanel>
                            <ColumnGutter visible={editMode} onInsert={(pid2)=>onInsertAt(pid2,"right",idx+1)} idx={idx+1}/>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <footer className={cx("mt-3 flex items-center justify-between rounded-2xl px-3 py-2 text-xs", theme.panel)}>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">Status:</span>
                      <span className="text-emerald-400">{feedStatus==="Connected"?"Connected":"Idle (mock)"}</span>
                      <span className="text-zinc-400">Latency:</span>
                      <span className="neon-text">{feedLatency??"—"}{feedLatency?" ms":""}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="neon-text">© {new Date().getFullYear()} NebulaX • Front-end mock</span>
                      <button type="button" className="neon-text hover:underline">Help</button>
                    </div>
                  </footer>
                </main>
              </div>
            </div>
          </div>
        );
      }

      const root = ReactDOM.createRoot(document.getElementById("root"));
      root.render(<NebulaXApp />);
    
