
export enum DocumentType {
  ESTIMATE = 'ESTIMATE',
  TRANSACTION_STATEMENT = 'TRANSACTION_STATEMENT',
  RECEIPT = 'RECEIPT'
}

export enum TaxOption {
  VAT_INCLUDED = 'VAT_INCLUDED',
  VAT_EXCLUDED = 'VAT_EXCLUDED'
}

export interface BizInfo {
  bizNo: string;
  name: string;
  owner: string;
  address: string;
  bizType: string;
  bizItem: string;
  contact: string;
}

export interface Item {
  id: string;
  name: string;
  spec: string;
  qty: number;
  unitPrice: number;
}

export interface DocumentState {
  type: DocumentType;
  docNo: string;
  date: string;
  supplier: BizInfo;
  client: {
    bizNo: string;
    name: string;
    owner: string;
  };
  items: Item[];
  taxOption: TaxOption;
  stampUrl: string | null;
  stampPos: { x: number, y: number };
  stampSize: number;
}
