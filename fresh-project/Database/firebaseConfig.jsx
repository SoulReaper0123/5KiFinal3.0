import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import "firebase/compat/database"; // Import the database module
import "firebase/compat/auth"; // Import the auth module

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCzINc7Pkozyowkhiocxr2UWvzabzDs0Lo",
    authDomain: "ki-82889.firebaseapp.com",
    projectId: "ki-82889",
    storageBucket: "ki-82889.appspot.com",
    messagingSenderId: "442370396512",
    appId: "1:442370396512:web:e6271c043fc3295ee44e05",
    measurementId: "G-FNCX3QBYWB"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase Storage and Realtime Database
const storage = firebase.storage(); // Use firebase.storage() for compat module
const database = firebase.database(); // Use firebase.database() for compat module
const auth = firebase.auth(); // Use firebase.auth() for email/password auth

export { auth, storage, database };
