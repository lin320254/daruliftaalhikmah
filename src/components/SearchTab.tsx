import React, { useState, useEffect, useRef } from 'react';
import { Lang, i18n } from '../translations.js';
import { DarDepartment, FatwaRecord, FatwaSummary, Theme } from '../types.js';
import { Search as SearchIcon, Loader2, Download, Eye, CheckSquare, Square, X, Zap, Sparkles } from 'lucide-react';

interface SearchTabProps {
  lang: Lang;
  theme?: Theme;
  dars: DarDepartment[];
  onSelectFatwa: (fatwa: FatwaRecord) => void;
  onBatchScrapeUrls: (urls: string[]) => void;
  onScrapedSingle: (fatwa: FatwaRecord) => void;
}

const POPULAR_TOPICS = [
  { ur: 'نماز', en: 'Prayer / Salah', my: 'နမာဇ် (Salah)' },
  { ur: 'زکوۃ', en: 'Zakat', my: 'ဇကာသ် (Zakat)' },
  { ur: 'روزہ', en: 'Fasting / Roza', my: 'ရိုဇာ (Fasting)' },
  { ur: 'قربانی', en: 'Qurbani', my: 'ကုရ်ဘာနီ (Qurbani)' },
  { ur: 'نکاح', en: 'Nikah / Marriage', my: 'နိကာဟ် (Nikah)' },
  { ur: 'طلاق', en: 'Talaq / Divorce', my: 'သွလာက် (Divorce)' },
  { ur: 'تجارت', en: 'Trade & Commerce', my: 'စီးပွားကုန်သွယ်ရေး (Trade)' },
  { ur: 'سود', en: 'Riba / Interest', my: 'အတိုး/ရီဗာ (Riba/Interest)' },
  { ur: 'وراثت', en: 'Inheritance (Wirasat)', my: 'အမွေဆက်ခံမှု (Inheritance)' },
  { ur: 'بٹ کوائن', en: 'Bitcoin / Crypto', my: 'Bitcoin / Crypto' },
];

export const SearchTab: React.FC<SearchTabProps> = ({
  lang,
  theme = 'light',
  dars,
  onSelectFatwa,
  onBatchScrapeUrls,
  onScrapedSingle,
}) => {
  const t = i18n[lang];
  const isLight = theme === 'light';
  const [query, setQuery] = useState('');
  const [activeDarFilter, setActiveDarFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FatwaSummary[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [detectedTerm, setDetectedTerm] = useState<string | null>(null);

  const debounceTimeout = useRef<any>(null);

  const executeSearch = async (searchTerm: string, dar: string = activeDarFilter) => {
    const q = searchTerm.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      setDetectedTerm(null);
      return;
    }

    setLoading(true);
    setSearched(true);
    setSelectedUrls(new Set());

    try {
      const darParam = dar === 'all' ? '' : dar;
      const url = `/api/scrape/search?q=${encodeURIComponent(q)}&dar_id=${darParam}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        if (data.normalizedQuery && data.normalizedQuery !== data.originalQuery) {
          setDetectedTerm(data.normalizedQuery);
        } else {
          setDetectedTerm(null);
        }
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Live Auto-Search as user types ("ရိုက်လိုက်တာနဲ့")
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.trim().length >= 2) {
      debounceTimeout.current = setTimeout(() => {
        executeSearch(query, activeDarFilter);
      }, 350);
    } else if (query.trim().length === 0 && searched) {
      setResults([]);
      setSearched(false);
    }

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [query, activeDarFilter]);

  const toggleSelectUrl = (url: string) => {
    const next = new Set(selectedUrls);
    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }
    setSelectedUrls(next);
  };

  const selectAll = () => {
    if (selectedUrls.size === filteredResults.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(filteredResults.map((f) => f.url)));
    }
  };

  const handleReadOrScrape = async (item: FatwaSummary) => {
    setFetchingId(item.id);
    try {
      const res = await fetch('/api/scrape/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url }),
      });
      const data = await res.json();
      if (data.success) {
        onScrapedSingle(data.fatwa);
        onSelectFatwa(data.fatwa);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingId(null);
    }
  };

  // Grouped institutions from current results
  const institutionsInResults = Array.from(new Set(results.map((r) => r.dar))).filter(Boolean);

  const filteredResults =
    activeDarFilter === 'all'
      ? results
      : results.filter((r) => {
          if (activeDarFilter === '1') {
            return r.dar.includes('دیوبند') || r.dar.includes('Deoband');
          }
          return r.dar.includes(activeDarFilter);
        });

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div
        className={`rounded-2xl p-6 sm:p-8 space-y-4 transition-colors ${
          isLight
            ? 'bg-white border border-emerald-100/90 shadow-sm'
            : 'border border-neutral-800 bg-neutral-900/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold mb-2 border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t.instantSearchBadge}</span>
            </div>
            <h2
              className={`text-xl sm:text-2xl font-bold tracking-tight mb-1 ${
                isLight ? 'text-emerald-950' : 'text-white'
              }`}
            >
              {lang === 'ur'
                ? 'ہمہ جہت تلاش (تمام دار الافتاء اور دیوبند)'
                : lang === 'my'
                ? 'ဖသ်ဝါအားလုံးမှ တပြိုင်နက် ရှာဖွေဆွဲယူခြင်း'
                : 'Universal Multi-Source Instant Search'}
            </h2>
            <p
              className={`text-xs ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}
            >
              {lang === 'ur'
                ? 'لفظ، موضوع یا فتویٰ نمبر ٹائپ کرتے ہی دار العلوم دیوبند، جامعہ کراچی، اشرفیہ، اور تمام اداروں سے نتائج حاضر ہو جائیں گے'
                : lang === 'my'
                ? 'ဖသ်ဝါအကြောင်းအရာ သို့မဟုတ် နံပါတ်ရိုက်လိုက်သည်နှင့် ဌာနအားလုံး (ဒေအိုဘန်း၊ ကရာချီ၊ အရှ်ရာဖီယာ) မှ တပြိုင်နက် ရှာပေးပါမည်'
                : 'Searches across Darul Uloom Deoband, Karachi, Ashrafia and all indexed archives simultaneously in real time'}
            </p>
          </div>
        </div>

        {/* Live Search Bar with Instant Clear */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch(query, activeDarFilter);
          }}
          className="relative flex items-center"
        >
          <div className="relative flex-1">
            <SearchIcon
              className={`w-5 h-5 absolute ${
                lang === 'ur' ? 'right-4' : 'left-4'
              } top-1/2 -translate-y-1/2 ${
                isLight ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              autoFocus
              className={`w-full ${
                lang === 'ur' ? 'pr-12 pl-12' : 'pl-12 pr-12'
              } py-3.5 rounded-xl text-base transition-all border focus:outline-none ${
                isLight
                  ? 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs'
                  : 'bg-neutral-950 border-neutral-700 text-white placeholder-neutral-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              } ${lang === 'ur' ? 'font-nastaliq' : ''}`}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setSearched(false);
                }}
                className={`absolute ${
                  lang === 'ur' ? 'left-3' : 'right-3'
                } top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                  isLight
                    ? 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={`${
              lang === 'ur' ? 'mr-3' : 'ml-3'
            } px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors shrink-0 shadow-sm`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SearchIcon className="w-4 h-4" />
            )}
            <span>{t.searchBtn}</span>
          </button>
        </form>

        {/* Translation Notification chip */}
        {detectedTerm && (
          <div
            className={`text-xs p-2.5 rounded-lg border flex items-center gap-2 ${
              isLight
                ? 'bg-emerald-50/70 border-emerald-200 text-neutral-700'
                : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {lang === 'ur' ? 'مطلوبہ اصطلاح:' : lang === 'my' ? 'ရှာဖွေနေသော အူရ်ဒူစကားလုံး:' : 'Grounded query:'}{' '}
              <strong className="text-emerald-700 font-nastaliq text-sm">{detectedTerm}</strong>
            </span>
          </div>
        )}

        {/* Quick Topic Chips */}
        <div>
          <span
            className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
              isLight ? 'text-emerald-800' : 'text-neutral-400'
            }`}
          >
            {lang === 'ur'
              ? 'فوری موضوعاتی بٹن (ایک کلک پر تلاش)'
              : lang === 'my'
              ? 'အမေးများသော အကြောင်းအရာများ (တစ်ချက်နှိပ် ရှာဖွေရန်)'
              : 'Popular Topics (One-Click Search)'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_TOPICS.map((topic, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(topic.ur);
                  executeSearch(topic.ur, activeDarFilter);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${
                  query === topic.ur
                    ? 'border-emerald-600 bg-emerald-100 text-emerald-900 font-semibold'
                    : isLight
                    ? 'bg-emerald-50/50 border-emerald-100 text-neutral-800 hover:bg-emerald-100/60 hover:border-emerald-300'
                    : 'bg-neutral-950 text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800 border-neutral-800'
                }`}
              >
                <span className="font-nastaliq text-emerald-700 text-sm font-semibold">{topic.ur}</span>
                {lang !== 'ur' && (
                  <span className="text-neutral-500 font-sans text-[11px]">
                    ({lang === 'my' ? topic.my : topic.en})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header Toolbar */}
      {searched && (
        <div className="space-y-3">
          {/* Institution Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveDarFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeDarFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-white text-neutral-700 hover:text-emerald-800 border border-neutral-200'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <span>{t.allSourcesTab}</span>
              <span className="ml-1.5 opacity-80 tabular-nums font-mono">({results.length})</span>
            </button>

            {institutionsInResults.map((darName) => {
              const count = results.filter((r) => r.dar === darName).length;
              const isActive = activeDarFilter === darName;
              return (
                <button
                  key={darName}
                  onClick={() => setActiveDarFilter(isActive ? 'all' : darName)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors font-nastaliq leading-normal ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-white text-neutral-700 hover:text-emerald-800 border border-neutral-200'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  <span>{darName}</span>
                  <span className="ml-1.5 font-sans opacity-80 tabular-nums font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={selectAll}
                disabled={filteredResults.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors border disabled:opacity-40 ${
                  isLight
                    ? 'text-neutral-700 bg-white border-neutral-200 hover:bg-neutral-50'
                    : 'text-neutral-300 bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                {selectedUrls.size === filteredResults.length && filteredResults.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-400" />
                )}
                <span>
                  {selectedUrls.size === filteredResults.length && filteredResults.length > 0
                    ? t.deselectAll
                    : t.selectAll}
                </span>
              </button>

              {/* Scrape Selected */}
              {selectedUrls.size > 0 && (
                <button
                  onClick={() => onBatchScrapeUrls(Array.from(selectedUrls))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {t.scrapeSelected} ({selectedUrls.size})
                  </span>
                </button>
              )}

              {/* Scrape All Found Results */}
              {filteredResults.length > 0 && (
                <button
                  onClick={() => onBatchScrapeUrls(filteredResults.map((f) => f.url))}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                    isLight
                      ? 'text-emerald-900 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      : 'text-emerald-300 bg-emerald-950/60 border-emerald-800 hover:bg-emerald-900/60'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {t.scrapeAllFound} ({filteredResults.length})
                  </span>
                </button>
              )}
            </div>

            <div className="text-xs text-neutral-500 font-mono tabular-nums">
              {filteredResults.length} {lang === 'ur' ? 'فتاویٰ موصول ہوئے' : lang === 'my' ? 'ခု တွေ့ရှိရပါသည်' : 'verdicts found'}
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className={`text-sm font-medium ${lang === 'ur' ? 'font-nastaliq' : ''}`}>{t.autoSearching}</p>
        </div>
      ) : searched && filteredResults.length === 0 ? (
        <div
          className={`py-20 text-center rounded-2xl border space-y-2 ${
            isLight
              ? 'bg-white border-emerald-100 text-neutral-600'
              : 'bg-neutral-900/20 border-neutral-800 text-neutral-400'
          }`}
        >
          <p className="text-sm font-medium">{t.noData}</p>
          <p className="text-xs text-neutral-400">
            {lang === 'ur'
              ? 'مختلف الفاظ یا فتویٰ نمبر سے دوبارہ کوشش فرمائیں۔'
              : lang === 'my'
              ? 'အခြား အဓိပ္ပာယ်တူ စကားလုံးများဖြင့် ထပ်မံ ကြိုးစားရှာဖွေကြည့်ပါ။'
              : 'Try different keywords or browse institutions directly.'}
          </p>
        </div>
      ) : filteredResults.length > 0 ? (
        <div
          className={`rounded-2xl overflow-hidden border shadow-xs ${
            isLight
              ? 'bg-white border-emerald-100'
              : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <div className={`divide-y ${isLight ? 'divide-emerald-50' : 'divide-neutral-800'}`}>
            {filteredResults.map((item, idx) => {
              const isSelected = selectedUrls.has(item.url);
              const isFetching = fetchingId === item.id;

              return (
                <div
                  key={item.url || idx}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    isSelected
                      ? isLight
                        ? 'bg-emerald-50'
                        : 'bg-emerald-950/20'
                      : isLight
                      ? 'hover:bg-emerald-50/40'
                      : 'hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleSelectUrl(item.url)}
                      className="text-neutral-400 hover:text-neutral-600 shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1 font-mono">
                        <span className="text-emerald-700 font-semibold">{item.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-nastaliq font-medium text-emerald-900">{item.dar}</span>
                        {item.category && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-nastaliq">{item.category}</span>
                          </>
                        )}
                      </div>
                      <h4
                        onClick={() => handleReadOrScrape(item)}
                        className={`text-base font-semibold transition-colors cursor-pointer dir-rtl font-nastaliq leading-relaxed ${
                          isLight
                            ? 'text-neutral-900 hover:text-emerald-700'
                            : 'text-white hover:text-emerald-300'
                        }`}
                      >
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReadOrScrape(item)}
                      disabled={isFetching}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                        isLight
                          ? 'text-emerald-900 bg-white border-emerald-200 hover:bg-emerald-50'
                          : 'text-white bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
                      }`}
                    >
                      {isFetching ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{t.viewDetails}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
