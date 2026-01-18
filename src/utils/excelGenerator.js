import * as XLSX from 'xlsx';

export function generateExcelFiles(items, globalSettings) {
    // 1. Acceptance Sheet (验收单)
    const acceptanceSheet = generateAcceptanceSheet(items, globalSettings);

    // 2. Stock In/Out Sheet (入库出库单)
    const stockSheet = generateStockSheet(items, globalSettings);

    // Trigger Download
    writeFile(acceptanceSheet, "附件1：大连理工大学科研材料验收单.xlsx");
    writeFile(stockSheet, "附件2：材料使用入库出库单.xlsx");
}

function writeFile(wb, filename) {
    XLSX.writeFile(wb, filename);
}

function generateAcceptanceSheet(items, { keeper }) {
    const wb = XLSX.utils.book_new();

    // Header Rows
    const headers = [
        ["大连理工大学科研材料验收单"],
        [null, null, null, null, null, null, null, "单位：元"],
        ["采购部门：", null, null, null, null, "财务账号："],
        ["序号", "材料名称", "规格型号", "单位", "单价", "数量", "金额", "保管人"]
    ];

    const dataRows = items.map((item, idx) => [
        idx + 1,
        `*${item.itemName}* (Detail: ${item.fileName})`, // Adjust format as needed
        item.model,
        item.unit,
        item.unitPrice,
        item.quantity,
        (item.unitPrice * item.quantity).toFixed(2),
        keeper || ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows]);

    // Merges
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title
        { s: { r: 1, c: 7 }, e: { r: 1, c: 7 } }, // Unit
        { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Dept
        { s: { r: 2, c: 5 }, e: { r: 2, c: 7 } }, // Account
    ];

    // Widths
    ws['!cols'] = [
        { wch: 5 }, { wch: 40 }, { wch: 15 }, { wch: 5 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 10 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "验收单");
    return wb;
}

function generateStockSheet(items, { keeper, signer }) {
    const wb = XLSX.utils.book_new();

    const headers = [
        ["材料使用入库出库单（样表）"],
        ["部门名称：", null, null, "财务账号：", null, null, null, null, null, null, null, "单位：元"],
        ["序号", "材料名称", "单价", "入库情况", null, null, "出库情况", null, null, null, "结余情况", null, "备注"],
        [null, null, null, "入库时间", "数量", "金额", "出库时间", "数量", "金额", "领用人签字", "数量", "金额", null]
    ];

    let rows = [];
    let merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // Title
        { s: { r: 2, c: 3 }, e: { r: 2, c: 5 } }, // In Header Group
        { s: { r: 2, c: 6 }, e: { r: 2, c: 9 } }, // Out Header Group
        { s: { r: 2, c: 10 }, e: { r: 2, c: 11 } }, // Balance Header Group
    ];

    let headerRowCount = 4; // Data starts at row index 4 (0-based)
    let currentRowIndex = headerRowCount;
    let seq = 1;

    items.forEach(item => {
        // Total Info
        const totalAmount = (item.unitPrice * item.quantity).toFixed(2);
        let currentBalance = item.quantity;

        // Start Row Index for this item (for merging)
        const itemStartRow = currentRowIndex;

        item.batches.forEach((batch, bIdx) => {
            const isFirst = bIdx === 0;

            // Calculate new balance
            currentBalance = currentBalance - batch.quantity;
            const balanceAmount = (currentBalance * item.unitPrice).toFixed(2);

            // Row Data
            // Col 0: Seq (Only on first?) -> Usually merge implies one value
            // Col 1: Name
            // Col 2: Price
            // Col 3: In Date
            // Col 4: In Qty
            // Col 5: In Amt

            rows.push([
                isFirst ? seq : null,
                isFirst ? item.itemName + (item.model ? ` ${item.model}` : "") : null, // Combine Name + Model
                isFirst ? item.unitPrice : null,
                isFirst ? item.invoiceDate : null,
                isFirst ? item.quantity : null,
                isFirst ? totalAmount : null,
                batch.outDate,
                batch.quantity,
                (item.unitPrice * batch.quantity).toFixed(2),
                signer || "",
                currentBalance < 0.001 ? 0 : currentBalance, // Avoid floating point epsilon
                balanceAmount,
                ""
            ]);

            currentRowIndex++;
        });

        // Add Merges for this item group if > 1 row
        const itemEndRow = currentRowIndex - 1;
        if (itemEndRow > itemStartRow) {
            // Merge Cols 0, 1, 2, 3, 4, 5
            [0, 1, 2, 3, 4, 5].forEach(col => {
                merges.push({ s: { r: itemStartRow, c: col }, e: { r: itemEndRow, c: col } });
            });
        }

        seq++;
    });

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    ws['!merges'] = merges;

    // Widths
    ws['!cols'] = [
        { wch: 5 }, { wch: 30 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "入库出库单");
    return wb;
}
