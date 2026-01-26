// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Add your own Firebase configuration from your Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyA5RLsyDxeRAsyHJHhFQq2iDIfpcYgSgw0",
  authDomain: "reefstruct.firebaseapp.com",
  projectId: "reefstruct",
  storageBucket: "reefstruct.firebasestorage.app",
  messagingSenderId: "414172901451",
  appId: "1:414172901451:web:8daf29e6c528bdc2d19dce",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
