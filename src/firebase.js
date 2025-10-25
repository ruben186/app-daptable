// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPZhOMWyNX13gjtj-Hxim8XzsIwaScg64",
  authDomain: "app-daptable.firebaseapp.com",
  projectId: "app-daptable",
  storageBucket: "app-daptable.firebasestorage.app",
  messagingSenderId: "706407694133",
  appId: "1:706407694133:web:90dcbd4bb792501104d67c",
  measurementId: "G-GP9LF6KTT5"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account' 
});

export {auth, googleProvider,analytics, signOut}
