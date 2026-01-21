import React, { useRef, useState, useEffect } from 'react';
import { Button } from './Button';
import { Camera as CameraIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraProps {
  onCapture: (base64Image: string) => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);

  // Function to stop stream safely
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Initialize camera
  useEffect(() => {
    if (!cameraActive) return;

    let mounted = true;

    const initCamera = async () => {
      setIsReady(false);
      setError('');
      
      try {
        stopStream(); // Stop any previous stream

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false 
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Important for mobile browsers
          videoRef.current.setAttribute('playsinline', 'true');
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (mounted) {
          setError('Erro ao acessar a câmera. Verifique permissões.');
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      stopStream();
    };
  }, [cameraActive]);

  const handleCanPlay = () => {
    if (videoRef.current) {
      setIsReady(true);
      // Ensure play is called explicitly
      videoRef.current.play().catch(console.warn);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && isReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Check for valid dimensions to avoid black screen
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Draw image
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const image = canvas.toDataURL('image/jpeg', 0.85);
        setPreview(image);
        onCapture(image);
        setCameraActive(false); // Stop camera processing to save battery
      }
    }
  };

  const retake = () => {
    setPreview(null);
    setCameraActive(true); // Restart camera
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center animate-fade-in">
        <div className="flex justify-center mb-2">
           <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-sm mb-3">{error}</p>
        <Button variant="secondary" onClick={() => setCameraActive(false)} className="mt-2" fullWidth>
           Cancelar
        </Button>
        <Button variant="primary" onClick={() => setCameraActive(true)} className="mt-2" fullWidth>
           Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden shadow-inner mb-4">
        {preview ? (
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
        ) : (
          <>
             {/* Loading State */}
             {!isReady && (
               <div className="absolute inset-0 flex items-center justify-center z-10">
                 <RefreshCw className="w-8 h-8 text-white/50 animate-spin" />
               </div>
             )}
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               muted
               onCanPlay={handleCanPlay}
               className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
             />
          </>
        )}
        
        {/* Overlay Guides */}
        {!preview && (
          <div className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none m-6">
             <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary-500 rounded-tl"></div>
             <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary-500 rounded-tr"></div>
             <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary-500 rounded-bl"></div>
             <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary-500 rounded-br"></div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full">
        {preview ? (
          <Button onClick={retake} variant="secondary" fullWidth>
            <RefreshCw className="w-4 h-4" />
            Tirar Outra Foto
          </Button>
        ) : (
          <Button 
            onClick={capturePhoto} 
            fullWidth 
            disabled={!isReady}
          >
            <CameraIcon className="w-4 h-4" />
            {isReady ? 'Capturar Foto' : 'Iniciando Câmera...'}
          </Button>
        )}
      </div>
    </div>
  );
};