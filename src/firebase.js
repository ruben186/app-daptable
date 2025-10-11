// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRSA1eSC5NUQWQSkPaHHHwTulSi8sZJqQ",
  authDomain: "projectandersonfvg.firebaseapp.com",
  projectId: "projectandersonfvg",
  storageBucket: "projectandersonfvg.firebasestorage.app",
  messagingSenderId: "640421341651",
  appId: "1:640421341651:web:24c5859d14d8801f166726"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account' 
});

const db = getFirestore(app);

export {auth, googleProvider, db, signOut}