
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZDpY3UxOBJsYGJ0DtVnoKuImQy5p9l2A",
  authDomain: "edbox-478209.firebaseapp.com",
  projectId: "edbox-478209",
  storageBucket: "edbox-478209.firebasestorage.app",
  messagingSenderId: "561726004930",
  appId: "1:561726004930:web:8f9a8a0ef884fcf9daa55b"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
