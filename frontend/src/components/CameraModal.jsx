import React, { useRef, useState } from "react";

const CameraModal = ({ isOpen, onCapture, onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      // Request camera access with proper constraints for both mobile and desktop
      const constraints = {
        video: {
          facingMode: 'environment', // Use rear camera on mobile, default on desktop
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.error('Camera access error:', err);
          setError("Cannot access camera. Please allow permission and ensure camera is available.");
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, "image/jpeg");
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full flex flex-col items-center">
        <h3 className="text-base font-bold text-gray-900 mb-3">Take Photo</h3>
        {error ? (
          <div className="text-red-500 mb-4 text-sm">{error}</div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="rounded-lg w-full max-h-56 bg-black mb-4 border border-gray-200" />
        )}
        <div className="flex gap-3 w-full mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-100"
          >Cancel</button>
          <button
            type="button"
            onClick={handleCapture}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-900"
            disabled={!!error}
          >Capture</button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
