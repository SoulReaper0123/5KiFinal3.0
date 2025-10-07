# CORS Issue Fix Instructions

## Problem
The TensorFlow.js validation is failing due to CORS restrictions, causing:
- Console errors about "Tainted canvases"
- Incorrect validation results (anime images being marked as valid IDs)
- Real faces being marked as invalid

## Quick Fix Solution

### Step 1: Disable TensorFlow Validation
Replace the following functions in `Registrations.jsx`:

#### Replace `verifyID` function (around line 812):
```javascript
const verifyID = async (imageUrl, label) => {
  // Always use manual verification due to CORS issues with TensorFlow
  console.log('Using manual ID verification due to CORS restrictions');
  return manualVerifyID(imageUrl, label);
};
```

#### Replace `verifyFace` function (around line 890):
```javascript
const verifyFace = async (imageUrl, label) => {
  // Always use manual verification due to CORS issues with TensorFlow
  console.log('Using manual face verification due to CORS restrictions');
  return manualVerifyFace(imageUrl, label);
};
```

### Step 2: Update Manual Verification Functions

#### Update `manualVerifyID` function to include better validation:
```javascript
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

    // Always require manual review for safety
    setValidationStatus(prev => ({
      ...prev,
      [label]: { 
        status: 'manual', 
        message: 'Manual review required',
        details: `Image loaded successfully (${width}x${height}).\n` +
                `Quality: ${imageQualityGood ? 'Good' : 'Poor'}\n` +
                `Shape: ${hasReasonableShape ? 'Reasonable' : 'Unusual'}\n` +
                `Please verify this is a valid ID document.`
      }
    }));
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
```

#### Update `manualVerifyFace` function:
```javascript
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
    
    // Always require manual review for safety
    setValidationStatus(prev => ({
      ...prev,
      [label]: { 
        status: 'manual', 
        message: 'Manual review required',
        details: `Image loaded successfully (${width}x${height}).\n` +
                `Quality: ${imageQualityGood ? 'Good' : 'Poor'}\n` +
                `Please verify this shows a clear face.`
      }
    }));
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
```

## Result After Fix

✅ **No more CORS errors in console**
✅ **No more incorrect "valid" status for anime images**
✅ **All images will show "Manual review required"**
✅ **Images still load and display properly**
✅ **Admin can manually approve/reject based on visual inspection**

## Why This Works

1. **Removes TensorFlow Processing**: Eliminates CORS issues entirely
2. **Basic Image Validation**: Still checks image dimensions and quality
3. **Manual Review**: Ensures human verification for all registrations
4. **Safe Approach**: Prevents false positives (anime marked as valid ID)
5. **Maintains Functionality**: All other features work normally

## Implementation

1. Open `Registrations.jsx`
2. Find the functions mentioned above
3. Replace them with the simplified versions
4. Save the file
5. Test the registration verification

The system will now work reliably without CORS issues and require proper manual review for all registrations.