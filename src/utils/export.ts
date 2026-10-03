import { FatwaRecord } from '../types.js';

export function downloadJson(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv(items: FatwaRecord[], filename: string) {
  const headers = ['ID', 'Fatwa_No', 'Title', 'Institution', 'Category', 'Date', 'Question', 'Answer', 'URL'];
  
  const escapeCsv = (str?: string) => {
    if (!str) return '""';
    const cleaned = str.replace(/"/g, '""');
    return `"${cleaned}"`;
  };

  const rows = items.map((f) => [
    escapeCsv(f.id),
    escapeCsv(f.fatwaNo),
    escapeCsv(f.title),
    escapeCsv(f.dar),
    escapeCsv(f.category),
    escapeCsv(f.date),
    escapeCsv(f.question),
    escapeCsv(f.answer),
    escapeCsv(f.url),
  ]);

  // \uFEFF is UTF-8 Byte Order Mark so Excel opens Arabic, Urdu & Burmese text without mojibake
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(fatwa: FatwaRecord, filename: string) {
  const content = `# ${fatwa.title}
**Fatwa Number**: ${fatwa.fatwaNo}  
**Institution**: ${fatwa.dar}  
**Category**: ${fatwa.category}  
**Date**: ${fatwa.date}  
**Source URL**: [${fatwa.url}](${fatwa.url})  

---

## ❓ Question (سوال)
${fatwa.question}

---

## 💡 Answer (جواب)
${fatwa.answer}

${fatwa.signature ? `\n---\n*${fatwa.signature}*\n` : ''}

${fatwa.burmeseSummary ? `\n---\n## 🇲🇲 မြန်မာဘာသာ အနှစ်ချုပ်\n${fatwa.burmeseSummary}\n` : ''}
`;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
