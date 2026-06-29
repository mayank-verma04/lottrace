import { useState } from 'react';
import { Scanner } from '@/features/scanner/Scanner';
import { CheckCircle } from 'lucide-react';
import { parseGS1 } from '@/utils/gs1Parser';

const SCAN_STATES = {
  IDLE:          'idle',
  SCANNING:      'scanning',
  LOOKING_UP:    'looking_up',
  LOT_FOUND:     'lot_found',
  NOT_FOUND:     'not_found',
  EVENT_FORM:    'event_form',
  SUCCESS:       'success',
  ERROR:         'error',
};

export default function ScanPage() {
  const [scanState, setScanState] = useState(SCAN_STATES.SCANNING);
  const [scannedCode, setScannedCode] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const showSuccessFeedback = () => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setScanState(SCAN_STATES.SCANNING);
    }, 1500);
  };

  const handleScan = (code) => {
    if (navigator.vibrate) navigator.vibrate(50);
    const parsed = parseGS1(code);
    const lotCode = parsed.lotCode || parsed.raw;
    
    setScannedCode(lotCode);
    setScanState(SCAN_STATES.LOOKING_UP);
    
    // Simulate lookup for now
    setTimeout(() => {
      // Mock result
      setScanState(SCAN_STATES.LOT_FOUND);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 p-4">
        {scanState === SCAN_STATES.SCANNING && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">Scan Barcode</h2>
            <Scanner onScan={handleScan} />
          </div>
        )}
        
        {scanState === SCAN_STATES.LOOKING_UP && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground animate-pulse">Looking up lot...</p>
          </div>
        )}

        {scanState === SCAN_STATES.LOT_FOUND && (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800">Lot Found</h3>
              <p className="font-mono text-lg mt-2">{scannedCode}</p>
            </div>
            <button 
              className="w-full bg-blue-600 text-white rounded-lg font-medium min-h-[44px]"
              onClick={showSuccessFeedback}
            >
              Record Event
            </button>
            <button 
              className="w-full bg-gray-100 text-gray-800 rounded-lg font-medium min-h-[44px]"
              onClick={() => setScanState(SCAN_STATES.SCANNING)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-green-500/20 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-green-500 text-white rounded-full p-6 animate-in zoom-in">
            <CheckCircle className="h-12 w-12" />
          </div>
        </div>
      )}
    </div>
  );
}
