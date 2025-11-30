import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import "firebase/compat/database";
import "firebase/compat/auth";

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

// Initialize Firebase v8 compat (for existing code) with SIMPLIFIED settings
let storage, database, auth;

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Initialize Firebase services with v8 compat
    storage = firebase.storage();
    database = firebase.database();
    auth = firebase.auth();
    
    // REMOVED the problematic setLogLevel call and other v8-specific settings
    // These settings are causing the error in v9 environment
    
    console.log('Firebase v8 compat initialized successfully');

} catch (error) {
    console.error('Error initializing Firebase v8 compat:', error);
    // Simple fallback without any additional configuration
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    storage = firebase.storage();
    database = firebase.database();
    auth = firebase.auth();
}

// Initialize Firebase v9 modular (for AI services)
let aiApp, vertexAI, aiModel;

try {
    // Create a separate app instance for AI services
    aiApp = initializeApp(firebaseConfig, 'ai-app');
    vertexAI = getVertexAI(aiApp);
    
    // Initialize Gemini 2.0 Flash model
    aiModel = getGenerativeModel(vertexAI, { 
        model: "gemini-2.0-flash-exp" 
    });
    
    console.log('Firebase AI initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase AI:', error);
    // Set to null so we can handle gracefully
    aiApp = null;
    vertexAI = null;
    aiModel = null;
}

// Enhanced upload function with better timeout handling
const uploadImageToFirebaseWithRetry = async (uri, folder, userId, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Upload attempt ${attempt} for ${folder}, user: ${userId}`);
            
            // Create a unique filename
            const timestamp = new Date().getTime();
            const uniqueFilename = `${userId}_${timestamp}_${Math.floor(Math.random() * 1000)}`;
            const fileExtension = uri.split('.').pop() || 'jpg';
            const filename = `${uniqueFilename}.${fileExtension}`;
            
            // Use user-specific folder path
            const imageRef = storage.ref(`users/${userId}/${folder}/${filename}`);
            
            console.log('Fetching image blob...');
            
            // Fetch with timeout
            const fetchPromise = fetch(uri);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Fetch timeout')), 15000)
            );
            
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            const blob = await response.blob();
            
            console.log('Uploading to Firebase Storage...');
            
            // Upload with timeout
            const uploadTask = imageRef.put(blob);
            
            const uploadPromise = new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    null,
                    (error) => reject(error),
                    () => resolve()
                );
            });
            
            const uploadTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Upload timeout')), 30000)
            );
            
            await Promise.race([uploadPromise, uploadTimeoutPromise]);
            
            console.log('Getting download URL...');
            
            // Get download URL with timeout
            const urlPromise = uploadTask.snapshot.ref.getDownloadURL();
            const urlTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('URL fetch timeout')), 15000)
            );
            
            const downloadURL = await Promise.race([urlPromise, urlTimeoutPromise]);
            
            console.log('Image upload successful');
            return downloadURL;
            
        } catch (error) {
            lastError = error;
            console.error(`Upload attempt ${attempt} failed:`, error);
            
            if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw new Error(`All upload attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
};

// Enhanced database write function
const writeToDatabaseWithRetry = async (refPath, data, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Database write attempt ${attempt} for path: ${refPath}`);
            
            const ref = database.ref(refPath);
            
            const writePromise = ref.set(data);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database write timeout')), 15000)
            );
            
            await Promise.race([writePromise, timeoutPromise]);
            
            console.log('Database write successful');
            return;
            
        } catch (error) {
            lastError = error;
            console.error(`Database write attempt ${attempt} failed:`, error);
            
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw new Error(`All database write attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
};

// Health check function
const checkFirebaseHealth = async () => {
    try {
        // Test database connection
        const testRef = database.ref('.info/connected');
        const testPromise = new Promise((resolve) => {
            const callback = testRef.on('value', (snapshot) => {
                if (snapshot.val() === true) {
                    testRef.off('value', callback);
                    resolve(true);
                }
            });
            
            // Timeout after 10 seconds
            setTimeout(() => {
                testRef.off('value', callback);
                resolve(false);
            }, 10000);
        });
        
        const dbConnected = await testPromise;
        
        // Test storage connection (simple operation)
        const storageRef = storage.ref('health-check.txt');
        await storageRef.putString('health-check', 'raw');
        await storageRef.delete();
        
        return {
            database: dbConnected,
            storage: true,
            auth: true,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Firebase health check failed:', error);
        return {
            database: false,
            storage: false,
            auth: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

export { 
    auth, 
    storage, 
    database, 
    aiApp, 
    vertexAI, 
    aiModel,
    uploadImageToFirebaseWithRetry,
    writeToDatabaseWithRetry,
    checkFirebaseHealth
};
