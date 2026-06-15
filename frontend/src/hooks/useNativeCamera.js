// frontend/src/hooks/useNativeCamera.js
//
// Smart camera hook for StrayCare:
// • On Android (Capacitor):  uses @capacitor/camera — opens native camera or gallery picker
// • On Web (browser):        falls back to a hidden <input type="file"> trigger
//
// Returns: { capturePhoto, photoPreview, photoFile, clearPhoto, isNative }
//
import { useState, useRef, useCallback } from 'react';

/**
 * Detects whether the app is running inside Capacitor (i.e., the Android APK).
 * window.Capacitor is injected by the Capacitor bridge when running natively.
 */
function isCapacitorNative() {
  return (
    typeof window !== 'undefined' &&
    window.Capacitor &&
    window.Capacitor.isNativePlatform &&
    window.Capacitor.isNativePlatform()
  );
}

/**
 * Converts a base64 data-URI string to a File object.
 * Required because Capacitor Camera returns base64, but our upload code expects a File.
 */
function base64ToFile(base64String, filename = 'photo.jpg') {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

export function useNativeCamera() {
  const [photoPreview, setPhotoPreview] = useState(null); // data-URI for <img> preview
  const [photoFile, setPhotoFile]       = useState(null); // File object for FormData upload
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState('');
  const fileInputRef                    = useRef(null);   // fallback web file input

  const isNative = isCapacitorNative();

  /**
   * Main entry point. Call this when the user taps the camera button.
   * On Android: opens native Camera.getPhoto() prompt (Camera or Gallery).
   * On Web: programmatically clicks a hidden file input.
   */
  const capturePhoto = useCallback(async () => {
    setError('');
    setIsLoading(true);

    if (isNative) {
      // ── Android / Native path ──────────────────────────────────────────────
      try {
        const { Camera, CameraSource, CameraResultType } = await import('@capacitor/camera');

        const image = await Camera.getPhoto({
          quality:          90,
          allowEditing:     false,
          resultType:       CameraResultType.DataUrl,  // returns base64 data-URI
          source:           CameraSource.Prompt,       // shows "Camera" or "Photos" choice
          width:            1280,
          height:           1280,
          correctOrientation: true,
          saveToGallery:    false,
          promptLabelHeader: 'Report a Stray Animal',
          promptLabelPhoto:  'Choose from Gallery',
          promptLabelPicture:'Take a Photo',
          promptLabelCancel: 'Cancel',
        });

        if (image.dataUrl) {
          setPhotoPreview(image.dataUrl);
          const file = base64ToFile(image.dataUrl, `stray_${Date.now()}.jpg`);
          setPhotoFile(file);
        }
      } catch (err) {
        if (!err.message?.includes('cancelled') && !err.message?.includes('User cancelled')) {
          setError('Camera access failed. Please check permissions in Settings.');
          console.error('Camera error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // ── Web / Browser fallback: trigger the hidden file input ──────────────
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.click();
    }
  }, [isNative]);

  /**
   * Called by the hidden file input's onChange handler (web only).
   */
  const handleWebFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
    // Reset input so selecting the same file again triggers onChange
    e.target.value = '';
  }, []);

  /**
   * Clears the current photo selection.
   */
  const clearPhoto = useCallback(() => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setError('');
  }, []);

  return {
    capturePhoto,       // call this on button click
    handleWebFileChange,// attach to hidden <input onChange>
    fileInputRef,       // attach to hidden <input ref>
    photoPreview,       // string: data-URI for <img src>
    photoFile,          // File: ready for FormData
    clearPhoto,         // reset
    isNative,           // boolean: true when on Android
    isLoading,          // boolean: waiting for camera
    error,              // string: error message
  };
}
