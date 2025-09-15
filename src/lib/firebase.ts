// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDywrDoJRo_Tulg--W-y8tEbOWPhwrOV84",
  authDomain: "studio-4633863899-17828.firebaseapp.com",
  projectId: "studio-4633863899-17828",
  storageBucket: "studio-4633863899-17828.firebasestorage.app",
  messagingSenderId: "31604006545",
  appId: "1:31604006545:web:77e096ba039d5e1a916930"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
