import { useLayoutEffect, useRef, useState } from 'react';
import { formatTime, parseTime } from '../domain/timer';
import { useTranslation } from '../app/i18n';

const maximumDuration = 99 * 60000 + 59000;

function maskTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4).padEnd(4, '0');
  const seconds = Math.min(59, Number(digits.slice(2, 4)));
  return `${digits.slice(0, 2)}:${seconds.toString().padStart(2, '0')}`;
}

export function TimeInput({value,onChange,label,autoFocus=false}:{value:string;onChange:(value:string)=>void;label:string;autoFocus?:boolean}) {
  const {t}=useTranslation();
  const input=useRef<HTMLInputElement>(null);
  const [part,setPart]=useState<'minute'|'second'>('minute');
  const selection=useRef<{start:number;end:number}|null>(null);
  const duration=parseTime(value);
  function selectPart(){
    const field=input.current;
    if(field) setPart((field.selectionStart??0)>field.value.indexOf(':')?'second':'minute');
  }
  function step(direction:number){
    if(!duration)return;
    const next=formatTime(Math.max(1000,Math.min(maximumDuration,duration+direction*(part==='second'?1000:60000))));
    if(next===value)return;
    const colon=next.indexOf(':');
    selection.current=part==='second'?{start:colon+1,end:next.length}:{start:0,end:colon};
    onChange(next);
  }
  useLayoutEffect(()=>{
    if(!selection.current||!input.current)return;
    input.current.focus();
    input.current.setSelectionRange(selection.current.start,selection.current.end);
    selection.current=null;
  },[value]);
  useLayoutEffect(() => {
    const field = input.current;
    const normalize = () => { if (parseTime(maskTime(value)) === 0) onChange('00:01'); };
    field?.addEventListener('blur', normalize);
    return () => field?.removeEventListener('blur', normalize);
  }, [onChange, value]);
  const increase=t(part==='second'?'Increase duration by 1 second':'Increase duration by 1 minute');
  const decrease=t(part==='second'?'Decrease duration by 1 second':'Decrease duration by 1 minute');
  const moveSelection = (nextSelection: { start: number; end: number }) => {
    selection.current = nextSelection;
    // When a typed digit is already 0, React keeps the same controlled value
    // and does not run the layout effect. Set the caret after the key event as
    // well, otherwise the browser restores it to the same digit.
    window.requestAnimationFrame(() => input.current?.setSelectionRange(nextSelection.start, nextSelection.end));
  };
  const updateDigit = (digit: string, position: number) => {
    const current = maskTime(value);
    const index = position < 2 ? position : Math.max(3, Math.min(4, position));
    const next = `${current.slice(0, index)}${digit}${current.slice(index + 1)}`;
    moveSelection({ start: index === 1 ? 3 : Math.min(5, index + 1), end: index === 1 ? 3 : Math.min(5, index + 1) });
    const masked = maskTime(next);
    onChange(index === 4 && parseTime(masked) === 0 ? '00:01' : masked);
  };
  const clearDigit = (backward: boolean, start: number, end: number) => {
    const current = maskTime(value);
    const positions = [0, 1, 3, 4].filter(position => start !== end ? position >= start && position < end : backward ? position < start : position >= start);
    const index = backward ? positions.at(-1) : positions[0];
    if (index === undefined) return;
    const next = `${current.slice(0, index)}0${current.slice(index + 1)}`;
    moveSelection({ start: index, end: index });
    onChange(parseTime(next) === 0 ? '00:01' : next);
  };
  return <div className="duration-input"><input ref={input} autoFocus={autoFocus} required maxLength={5} inputMode="numeric" pattern="[0-9]{2}:[0-5][0-9]" aria-label={label} className="time-input" value={maskTime(value)} onChange={e=>onChange(maskTime(e.target.value))} onPaste={e=>{e.preventDefault();selection.current={start:5,end:5};onChange(maskTime(e.clipboardData.getData('text')));}} onSelect={selectPart} onClick={selectPart} onKeyUp={selectPart} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();step(e.key==='ArrowUp'?1:-1);return;}if(/^\d$/.test(e.key)){e.preventDefault();updateDigit(e.key,e.currentTarget.selectionStart??0);return;}if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();clearDigit(e.key==='Backspace',e.currentTarget.selectionStart??0,e.currentTarget.selectionEnd??0);return;}if(e.key.length===1)e.preventDefault();}} placeholder={t('MM:SS')} aria-invalid={!duration}/><div className="duration-arrows"><button type="button" aria-label={increase} title={increase} disabled={!duration||duration>=maximumDuration} onMouseDown={e=>e.preventDefault()} onClick={()=>step(1)}>▲</button><button type="button" aria-label={decrease} title={decrease} disabled={!duration||duration<=1000} onMouseDown={e=>e.preventDefault()} onClick={()=>step(-1)}>▼</button></div></div>;
}
