import React, { useState } from 'react';
import { Lang, i18n } from '../translations.js';
import { FatwaRecord, Theme } from '../types.js';
import { ArrowRight, Loader2, Sparkles, Link as LinkIcon, ListOrdered, FileText } from 'lucide-react';

interface UrlScraperTabProps {
  lang: Lang;
  theme?: Theme;
  onScraped: (fatwa: FatwaRecord) => void;
  onStartBatch: (urls: string[]) => void;
  onSelectFatwa: (fatwa: FatwaRecord) => void;
  recentScraped: FatwaRecord[];
}

const SAMPLE_URLS = [
  {
    titleUr: 'روزہ میں کرونا ٹیسٹ کروانے کا شرعی حکم',
    titleMy: 'Deoband: Corona Test while Fasting (ရိုဇာတွင် ကိုရိုနာစစ်ဆေးခြင်း)',
    titleEn: 'Deoband: Corona Test while Fasting (COVID Swab)',
    url: 'https://www.darulifta.info/d/deoband/fatwa/5hU/roza-mein-corona-test-karwane-se-roza-ka-hukm',
    dar: 'دار الافتاء دار العلوم دیوبند',
  },
  {
    titleUr: 'نکاح میں مہر کے بدلے سونا یا رقم دینے کا حکم',
    titleMy: 'Deoband: Mehr & Gold valuation in Nikah (နိကာဟ်တွင် မဲဟဲရ်ရွှေပေးခြင်း)',
    titleEn: 'Deoband: Mehr & Gold valuation in Nikah',
    url: 'https://www.darulifta.info/d/deoband/fatwa/4KK/dhaai-tola-sone-ke-badle-nikah-hua-to-mehr-mein-sona-dena-hoga-ya-raqam',
    dar: 'دار الافتاء دار العلوم دیوبند',
  },
  {
    titleUr: 'گواہوں کے بغیر خفیہ نکاح کرنے کی شرعی حیثیت',
    titleMy: 'Deoband: Secret marriage without witnesses (သက်သေမပါ လျှို့ဝှက်နိကာဟ်)',
    titleEn: 'Deoband: Secret marriage without witnesses',
    url: 'https://www.darulifta.info/d/deoband/fatwa/4KG/gawahon-ke-baghair-khufiya-taur-par-nikah-karna',
    dar: 'دار الافتاء دار العلوم دیوبند',
  },
  {
    titleUr: 'قربانی کا گوشت اندازے سے تقسیم کرنے کا مسئلہ',
    titleMy: 'Deoband: Distributing Qurbani Meat (ကုရ်ဘာနီအမဲသား ခွဲဝေမှု)',
    titleEn: 'Deoband: Distributing Qurbani Meat by estimate',
    url: 'https://www.darulifta.info/d/deoband/fatwa/4KA/qurbani-ka-gosht-andaza-se-taqseem-karna',
    dar: 'دار الافتاء دار العلوم دیوبند',
  },
];

export const UrlScraperTab: React.FC<UrlScraperTabProps> = ({
  lang,
  theme = 'light',
  onScraped,
  onStartBatch,
  onSelectFatwa,
  recentScraped,
}) => {
  const t = i18n[lang];
  const isLight = theme === 'light';
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [urlInput, setUrlInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSingleScrape = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl || urlInput).trim();
    if (!urlToFetch) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/scrape/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Scraping failed');
      }

      onScraped(data.fatwa);
      if (!targetUrl) setUrlInput('');
      onSelectFatwa(data.fatwa);
    } catch (err: any) {
      setError(err.message || 'Error connecting to scraper server');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = batchInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http'));

    if (urls.length === 0) {
      setError(
        lang === 'ur'
          ? 'براہِ کرم کم از کم ایک درست مکمل لنک درج فرمائیں'
          : lang === 'my'
          ? 'ကျေးဇူးပြု၍ မှန်ကန်သော URL အနည်းဆုံးတစ်ခု ထည့်သွင်းပေးပါ'
          : 'Please enter at least one valid URL'
      );
      return;
    }

    onStartBatch(urls);
    setBatchInput('');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Mode Selector */}
      <div
        className={`rounded-2xl p-6 sm:p-8 transition-colors ${
          isLight
            ? 'bg-white border border-emerald-100/90 shadow-sm'
            : 'border border-neutral-800 bg-neutral-900/40'
        }`}
      >
        <div className="max-w-3xl">
          <h2
            className={`text-xl sm:text-2xl font-bold tracking-tight mb-2 ${
              isLight ? 'text-emerald-950' : 'text-white'
            }`}
          >
            {lang === 'ur'
              ? 'دار الافتاء اور دیوبند سے براہِ راست فتاویٰ اخذ کریں'
              : lang === 'my'
              ? 'Darul Ifta & Deoband ဖသ်ဝါများကို တိုက်ရိုက်ဆွဲယူခြင်း'
              : 'Direct URL Scraper & Extraction Engine'}
          </h2>
          <p
            className={`text-sm mb-6 leading-relaxed ${
              isLight ? 'text-neutral-600' : 'text-neutral-400'
            }`}
          >
            {lang === 'ur'
              ? 'https://www.darulifta.info/ یا https://darulifta-deoband.com/ کا کوئی بھی لنک درج کر کے سوال، تفصیلی جواب، فقہی حوالہ جات اور مہر و دستخط سیکنڈوں میں محفوظ کریں۔'
              : lang === 'my'
              ? 'https://www.darulifta.info/ သို့မဟုတ် https://darulifta-deoband.com/ မှ မည်သည့် ဖသ်ဝါလင့်ခ်ကိုမဆို ထည့်သွင်းပြီး မေးခွန်း၊ အဖြေ၊ သာဓက၊ ဖသ်ဝါနံပါတ်များကို စက္ကန့်ပိုင်းအတွင်း ဆွဲထုတ်ပါ။'
              : 'Extract complete jurisprudential questions, rulings, Arabic references, fatwa IDs, and signatures from any Darul Ifta Deoband or darulifta.info URL in seconds.'}
          </p>

          {/* Mode Switcher */}
          <div
            className={`inline-flex p-1 rounded-xl mb-6 border ${
              isLight
                ? 'bg-emerald-50/80 border-emerald-200/80'
                : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'single'
                  ? isLight
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'bg-neutral-800 text-white shadow-sm'
                  : isLight
                  ? 'text-neutral-600 hover:text-emerald-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LinkIcon className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>{t.singleScrape}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('batch')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'batch'
                  ? isLight
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'bg-neutral-800 text-white shadow-sm'
                  : isLight
                  ? 'text-neutral-600 hover:text-emerald-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ListOrdered className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>{t.batchScrape}</span>
            </button>
          </div>

          {/* Mode 1: Single URL */}
          {mode === 'single' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSingleScrape();
              }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={t.enterUrlPlaceholder}
                    dir="ltr"
                    className={`w-full px-4 py-3.5 rounded-xl text-sm transition-all font-mono border focus:outline-none ${
                      isLight
                        ? 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                        : 'bg-neutral-950 border-neutral-700 text-white placeholder-neutral-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    }`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !urlInput.trim()}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.loading}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.singleScrape}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </form>
          ) : (
            /* Mode 2: Batch URLs */
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div>
                <textarea
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  dir="ltr"
                  placeholder={`https://www.darulifta.info/d/deoband/fatwa/5hU/...\nhttps://www.darulifta.info/d/deoband/fatwa/4KK/...\nhttps://www.darulifta.info/d/deoband/fatwa/4KG/...`}
                  rows={5}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-mono transition-all resize-y border focus:outline-none ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                      : 'bg-neutral-950 border-neutral-700 text-white placeholder-neutral-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                  }`}
                  required
                />
                <div className="flex items-center justify-between text-xs text-neutral-500 mt-1">
                  <span>
                    {lang === 'ur'
                      ? 'ایک بیچ میں زیادہ سے زیادہ ۳۰ فتاویٰ کے لنکس شامل کیے جا سکتے ہیں'
                      : lang === 'my'
                      ? 'တစ်ကြိမ်လျှင် အများဆုံး ၃၀ ခုအထိ ဆွဲယူနိုင်ပါသည်'
                      : 'Up to 30 URLs per batch'}
                  </span>
                  <span className="tabular-nums font-mono">
                    {batchInput.split('\n').filter((l) => l.trim().startsWith('http')).length} URLs
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.startBatch}</span>
              </button>
            </form>
          )}

          {/* Quick Click Samples */}
          <div
            className={`mt-6 pt-6 border-t ${
              isLight ? 'border-neutral-200/80' : 'border-neutral-800/80'
            }`}
          >
            <span
              className={`text-xs font-semibold uppercase tracking-wider block mb-3 ${
                isLight ? 'text-emerald-800' : 'text-neutral-400'
              }`}
            >
              {t.quickExamples}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_URLS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUrlInput(sample.url);
                    handleSingleScrape(sample.url);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all group flex items-start justify-between ${
                    isLight
                      ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/90 shadow-2xs'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="pr-2 min-w-0">
                    <p
                      className={`text-xs font-medium transition-colors truncate ${
                        isLight
                          ? 'text-neutral-800 group-hover:text-emerald-800'
                          : 'text-neutral-300 group-hover:text-emerald-400'
                      } ${lang === 'ur' ? 'font-nastaliq leading-normal' : ''}`}
                    >
                      {lang === 'ur' ? sample.titleUr : lang === 'my' ? sample.titleMy : sample.titleEn}
                    </p>
                    <p className="text-[11px] text-emerald-700/80 truncate mt-0.5 font-mono">
                      {sample.dar}
                    </p>
                  </div>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-all shrink-0 mt-0.5 group-hover:translate-x-0.5 ${
                      isLight ? 'text-emerald-600' : 'text-neutral-400 group-hover:text-emerald-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recently Scraped List */}
      {recentScraped.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3
              className={`text-sm font-semibold uppercase tracking-wider ${
                isLight ? 'text-neutral-700' : 'text-neutral-300'
              }`}
            >
              {t.recentScraped}
            </h3>
            <span className="text-xs text-neutral-500 tabular-nums font-mono">
              {recentScraped.length} items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentScraped.slice(0, 8).map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectFatwa(item)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isLight
                    ? 'bg-white border-emerald-100 hover:border-emerald-300 hover:shadow-xs'
                    : 'bg-neutral-900 border border-neutral-800 hover:border-emerald-800/80 hover:bg-neutral-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2 font-mono">
                    <span className="text-emerald-700 font-semibold">{item.fatwaNo || item.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-nastaliq">{item.dar}</span>
                    {item.category && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-nastaliq">{item.category}</span>
                      </>
                    )}
                  </div>
                  <h4
                    className={`text-base font-semibold transition-colors line-clamp-2 dir-rtl font-nastaliq leading-relaxed ${
                      isLight
                        ? 'text-neutral-900 group-hover:text-emerald-700'
                        : 'text-white group-hover:text-emerald-300'
                    }`}
                  >
                    {item.title}
                  </h4>
                </div>

                <div
                  className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${
                    isLight ? 'border-neutral-100 text-neutral-500' : 'border-neutral-800/60 text-neutral-400'
                  }`}
                >
                  <span className="line-clamp-1 italic max-w-[200px] dir-rtl font-nastaliq">
                    {item.question.slice(0, 60)}...
                  </span>
                  <span className="text-emerald-700 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0 ml-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t.viewDetails}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
