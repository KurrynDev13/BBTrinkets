import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProductDefaults(category: string) {
  switch (category) {
    case 'Pins': return { material: 'Hard Enamel & Zinc Alloy', dimensions: 'Approx. 1.5 - 2 inches', protection: 'Rubber clutch backing', origin: 'Hand-drawn, Manufactured via production partner' };
    case 'Keychains': return { material: 'Clear Acrylic', dimensions: 'Approx. 2 - 2.5 inches', protection: 'Protective film on both sides', origin: 'Hand-drawn, Manufactured via production partner' };
    case 'Artworks': return { material: 'Archival Paper / Canvas', dimensions: 'Varies (e.g., 8x10 inches)', protection: 'Acid-free sleeve', origin: '100% Handcrafted by Artist' };
    case 'Prints': return { material: '300gsm Premium Art Card', dimensions: 'A5 / A4', protection: 'Clear cello sleeve with backing board', origin: 'Printed locally' };
    case 'Stickers': return { material: 'Premium Vinyl', dimensions: 'Approx. 2 - 3 inches', protection: 'Waterproof & Scratch-resistant lamination', origin: 'Printed & Cut in-house' };
    default: return { material: 'Not specified', dimensions: 'Not specified', protection: 'Not specified', origin: 'Not specified' };
  }
}
