import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrGKE2zxBjvBF7Wu_74IZljiC_lvJZhEI",
  authDomain: "setrikuy-app.firebaseapp.com",
  projectId: "setrikuy-app",
  storageBucket: "setrikuy-app.firebasestorage.app",
  messagingSenderId: "429860459035",
  appId: "1:429860459035:web:10fa7b636f81e83d02debe",
  measurementId: "G-GQMHRE61PF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app); // Database
export const auth = getAuth(app);    // Login System