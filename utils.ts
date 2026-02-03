
/**
 * Formats a number with thousand separators.
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ko-KR');
};

/**
 * Converts a number to Korean currency string (e.g., 일금 일백만원정).
 */
export const numberToKorean = (num: number): string => {
  const units = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const smallUnits = ['', '십', '백', '천'];
  const largeUnits = ['', '만', '억', '조', '경'];
  
  if (num === 0) return '영';
  
  let result = '';
  const numStr = Math.floor(num).toString();
  const len = numStr.length;

  for (let i = 0; i < len; i++) {
    const n = parseInt(numStr[i]);
    const pos = len - 1 - i;
    
    if (n > 0) {
      result += units[n] + smallUnits[pos % 4];
    }
    
    if (pos > 0 && pos % 4 === 0) {
      const chunk = numStr.slice(Math.max(0, i - 3), i + 1);
      if (parseInt(chunk) > 0 || (i === len - 1 && n > 0)) {
         result += largeUnits[Math.floor(pos / 4)];
      }
    }
  }

  // Basic cleanup for natural Korean phrasing
  result = result.replace('일십', '십').replace('일백', '백').replace('일천', '천');
  
  return result ? `일금 ${result}원정` : '영원정';
};

/**
 * Calculates item totals based on tax option.
 */
export const calculateTotals = (items: any[], taxOption: string) => {
  let subTotal = 0;
  items.forEach(item => {
    subTotal += (item.qty || 0) * (item.unitPrice || 0);
  });

  let vat = 0;
  let total = 0;

  if (taxOption === 'VAT_INCLUDED') {
    total = subTotal;
    subTotal = Math.round(total / 1.1);
    vat = total - subTotal;
  } else {
    vat = Math.round(subTotal * 0.1);
    total = subTotal + vat;
  }

  return { subTotal, vat, total };
};

/**
 * Formats phone numbers automatically (e.g., 01012345678 -> 010-1234-5678)
 */
export const formatPhoneNumber = (value: string): string => {
  if (!value) return value;
  const digits = value.replace(/[^\d]/g, '');
  const len = digits.length;

  if (len < 4) return digits;
  if (len < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (len < 11) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

/**
 * Formats Business Registration Number (e.g., 1234567890 -> 123-45-67890)
 */
export const formatBizNo = (value: string): string => {
  if (!value) return value;
  const digits = value.replace(/[^\d]/g, '');
  const len = digits.length;

  if (len < 4) return digits;
  if (len < 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
};
