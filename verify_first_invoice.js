import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist';

async function getPageTextItems(pdf, pageNo) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const items = content.items.map(item => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        w: item.width,
        h: item.height
    }));

    items.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 5) {
            return b.y - a.y;
        }
        return a.x - b.x;
    });

    return items;
}

async function parseInvoicePDF(filePath) {
    const dataBuffer = new Uint8Array(fs.readFileSync(filePath));
    // In Node.js, we don't strictly need to set workerSrc if we accept main thread parsing or if the lib handles it.
    // For v4, it might warn but work.
    const pdf = await pdfjsLib.getDocument(dataBuffer).promise;
    const items = await getPageTextItems(pdf, 1);

    let fullText = "";
    let lastY = items[0]?.y || 0;

    items.forEach(item => {
        if (Math.abs(item.y - lastY) > 8) {
            fullText += "\n";
        }
        fullText += item.str;
        lastY = item.y;
    });

    console.log("--- RAW EXTRACTED TEXT START ---");
    console.log(fullText);
    console.log("--- RAW EXTRACTED TEXT END ---\n");

    const totalPrice = extractTotalAmount(fullText);
    const invoiceDate = extractDate(fullText) || "Unknown";
    const itemInfo = extractMainItem(fullText, items);

    return {
        fileName: path.basename(filePath),
        itemName: itemInfo.name,
        model: itemInfo.model,
        unit: itemInfo.unit,
        quantity: itemInfo.quantity,
        unitPrice: itemInfo.price,
        totalPrice: totalPrice,
        invoiceDate: invoiceDate
    };
}

function extractTotalAmount(text) {
    const combinedRegex = /(?:价税合计|小写).*?[¥￥]?\s*(\d+\.?\d*)/;
    const match = text.match(combinedRegex);
    if (match) return parseFloat(match[1]);
    return 0;
}

function extractDate(text) {
    const match = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (match) {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }
    return null;
}

function extractMainItem(text, items) {
    let name = "";
    let model = "";
    let unit = "";
    let quantity = 0;
    let price = 0;

    const nameLineRegex = /(\*[\u4e00-\u9fa5\w]+\*[^\n\r]*)/;
    const nameMatch = text.match(nameLineRegex);

    if (nameMatch) {
        const rawName = nameMatch[1];
        const searchStr = rawName.substring(0, Math.min(rawName.length, 6));

        // In node, searching strict strings might vary with encoding but usually fine.
        const nameItemIndex = items.findIndex(it => it.str.includes(searchStr));

        if (nameItemIndex !== -1) {
            const anchorY = items[nameItemIndex].y;

            const rowItems = items.filter(it => Math.abs(it.y - anchorY) < 12);
            rowItems.sort((a, b) => a.x - b.x);

            const numbers = rowItems
                .map(it => it.str.trim())
                .filter(str => /^-?\d+(\.\d+)?$/.test(str))
                .map(parseFloat);

            if (numbers.length >= 2) {
                let found = false;
                for (let i = 0; i < numbers.length - 1; i++) {
                    for (let j = i + 1; j < numbers.length; j++) {
                        const p = numbers[i] * numbers[j];
                        if (numbers.some(n => Math.abs(n - p) < 0.05)) {
                            quantity = numbers[i];
                            price = numbers[j];
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }

                if (!found) {
                    quantity = numbers[0];
                    price = numbers[1];
                }
            }

            name = rawName;

            const unitCandidates = rowItems.filter(it =>
                !name.includes(it.str) &&
                !/^\d/.test(it.str) &&
                /^[个套台箱盒米kgCL把张支组]$/i.test(it.str.trim())
            );
            if (unitCandidates.length > 0) unit = unitCandidates[0].str;
        } else {
            name = nameMatch[0];
        }
    }

    if (name && /\d+\.\d+$/.test(name)) {
        name = name.replace(/\s*\d+\.\d+$/, '');
    }

    return { name, model, unit, quantity, price };
}

(async () => {
    const filePath = 'fapiao_shili/2025-12-12-38.84-ergo9153解胶剂丙酮清洗剂.pdf';
    try {
        console.log(`Processing ${filePath}...`);
        const result = await parseInvoicePDF(filePath);
        console.log("\n--- STRUCTURED OUTPUT ---");
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
