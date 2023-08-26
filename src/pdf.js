import * as pdfjslib from 'pdfjs-dist';

export default class Pdf {
  async getPageText(pdf, pageNo) {
    const page = await pdf.getPage(pageNo);
    const tokenizedText = await page.getTextContent();
    const pageText = tokenizedText.items.map((token) => token.str).join('');
    return pageText;
  }

  async getPDFText(source) {
    const pdf = await pdfjslib.getDocument(source).promise;
    const maxPages = pdf.numPages;
    const pageTextPromises = [];
    for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
      pageTextPromises.push(Pdf.getPageText(pdf, pageNo));
    }
    const pageTexts = await Promise.all(pageTextPromises);
    return pageTexts.join(' ');
  }
}