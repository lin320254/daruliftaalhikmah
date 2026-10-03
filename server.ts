import express, { Request, Response } from 'express';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { DarDepartment, FatwaRecord, FatwaSummary, ChapterItem } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const KNOWN_DARS: DarDepartment[] = [
  {
    id: '1',
    slug: 'deoband',
    nameUrdu: 'دار الافتاء دار العلوم دیوبند',
    nameEn: 'Darul Ifta Darul Uloom Deoband',
    nameMy: 'ဒါရူလ်အိုလူးမ် ဒေအိုဘန်း ဖသ်ဝါဌာန',
    location: 'Deoband, UP, India',
    website: 'https://darulifta-deoband.com',
    countEstimate: '50,000+ Fatwas',
    featured: true,
  },
  {
    id: '7',
    slug: 'deobandw',
    nameUrdu: 'دار الافتاء دار العلوم (وقف) دیوبند',
    nameEn: 'Darul Ifta Darul Uloom (Waqf) Deoband',
    nameMy: 'ဒေအိုဘန်း (ဝကဖ်) ဖသ်ဝါဌာန',
    location: 'Deoband, UP, India',
    website: 'https://www.darulifta.info/d/deobandw',
    countEstimate: '10,000+ Fatwas',
    featured: true,
  },
  {
    id: '2',
    slug: 'darululoomkarachi',
    nameUrdu: 'دار الافتاء دار العلوم کراچی',
    nameEn: 'Darul Ifta Darul Uloom Karachi',
    nameMy: 'ဒါရူလ်အိုလူးမ် ကရာချီ ဖသ်ဝါဌာန',
    location: 'Karachi, Pakistan',
    website: 'https://www.darulifta.info/d/darululoomkarachi',
    countEstimate: '30,000+ Fatwas',
    featured: true,
  },
  {
    id: '6',
    slug: 'ashrafia',
    nameUrdu: 'دار الافتاء جامعہ اشرفیہ لاہور',
    nameEn: 'Darul Ifta Jamia Ashrafia Lahore',
    nameMy: 'ဂျာမိအာ အရှ်ရာဖီယာ လာဟိုး ဖသ်ဝါဌာန',
    location: 'Lahore, Pakistan',
    website: 'https://www.darulifta.info/d/ashrafia',
    countEstimate: '20,000+ Fatwas',
    featured: true,
  },
  {
    id: '4',
    slug: 'jamiaturrasheed',
    nameUrdu: 'دار الافتاء جامعۃ الرشید کراچی',
    nameEn: 'Darul Ifta Jamiatur Rasheed',
    nameMy: 'ဂျာမိအာ ရရှီဒ် ကရာချီ',
    location: 'Karachi, Pakistan',
    website: 'https://www.darulifta.info/d/jamiaturrasheed',
    countEstimate: '15,000+ Fatwas',
    featured: true,
  },
  {
    id: '20',
    slug: 'usmaniapsh',
    nameUrdu: 'دار الافتاء جامعہ عثمانیہ پشاور',
    nameEn: 'Darul Ifta Jamia Usmania Peshawar',
    nameMy: 'ဂျာမိအာ ဥစမာနီယာ ပရှာဝါ ဖသ်ဝါဌာန',
    location: 'Peshawar, Pakistan',
    website: 'https://www.darulifta.info/d/usmaniapsh',
    countEstimate: '12,000+ Fatwas',
    featured: false,
  },
  {
    id: '5',
    slug: 'binoria',
    nameUrdu: 'دار الافتاء جامعہ بنوریہ کراچی',
    nameEn: 'Darul Ifta Jamia Binoria Karachi',
    nameMy: 'ဂျာမိအာ ဘနူရီယာ ကရာချီ',
    location: 'Karachi, Pakistan',
    website: 'https://www.darulifta.info/d/binoria',
    countEstimate: '18,000+ Fatwas',
    featured: false,
  },
  {
    id: '8',
    slug: 'farooqia',
    nameUrdu: 'دار الافتاء جامعہ فاروقیہ',
    nameEn: 'Darul Ifta Jamia Farooqia Karachi',
    nameMy: 'ဂျာမိအာ ဖာရူကီယာ ကရာချီ',
    location: 'Karachi, Pakistan',
    website: 'https://www.darulifta.info/d/farooqia',
    countEstimate: '10,000+ Fatwas',
    featured: false,
  },
];

async function fetchWithRetry(url: string, retries = 2, timeoutMs = 12000): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ur;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Failed after retries');
}

function cleanText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseFatwaHtml(html: string, originalUrl: string): FatwaRecord {
  const $ = cheerio.load(html);

  let articleData: any = null;
  let qaData: any = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() || '';
      const parsed = JSON.parse(raw.trim());
      if (parsed['@type'] === 'Article') articleData = parsed;
      if (parsed['@type'] === 'QAPage' || parsed.mainEntity) qaData = parsed;
    } catch (e) {
      // ignore json parse error
    }
  });

  const rawTitle =
    qaData?.mainEntity?.name ||
    articleData?.headline ||
    $('h1, h2.font-bold').first().text() ||
    $('title').text().replace(/\|.*$/, '').trim();

  const title = cleanText(rawTitle);
  const romanTitle = cleanText(articleData?.alternativeHeadline || '');

  const dar = cleanText(
    articleData?.author?.name ||
    qaData?.mainEntity?.acceptedAnswer?.author?.name ||
    $('.text-sm a[href*="/d/"]').first().text() ||
    'دار الافتاء دار العلوم دیوبند'
  );

  const category = cleanText(
    articleData?.articleSection ||
    $('.bg-emerald-50, .text-xs.font-medium, a[href*="/bab/"]').first().text() ||
    'فتاویٰ عامہ'
  );

  const date = cleanText(
    qaData?.mainEntity?.dateCreated ||
    articleData?.datePublished ||
    $('time').first().text() ||
    ''
  );

  // Question extraction
  let question = cleanText(qaData?.mainEntity?.text);
  if (!question) {
    const qBox = $('.bg-yellow-50, .bg-amber-50, .border-yellow-200, .ur:has(p)').first();
    if (qBox.length) {
      question = cleanText(qBox.text());
    } else {
      $('div').each((_, el) => {
        const t = $(el).text();
        if (t.includes('سوال') && t.length > 30 && t.length < 3000 && !question) {
          question = cleanText(t.replace(/^سوال[:\s]*/, ''));
        }
      });
    }
  }

  // Answer extraction
  let answer = cleanText(qaData?.mainEntity?.acceptedAnswer?.text);
  if (!answer) {
    const aBox = $('.bg-green-50, .border-green-200, .border-emerald-200').first();
    if (aBox.length) {
      answer = cleanText(aBox.text());
    } else {
      $('div').each((_, el) => {
        const t = $(el).text();
        if (t.includes('جواب') && t.length > 50 && !answer) {
          answer = cleanText(t.replace(/^جواب[:\s]*/, ''));
        }
      });
    }
  }

  // Fatwa Number extraction
  let fatwaNo = '';
  const fatwaNoMatch = answer.match(/Fatwa\s*:\s*([^\n\r]+)/i);
  if (fatwaNoMatch) {
    fatwaNo = cleanText(fatwaNoMatch[1]);
  } else {
    const generalMatch = answer.match(/فتویٰ\s*نمبر\s*:\s*([^\n\r]+)/);
    if (generalMatch) {
      fatwaNo = cleanText(generalMatch[1]);
    }
  }

  // Signature extraction
  let signature = '';
  if (answer.includes('واللہ تعالیٰ اعلم')) {
    const parts = answer.split('واللہ تعالیٰ اعلم');
    signature = 'واللہ تعالیٰ اعلم ' + cleanText(parts[1]);
  }

  const urlParts = originalUrl.split('/');
  const id = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1] || String(Date.now());

  let source: 'darulifta.info' | 'darulifta-deoband.com' | 'other' = 'darulifta.info';
  if (originalUrl.includes('darulifta-deoband.com')) {
    source = 'darulifta-deoband.com';
  }

  return {
    id,
    url: originalUrl,
    title: title || 'فتویٰ شرعی',
    romanTitle: romanTitle || undefined,
    fatwaNo: fatwaNo || id,
    dar,
    category,
    date,
    question: question || 'سوال دستیاب نہیں ہے۔',
    answer: answer || 'جواب دستیاب نہیں ہے۔',
    signature: signature || undefined,
    scrapedAt: new Date().toISOString(),
    source,
  };
}

// 1. Catalog of Dars
app.get('/api/scrape/dars', (_req: Request, res: Response) => {
  res.json({ success: true, dars: KNOWN_DARS });
});

// 2. Scrape single URL
app.post('/api/scrape/url', async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ success: false, error: 'URL is required' });
    return;
  }

  try {
    let targetUrl = url.trim();

    // If user provided a darulifta-deoband.com URL with ID, or standard darulifta.info
    // If it's darulifta-deoband.com, we can resolve its mirrored or direct content
    if (targetUrl.includes('darulifta-deoband.com')) {
      const matchId = targetUrl.match(/\/(\d+)\/?$/);
      if (matchId) {
        // search by this ID on darulifta.info or mirror
        const fatwaId = matchId[1];
        const searchHtml = await fetchWithRetry(`https://www.darulifta.info/search?q=${fatwaId}&search_engine=internal&dar_id=1`);
        const $ = cheerio.load(searchHtml);
        const firstLink = $('a[href*="/d/deoband/fatwa/"]').first().attr('href');
        if (firstLink) {
          targetUrl = firstLink.startsWith('http') ? firstLink : `https://www.darulifta.info${firstLink}`;
        }
      }
    }

    const html = await fetchWithRetry(targetUrl);
    const fatwa = parseFatwaHtml(html, targetUrl);

    res.json({ success: true, fatwa });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Failed to scrape fatwa: ${err.message || String(err)}`,
    });
  }
});

const TERM_MAP: Record<string, string> = {
  // English / Roman Urdu
  'namaz': 'نماز',
  'salah': 'نماز',
  'salat': 'نماز',
  'prayer': 'نماز',
  'roza': 'روزہ',
  'fasting': 'روزہ',
  'sawm': 'روزہ',
  'ramadan': 'رمضان',
  'zakat': 'زکوۃ',
  'zakah': 'زکوۃ',
  'charity': 'صدقہ',
  'qurbani': 'قربانی',
  'udhiyah': 'قربانی',
  'sacrifice': 'قربانی',
  'nikah': 'نکاح',
  'marriage': 'نکاح',
  'mehr': 'مہر',
  'talaq': 'طلاق',
  'divorce': 'طلاق',
  'khula': 'خلع',
  'iddah': 'عدت',
  'halal': 'حلال',
  'haram': 'حرام',
  'riba': 'سود',
  'interest': 'سود',
  'sood': 'سود',
  'loan': 'قرض',
  'bank': 'بینک',
  'insurance': 'انشورنس',
  'bitcoin': 'بٹ کوائن',
  'crypto': 'کرپٹو',
  'wirasat': 'وراثت',
  'inheritance': 'وراثت',
  'hajj': 'حج',
  'umrah': 'عمرہ',
  'wudu': 'وضو',
  'taharah': 'طہارت',
  'janaza': 'جنازہ',
  'jummah': 'جمعہ',
  'eid': 'عید',
  
  // Burmese (မြန်မာ)
  'နမာဇ်': 'نماز',
  'ဆွလာသ်': 'نماز',
  'ရိုဇာ': 'روزہ',
  'ဥပုသ်': 'روزہ',
  'ဇကာသ်': 'زکوۃ',
  'ကုရ်ဘာနီ': 'قربانی',
  'နိကာဟ်': 'نکاح',
  'မင်္ဂလာ': 'نکاح',
  'သွလာက်': 'طلاق',
  'ကွာရှင်း': 'طلاق',
  'မဲဟဲရ်': 'مہر',
  'ရီဗာ': 'سود',
  'အတိုး': 'سود',
  'အမွေ': 'وراثت',
  'ဝုဒူ': 'وضو',
  'သဟာရသ်': 'طہارت',
  'ဟဂျ်': 'حج',
  'ဂျမာအသ်': 'جماعت',
  'ဂျွမ္မာဟ်': 'جمعہ',
  'အိဒ်': 'عید',
  'ဂျနာဇာ': 'جنازہ',
  'စီးပွား': 'تجارت',
  'အရောင်းအဝယ်': 'بیع',
};

function normalizeSearchQuery(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  for (const [key, urdu] of Object.entries(TERM_MAP)) {
    if (trimmed === key || trimmed.includes(key)) {
      return urdu;
    }
  }
  return raw.trim();
}

// 3. Search endpoint
app.get('/api/scrape/search', async (req: Request, res: Response): Promise<void> => {
  const query = (req.query.q as string) || '';
  let darId = (req.query.dar_id as string) || '';
  if (darId === 'all') darId = '';

  if (!query.trim()) {
    res.json({ success: true, results: [], total: 0 });
    return;
  }

  try {
    const normalized = normalizeSearchQuery(query);
    const encoded = encodeURIComponent(normalized);
    // When darId is empty, darulifta.info searches across ALL institutions simultaneously
    const searchUrl = `https://www.darulifta.info/search?q=${encoded}&search_engine=internal${darId ? '&dar_id=' + darId : ''}`;

    const html = await fetchWithRetry(searchUrl);
    const $ = cheerio.load(html);

    const results: FatwaSummary[] = [];

    $('a[href*="/fatwa/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const fullUrl = href.startsWith('http') ? href : `https://www.darulifta.info${href}`;
      const title = cleanText($(el).text());
      if (!title || title.length < 3) return;

      // Extract dar & category from surrounding container
      const parentCard = $(el).closest('.bg-white, .border, article, .rounded-xl, .p-4');
      const darName = cleanText(parentCard.find('a[href*="/d/"]').not($(el)).first().text()) || 'دار العلوم دیوبند';
      const catName = cleanText(parentCard.find('a[href*="/bab/"]').first().text());

      // Avoid duplicates
      if (!results.some((r) => r.url === fullUrl)) {
        const parts = fullUrl.split('/');
        const id = parts[parts.length - 2] || parts[parts.length - 1];
        results.push({
          id,
          url: fullUrl,
          title,
          dar: darName,
          category: catName,
        });
      }
    });

    res.json({
      success: true,
      originalQuery: query,
      normalizedQuery: normalized,
      darId,
      results,
      total: results.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Search scraping failed: ${err.message || String(err)}`,
    });
  }
});

// 4. Browse by Dar & Bab (Chapter)
app.get('/api/scrape/browse', async (req: Request, res: Response): Promise<void> => {
  const darSlug = (req.query.dar as string) || 'deoband';
  const bab = req.query.bab as string;
  const page = (req.query.page as string) || '1';

  try {
    let url = `https://www.darulifta.info/d/${darSlug}`;
    if (bab) {
      url += `/bab/${bab}`;
    }
    url += `?page=${page}`;

    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    // 1. Chapters
    const chapters: ChapterItem[] = [];
    $(`a[href*="/d/${darSlug}/bab/"]`).each((_, el) => {
      const href = $(el).attr('href') || '';
      const title = cleanText($(el).text());
      const match = href.match(/\/bab\/(\d+)/);
      if (match && title) {
        const id = match[1];
        if (!chapters.some((c) => c.id === id)) {
          chapters.push({
            id,
            title,
            slug: `bab-${id}`,
            url: href.startsWith('http') ? href : `https://www.darulifta.info${href}`,
          });
        }
      }
    });

    // 2. Fatwa items
    const fatwas: FatwaSummary[] = [];
    $(`a[href*="/d/${darSlug}/fatwa/"]`).each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const fullUrl = href.startsWith('http') ? href : `https://www.darulifta.info${href}`;
      const title = cleanText($(el).text());
      if (!title || title.length < 3) return;

      const parts = fullUrl.split('/');
      const id = parts[parts.length - 2] || parts[parts.length - 1];

      if (!fatwas.some((f) => f.url === fullUrl)) {
        fatwas.push({
          id,
          url: fullUrl,
          title,
          dar: darSlug === 'deoband' ? 'دار العلوم دیوبند' : darSlug,
        });
      }
    });

    const hasNext = $('a[rel="next"], a:contains("اگلا"), a:contains("Next")').length > 0;

    res.json({
      success: true,
      dar: darSlug,
      bab: bab || null,
      page: parseInt(page, 10),
      hasNext,
      chapters,
      fatwas,
      total: fatwas.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Browse scraping failed: ${err.message || String(err)}`,
    });
  }
});

// 5. Batch Scrape Endpoint
app.post('/api/scrape/batch', async (req: Request, res: Response): Promise<void> => {
  const { urls } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    res.status(400).json({ success: false, error: 'Array of URLs is required' });
    return;
  }

  // Cap at 30 items per batch to preserve server bandwidth and avoid rate limits
  const listToScrape = urls.slice(0, 30);
  const items: FatwaRecord[] = [];
  const errors: { url: string; error: string }[] = [];

  for (const url of listToScrape) {
    try {
      const html = await fetchWithRetry(url, 1, 9000);
      const record = parseFatwaHtml(html, url);
      items.push(record);
      // Gentle 300ms pause between requests
      await new Promise((r) => setTimeout(r, 300));
    } catch (e: any) {
      errors.push({ url, error: e.message || String(e) });
    }
  }

  res.json({
    success: true,
    totalRequested: listToScrape.length,
    successful: items.length,
    failed: errors.length,
    items,
    errors,
  });
});

// 6. AI Translation & Scholar Summary (Burmese + English)
app.post('/api/ai/summarize', async (req: Request, res: Response): Promise<void> => {
  const { question, answer, title, targetLang = 'my' } = req.body;

  if (!question || !answer) {
    res.status(400).json({ success: false, error: 'Question and answer are required' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      success: false,
      error: 'GEMINI_API_KEY is not configured in environment secrets.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are a senior Islamic jurisprudential scholar and translator.
Analyze this Islamic Fatwa (Legal verdict from Darul Uloom Deoband / Darul Ifta).
Provide an accurate, respectful, and crystal-clear summary in ${targetLang === 'my' ? 'Burmese (မြန်မာဘာသာ)' : 'English'}.

Title: ${title || 'Fatwa'}
Question: ${question}
Answer: ${answer}

Format your response in structured Markdown with these sections:
1. ${targetLang === 'my' ? '📌 မေးခွန်း အနှစ်ချုပ် (Question Summary)' : '📌 Core Question'}
2. ${targetLang === 'my' ? '⚖️ ရှရီအသ် အမိန့်/ဆုုံးဖြတ်ချက် (Ruling: Halal/Haram/Makruh/Jaiz/Mustahab)' : '⚖️ Ruling & Verdict'}
3. ${targetLang === 'my' ? '📖 အခြေခံ သာဓကနှင့် အသေးစိတ် ရှင်းလင်းချက် (Reasoning & Evidence)' : '📖 Evidence & Detailed Reasoning'}
4. ${targetLang === 'my' ? '💡 အရေးကြီး မှတ်ချက် (Important Note)' : '💡 Practical Takeaway'}

Keep the tone dignified, objective, and scholarly.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      summary: response.text,
      targetLang,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `AI translation failed: ${err.message || String(err)}`,
    });
  }
});

// Setup dev Vite middleware or production static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, '../dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, '../dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
