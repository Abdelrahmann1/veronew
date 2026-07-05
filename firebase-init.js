/* ============================================================
   GTR by Vero UK — Firebase Analytics
   Public web app config (safe to ship — not a secret; Firebase
   identifies apps this way, access is controlled via Security Rules).
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZvSPhw05rlRSrbQvVpXYMB1-ZxSQ3V68",
  authDomain: "vero-86809.firebaseapp.com",
  projectId: "vero-86809",
  storageBucket: "vero-86809.firebasestorage.app",
  messagingSenderId: "745753790012",
  appId: "1:745753790012:web:d86d247150e8de3b0a6539",
  measurementId: "G-QS0E7X0S5T"
};

const firebaseApp = initializeApp(firebaseConfig);
getAnalytics(firebaseApp);
