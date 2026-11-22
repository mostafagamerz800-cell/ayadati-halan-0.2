import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth,connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDocFromServer } from 'firebase/firestore';
import oldConfig from '../../firebase-applet-config.json';
import pilotConfig from '../../firebase-pilot-config.json';
const pilot=import.meta.env.VITE_SECURE_PILOT==='true';
const emulator=pilot && import.meta.env.VITE_PILOT_EMULATOR==='true' && ['localhost','127.0.0.1'].includes(location.hostname);
const appletConfig=emulator ? {...pilotConfig, projectId:'demo-ayadati-secure',apiKey:'demo-api-key',authDomain:'demo-ayadati-secure.firebaseapp.com'} : pilot?pilotConfig:oldConfig;

// Use live provisioned config from firebase-applet-config.json, with env overrides if provided
export const firebaseConfig = pilot ? {...appletConfig} : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes('Placeholder')
    ? import.meta.env.VITE_FIREBASE_API_KEY
    : appletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: pilot ? appletConfig.projectId : import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || '(default)',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
};

// Initialize Firebase app singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL for named enterprise database)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);
if(emulator){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8081);}

// Check if using placeholder key
export const isPlaceholderConfig = (): boolean => {
  return !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('Placeholder');
};

// Connection healthcheck test as specified in skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection notice: client is offline or waiting for permissions.');
    }
  }
}

if(!pilot) testConnection();

export default app;
