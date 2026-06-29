import { useState } from 'react';
import { Scanner } from '@/features/scanner/Scanner';
import { CheckCircle, ListPlus, Send } from 'lucide-react';
import { parseGS1 } from '@/utils/gs1Parser';
import { Button } from '@/components/ui/button';

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
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);

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
    
    if (isBulkMode) {
      if (!scannedItems.find(i => i.lotCode === lotCode)) {
        setScannedItems(prev => [...prev, { lotCode, parsed }]);
        if (navigator.vibrate) navigator.vibrate(100);
      }
      return;
    }

    setScannedCode(lotCode);
    setScanState(SCAN_STATES.LOOKING_UP);
    
    setTimeout(() => {
      // Mock logic: 20% chance of "unknown lot" to simulate NOT_FOUND
      if (Math.random() < 0.2) {
        setScanState(SCAN_STATES.NOT_FOUND);
      } else {
        setScanState(SCAN_STATES.LOT_FOUND);
      }
    }, 500);
  };

  const handleBulkSubmit = () => {
    if (scannedItems.length === 0) return;
    setScanState(SCAN_STATES.EVENT_FORM);
    // For now, simulate success
    showSuccessFeedback();
    setScannedItems([]);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 p-4 flex flex-col">
        {scanState === SCAN_STATES.SCANNING && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Scan Barcode</h2>
              <button 
                className={`text-sm px-3 py-1 rounded-full border ${isBulkMode ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setIsBulkMode(!isBulkMode)}
              >
                {isBulkMode ? 'Bulk Mode: ON' : 'Bulk Mode: OFF'}
              </button>
            </div>
            
            <Scanner onScan={handleScan} />

            {isBulkMode && (
              <div className="flex-1 flex flex-col space-y-4 mt-4">
                <div className="flex-1 border rounded-lg p-3 bg-gray-50 overflow-y-auto max-h-48">
                  <h3 className="text-sm font-medium mb-2 text-gray-500">Scanned ({scannedItems.length})</h3>
                  {scannedItems.length === 0 ? (
                    <p className="text-sm text-gray-400">Scan items to add to list</p>
                  ) : (
                    <ul className="space-y-2">
                      {scannedItems.map((item, i) => (
                        <li key={i} className="text-sm p-2 bg-white rounded border shadow-sm flex items-center justify-between">
                          <span className="font-mono">{item.lotCode}</span>
                          <button onClick={() => setScannedItems(items => items.filter((_, idx) => idx !== i))} className="text-red-500 text-xs">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button onClick={handleBulkSubmit} className="w-full min-h-[44px]" disabled={scannedItems.length === 0}>
                  <Send className="w-4 h-4 mr-2" /> Receive {scannedItems.length} Items
                </Button>
              </div>
            )}
          </div>
        )}
        
        {scanState === SCAN_STATES.LOOKING_UP && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground animate-pulse">Looking up lot...</p>
          </div>
        )}

        {scanState === SCAN_STATES.NOT_FOUND && (
          <div className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-amber-800">Unknown Lot Code</h3>
              <p className="font-mono text-lg mt-2">{scannedCode}</p>
              <p className="text-sm text-amber-700 mt-2">This lot does not exist in your system.</p>
            </div>
            <Button 
              className="w-full min-h-[44px]"
              onClick={() => setScanState(SCAN_STATES.EVENT_FORM)}
            >
              <ListPlus className="w-4 h-4 mr-2" /> Create New Lot
            </Button>
            <Button 
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={() => setScanState(SCAN_STATES.SCANNING)}
            >
              Cancel
            </Button>
          </div>
        )}

        {scanState === SCAN_STATES.LOT_FOUND && (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800">Lot Found</h3>
              <p className="font-mono text-lg mt-2">{scannedCode}</p>
            </div>
            <Button 
              className="w-full min-h-[44px]"
              onClick={showSuccessFeedback}
            >
              Record Event
            </Button>
            <Button 
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={() => setScanState(SCAN_STATES.SCANNING)}
            >
              Cancel
            </Button>
          </div>
        )}

        {scanState === SCAN_STATES.EVENT_FORM && (
          <div className="space-y-6 mt-4">
             <h3 className="font-semibold text-lg">Record Event</h3>
             <p className="text-sm text-muted-foreground">Flow for creating event goes here.</p>
             <Button onClick={showSuccessFeedback} className="w-full min-h-[44px]">Save Event</Button>
             <Button variant="outline" onClick={() => setScanState(SCAN_STATES.SCANNING)} className="w-full min-h-[44px]">Cancel</Button>
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
