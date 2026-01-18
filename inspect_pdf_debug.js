const fs = require('fs');
const pdfToken = require('pdf-parse');
const path = require('path');

const pdfSamples = [
    'fapiao_shili/2025-12-12-38.84-ergo9153解胶剂丙酮清洗剂.pdf',
    'fapiao_shili/2025-12-16-104.5-霍尼韦尔（Honeywell）KN95口罩工业防尘粉尘防灰口罩防雾霾pm2.5花粉飞沫甲流感 H910Plus耳戴50只_盒环保装.pdf'
];

async function analyzePDF(filePath) {
    const fullPath = path.join(__dirname, filePath);
    console.log(`\n--- Analyzing PDF: ${path.basename(filePath)} ---`);
    if (!fs.existsSync(fullPath)) {
        console.log("File not found!");
        return;
    }
    const dataBuffer = fs.readFileSync(fullPath);
    try {
        // Adjust for potential import differences
        const parseFunc = typeof pdfToken === 'function' ? pdfToken : pdfToken.default;

        if (typeof parseFunc !== 'function') {
            console.log("PDF Library import debug:", pdfToken);
            return;
        }

        const data = await parseFunc(dataBuffer);
        console.log("PDF Text Content Preview (first 800 chars):");
        console.log("--------------------------------------------------");
        console.log(data.text.substring(0, 800));
        console.log("--------------------------------------------------");
    } catch (e) {
        console.error("Error parsing PDF:", e.message);
    }
}

async function main() {
    for (const p of pdfSamples) {
        await analyzePDF(p);
    }
}

main();
