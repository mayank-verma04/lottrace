import { BrowserMultiFormatReader } from '@zxing/library';
import { useEffect, useRef, useState } from 'react';
import { CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const Scanner = ({ onScan, onError }) => {
  const videoRef = useRef(null);
  const readerRef = useRef(new BrowserMultiFormatReader());
  const [permissionState, setPermissionState] = useState('prompt');
  const navigate = useNavigate();
  const lastScanRef = useRef({ code: null, time: 0 });

  useEffect(() => {
    const reader = readerRef.current;

    const startScanner = async () => {
      try {
        const devices = await reader.listVideoInputDevices();
        if (devices.length === 0) {
          setPermissionState('denied');
          return;
        }
        
        setPermissionState('granted');
        reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
          if (result) {
            const code = result.getText();
            const now = Date.now();
            if (code === lastScanRef.current.code && now - lastScanRef.current.time < 2000) return;
            lastScanRef.current = { code, time: now };
            onScan(code);
          }
          if (err && err.name !== 'NotFoundException') {
            if (onError) onError(err);
          }
        });
      } catch (err) {
        setPermissionState('denied');
      }
    };

    startScanner();

    return () => {
      reader.reset();
    };
  }, [onScan, onError]);

  if (permissionState === 'denied') {
    return (
      <div className="text-center space-y-4 p-6">
        <CameraOff className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="font-semibold">Camera access needed</h3>
        <p className="text-sm text-muted-foreground">
          To scan barcodes, allow camera access in your browser settings.
        </p>
        <Button className="w-full min-h-[44px]" onClick={() => navigate('/manual')}>
          Enter Code Manually
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover" />
      {/* Viewfinder overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-white/70 rounded-lg" />
      </div>
    </div>
  );
};
