// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
googleProvider.setCustomParameters({
  prompt: 'select_account' 
});

export {auth, googleProvider,db, signOut}
