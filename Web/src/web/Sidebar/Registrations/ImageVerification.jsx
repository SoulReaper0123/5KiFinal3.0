import * as tf from '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';
import { createWorker } from 'tesseract.js';

const ImageVerification = {
  // Initialize models
  async init() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    this.worker = await createWorker();
  },

  // Verify if image contains a real face
  async verifyFace(imageElement) {
    try {
      const detections = await faceapi.detectAllFaces(
        imageElement, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();
      
      return {
        isFace: detections.length > 0,
        faceCount: detections.length,
        landmarks: detections.length > 0 ? detections[0].landmarks : null
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return { isFace: false, error: error.message };
    }
  },

  // Verify if image contains a valid ID
  async verifyID(imageElement, idType = 'generic') {
    try {
      // First check if there's text (basic ID verification)
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      const { data: { text } } = await this.worker.recognize(imageElement);
      
      // Check for common ID patterns
      const hasIDText = text.length > 20; // Basic check - IDs usually have lots of text
      
      // Additional checks based on ID type could be added here
      
      return {
        isID: hasIDText,
        textFound: text,
        confidence: hasIDText ? 0.8 : 0.2 // Simple confidence score
      };
    } catch (error) {
      console.error('ID verification error:', error);
      return { isID: false, error: error.message };
    }
  },

  // Clean up
  async cleanup() {
    await this.worker.terminate();
  }
};

export default ImageVerification;