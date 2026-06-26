import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';

interface OCRResult {
  image_filename: string;
  raw_text: string;
  bill_type: string;
  currency: string | null;        // ISO code e.g. "USD", "INR"
  currency_symbol: string;        // Display symbol e.g. "$", "₹"
  amounts: { value: number; raw: string }[];
  units_consumed: { value: number; unit: string; raw: string }[];
  extracted_date: string | null;
  suggested_activity: {
    category: string;
    type: string;
    value: number;
    unit: string;
  };
}

export default function OCRAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [editedCategory, setEditedCategory] = useState('');
  const [editedType, setEditedType] = useState('');
  const [editedValue, setEditedValue] = useState<number | ''>('');
  const [editedUnit, setEditedUnit] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setOcrResult(null);
      setError(null);
      setSuccess(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    // Stage 7: Clear previous result to prevent stale cache showing
    setOcrResult(null);
    setSuccess(false);
    setEditedCategory('');
    setEditedType('');
    setEditedValue('');
    setEditedUnit('');

    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await apiClient.post<OCRResult>('/ocr/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Stage 5: Log the exact response from backend
      console.log('[OCR] Stage 5 - Raw backend response:', JSON.stringify(response.data, null, 2));
      console.log('[OCR] units_consumed:', response.data.units_consumed);
      console.log('[OCR] amounts:', response.data.amounts);
      console.log('[OCR] suggested_activity:', response.data.suggested_activity);
      console.log('[OCR] extracted_date:', response.data.extracted_date);

      setOcrResult(response.data);
      const s = response.data.suggested_activity;
      setEditedCategory(s.category);
      setEditedType(s.type);
      setEditedValue(s.value ?? '');
      setEditedUnit(s.unit);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze bill. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!ocrResult || editedValue === '') return;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.post('/ocr/save', {
        category: editedCategory,
        type: editedType,
        value: Number(editedValue),
        unit: editedUnit,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save activity.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setOcrResult(null);
    setSuccess(false);
    setError(null);
    setEditedCategory('');
    setEditedType('');
    setEditedValue('');
    setEditedUnit('');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Camera className="h-5 w-5 text-brand-400" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Smart Bill Analyzer</h2>
        </div>
        <p className="text-[var(--muted-foreground)] ml-13">
          Upload your utility bills or receipts — AI will extract the data and log an activity for you.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Success State */}
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center"
        >
          <div className="mx-auto w-20 h-20 bg-brand-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-brand-400" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Activity Logged!</h2>
          <p className="text-[var(--muted-foreground)] mb-8">
            Your bill has been processed and the activity added to your eco profile.
          </p>
          <Button onClick={resetAll} size="lg">Analyze Another Bill</Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Panel */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-4">Upload Document</h3>

            {!file ? (
              <div
                {...getRootProps()}
                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center cursor-pointer transition-colors min-h-[320px] ${
                  isDragActive
                    ? 'border-brand-500 bg-brand-500/5'
                    : 'border-slate-700 hover:border-brand-500/50 hover:bg-[var(--muted)]/30'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
                <p className="text-lg font-medium text-[var(--foreground)] mb-1">Drop your bill here</p>
                <p className="text-sm text-[var(--muted-foreground)]">or click to browse</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-4">PNG, JPG, WEBP · Max 10 MB</p>
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                <div className="relative bg-[var(--muted)] rounded-xl overflow-hidden min-h-[320px] flex items-center justify-center">
                  <img src={preview!} alt="Bill Preview" className="max-w-full max-h-[480px] object-contain" />
                  <button
                    onClick={(e) => { e.stopPropagation(); resetAll(); }}
                    className="absolute top-3 right-3 bg-[var(--card)]/80 hover:bg-slate-700 p-1.5 rounded-full transition-colors"
                  >
                    <XCircle className="h-5 w-5 text-[var(--muted-foreground)]" />
                  </button>
                </div>
                {!ocrResult && (
                  <div className="mt-4">
                    <Button onClick={handleAnalyze} disabled={isUploading} size="lg" className="w-full">
                      {isUploading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing…</>
                      ) : (
                        'Extract Data with AI'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col transition-opacity ${!ocrResult ? 'opacity-40 pointer-events-none' : ''}`}>
            <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-4">Extracted Data</h3>

            {!ocrResult ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[320px] text-center">
                <Loader2 className="h-8 w-8 text-slate-700 mb-3" />
                <p className="text-[var(--muted-foreground)] text-sm">Results will appear here after analysis</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Metadata badges */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[var(--muted)] p-3 rounded-xl">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Bill Type</p>
                    <p className="text-base font-semibold text-[var(--foreground)] capitalize">{ocrResult.bill_type}</p>
                  </div>
                  <div className="bg-[var(--muted)] p-3 rounded-xl">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Bill Date</p>
                    <p className="text-base font-semibold text-[var(--foreground)]">{ocrResult.extracted_date || 'Not found'}</p>
                  </div>
                </div>

                {/* Extracted fields from Gemini */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Units Consumed</p>
                    <p className="text-base font-bold text-emerald-400">
                      {ocrResult.units_consumed?.length > 0
                        ? `${ocrResult.units_consumed[0].value} ${ocrResult.units_consumed[0].unit}`
                        : 'Not found'}
                    </p>
                  </div>
                  <div className="bg-[var(--muted)] p-3 rounded-xl">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                      Amount Due {ocrResult.currency ? <span className="text-[var(--muted-foreground)] normal-case font-normal">({ocrResult.currency})</span> : null}
                    </p>
                    <p className="text-base font-semibold text-[var(--foreground)]">
                      {ocrResult.amounts?.length > 0
                        ? `${ocrResult.currency_symbol ?? '$'}${ocrResult.amounts[0].value.toLocaleString()}`
                        : 'Not found'}
                    </p>
                  </div>
                </div>

                {/* Editor */}
                <div className="border-t border-[var(--border)] pt-5 flex-1">
                  <p className="text-sm font-semibold text-[var(--foreground)] mb-4">Review & Edit Before Logging</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Category</label>
                        <select
                          value={editedCategory}
                          onChange={(e) => setEditedCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--muted)] border border-slate-700 rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-brand-500"
                        >
                          <option value="electricity">Electricity</option>
                          <option value="water">Water</option>
                          <option value="transportation">Transportation</option>
                          <option value="waste">Waste</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Type</label>
                        <input
                          type="text"
                          value={editedType}
                          onChange={(e) => setEditedType(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--muted)] border border-slate-700 rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Value</label>
                        <input
                          type="number"
                          value={editedValue}
                          onChange={(e) => setEditedValue(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[var(--muted)] border border-slate-700 rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Unit</label>
                        <input
                          type="text"
                          value={editedUnit}
                          onChange={(e) => setEditedUnit(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--muted)] border border-slate-700 rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-5 border-t border-[var(--border)] flex justify-end gap-3">
                  <Button variant="secondary" onClick={resetAll}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving || editedValue === ''}>
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Log Activity'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
