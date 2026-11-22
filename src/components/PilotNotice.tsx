import {useEffect,useState} from 'react';
import {PILOT,pilotError,pilotSubscribe} from '../lib/pilotBackend';
export function PilotNotice(){const [error,setError]=useState('');useEffect(()=>pilotSubscribe(()=>setError(pilotError())),[]);if(!PILOT)return null;return <aside dir="rtl" className="p-3 text-sm border-b border-amber-300 bg-amber-50 text-amber-950" role={error?'alert':'status'}>تجربة ربط Firebase لعيادة واحدة. بيانات وهمية فقط، من غير تقارير أو ملاحظات طبية. {error&&<strong>{error}</strong>}</aside>;}
