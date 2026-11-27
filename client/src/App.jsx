import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, AudioLines, Battery, Bot, ChevronRight, Clock3, Command, Cpu,
  Gauge, History, Menu, Mic, MicOff, MessageSquare, Send, ShieldCheck,
  Sparkles, Trash2, Volume2, VolumeX, Wifi, X, Zap
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const STORAGE_KEY = "jarvis2_conversation_v1";
function readHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function Orb({ listening, thinking }) {
  return <div className={`orb-wrap ${listening ? "listening" : ""} ${thinking ? "thinking" : ""}`}>
    <div className="orb-grid"/><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><div className="orb-ring ring-three"/>
    <div className="orb-core"><div className="core-shine"/><div className="core-mark">J</div></div><div className="orb-scan"/>
  </div>;
}
function App() {
  const [messages,setMessages]=useState(readHistory),[input,setInput]=useState(""),[busy,setBusy]=useState(false);
  const [listening,setListening]=useState(false),[voiceEnabled]=useState(true),[muted,setMuted]=useState(false);
  const [mobileMenu,setMobileMenu]=useState(false),[activeTab,setActiveTab]=useState("overview"),[clock,setClock]=useState(new Date());
  const [status,setStatus]=useState("ALL SYSTEMS NOMINAL"),[toast,setToast]=useState(""),[battery,setBattery]=useState(null),[online,setOnline]=useState(navigator.onLine);
  const chatEnd=useRef(null),inputRef=useRef(null),recognitionRef=useRef(null);
  useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(messages.slice(-60)));chatEnd.current?.scrollIntoView({behavior:"smooth"});},[messages,busy]);
  useEffect(()=>{
    const timer=setInterval(()=>setClock(new Date()),1000),onlineHandler=()=>setOnline(navigator.onLine);
    window.addEventListener("online",onlineHandler);window.addEventListener("offline",onlineHandler);
    if("getBattery" in navigator) navigator.getBattery().then(b=>{const update=()=>setBattery(Math.round(b.level*100));update();b.addEventListener("levelchange",update);}).catch(()=>{});
    return ()=>{clearInterval(timer);window.removeEventListener("online",onlineHandler);window.removeEventListener("offline",onlineHandler);recognitionRef.current?.stop();};
  },[]);
  const formattedTime=useMemo(()=>clock.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}),[clock]);
  function notify(text){setToast(text);window.setTimeout(()=>setToast(""),2600);}
  function speak(text){if(!voiceEnabled||muted||!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.slice(0,1200));u.rate=1.02;u.pitch=.92;u.volume=.9;window.speechSynthesis.speak(u);}
  function runLocalCommand(raw){
    const text=raw.toLowerCase().trim(),sites=[["youtube","https://www.youtube.com"],["google","https://www.google.com"],["github","https://github.com"],["gmail","https://mail.google.com"],["linkedin","https://www.linkedin.com"],["chatgpt","https://chatgpt.com"]];
    const match=sites.find(([name])=>text===`open ${name}`||text===`launch ${name}`||text===`go to ${name}`);
    if(match){window.open(match[1],"_blank","noopener,noreferrer");const reply=`Opening ${match[0]}.`;setMessages(p=>[...p,{role:"user",text:raw},{role:"assistant",text:reply}]);speak(reply);return true;}
    if(text==="what time is it"||text==="time"){const reply=`The current local time is ${new Date().toLocaleTimeString()}.`;setMessages(p=>[...p,{role:"user",text:raw},{role:"assistant",text:reply}]);speak(reply);return true;}
    if(text==="clear chat"||text==="clear conversation"){setMessages([]);localStorage.removeItem(STORAGE_KEY);notify("Conversation cleared");return true;}
    return false;
  }
  async function sendMessage(value=input){
    const text=value.trim();if(!text||busy)return;setInput("");if(runLocalCommand(text))return;
    setMessages(p=>[...p,{role:"user",text}]);setBusy(true);setStatus("JARVIS PROCESSING REQUEST");
    try{
      const response=await fetch(`${API_BASE}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,history:messages.slice(-16).map(m=>({role:m.role==="assistant"?"model":"user",text:m.text}))})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"The AI service returned an error.");
      const answer=data.reply||"I couldn't generate a response. Please try again.";setMessages(p=>[...p,{role:"assistant",text:answer}]);speak(answer);setStatus("ALL SYSTEMS NOMINAL");
    }catch(error){setMessages(p=>[...p,{role:"assistant",text:`Connection issue: ${error.message||"Unable to reach JARVIS."}`}]);setStatus("AI LINK INTERRUPTED");}
    finally{setBusy(false);}
  }
  function startListening(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){notify("Speech recognition is not supported. Try Chrome or Edge.");return;}
    if(listening){recognitionRef.current?.stop();setListening(false);return;}
    const recognition=new SR();recognition.lang="en-IN";recognition.interimResults=false;recognition.maxAlternatives=1;
    recognition.onstart=()=>{setListening(true);setStatus("VOICE CHANNEL ACTIVE");};
    recognition.onresult=e=>{const transcript=e.results[0][0].transcript;setInput(transcript);sendMessage(transcript);};
    recognition.onerror=()=>notify("Microphone error. Check browser permissions.");
    recognition.onend=()=>{setListening(false);setStatus("ALL SYSTEMS NOMINAL");};recognitionRef.current=recognition;recognition.start();
  }
  const suggestions=[
    {icon:<Sparkles size={16}/>,title:"Daily briefing",prompt:"Give me a concise daily briefing and three priorities to focus on."},
    {icon:<Cpu size={16}/>,title:"Explain a concept",prompt:"Explain how neural networks work in simple terms, with an example."},
    {icon:<Command size={16}/>,title:"Build something",prompt:"Suggest an advanced weekend software project I can build and give me a roadmap."},
    {icon:<ShieldCheck size={16}/>,title:"Security checklist",prompt:"Give me a practical security checklist for a modern web application."}
  ];
  function clearChat(){setMessages([]);localStorage.removeItem(STORAGE_KEY);notify("Conversation cleared");}
  return <div className="app-shell"><div className="ambient ambient-a"/><div className="ambient ambient-b"/>
    <header className="topbar">
      <button className="mobile-menu icon-btn" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu?<X/>:<Menu/>}</button>
      <div className="brand"><div className="brand-emblem"><span>J</span></div><div><div className="brand-name">JARVIS<span>2.0</span></div><div className="brand-sub">PERSONAL INTELLIGENCE SYSTEM</div></div></div>
      <div className="top-center"><span className="live-dot"/> SECURE SESSION <span className="top-divider"/> BUILD 2.0.1</div>
      <div className="top-actions"><div className="clock"><Clock3 size={15}/><span>{formattedTime}</span></div>
        <button className="icon-btn" title={muted?"Unmute":"Mute"} onClick={()=>setMuted(!muted)}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button>
        <button className="icon-btn" title="Clear conversation" onClick={clearChat}><Trash2 size={17}/></button></div>
    </header>
    <div className={`layout ${mobileMenu?"menu-open":""}`}>
      <aside className="sidebar"><div className="side-label">COMMAND DECK</div>
        <button className={`nav-item ${activeTab==="overview"?"active":""}`} onClick={()=>{setActiveTab("overview");setMobileMenu(false);}}><Gauge size={17}/> Overview <span className="nav-key">01</span></button>
        <button className={`nav-item ${activeTab==="assistant"?"active":""}`} onClick={()=>{setActiveTab("assistant");setMobileMenu(false);inputRef.current?.focus();}}><MessageSquare size={17}/> AI Assistant <span className="nav-key">02</span></button>
        <button className={`nav-item ${activeTab==="systems"?"active":""}`} onClick={()=>{setActiveTab("systems");setMobileMenu(false);}}><Activity size={17}/> System status <span className="nav-key">03</span></button>
        <div className="side-divider"/><div className="side-label">QUICK ACTIONS</div>
        <button className="quick-action" onClick={()=>sendMessage("Give me a concise personal productivity briefing.")}><Zap size={16}/> Daily briefing</button>
        <button className="quick-action" onClick={()=>sendMessage("Help me brainstorm an innovative software project.")}><Sparkles size={16}/> Idea generator</button>
        <button className="quick-action" onClick={()=>sendMessage("Give me a step-by-step coding lesson for today.")}><Bot size={16}/> Coding mode</button>
        <div className="sidebar-bottom"><div className="mini-status"><span className="status-pulse"/><span>JARVIS CORE</span><strong>ONLINE</strong></div>
          <div className="mini-status"><Wifi size={14}/><span>NETWORK</span><strong>{online?"CONNECTED":"OFFLINE"}</strong></div>
          <div className="mini-status"><Battery size={14}/><span>BATTERY</span><strong>{battery===null?"N/A":`${battery}%`}</strong></div>
          <div className="sidebar-version">STARK INDUSTRIES // PERSONAL BUILD</div></div>
      </aside>
      <main className="main-content"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> INTERFACE / {activeTab.toUpperCase()}</div>
        <h1>{activeTab==="systems"?"System diagnostics":activeTab==="assistant"?"AI communication":"Good day, operator."}</h1>
        <p>{activeTab==="systems"?"A live overview of this browser session.":"Your personal intelligence system is ready for instructions."}</p></div>
        <div className="system-pill"><span className="live-dot"/>{status}</div></div>
        {activeTab==="systems"?<section className="diagnostic-grid">
          {[
            ["AI SERVICE","GEMINI API","Backend connection required",<Bot/>],
            ["NETWORK",online?"CONNECTED":"OFFLINE","Browser connectivity",<Wifi/>],
            ["VOICE ENGINE",("SpeechRecognition" in window||"webkitSpeechRecognition" in window)?"AVAILABLE":"LIMITED","Browser speech capability",<AudioLines/>],
            ["LOCAL STORAGE","ACTIVE","Conversation history on this device",<History/>]
          ].map(([label,value,desc,icon])=><div className="metric-card" key={label}><div className="metric-top">{label}{icon}</div><div className="metric-value">{value}</div><div className="metric-desc">{desc}</div></div>)}
          <div className="diagnostic-note"><ShieldCheck/><div><strong>Privacy note</strong><p>Chat history is stored in this browser. Messages sent to the assistant are processed by your configured Gemini API backend. Do not submit passwords or sensitive personal data.</p></div></div>
        </section>:<>
          <section className="hero-grid"><div className="orb-panel"><div className="panel-caption"><span>NEURAL INTERFACE</span><span className="tiny-live">● LIVE</span></div>
            <Orb listening={listening} thinking={busy}/><div className="orb-state">{busy?"PROCESSING":listening?"LISTENING":"AWAITING INPUT"}</div>
            <div className="orb-hint">J.A.R.V.I.S. // GEMINI INTELLIGENCE</div>
            <div className="orb-footer"><span>CORE TEMP <b>OPTIMAL</b></span><span>LATENCY <b>VARIABLE</b></span><span>UPLINK <b>{online?"ACTIVE":"DOWN"}</b></span></div></div>
            <div className="right-stack"><div className="metric-card time-card"><div className="metric-top">LOCAL TIME <Clock3 size={15}/></div><div className="time-display">{formattedTime}</div><div className="metric-desc">{clock.toLocaleDateString([],{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div></div>
              <div className="metric-card"><div className="metric-top">SYSTEM READINESS <Activity size={15}/></div>
                <div className="readiness"><span>AI INTERFACE</span><b>READY</b></div><div className="readiness"><span>VOICE CHANNEL</span><b>{listening?"ACTIVE":"STANDBY"}</b></div>
                <div className="readiness"><span>NETWORK LINK</span><b>{online?"STABLE":"OFFLINE"}</b></div><div className="readiness"><span>LOCAL MEMORY</span><b>ENABLED</b></div></div>
              <div className="quote-card"><div className="quote-mark">“</div><p>Sometimes you gotta run before you can walk.</p><span>— TONY STARK</span></div></div>
          </section>
          <section className="assistant-section" id="assistant"><div className="section-heading"><div><div className="eyebrow">COMMUNICATION CHANNEL</div><h2>Talk to JARVIS</h2></div>
            <div className="chat-tools"><span className="model-tag"><Sparkles size={13}/> GEMINI AI</span><button className="text-btn" onClick={clearChat}><Trash2 size={14}/> Clear</button></div></div>
            <div className="chat-window">{messages.length===0?<div className="empty-chat"><div className="empty-icon"><Bot size={24}/></div><h3>At your service.</h3><p>Systems are online. What would you like me to do?</p>
              <div className="suggestion-grid">{suggestions.map(s=><button className="suggestion" key={s.title} onClick={()=>sendMessage(s.prompt)}><span>{s.icon}</span><span>{s.title}</span><ChevronRight size={15}/></button>)}</div></div>:
              <div className="messages">{messages.map((m,i)=><motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`message ${m.role}`} key={`${i}-${m.role}`}><div className="message-avatar">{m.role==="assistant"?<Bot size={16}/>:"YOU"}</div>
                <div className="message-body"><div className="message-meta">{m.role==="assistant"?"JARVIS":"OPERATOR"} <span>{m.role==="assistant"?"AI RESPONSE":"INPUT"}</span></div><div className="message-text">{m.text}</div></div></motion.div>)}
                {busy&&<div className="message assistant"><div className="message-avatar"><Bot size={16}/></div><div className="message-body"><div className="message-meta">JARVIS <span>PROCESSING</span></div><div className="typing"><i/><i/><i/></div></div></div>}<div ref={chatEnd}/></div>}</div>
            <form className="composer" onSubmit={e=>{e.preventDefault();sendMessage();}}><button type="button" className={`mic-btn ${listening?"recording":""}`} onClick={startListening} title="Voice input">{listening?<MicOff size={19}/>:<Mic size={19}/>}</button>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} placeholder="Give JARVIS an instruction..." aria-label="Message JARVIS"/>
              <button className="send-btn" type="submit" disabled={!input.trim()||busy}><Send size={17}/><span>TRANSMIT</span></button></form>
            <div className="composer-foot"><span><ShieldCheck size={12}/> ENCRYPTED IN TRANSIT VIA HTTPS WHEN DEPLOYED</span><span>ENTER TO SEND</span></div>
          </section>
        </>}
        <footer className="footer"><span>JARVIS 2.0 <b>•</b> PERSONAL AI COMMAND CENTRE</span><span>DESIGNED FOR THE NEXT FRONTIER <Zap size={12}/></span></footer>
      </main>
    </div>
    <AnimatePresence>{toast&&<motion.div className="toast" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}}>{toast}</motion.div>}</AnimatePresence>
  </div>;
}
export default App;