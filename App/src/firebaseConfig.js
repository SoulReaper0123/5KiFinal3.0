import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import "firebase/compat/database"; // Import the database module
import "firebase/compat/auth"; // Import the auth module

// For Firebase AI (Vertex AI) - using v9 modular
import { initializeApp } from 'firebase/app';
import { getVertexAI, getGenerativeModel } from 'firebase/vertexai-preview';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCzINc7Pkozyowkhiocxr2UWvzabzDs0Lo",
    authDomain: "ki-82889.firebaseapp.com",
    projectId: "ki-82889",
    storageBucket: "ki-82889.appspot.com",
    messagingSenderId: "442370396512",
    appId: "1:442370396512:web:e6271c043fc3295ee44e05",
    measurementId: "G-FNCX3QBYWB"
};

// Initialize Firebase v8 compat (for existing code)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase Storage and Realtime Database (v8 compat)
const storage = firebase.storage();
const database = firebase.database();
const auth = firebase.auth();

// Initialize Firebase v9 modular (for AI services)
let app, vertexAI, aiModel;

try {
    // Create a separate app instance for AI services
    app = initializeApp(firebaseConfig, 'ai-app');
    vertexAI = getVertexAI(app);
    
    // Initialize Gemini 2.0 Flash model
    aiModel = getGenerativeModel(vertexAI, { 
        model: "gemini-2.0-flash-exp" 
    });
    
    console.log('Firebase AI initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase AI:', error);
    // Set to null so we can handle gracefully
    app = null;
    vertexAI = null;
    aiModel = null;
}

export { auth, storage, database, app, vertexAI, aiModel };
