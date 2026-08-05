import { initializeApp } from "firebase/app";
import { getAuth, sendEmailVerification, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFna6SQGyzMD2c9Ho_9eaXVLbf3e0X39s",
  authDomain: "purepulse-fd912.firebaseapp.com",
  projectId: "purepulse-fd912",
  storageBucket: "purepulse-fd912.firebasestorage.app",
  messagingSenderId: "484097875003",
  appId: "1:484097875003:web:6186f1975f9f0edf04901e",
  measurementId: "G-JQP61JPRLX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export { sendEmailVerification };