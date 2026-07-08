import { PDFParse } from "pdf-parse";

const cleanText = (value) =>
  value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

export const extractTextFromPDF = async (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("We couldn't process this PDF. Please upload a valid PDF.");
  }

  try {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    const extractedText = cleanText(parsed?.text || "");

    if (!extractedText || extractedText.length < 10) {
      throw new Error(
        "We couldn't extract text from this PDF. It may be a scanned document. Please upload a text-based PDF."
      );
    }

    return extractedText;
  } catch (error) {
    if (
      typeof error?.message === "string" &&
      error.message.includes("We couldn't extract text from this PDF")
    ) {
      throw error;
    }

    throw new Error(
      "We couldn't process this PDF. Please upload a valid PDF."
    );
  }
};