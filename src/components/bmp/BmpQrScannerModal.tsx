import React, { useState } from 'react';
import { QrCode, Scan, X, Copy, Check, Send, AlertCircle } from 'lucide-react';

interface BmpQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  userId: string;
  onScanPay: (recipient: string, amount: number, note: string) => void;
}

export const BmpQrScannerModal: React.FC<BmpQrScannerModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  userId,
  onScanPay
}) => {
  const [activeTab, setActiveTab] = useState<'myQr' | 'scan'>('myQr');
  const [requestAmount, setRequestAmount] = useState<number | ''>('');
  const [scannedCode, setScannedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const qrDataString = `BMP_PAY:${userId}:${requestAmount || 0}:${walletAddress}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParseQr = (code: string) => {
    setParseError(null);
    const trimmed = code.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('BMP_PAY:')) {
      const parts = trimmed.split(':');
      const recipient = parts[1] || '';
      const amount = parseFloat(parts[2]) || 0;
      if (recipient) {
        onScanPay(recipient, amount, 'QR Payment');
        onClose();
        return;
      }
    } else if (trimmed.startsWith('bmp1') || trimmed.includes('@')) {
      onScanPay(trimmed, 0, 'QR Transfer');
      onClose();
      return;
    }

    setParseError('Invalid BMP QR Payload format. Expected BMP_PAY or bmp1 address.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('myQr')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === 'myQr' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              My QR Code
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === 'scan' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Scan & Pay
            </button>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'myQr' ? (
            <div className="space-y-4 text-center">
              
              {/* QR Visualization Container */}
              <div className="p-4 bg-white rounded-2xl shadow-inner max-w-[200px] mx-auto border-4 border-amber-400/30">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrDataString)}`}
                  alt="BMP QR Code"
                  className="w-full h-auto rounded-lg"
                />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Your BMP Wallet Address</span>
                <div className="mt-1 flex items-center justify-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-xs font-mono text-amber-300 truncate max-w-[200px]">{walletAddress}</span>
                  <button onClick={handleCopy} className="p-1 text-slate-400 hover:text-white">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Optional Request Amount (BMP)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 text-center font-mono font-bold focus:outline-none"
                />
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              {parseError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              <div className="text-center p-6 bg-slate-950 border border-dashed border-slate-800 rounded-2xl">
                <Scan className="w-8 h-8 text-amber-400 animate-pulse mx-auto mb-2" />
                <p className="text-xs text-slate-400">Camera / Code Scanner</p>
                <p className="text-[10px] text-slate-500 mt-1">Paste or enter raw payload string below to simulate camera scan</p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="BMP_PAY:user123:50 or bmp1..."
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
                <button
                  onClick={() => handleParseQr(scannedCode)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Process Payment
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
