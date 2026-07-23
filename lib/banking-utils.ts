// Helper function to generate a fake valid IBAN for Bank of Arien (DE99 4409 0000 XXXX XXXX XX)
export function generateIBAN(): string {
  const bankCode = "44090000"; // Bank code representing Arien Bank
  const accountNum = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digit account number

  // Quick country check representation (DE + 2 checksum digits)
  // Let's make it look like: DE + 2 random checksum digits + bankCode + accountNum
  const checksum = Math.floor(10 + Math.random() * 90).toString();
  return `DE${checksum}${bankCode}${accountNum}`;
}

export function generateCardNumber(): string {
  // Let's generate a fake Visa or Mastercard lookalike (16 digits)
  // Mastercard starts with 51-55
  let num = "5243";
  for (let i = 0; i < 12; i++) {
    num += Math.floor(Math.random() * 10).toString();
  }
  return num;
}

export function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

export function generateExpiryDate(): string {
  const now = new Date();
  const year = (now.getFullYear() + 4).toString().substring(2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${month}/${year}`;
}
