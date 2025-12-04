import * as XLSX from 'xlsx';
import { Product, ExcelArticleRow, ExcelStockRow } from '../types';
import { supabase } from './supabaseClient';

export const parseArticlesExcel = async (file: File): Promise<Partial<Product>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Read file holding raw data
        const jsonData = XLSX.utils.sheet_to_json<ExcelArticleRow>(sheet);

        const products: Partial<Product>[] = jsonData.map((row) => ({
          id: String(row.codart || '').trim(),
          name: row.desart || 'Sin Nombre',
          family: row.familia || 'General',
          subfamily: row.subfamily || '',
          price_1: Number(row.pventa_1) || 0,
          price_2: Number(row.pventa_2) || 0,
          price_3: Number(row.pventa_3) || 0,
          price_4: Number(row.pventa_4) || 0,
          stock: 0, // Default stock 0 until merged
        })).filter(p => p.id !== ''); // Filter out empty rows

        resolve(products);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const parseStockExcel = async (file: File): Promise<{id: string, stock: number}[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Stock file starts at row 8 (index 7)
        const jsonData = XLSX.utils.sheet_to_json<ExcelStockRow>(sheet, { range: 7 });

        const stockItems = jsonData
          .map(row => {
            const id = String(row['Código'] || '').trim();

            // NORMALIZAR STOCK
            let rawStock = row['Stock'];

            // Si viene como string, limpiar
            if (typeof rawStock === 'string') {
              // Reemplazar coma por punto
              rawStock = rawStock.replace(',', '.');

              // Convertir a número
              rawStock = Number(rawStock);
            }

            // Si viene como número, usarlo
            if (typeof rawStock !== 'number' || isNaN(rawStock)) {
              rawStock = 0;
            }

            // FORZAR ENTERO SIEMPRE 💥
            const stock = Math.round(rawStock);

            return { id, stock };
          })
          .filter(item => item.id !== '');

        resolve(stockItems);

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};


export const consolidateData = (articles: Partial<Product>[], stocks: {id: string, stock: number}[]): Product[] => {
  // Create a map of articles for O(1) access
  const productMap = new Map<string, Product>();

  // 1. Load articles
  articles.forEach(art => {
    if (art.id) {
      productMap.set(art.id, art as Product);
    }
  });

  // 2. Update stock
  stocks.forEach(stk => {
    const product = productMap.get(stk.id);
    if (product) {
      product.stock = stk.stock;
    } 
  });

  return Array.from(productMap.values());
};

// Function to upload to Supabase in batches
export const bulkUpsertProducts = async (products: Product[]) => {
  const BATCH_SIZE = 500;

  // 🔥 Normalización ANTES del insert
  const cleanedProducts = products.map(p => ({
    id: String(p.id).trim(),
    name: String(p.name).trim(),
    family: p.family ? String(p.family).trim() : null,
    subfamily: p.subfamily ? String(p.subfamily).trim() : null,

    // precios → siempre numeric
    price_1: Number(p.price_1) || 0,
    price_2: Number(p.price_2) || 0,
    price_3: Number(p.price_3) || 0,
    price_4: Number(p.price_4) || 0,

    // STOCK → aseguramos ENTERO SI O SI 💥
    stock: Math.round(Number(p.stock) || 0),

    supplier: p.supplier ? String(p.supplier).trim() : null,
    is_dollar: Boolean(p.is_dollar),
    exchange_rate: Number(p.exchange_rate) || null,
  }));

  // 🔥 Inserción en lotes
  for (let i = 0; i < cleanedProducts.length; i += BATCH_SIZE) {
    const batch = cleanedProducts.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error("❌ Error en lote", i, error);
      throw new Error(`Error subiendo lote ${i}: ${error.message}`);
    }
  }
};

