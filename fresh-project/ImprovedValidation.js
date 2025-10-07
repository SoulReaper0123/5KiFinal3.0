// Improved Validation System using Face-API.js + Tesseract.js
// This replaces the TensorFlow approach with better libraries

import * as faceapi from 'face-api.js';
import Tesseract from 'tesseract.js';

// Enhanced image loading with proper CORS handling
const loadImageWithCORS = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Set crossOrigin AFTER CORS is configured in Firebase
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('Image loaded with CORS support');
      resolve(img);
    };
    
    img.onerror = (error) => {
      console.warn('CORS image loading failed, trying without CORS');
      
      // Fallback: load without CORS
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => reject(error);
      fallbackImg.src = imageUrl;
    };
    
    img.src = imageUrl;
  });
};

// Face-API.js initialization (better than TensorFlow for faces)
const initializeFaceAPI = async () => {
  try {
    console.log('Loading Face-API.js models...');
    
    // Load models from CDN or local files
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    
    console.log('Face-API.js models loaded successfully');
    return true;
  } catch (error) {
    console.error('Face-API.js model loading failed:', error);
    return false;
  }
};

// Enhanced face verification using Face-API.js
const verifyFaceWithFaceAPI = async (imageUrl, label) => {
  setValidationStatus(prev => ({
    ...prev,
    [label]: { status: 'verifying', message: 'Analyzing face with Face-API.js...' }
  }));

  try {
    const img = await loadImageWithCORS(imageUrl);
    
    // Detect faces using Face-API.js
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log(`Face-API.js detected ${detections.length} faces`);

    if (detections.length === 1) {
      const detection = detections[0];
      const confidence = detection.detection.score;
      
      // Check face quality
      const landmarks = detection.landmarks;
      const faceQuality = analyzeFaceQuality(landmarks, img);
      
      if (confidence > 0.7 && faceQuality.isGood) {
        setValidationStatus(prev => ({
          ...prev,
          [label]: { 
            status: 'valid', 
            message: 'Face verification successful',
            details: `Confidence: ${(confidence * 100).toFixed(1)}%\n` +
                    `Quality Score: ${faceQuality.score.toFixed(1)}/10\n` +
                    `Face landmarks detected: ${landmarks.positions.length}`
          }
        }));
      } else {
        setValidationStatus(prev => ({
          ...prev,
          [label]: { 
            status: 'partial', 
            message: 'Face detected but quality issues',
            details: `Confidence: ${(confidence * 100).toFixed(1)}%\n` +
                    `Quality issues: ${faceQuality.issues.join(', ')}`
          }
        }));
      }
    } else if (detections.length === 0) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'invalid', 
          message: 'No face detected',
          details: 'Please ensure the selfie shows a clear, front-facing face.'
        }
      }));
    } else {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'invalid', 
          message: 'Multiple faces detected',
          details: `Found ${detections.length} faces. Selfie should contain only one face.`
        }
      }));
    }
  } catch (error) {
    console.error('Face-API.js verification failed:', error);
    
    if (error.message.includes('CORS') || error.message.includes('tainted')) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'manual', 
          message: 'CORS issue - Manual review required',
          details: 'Please configure Firebase Storage CORS or review manually.'
        }
      }));
    } else {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'error', 
          message: 'Face verification failed',
          details: error.message
        }
      }));
    }
  }
};

// ID verification using Tesseract.js for text extraction
const verifyIDWithTesseract = async (imageUrl, label) => {
  setValidationStatus(prev => ({
    ...prev,
    [label]: { status: 'verifying', message: 'Extracting text from ID...' }
  }));

  try {
    const img = await loadImageWithCORS(imageUrl);
    
    // Use Tesseract.js to extract text
    const { data: { text, confidence } } = await Tesseract.recognize(img, 'eng', {
      logger: m => console.log('Tesseract progress:', m)
    });

    console.log('Extracted text:', text);
    console.log('OCR confidence:', confidence);

    // Analyze extracted text for ID-like content
    const idAnalysis = analyzeIDText(text);
    
    if (idAnalysis.isValidID && confidence > 60) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'valid', 
          message: 'ID text extraction successful',
          details: `OCR Confidence: ${confidence.toFixed(1)}%\n` +
                  `Detected: ${idAnalysis.detectedFields.join(', ')}\n` +
                  `Text length: ${text.length} characters`
        }
      }));
    } else if (confidence > 30) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'partial', 
          message: 'Text detected but unclear',
          details: `OCR Confidence: ${confidence.toFixed(1)}%\n` +
                  `Issues: ${idAnalysis.issues.join(', ')}\n` +
                  `Manual review recommended`
        }
      }));
    } else {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'manual', 
          message: 'Low text confidence - Manual review required',
          details: `OCR Confidence: ${confidence.toFixed(1)}%\n` +
                  `Extracted text may be unreliable`
        }
      }));
    }
  } catch (error) {
    console.error('Tesseract verification failed:', error);
    setValidationStatus(prev => ({
      ...prev,
      [label]: { 
        status: 'error', 
        message: 'Text extraction failed',
        details: error.message
      }
    }));
  }
};

// Helper function to analyze face quality
const analyzeFaceQuality = (landmarks, img) => {
  const issues = [];
  let score = 10;

  // Check if face is too small
  const faceBox = landmarks.getBoundingBox();
  const faceArea = faceBox.width * faceBox.height;
  const imageArea = img.width * img.height;
  const faceRatio = faceArea / imageArea;

  if (faceRatio < 0.1) {
    issues.push('Face too small');
    score -= 2;
  }

  // Check face angle (basic check using eye positions)
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const eyeDistance = Math.abs(leftEye[0].y - rightEye[0].y);
  
  if (eyeDistance > 10) {
    issues.push('Face not front-facing');
    score -= 3;
  }

  // Check image quality
  if (img.width < 300 || img.height < 300) {
    issues.push('Low resolution');
    score -= 2;
  }

  return {
    score,
    isGood: score >= 7 && issues.length === 0,
    issues
  };
};

// Helper function to analyze ID text
const analyzeIDText = (text) => {
  const detectedFields = [];
  const issues = [];
  
  // Common ID patterns
  const patterns = {
    name: /[A-Z][a-z]+ [A-Z][a-z]+/,
    date: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,
    number: /\d{8,}/,
    address: /(street|st|avenue|ave|road|rd)/i
  };

  // Check for ID-like patterns
  Object.entries(patterns).forEach(([field, pattern]) => {
    if (pattern.test(text)) {
      detectedFields.push(field);
    }
  });

  // Validation logic
  const isValidID = detectedFields.length >= 2;
  
  if (detectedFields.length === 0) {
    issues.push('No recognizable ID fields');
  }
  
  if (text.length < 20) {
    issues.push('Very little text detected');
  }

  return {
    isValidID,
    detectedFields,
    issues
  };
};

export {
  initializeFaceAPI,
  verifyFaceWithFaceAPI,
  verifyIDWithTesseract,
  loadImageWithCORS
};