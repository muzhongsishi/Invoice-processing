import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { BatchConfigurator } from './BatchConfigurator';

export function InvoiceItemRow({ item, index, onUpdate, onDelete, t }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const totalOut = item.batches.reduce((sum, b) => sum + (parseFloat(b.quantity) || 0), 0);
    const isReady = Math.abs(totalOut - item.quantity) < 0.01 && item.itemName;

    const handleChange = (field, value) => {
        onUpdate({ ...item, [field]: value });
    };

    return (
        <div className={clsx(
            "border rounded-xl transition-all",
            isReady ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50/30"
        )}>
            <div className="p-4 grid grid-cols-12 gap-4 items-center">
                {/* Status Indicator */}
                <div className="col-span-1 flex justify-center">
                    {isReady ? <CheckCircle className="text-green-500" size={20} /> : <AlertCircle className="text-amber-500" size={20} />}
                </div>

                {/* Main Fields Input */}
                <div className="col-span-11 grid grid-cols-12 gap-4">
                    <div className="col-span-4">
                        <label className="text-xs text-slate-500 block mb-1">{t('itemName')}</label>
                        <input
                            type="text"
                            value={item.itemName}
                            onChange={e => handleChange('itemName', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="col-span-3">
                        <label className="text-xs text-slate-500 block mb-1">{t('model')}</label>
                        <input
                            type="text"
                            value={item.model}
                            onChange={e => handleChange('model', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs text-slate-500 block mb-1">{t('price')}</label>
                        <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => handleChange('unitPrice', parseFloat(e.target.value))}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs text-slate-500 block mb-1">{t('qty')}</label>
                        <input
                            type="number"
                            value={item.quantity}
                            onChange={e => handleChange('quantity', parseFloat(e.target.value))}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="col-span-1 flex items-end justify-center pb-1">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                        >
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 pl-16 grid grid-cols-12 gap-8 border-t border-slate-100 pt-4">
                    <div className="col-span-7">
                        <BatchConfigurator item={item} onUpdate={onUpdate} t={t} />
                    </div>
                    <div className="col-span-5 space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between items-center">
                                {t('originalFile')}
                                {item.file && (
                                    <button
                                        onClick={() => window.open(URL.createObjectURL(item.file), '_blank')}
                                        className="text-blue-600 hover:underline text-xs lowercase"
                                    >
                                        view pdf
                                    </button>
                                )}
                            </label>
                            <p className="text-sm text-slate-700 truncate" title={item.fileName}>{item.fileName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">{t('date')}</label>
                                <input
                                    type="date"
                                    value={item.invoiceDate}
                                    onChange={e => handleChange('invoiceDate', e.target.value)}
                                    className="w-full mt-1 px-3 py-1.5 text-sm border border-slate-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">{t('unit')}</label>
                                <input
                                    type="text"
                                    value={item.unit}
                                    onChange={e => handleChange('unit', e.target.value)}
                                    className="w-full mt-1 px-3 py-1.5 text-sm border border-slate-200 rounded-md"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => onDelete(item.id)}
                            className="text-red-500 text-xs hover:underline mt-2"
                        >
                            {t('remove')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
