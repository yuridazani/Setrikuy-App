import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrGKE2zxBjvBF7Wu_74IZljiC_lvJZhEI",
  authDomain: "setrikuy-app.firebaseapp.com",
  projectId: "setrikuy-app",
  storageBucket: "setrikuy-app.firebasestorage.app",
  messagingSenderId: "429860459035",
  appId: "1:429860459035:web:10fa7b636f81e83d02debe",
  measurementId: "G-GQMHRE61PF",
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Analytics (opsional, aman tetap dipakai)
const analytics = getAnalytics(app);

// Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// ===============================
// AKTIFKAN OFFLINE PERSISTENCE
// ===============================
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.log("Offline persistence gagal: multiple tab terbuka");
  } else if (err.code === "unimplemented") {
    console.log("Browser tidak mendukung offline persistence");
  }
});
