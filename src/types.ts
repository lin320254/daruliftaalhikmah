export interface FatwaRecord {
  id: string;
  url: string;
  title: string;
  romanTitle?: string;
  fatwaNo: string;
  dar: string;
  darId?: string;
  category: string;
  date: string;
  question: string;
  answer: string;
  signature?: string;
  scrapedAt: string;
  source: 'darulifta.info' | 'darulifta-deoband.com' | 'other';
  burmeseSummary?: string;
  englishSummary?: string;
}

export interface FatwaSummary {
  id: string;
  url: string;
  title: string;
  dar: string;
  category?: string;
  date?: string;
  slug?: string;
  fatwaNo?: string;
}

export interface DarDepartment {
  id: string;
  slug: string;
  nameUrdu: string;
  nameEn: string;
  nameMy: string;
  location: string;
  website: string;
  countEstimate?: string;
  featured?: boolean;
}

export interface ChapterItem {
  id: string;
  title: string;
  slug: string;
  url: string;
}

export interface ScrapeJobStatus {
  total: number;
  completed: number;
  failed: number;
  currentTitle?: string;
  isRunning: boolean;
}

export type Theme = 'light' | 'dark';
