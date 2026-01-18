const fs = require('fs');
const pdf = require('pdf-parse');
const XLSX = require('xlsx');
const path = require('path');

const excel1 = path.join(__dirname, 'Excel_need/附件1：大连理工大学科研材料验收单.xlsx');
const excel2 = path.join(__dirname, 'Excel_need/附件2：材料使用入库出库单.xlsx');

const pdfSamples = [
    'fapiao_shili/2025-12-12-38.84-ergo9153解胶剂丙酮清洗剂.pdf', 
    'fapiao_shili/2025-12-16-104.5-霍尼韦尔（Honeywell）KN95口罩工业防尘粉尘防灰口罩防雾霾pm2.5花粉飞沫甲流感 H910Plus耳戴50只_盒环保装.pdf'
];

async function analyzeExcel(filePath) {
    console.log(`\n--- Analyzing Excel: ${path.basename(filePath)} ---`);
    if (!fs.existsSync(filePath)) {
        console.log("File not found!");
        return;
    }
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // console.log("Sheet Name:", sheetName);
    
    // Convert to JSON to see structure
    const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
    console.log("First 5 rows:");
    data.slice(0, 5).forEach(row => console.log(JSON.stringify(row)));
}

async function analyzePDF(filePath) {
    const fullPath = path.join(__dirname, filePath);
    console.log(`\n--- Analyzing PDF: ${path.basename(filePath)} ---`);
    if (!fs.existsSync(fullPath)) {
        console.log("File not found!");
        return;
    }
    const dataBuffer = fs.readFileSync(fullPath);
    try {
        const data = await pdf(dataBuffer);
        console.log("PDF Text Content Preview (first 500 chars):");
        console.log(data.text.substring(0, 500));
        console.log("\n--- End Preview ---");
    } catch (e) {
        console.error("Error parsing PDF:", e.message);
    }
}

async function main() {
    await analyzeExcel(excel1);
    await analyzeExcel(excel2);
    
    for (const p of pdfSamples) {
        await analyzePDF(p);
    }
}

main();
