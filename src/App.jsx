import React, { useState } from 'react';
import { parseInvoicePDF } from './utils/pdfParser';
import { generateExcelFiles } from './utils/excelGenerator';
import { Dropzone } from './components/Dropzone';
import { InvoiceItemRow } from './components/InvoiceItemRow';
import { ExportPanel } from './components/ExportPanel';
import { FileText, Loader2, Globe } from 'lucide-react';

const translations = {
    zh: {
        title: "发票处理助手",
        subtitle: "上传 PDF 电子发票，自动提取信息并生成验收单与出库单。",
        processing: "正在解析发票...",
        dropText: "将 PDF 发票拖入此处",
        dropSub: "或点击选择文件",
        processingDrop: "正在处理...",
        reviewTitle: "核对明细",
        expandHint: "请展开条目配置分批出库信息。",
        exportSettings: "导出设置",
        exportBtn: "导出 Excel 文件",
        keeper: "保管人",
        signer: "领用人签字",
        keeperPlace: "例如：张三",
        signerPlace: "例如：李四",
        noItems: "没有可导出的条目！",
        errorParse: "解析失败",
        itemName: "材料名称",
        model: "规格型号",
        price: "单价",
        qty: "数量",
        unit: "单位",
        date: "开票日期",
        originalFile: "原始文件",
        remove: "移除条目",
        stockPlan: "出库计划",
        currentAlloc: "当前已分配",
        totalReq: "总需",
        addBatch: "添加批次",
        batch: "批次"
    },
    en: {
        title: "Invoice Processor",
        subtitle: "Upload PDF Invoices to auto-generate acceptance and stock-out forms.",
        processing: "Processing Invoices...",
        dropText: "Drop PDF Invoices Here",
        dropSub: "or click to browse files",
        processingDrop: "Processing...",
        reviewTitle: "Review Items",
        expandHint: "Please expand items to configure stock-out batches.",
        exportSettings: "Export Settings",
        exportBtn: "Export Excel Files",
        keeper: "Keeper Name",
        signer: "Signer Name",
        keeperPlace: "e.g. Zhang San",
        signerPlace: "e.g. Li Si",
        noItems: "No items to export!",
        errorParse: "Failed to parse",
        itemName: "Item Name",
        model: "Model",
        price: "Price",
        qty: "Qty",
        unit: "Unit",
        date: "Invoice Date",
        originalFile: "Original File",
        remove: "Remove Item",
        stockPlan: "Stock Out Plan",
        currentAlloc: "Current Alloc",
        totalReq: "Total Required",
        addBatch: "Add Batch",
        batch: "Batch"
    }
};

function App() {
    const [items, setItems] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [settings, setSettings] = useState({ keeper: '', signer: '' });
    const [lang, setLang] = useState('zh');

    const t = (key) => translations[lang][key] || key;

    const handleDrop = async (files) => {
        setIsProcessing(true);
        try {
            const newItems = [];
            for (const file of files) {
                try {
                    const data = await parseInvoicePDF(file);
                    newItems.push(data);
                } catch (error) {
                    console.error(`Failed to parse ${file.name}`, error);
                    alert(`${t('errorParse')} ${file.name}: ${error.message}`);
                }
            }
            setItems(prev => [...prev, ...newItems]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateItem = (updatedItem) => {
        setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    const handleDeleteItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleExport = () => {
        if (items.length === 0) {
            alert(t('noItems'));
            return;
        }
        generateExcelFiles(items, settings);
    };

    const handleSettingsChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const toggleLang = () => {
        setLang(prev => prev === 'zh' ? 'en' : 'zh');
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 pb-32">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex justify-between items-start">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <FileText className="text-blue-600" size={32} />
                            {t('title')}
                        </h1>
                        <p className="text-slate-500 text-lg">
                            {t('subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={toggleLang}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                    >
                        <Globe size={16} />
                        {lang === 'zh' ? 'English' : '中文'}
                    </button>
                </header>

                {/* Dropzone */}
                <Dropzone onDrop={handleDrop} isProcessing={isProcessing} t={t} />

                {/* Items List */}
                {items.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-800">
                                {t('reviewTitle')} ({items.length})
                            </h2>
                            <div className="text-sm text-slate-500">
                                {t('expandHint')}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <InvoiceItemRow
                                    key={item.id}
                                    index={idx}
                                    item={item}
                                    onUpdate={handleUpdateItem}
                                    onDelete={handleDeleteItem}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Export Panel */}
                {items.length > 0 && (
                    <ExportPanel
                        onExport={handleExport}
                        settings={settings}
                        onSettingsChange={handleSettingsChange}
                        t={t}
                    />
                )}

            </div>

            {/* Loading Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                        <p className="text-xl font-medium text-slate-700">{t('processing')}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
