import React from 'react';
import { Download, Settings } from 'lucide-react';

export function ExportPanel({ onExport, settings, onSettingsChange, t }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky bottom-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Settings size={20} /> {t('exportSettings')}
                </h3>
                <button
                    onClick={onExport}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-200"
                >
                    <Download size={20} /> {t('exportBtn')}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                        {t('keeper')}
                    </label>
                    <input
                        type="text"
                        value={settings.keeper}
                        onChange={(e) => onSettingsChange('keeper', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder={t('keeperPlace')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                        {t('signer')}
                    </label>
                    <input
                        type="text"
                        value={settings.signer}
                        onChange={(e) => onSettingsChange('signer', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder={t('signerPlace')}
                    />
                </div>
            </div>
        </div>
    );
}
