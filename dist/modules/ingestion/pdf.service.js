import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { getLogger } from '../../core/logger/index.js';
const logger = getLogger();
const normalizeText = (rawText) => {
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const normalized = lines.join('\n');
    return normalized
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{2,}/g, '\n\n')
        .trim();
};
export const extractPdfText = async (filePath) => {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const data = await pdfParse(fileBuffer);
        if (!data || typeof data.text !== 'string') {
            logger.warn({ filePath }, 'PDF parser returned no text content');
            return '';
        }
        const text = normalizeText(data.text);
        if (text.length === 0) {
            logger.warn({ filePath }, 'PDF contains no extractable text; scanned PDF may require OCR');
        }
        return text;
    }
    catch (error) {
        logger.error({ err: error, filePath }, 'Failed to extract text from PDF');
        throw new Error(`PDF extraction failed: ${error.message}`);
    }
};
export const extractPdfMetadata = async (filePath) => {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const data = await pdfParse(fileBuffer);
        return {
            pageCount: data.numpages || 0,
            metadata: data.info,
        };
    }
    catch (error) {
        logger.warn({ err: error, filePath }, 'Failed to extract PDF metadata');
        return { pageCount: 0 };
    }
};
//# sourceMappingURL=pdf.service.js.map