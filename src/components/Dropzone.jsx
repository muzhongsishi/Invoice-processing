import React, { useCallback } from 'react';
import { Upload, FileUp } from 'lucide-react';
import clsx from 'clsx';

export function Dropzone({ onDrop, isProcessing, t }) {
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isProcessing) return;

        const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (files.length > 0) {
            onDrop(files);
        }
    }, [onDrop, isProcessing]);

    const handleFileInput = (e) => {
        if (isProcessing) return;
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onDrop(files);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={clsx(
                "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer group",
                isProcessing
                    ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-50"
                    : "border-slate-300 hover:border-blue-500 hover:bg-blue-50"
            )}
        >
            <input
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                id="pdf-upload"
                onChange={handleFileInput}
                disabled={isProcessing}
            />
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-4">
                <div className={clsx(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                    isProcessing ? "bg-slate-200 text-slate-400" : "bg-blue-100 text-blue-600 group-hover:bg-blue-200"
                )}>
                    {isProcessing ? <Upload className="animate-bounce" /> : <FileUp size={32} />}
                </div>
                <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-700">
                        {isProcessing ? t('processingDrop') : t('dropText')}
                    </p>
                    {!isProcessing && (
                        <p className="text-sm text-slate-500">
                            {t('dropSub')}
                        </p>
                    )}
                </div>
            </label>
        </div>
    );
}
