import {Component, type ErrorInfo, type ReactNode, useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {AuthProvider} from './context/AuthContext.tsx';
import './index.css';
import './mvp.css';

type BootWindow=Window & {__clinicBoot?:{appReady:()=>void;fail:()=>void}};
const boot=()=>(window as BootWindow).__clinicBoot;
class StartupBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(_error:Error,_info:ErrorInfo){boot()?.fail();}
  render(){return this.state.failed?null:this.props.children;}
}
function Ready({children}:{children:ReactNode}){
  useLayoutEffect(()=>boot()?.appReady(),[]);
  return children;
}
async function start(){
  try {
    // Keep the legacy demo and its audio worker out of the connected pilot build.
    const Entry=import.meta.env.VITE_SECURE_PILOT==='true'
      ? (await import('./components/PilotApp.tsx')).PilotApp
      : (await import('./App.tsx')).default;
    createRoot(document.getElementById('root')!).render(<StartupBoundary><Ready><AuthProvider><Entry/></AuthProvider></Ready></StartupBoundary>);
  } catch {boot()?.fail();}
}
void start();
