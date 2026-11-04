import { useEffect, useId, useState, type ReactNode } from 'react';
import { HelpCircle, X } from 'lucide-react';
export function Field({label,value,onChange,error,type='number'}:{label:string;value:number|string;onChange:(v:any)=>void;error?:string;type?:'number'|'text'}) {
  const id=useId();
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} type={type} step={type==='number'?'any':undefined} value={typeof value==='number'&&!Number.isFinite(value)?'':value} onChange={event=>onChange(type==='number'?(event.target.value===''?NaN:Number(event.target.value)):event.target.value)} aria-invalid={!!error} aria-describedby={error?id+'-error':undefined}/>{error&&<p className="field-error" id={id+'-error'} role="alert">{error}</p>}</div>;
}
export function Help({label,children}:{label:string;children:ReactNode}) {
 const [open,setOpen]=useState(false);const id=useId();return <span className="help" onKeyDown={event=>{if(event.key==='Escape')setOpen(false)}}><button type="button" className="help-trigger" aria-label={'Help: '+label} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><HelpCircle size={17}/></button>{open&&<span className="help-content" id={id}>{children}<button type="button" aria-label="Close help" onClick={()=>setOpen(false)}><X size={16}/></button></span>}</span>;
}
export function Toggle({label,checked,onChange,help}:{label:string;checked:boolean;onChange:(value:boolean)=>void;help?:string}) {return <div className="toggle-row"><span>{label}{help&&<Help label={label}>{help}</Help>}</span><button type="button" className="toggle" role="switch" aria-label={label} aria-checked={checked} onClick={()=>onChange(!checked)}><span/></button></div>}
export function Money({value}:{value:number}) {return <>{value.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2})}</>}

export function InputGroup({title,children,initiallyOpen=false,invalid=false,revealKey=0,className=''}:{title:string;children:ReactNode;initiallyOpen?:boolean;invalid?:boolean;revealKey?:number;className?:string}){
 const [open,setOpen]=useState(initiallyOpen);const id=useId();
 useEffect(()=>{if(invalid)setOpen(true)},[invalid,revealKey]);
 return <section className={'input-group '+className}><h2><span className="group-title">{title}</span><button className="group-heading" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{title}<span aria-hidden="true">{open?'−':'+'}</span></button></h2><div id={id} className={'group-content'+(open?' expanded':'')}>{children}</div></section>;
}
