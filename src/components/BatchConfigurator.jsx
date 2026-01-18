import React, { useMemo } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';

export function BatchConfigurator({ item, onUpdate, t }) {
    const totalOut = item.batches.reduce((sum, b) => sum + (parseFloat(b.quantity) || 0), 0);
    const isValid = Math.abs(totalOut - item.quantity) < 0.01;

    const addBatch = () => {
        const remaining = Math.max(0, item.quantity - totalOut);
        const newBatch = {
            id: crypto.randomUUID(),
            outDate: item.invoiceDate,
            quantity: remaining > 0 ? remaining : 0
        };
        onUpdate({ ...item, batches: [...item.batches, newBatch] });
    };

    const updateBatch = (id, field, value) => {
        const newBatches = item.batches.map(b =>
            b.id === id ? { ...b, [field]: value } : b
        );
        onUpdate({ ...item, batches: newBatches });
    };

    const removeBatch = (id) => {
        if (item.batches.length <= 1) return; // Prevent removing last one
        const newBatches = item.batches.filter(b => b.id !== id);
        onUpdate({ ...item, batches: newBatches });
    };

    return (
        <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                <span>{t('stockPlan')} ({t('totalReq')}: {item.quantity})</span>
                <span className={isValid ? "text-green-600" : "text-red-500"}>
                    {t('currentAlloc')}: {totalOut}
                </span>
            </div>

            <div className="space-y-2">
                {item.batches.map((batch, idx) => (
                    <div key={batch.id} className="flex gap-2 items-center">
                        <div className="w-8 text-xs text-slate-400 font-mono">#{idx + 1}</div>

                        <div className="flex-1 relative">
                            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="date"
                                value={batch.outDate}
                                onChange={(e) => updateBatch(batch.id, 'outDate', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="w-24">
                            <input
                                type="number"
                                value={batch.quantity}
                                min="0"
                                step="0.01"
                                onChange={(e) => updateBatch(batch.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder={t('qty')}
                            />
                        </div>

                        <button
                            onClick={() => removeBatch(batch.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            disabled={item.batches.length <= 1}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={addBatch}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
            >
                <Plus size={16} /> {t('addBatch')}
            </button>
        </div>
    );
}
