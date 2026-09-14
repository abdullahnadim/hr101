import Papa from 'papaparse';
import { z } from 'zod';

const CandidateSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\+?880\d{10}$|^01\d{9}$/, "Invalid BD phone number format"),
  email: z.string().email(),
  position: z.string().min(2)
});

export const processImport = (file: File) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const valid = [];
      const invalid = [];
      
      results.data.forEach((row: any) => {
        const parseResult = CandidateSchema.safeParse(row);
        if (parseResult.success) {
          valid.push(parseResult.data);
        } else {
          invalid.push({ row, errors: parseResult.error.errors });
        }
      });
      
      // Update UI state with valid/invalid counts before pushing to API
      console.log(`Ready to import: ${valid.length}. Errors: ${invalid.length}`);
    }
  });
};