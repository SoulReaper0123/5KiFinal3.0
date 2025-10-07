// This is a temporary file to show the corrected validation functions
// These should replace the existing functions in Registrations.jsx

// Simplified image loading that bypasses CORS issues completely
const loadImageForTensorFlow = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    console.log('Loading image for basic validation:', imageUrl);
    
    // Create a simple image element for basic validation
    const img = new Image();
    
    img.onload = () => {
      console.log('Image loaded successfully');
      console.log('Image dimensions:', img.naturalWidth || img.width, 'x', img.naturalHeight || img.height);
      
      // Return image element for basic validation
      // We'll do validation based on image properties rather than TensorFlow
      resolve(img);
    };
    
    img.onerror = (error) => {
      console.warn('Image loading failed:', error);
      reject(new Error('Failed to load image'));
    };
    
    // Load image without CORS to avoid tainted canvas issues
    img.src = imageUrl;
  });
};

// Updated manualVerifyID function with better validation
const manualVerifyID = async (imageUrl, label) => {
  setValidationStatus(prev => ({
    ...prev,
    [label]: { status: 'verifying', message: 'Analyzing ID document...' }
  }));

  try {
    // Load image for basic validation
    const loadedImg = await loadImageForTensorFlow(imageUrl);
    console.log('Image loaded for ID verification');
    
    const width = loadedImg.naturalWidth || loadedImg.width;
    const height = loadedImg.naturalHeight || loadedImg.height;
    console.log('Image dimensions:', width, 'x', height);

    // Basic validation checks without TensorFlow
    const imageQualityGood = width >= 300 && height >= 300;
    const aspectRatioReasonable = (width / height) >= 0.5 && (width / height) <= 2.0;
    const imageSizeReasonable = width * height >= 90000; // At least 300x300 pixels
    
    // For ID documents, we expect certain characteristics
    const isLandscape = width > height;
    const isPortrait = height > width;
    
    // ID documents are typically landscape or portrait, not square
    const hasReasonableShape = isLandscape || isPortrait;
    
    console.log('Basic validation results:', {
      width,
      height,
      imageQualityGood,
      aspectRatioReasonable,
      imageSizeReasonable,
      hasReasonableShape,
      isLandscape,
      isPortrait
    });

    // Calculate validation score based on basic image properties
    let validationScore = 0;
    let issues = [];
    
    if (imageQualityGood) {
      validationScore += 0.3;
    } else {
      issues.push('Low image resolution');
    }
    
    if (aspectRatioReasonable) {
      validationScore += 0.2;
    } else {
      issues.push('Unusual aspect ratio');
    }
    
    if (imageSizeReasonable) {
      validationScore += 0.2;
    } else {
      issues.push('Image too small');
    }
    
    if (hasReasonableShape) {
      validationScore += 0.3;
    } else {
      issues.push('Unusual document shape');
    }

    // Since we can't use TensorFlow due to CORS, we'll be more conservative
    // and require manual review for most cases
    if (validationScore >= 0.8 && issues.length === 0) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'partial', 
          message: 'Basic validation passed - Manual review recommended',
          details: `Image Quality: ${imageQualityGood ? 'Good' : 'Poor'} (${width}x${height})\n` +
                  `Aspect Ratio: ${aspectRatioReasonable ? 'Acceptable' : 'Unusual'}\n` +
                  `Document Shape: ${hasReasonableShape ? 'Reasonable' : 'Unusual'}\n` +
                  `Note: Advanced AI validation unavailable due to browser restrictions`
        }
      }));
    } else {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'manual', 
          message: 'Manual review required',
          details: `Image loaded successfully but requires manual verification.\n` +
                  `Issues detected: ${issues.length > 0 ? issues.join(', ') : 'None'}\n` +
                  `Image Quality: ${imageQualityGood ? 'Good' : 'Poor'} (${width}x${height})\n` +
                  `Please verify this is a valid ID document.`
        }
      }));
    }
  } catch (error) {
    console.error('ID verification failed:', error);
    setValidationStatus(prev => ({
      ...prev,
      [label]: { 
        status: 'error', 
        message: 'Image loading failed', 
        details: 'Unable to load image for verification. Please check the image and try again.'
      }
    }));
  }
};

// Updated manualVerifyFace function with better validation
const manualVerifyFace = async (imageUrl, label) => {
  setValidationStatus(prev => ({
    ...prev,
    [label]: { status: 'verifying', message: 'Analyzing selfie image...' }
  }));

  try {
    // Load image to verify it's accessible
    const loadedImg = await loadImageForTensorFlow(imageUrl);
    console.log('Image loaded for face verification');
    
    const width = loadedImg.naturalWidth || loadedImg.width;
    const height = loadedImg.naturalHeight || loadedImg.height;
    console.log('Image dimensions:', width, 'x', height);

    // Basic validation for selfie images
    const imageQualityGood = width >= 200 && height >= 200;
    const aspectRatioReasonable = (width / height) >= 0.5 && (width / height) <= 2.0;
    const imageSizeReasonable = width * height >= 40000; // At least 200x200 pixels
    
    // For selfies, we expect portrait or square-ish images
    const isPortrait = height >= width;
    const isSquareish = Math.abs(width - height) / Math.max(width, height) < 0.5;
    const hasReasonableShape = isPortrait || isSquareish;
    
    console.log('Basic selfie validation results:', {
      width,
      height,
      imageQualityGood,
      aspectRatioReasonable,
      imageSizeReasonable,
      hasReasonableShape,
      isPortrait,
      isSquareish
    });

    // Calculate validation score
    let validationScore = 0;
    let issues = [];
    
    if (imageQualityGood) {
      validationScore += 0.4;
    } else {
      issues.push('Low image resolution');
    }
    
    if (aspectRatioReasonable) {
      validationScore += 0.2;
    } else {
      issues.push('Unusual aspect ratio');
    }
    
    if (imageSizeReasonable) {
      validationScore += 0.2;
    } else {
      issues.push('Image too small');
    }
    
    if (hasReasonableShape) {
      validationScore += 0.2;
    } else {
      issues.push('Unusual selfie orientation');
    }

    // Be conservative with selfie validation
    if (validationScore >= 0.8 && issues.length === 0) {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'partial', 
          message: 'Basic validation passed - Manual review recommended',
          details: `Image Quality: ${imageQualityGood ? 'Good' : 'Poor'} (${width}x${height})\n` +
                  `Orientation: ${hasReasonableShape ? 'Appropriate for selfie' : 'Unusual'}\n` +
                  `Note: Face detection unavailable due to browser restrictions`
        }
      }));
    } else {
      setValidationStatus(prev => ({
        ...prev,
        [label]: { 
          status: 'manual', 
          message: 'Manual review required',
          details: `Image loaded successfully but requires manual verification.\n` +
                  `Issues detected: ${issues.length > 0 ? issues.join(', ') : 'None'}\n` +
                  `Image Quality: ${imageQualityGood ? 'Good' : 'Poor'} (${width}x${height})\n` +
                  `Please verify this shows a clear face.`
        }
      }));
    }
  } catch (error) {
    console.error('Face verification failed:', error);
    setValidationStatus(prev => ({
      ...prev,
      [label]: { 
        status: 'error', 
        message: 'Image loading failed', 
        details: 'Unable to load image for verification. Please check the image and try again.'
      }
    }));
  }
};

// Simplified verifyID function
const verifyID = async (imageUrl, label) => {
  // Always use manual verification due to CORS issues with TensorFlow
  console.log('Using manual ID verification due to CORS restrictions');
  return manualVerifyID(imageUrl, label);
};

// Simplified verifyFace function
const verifyFace = async (imageUrl, label) => {
  // Always use manual verification due to CORS issues with TensorFlow
  console.log('Using manual face verification due to CORS restrictions');
  return manualVerifyFace(imageUrl, label);
};