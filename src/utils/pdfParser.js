// Set worker source
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

async function getPageTextItems(pdf, pageNo) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const items = content.items.map(item => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        w: item.width,
        h: item.height,
        hasEOL: item.hasEOL
    }));

    // Sort by Y (top to bottom), then X (left to right)
    items.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 5) {
            return b.y - a.y;
        }
        return a.x - b.x;
    });

    return items;
}

export async function parseInvoicePDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const items = await getPageTextItems(pdf, 1);

    // Reconstruct full text with smart spacing
    let fullText = "";
    let lastY = items[0]?.y || 0;
    let lastX = 0;
    let lastW = 0;

    items.forEach(item => {
        // Check for new line
        if (Math.abs(item.y - lastY) > 8) {
            fullText += "\n";
            lastX = 0;
            lastW = 0;
        } else {
            // Check for horizontal gap > small threshold to add space
            // standard char width is roughly 5-10 units? 
            // If gap > 2, add space.
            if (lastX > 0 && (item.x - (lastX + lastW)) > 2) {
                fullText += " ";
            }
        }
        fullText += item.str;
        lastY = item.y;
        lastX = item.x;
        lastW = item.w;
    });

    console.log("Parsed PDF Text (spaced):", fullText);

    const totalPrice = extractTotalAmount(fullText);
    const invoiceDate = extractDate(fullText) || new Date().toISOString().split('T')[0];
    const itemInfo = extractMainItem(fullText, items);

    const data = {
        id: crypto.randomUUID(),
        fileName: file.name,
        file: file, // Store file for preview
        itemName: itemInfo.name || "未识别商品",
        model: itemInfo.model || "",
        unit: itemInfo.unit || "个",
        quantity: itemInfo.quantity || 1,
        unitPrice: itemInfo.price || 0,
        totalPrice: totalPrice,
        invoiceDate: invoiceDate,
        keeper: "",
        signer: "",
        batches: []
    };

    data.batches.push({
        id: crypto.randomUUID(),
        outDate: data.invoiceDate,
        quantity: data.quantity
    });

    return data;
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
        const y = match[1];
        const m = match[2].padStart(2, '0');
        const d = match[3].padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return null;
}

function extractMainItem(text, items) {
    let name = "";
    let model = "";
    let unit = "";
    let quantity = 0;
    let price = 0;

    // 1. Find the Item Name Line (Starts with *)
    // Regex matches *Name*...
    const nameLineRegex = /(\*[\u4e00-\u9fa5\w]+\*[^\n\r]*)/;
    const nameMatch = text.match(nameLineRegex);

    if (nameMatch) {
        const rawLine = nameMatch[0]; // Full line

        // Split by spaces to find components
        // Typical line: *Category*Name Model Unit Qty Price ...
        // Note: Name might contain spaces? Usually not in strict Chinese invoices for *...* part.
        // But "Name Model" might be "Name space Model".

        // Step A: Extract strict name *...*
        const strictNameMatch = rawLine.match(/(\*[\u4e00-\u9fa5\w]+\*[^\s]*)/);
        if (strictNameMatch) {
            name = strictNameMatch[1];

            // Step B: Look at what comes AFTER the name in that line
            const remainingText = rawLine.substring(name.length).trim();

            if (remainingText) {
                // Identify numbers (Qt, Price)
                // Match numbers at the end
                // Regex to find trailing numbers: e.g. "Model Unit 10 100.00 ..."
                // Strategy: Tokenize by space
                const tokens = remainingText.split(/\s+/).filter(t => t.trim() !== '');

                const numbers = [];
                const textTokens = [];

                tokens.forEach(t => {
                    // Check if number (ignoring % or -)
                    if (/^-?\d+(\.\d+)?%?$/.test(t)) {
                        numbers.push(parseFloat(t));
                    } else {
                        textTokens.push(t);
                    }
                });

                // Logic for Qty/Price
                if (numbers.length >= 2) {
                    let found = false;
                    for (let i = 0; i < numbers.length - 1; i++) {
                        for (let j = i + 1; j < numbers.length; j++) {
                            const p = numbers[i] * numbers[j];
                            if (Math.abs(numbers.some(n => Math.abs(n - p) < 0.1))) found = true; // Simplified check

                            // Strict check of p existence in the numbers array is better
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
                } else if (numbers.length === 1) {
                    quantity = numbers[0];
                }


                // Logic for Model / Unit
                // textTokens contains non-number parts
                // Exclude known tax keywords
                const potentialModelUnitKeys = textTokens.filter(t => !/^\d+%$/.test(t) && t !== '免税');

                potentialModelUnitKeys.forEach(t => {
                    // Check if Unit
                    if (/^[个套台箱盒米kgCL把张支组]$/i.test(t)) {
                        unit = t;
                    } else {
                        // Assume Model
                        if (!model) model = t;
                        else model += " " + t;
                    }
                });
            }
        } else {
            name = rawLine; // Fallback
        }
    }

    return { name, model, unit, quantity, price };
}
