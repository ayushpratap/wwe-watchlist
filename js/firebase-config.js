// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// =========================================================================
// 🔴 SETUP INSTRUCTIONS (FOR YOUR OWN HOSTING)
// 1. Go to console.firebase.google.com -> Create Project
// 2. Add Web App -> Copy the "firebaseConfig" object below
// 3. Enable "Firestore Database" in Test Mode
// 4. Enable "Authentication" -> "Email/Password" sign-in provider
// =========================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBgMuK8eejSC8ESCartZ--E5gSef0UZFUY",
  authDomain: "wwe-watchlist.firebaseapp.com",
  projectId: "wwe-watchlist",
  storageBucket: "wwe-watchlist.firebasestorage.app",
  messagingSenderId: "767396925990",
  appId: "1:767396925990:web:4b84ef34b4bdd97ec14ce7",
};

// Initialize Firebase
let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// Export for use in other modules
export {
  app,
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
};
