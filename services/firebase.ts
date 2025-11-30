import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_psJegYJFM7FNVDANt0o1BodMjn7zFAw",
  authDomain: "bk-test-7e3db.firebaseapp.com",
  projectId: "bk-test-7e3db",
  storageBucket: "bk-test-7e3db.firebasestorage.app",
  messagingSenderId: "720109531668",
  appId: "1:720109531668:web:72fba976956fccb84f6d01",
  measurementId: "G-WVVRDKRTH6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
