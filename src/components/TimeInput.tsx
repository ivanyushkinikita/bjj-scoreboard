import { useLayoutEffect, useRef, useState } from 'react';
import { formatTime, parseTime } from '../domain/timer';
import { useTranslation } from '../app/i18n';

export function TimeInput({value,onChange,label,autoFocus=false}:{value:string;onChange:(value:string)=>void;label:string;autoFocus?:boolean}) {
  const {t}=useTranslation();
  const input=useRef<HTMLInputElement>(null);
  const [part,setPart]=useState<'minute'|'second'>('minute');
  const selection=useRef<'minute'|'second'|null>(null);
  const duration=parseTime(value);
  function selectPart(){
    const field=input.current;
    if(field) setPart((field.selectionStart??0)>field.value.indexOf(':')?'second':'minute');
  }
  function step(direction:number){
    if(!duration)return;
    const next=formatTime(Math.max(1000,Math.min(59999000,duration+direction*(part==='second'?1000:60000))));
    if(next===value)return;
    selection.current=part;
    onChange(next);
  }
  useLayoutEffect(()=>{
    if(!selection.current||!input.current)return;
    const colon=value.indexOf(':');
    input.current.focus();
    input.current.setSelectionRange(selection.current==='second'?colon+1:0,selection.current==='second'?value.length:colon);
    selection.current=null;
  },[value]);
  const increase=t(part==='second'?'Increase duration by 1 second':'Increase duration by 1 minute');
  const decrease=t(part==='second'?'Decrease duration by 1 second':'Decrease duration by 1 minute');
  return <div className="duration-input"><input ref={input} autoFocus={autoFocus} required maxLength={6} aria-label={label} className="time-input" value={value} onChange={e=>onChange(e.target.value)} onSelect={selectPart} onClick={selectPart} onKeyUp={selectPart} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();step(e.key==='ArrowUp'?1:-1);}}} placeholder={t('MM:SS')} aria-invalid={!duration}/><div className="duration-arrows"><button type="button" aria-label={increase} title={increase} disabled={!duration||duration>=59999000} onMouseDown={e=>e.preventDefault()} onClick={()=>step(1)}>▲</button><button type="button" aria-label={decrease} title={decrease} disabled={!duration||duration<=1000} onMouseDown={e=>e.preventDefault()} onClick={()=>step(-1)}>▼</button></div></div>;
}
