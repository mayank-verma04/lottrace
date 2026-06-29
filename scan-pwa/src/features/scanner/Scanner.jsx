import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useEffect, useRef, useState, useCallback } from 'react';
import { CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const Scanner = ({ onScan, onError }) => {
  const videoRef = useRef(null);
  const [permissionState, setPermissionState] = useState('prompt');
  const navigate = useNavigate();
  const lastScanRef = useRef({ code: null, time: 0 });

  // Keep stable refs to callbacks so the scanner never restarts on re-renders.
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    // Create the reader inside the effect so it's fully owned by this lifecycle.
    const reader = new BrowserMultiFormatReader();

    // ZXing internally calls console.warn for every NotFoundException (every frame
    // with no barcode). Patch it out for the lifetime of this scanner to prevent
    // DevTools memory bloat and eventual browser crash.
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const msg = args[0];
      if (
        typeof msg === 'string' &&
        (msg.includes('NotFoundException') || msg.includes('non-ReaderException'))
      ) {
        return; // swallow silently — this is normal "no barcode found" noise
      }
      originalWarn.apply(console, args);
    };

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
            // De-duplicate: ignore same code scanned within 2 s
            if (
              code === lastScanRef.current.code &&
              now - lastScanRef.current.time < 2000
            ) {
              return;
            }
            lastScanRef.current = { code, time: now };
            onScanRef.current?.(code);
          }

          // err is set on EVERY frame where no barcode is found — this is expected
          // ZXing behaviour, not a real error. Only forward genuinely unexpected errors.
          if (err && !(err instanceof NotFoundException)) {
            // Also guard against the string-based name in case the bundler mangles classes
            if (err.name !== 'NotFoundException' && err.constructor?.name !== 'NotFoundException') {
              onErrorRef.current?.(err);
            }
          }
        });
      } catch (err) {
        // Camera permission denied or not available
        setPermissionState('denied');
      }
    };

    startScanner();

    return () => {
      // Restore original console.warn before teardown
      console.warn = originalWarn;
      try {
        reader.reset();
      } catch (_) {
        // Ignore reset errors during unmount
      }
    };
  }, []); // Empty deps — scanner starts once and stays running for the component lifetime

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
