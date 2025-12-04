export interface Product {
  id: string; // codart / Código
  name: string; // desart / Denominación
  family: string;
  subfamily: string;
  price_1: number;
  price_2: number;
  price_3: number;
  price_4: number;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedPrice: number; // The price at the moment of adding (based on list)
  selectedListId: number;
}

export type PriceListId = 1 | 2 | 3 | 4;

export interface ExcelArticleRow {
  codart: string | number;
  desart: string;
  familia: string;
  subfamilia: string;
  pventa_1: number;
  pventa_2: number;
  pventa_3: number;
  pventa_4: number;
  [key: string]: any;
}

export interface ExcelStockRow {
  Código: string | number;
  Denominación: string;
  Familia: string;
  Stock: number;
  [key: string]: any;
}