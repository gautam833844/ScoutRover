'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  QrCode, Camera, Upload, Download, Copy, Check, X, Image as ImageIcon,
  Palette, Type, AlertCircle, Scan
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Tabs, Breadcrumb, Select, Badge, EmptyState } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { QR_CONFIG } from '@/constants';

export default function QRCodePage() {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'QR Code' }]} />

      <div className="mb-6">
        <h1 className="page-title">QR Code</h1>
        <p className="page-subtitle">Generate and scan QR codes</p>
      </div>

      <Tabs
        items={[
          { key: 'generate', label: 'Generator', icon: <QrCode className="w-4 h-4" /> },
          { key: 'scan', label: 'Scanner', icon: <Scan className="w-4 h-4" /> },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === 'generate' ? <QRGenerator /> : <QRScanner />}
    </DashboardLayout>
  );
}

// ========== QR GENERATOR ==========
function QRGenerator() {
  const { success } = useToast();
  const [text, setText] = useState('https://atlas-slam.io');
  const [size, setSize] = useState<number>(QR_CONFIG.defaultSize);
  const [fgColor, setFgColor] = useState<string>(QR_CONFIG.defaultFgColor);
  const [bgColor, setBgColor] = useState<string>(QR_CONFIG.defaultBgColor);
  const [errorLevel, setErrorLevel] = useState<string>(QR_CONFIG.defaultErrorLevel);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const generateQR = useCallback(async () => {
    if (!text.trim() || !canvasRef.current) return;
    try {
      const QRCode = (await import('qrcode')).default;
      await QRCode.toCanvas(canvasRef.current, text, {
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel as 'L' | 'M' | 'Q' | 'H',
      });
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  }, [text, size, fgColor, bgColor, errorLevel]);

  useEffect(() => { generateQR(); }, [generateQR]);

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'atlas-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    success('Downloaded', 'QR code saved as PNG');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success('Copied', 'Text copied to clipboard');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Settings */}
      <div className="card p-6 space-y-5">
        <div>
          <Input
            label="QR Content"
            placeholder="Enter URL, text, or data..."
            value={text}
            onChange={e => setText(e.target.value)}
            rightIcon={
              <button onClick={copyToClipboard} className="text-surface-400 hover:text-brand-500">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Foreground</label>
            <div className="flex items-center gap-2">
              <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-surface-300 dark:border-surface-600 cursor-pointer" />
              <input type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className="input text-xs font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Background</label>
            <div className="flex items-center gap-2">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-surface-300 dark:border-surface-600 cursor-pointer" />
              <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="input text-xs font-mono" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Size"
            value={String(size)}
            onChange={e => setSize(Number(e.target.value))}
            options={[
              { value: '128', label: '128 × 128' },
              { value: '256', label: '256 × 256' },
              { value: '512', label: '512 × 512' },
              { value: '1024', label: '1024 × 1024' },
            ]}
          />
          <Select
            label="Error Correction"
            value={errorLevel}
            onChange={e => setErrorLevel(e.target.value as any)}
            options={[
              { value: 'L', label: 'Low (7%)' },
              { value: 'M', label: 'Medium (15%)' },
              { value: 'Q', label: 'Quartile (25%)' },
              { value: 'H', label: 'High (30%)' },
            ]}
          />
        </div>

        <Button variant="primary" onClick={downloadQR} icon={<Download className="w-4 h-4" />} className="w-full">
          Download QR Code
        </Button>
      </div>

      {/* Preview */}
      <div className="card p-6 flex flex-col items-center justify-center">
        <p className="text-sm font-medium text-surface-500 mb-4">Preview</p>
        <div className="bg-white rounded-2xl p-6 shadow-inner border border-surface-100 dark:border-surface-700">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>
        {text && (
          <p className="text-xs text-surface-400 mt-4 text-center max-w-xs truncate">{text}</p>
        )}
      </div>
    </div>
  );
}

// ========== QR SCANNER ==========
function QRScanner() {
  const { success, error: showError, info } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState('');
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload'>('camera');
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
      }
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setScanning(true);
      setResult('');

      await scanner.start(
        { facingMode: 'environment' },
        { fps: QR_CONFIG.scannerFps, qrbox: QR_CONFIG.scannerQrbox },
        (decodedText: string) => {
          setResult(decodedText);
          success('QR Code Found!', decodedText.slice(0, 50));
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {} // Ignore scan failures
      );
    } catch (err: any) {
      showError('Scanner Error', err?.message || 'Could not access camera');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      await scannerRef.current?.stop();
    } catch {}
    setScanning(false);
  };

  const scanFromFile = async (file: File) => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader-file');
      const decodedText = await scanner.scanFile(file, true);
      setResult(decodedText);
      success('QR Code Found!', decodedText.slice(0, 50));
    } catch {
      showError('Scan Failed', 'No QR code found in the image');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) scanFromFile(file);
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    success('Copied', 'Result copied to clipboard');
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Scanner */}
      <div className="card p-6">
        <div className="flex items-center gap-2 bg-surface-100 dark:bg-dark-elevated rounded-xl p-1 mb-5">
          <button
            onClick={() => { setScanMethod('camera'); stopScanner(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              scanMethod === 'camera' ? 'bg-white dark:bg-dark-card text-brand-600 shadow-sm' : 'text-surface-500'
            }`}
          >
            <Camera className="w-4 h-4" /> Camera
          </button>
          <button
            onClick={() => { setScanMethod('upload'); stopScanner(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              scanMethod === 'upload' ? 'bg-white dark:bg-dark-card text-brand-600 shadow-sm' : 'text-surface-500'
            }`}
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>

        {scanMethod === 'camera' ? (
          <div>
            <div id="qr-reader" className="rounded-xl overflow-hidden bg-surface-900 min-h-[300px] mb-4" />
            <Button
              variant={scanning ? 'danger' : 'primary'}
              onClick={scanning ? stopScanner : startScanner}
              icon={scanning ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              className="w-full"
            >
              {scanning ? 'Stop Scanner' : 'Start Camera Scanner'}
            </Button>
          </div>
        ) : (
          <div>
            <div id="qr-reader-file" className="hidden" />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-12 text-center cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 transition-colors"
            >
              <Upload className="w-10 h-10 text-surface-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Click to upload an image</p>
              <p className="text-xs text-surface-400 mt-1">PNG, JPG, or WebP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Result */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Scan Result</h3>
        {result ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">QR Code Detected</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 break-all font-mono">{result}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={copyResult} icon={<Copy className="w-4 h-4" />} className="flex-1">
                Copy
              </Button>
              {result.startsWith('http') && (
                <a href={result} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="primary" className="w-full">Open Link</Button>
                </a>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Scan className="w-12 h-12" />}
            title="No QR code scanned yet"
            description="Use the camera scanner or upload an image to scan a QR code"
          />
        )}
      </div>
    </div>
  );
}
