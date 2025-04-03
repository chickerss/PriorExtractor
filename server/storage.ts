import { 
  extractedCodes, 
  type ExtractedCode, 
  type InsertExtractedCode 
} from "@shared/schema";

export interface IStorage {
  getExtractedCodes(): Promise<ExtractedCode[]>;
  getExtractedCodesByPayer(payerName: string): Promise<ExtractedCode[]>;
  getExtractedCodesByLineOfBusiness(lineOfBusiness: string): Promise<ExtractedCode[]>;
  getExtractedCodesByYear(year: number): Promise<ExtractedCode[]>;
  saveExtractedCodes(codes: InsertExtractedCode[]): Promise<ExtractedCode[]>;
  searchExtractedCodes(searchTerm: string): Promise<ExtractedCode[]>;
  clearAllCodes(): Promise<void>;
}

export class MemStorage implements IStorage {
  private codes: Map<number, ExtractedCode>;
  private currentId: number;

  constructor() {
    this.codes = new Map();
    this.currentId = 1;
  }

  async getExtractedCodes(): Promise<ExtractedCode[]> {
    return Array.from(this.codes.values());
  }

  async getExtractedCodesByPayer(payerName: string): Promise<ExtractedCode[]> {
    return Array.from(this.codes.values()).filter(
      (code) => code.payerName.toLowerCase() === payerName.toLowerCase()
    );
  }

  async getExtractedCodesByLineOfBusiness(lineOfBusiness: string): Promise<ExtractedCode[]> {
    return Array.from(this.codes.values()).filter(
      (code) => code.lineOfBusiness.toLowerCase() === lineOfBusiness.toLowerCase()
    );
  }

  async getExtractedCodesByYear(year: number): Promise<ExtractedCode[]> {
    return Array.from(this.codes.values()).filter(
      (code) => code.year === year
    );
  }

  async saveExtractedCodes(insertCodes: InsertExtractedCode[]): Promise<ExtractedCode[]> {
    const savedCodes: ExtractedCode[] = [];

    for (const insertCode of insertCodes) {
      const id = this.currentId++;
      const code: ExtractedCode = { ...insertCode, id };
      this.codes.set(id, code);
      savedCodes.push(code);
    }

    return savedCodes;
  }

  async searchExtractedCodes(searchTerm: string): Promise<ExtractedCode[]> {
    const term = searchTerm.toLowerCase();
    
    return Array.from(this.codes.values()).filter(
      (code) => 
        code.code.toLowerCase().includes(term) ||
        code.payerName.toLowerCase().includes(term) ||
        code.lineOfBusiness.toLowerCase().includes(term) ||
        code.sourceFile.toLowerCase().includes(term)
    );
  }

  async clearAllCodes(): Promise<void> {
    this.codes.clear();
  }
}

export const storage = new MemStorage();
