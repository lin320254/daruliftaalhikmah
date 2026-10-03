import React, { useState, useEffect } from 'react';
import { Lang, i18n } from '../translations.js';
import { ChapterItem, DarDepartment, FatwaRecord, FatwaSummary, Theme } from '../types.js';
import { Loader2, ChevronLeft, ChevronRight, CheckSquare, Square, Download, Eye, ExternalLink } from 'lucide-react';

interface BrowseTabProps {
  lang: Lang;
  theme?: Theme;
  dars: DarDepartment[];
  onSelectFatwa: (fatwa: FatwaRecord) => void;
  onBatchScrapeUrls: (urls: string[]) => void;
  onScrapedSingle: (fatwa: FatwaRecord) => void;
}

export const BrowseTab: React.FC<BrowseTabProps> = ({
  lang,
  theme = 'light',
  dars,
  onSelectFatwa,
  onBatchScrapeUrls,
  onScrapedSingle,
}) => {
  const t = i18n[lang];
  const isLight = theme === 'light';
  const [selectedDar, setSelectedDar] = useState<string>('deoband');
  const [selectedBab, setSelectedBab] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [fatwaList, setFatwaList] = useState<FatwaSummary[]>([]);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  const loadData = async (darSlug: string, babId: string, pageNum: number) => {
    setLoading(true);
    setSelectedUrls(new Set());
    try {
      let q = `/api/scrape/browse?dar=${darSlug}&page=${pageNum}`;
      if (babId) q += `&bab=${babId}`;

      const res = await fetch(q);
      const data = await res.json();
      if (data.success) {
        setFatwaList(data.fatwas || []);
        if (data.chapters && data.chapters.length > 0) {
          setChapters(data.chapters);
        }
        setHasNext(data.hasNext || false);
      }
    } catch (e) {
      console.error('Error browsing fatwas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDar, selectedBab, page);
  }, [selectedDar, selectedBab, page]);

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
    if (selectedUrls.size === fatwaList.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(fatwaList.map((f) => f.url)));
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

  const currentDarObj = dars.find((d) => d.slug === selectedDar);

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div
        className={`rounded-2xl p-6 sm:p-8 space-y-4 transition-colors ${
          isLight
            ? 'bg-white border border-emerald-100/90 shadow-sm'
            : 'border border-neutral-800 bg-neutral-900/40'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2
              className={`text-xl sm:text-2xl font-bold tracking-tight mb-1 ${
                isLight ? 'text-emerald-950' : 'text-white'
              }`}
            >
              {lang === 'ur'
                ? 'دار الافتاء اور ابواب کے لحاظ سے فتاویٰ اخذ کریں'
                : lang === 'my'
                ? 'ဖသ်ဝါဌာနနှင့် ကဏ္ဍအလိုက် ဆွဲယူလေ့လာခြင်း'
                : 'Browse by Institution & Chapters'}
            </h2>
            <p
              className={`text-xs ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}
            >
              {lang === 'ur'
                ? 'دار العلوم دیوبند اور دیگر مستند دار الافتاء کے ابواب اور صفحات کی فہرست سے فتاویٰ ڈاؤنلوڈ کریں'
                : lang === 'my'
                ? 'ဒါရူလ်အိုလူးမ် ဒေအိုဘန်း နှင့် အခြားထင်ရှားသော ဖသ်ဝါဌာနများ၏ အခန်းကဏ္ဍများကို တိုက်ရိုက်ဆွဲယူပါ'
                : 'Browse verified chapters from Darul Uloom Deoband and affiliated jurisprudence academies'}
            </p>
          </div>

          {/* Dar Selector */}
          <div className="flex items-center gap-2">
            <label
              className={`text-xs font-medium shrink-0 ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}
            >
              {t.dar}:
            </label>
            <select
              value={selectedDar}
              onChange={(e) => {
                setSelectedDar(e.target.value);
                setSelectedBab('');
                setPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none border ${
                isLight
                  ? 'bg-white border-neutral-300 text-neutral-800 focus:border-emerald-600 shadow-2xs'
                  : 'bg-neutral-950 border-neutral-700 text-white focus:border-emerald-500'
              }`}
            >
              {dars.map((dar) => (
                <option key={dar.slug} value={dar.slug}>
                  {dar.nameUrdu} {lang === 'my' ? `(${dar.nameMy})` : lang === 'en' ? `(${dar.nameEn})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Institution Info Card */}
        {currentDarObj && (
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight
                ? 'bg-emerald-50/50 border-emerald-100 text-neutral-700'
                : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-semibold font-nastaliq ${isLight ? 'text-emerald-950' : 'text-white'}`}>
                {currentDarObj.nameUrdu}
              </span>
              <span aria-hidden="true">·</span>
              <span>{currentDarObj.location}</span>
              {currentDarObj.countEstimate && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-mono tabular-nums font-semibold">
                    {currentDarObj.countEstimate}
                  </span>
                </>
              )}
            </div>
            <a
              href={currentDarObj.website}
              target="_blank"
              rel="noreferrer noopener"
              dir="ltr"
              className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors font-mono font-medium"
            >
              <span>{currentDarObj.website.replace('https://', '')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Chapters / Abwab */}
        {chapters.length > 0 && (
          <div>
            <span
              className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
                isLight ? 'text-emerald-800' : 'text-neutral-400'
              }`}
            >
              {lang === 'ur'
                ? 'فہرست ابواب (Chapters)'
                : lang === 'my'
                ? 'အခန်းကဏ္ဍများ (Chapters / ابواب)'
                : 'Chapters (Abwab)'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setSelectedBab('');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  !selectedBab
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isLight
                    ? 'bg-emerald-50/50 text-neutral-800 hover:bg-emerald-100 border border-emerald-100'
                    : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                {lang === 'ur' ? 'تمام ابواب (All)' : lang === 'my' ? 'အားလုံး (All)' : 'All Chapters'}
              </button>
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedBab(ch.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors font-nastaliq leading-normal ${
                    selectedBab === ch.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-emerald-50/50 text-neutral-800 hover:bg-emerald-100 border border-emerald-100'
                      : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  {ch.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Toolbar for Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors border ${
              isLight
                ? 'text-neutral-700 bg-white border-neutral-200 hover:bg-neutral-50'
                : 'text-neutral-300 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            {selectedUrls.size === fatwaList.length && fatwaList.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-neutral-400" />
            )}
            <span>
              {selectedUrls.size === fatwaList.length && fatwaList.length > 0
                ? t.deselectAll
                : t.selectAll}
            </span>
          </button>

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

          <button
            onClick={() => onBatchScrapeUrls(fatwaList.map((f) => f.url))}
            disabled={fatwaList.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors border disabled:opacity-40 ${
              isLight
                ? 'text-neutral-700 bg-white border-neutral-200 hover:bg-neutral-50'
                : 'text-neutral-300 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.scrapeAllPage} ({fatwaList.length})</span>
          </button>
        </div>

        <div className="text-xs text-neutral-500 font-mono">
          {t.page}: <span className={`font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>{page}</span>
        </div>
      </div>

      {/* Main Table / Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-neutral-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">{t.loading}</p>
        </div>
      ) : fatwaList.length === 0 ? (
        <div
          className={`py-20 text-center rounded-2xl border ${
            isLight
              ? 'bg-white border-emerald-100 text-neutral-600'
              : 'bg-neutral-900/20 border-neutral-800 text-neutral-400'
          }`}
        >
          <p className="text-sm">{t.noData}</p>
        </div>
      ) : (
        <div
          className={`rounded-2xl overflow-hidden border shadow-xs ${
            isLight
              ? 'bg-white border-emerald-100'
              : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <div className={`divide-y ${isLight ? 'divide-emerald-50' : 'divide-neutral-800'}`}>
            {fatwaList.map((item, idx) => {
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
                        <span className="font-nastaliq text-emerald-900 font-medium">{item.dar}</span>
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
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
          className={`flex items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors border ${
            isLight
              ? 'text-neutral-700 bg-white border-neutral-200 hover:bg-neutral-50'
              : 'text-neutral-300 bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t.previousPage}</span>
        </button>

        <span className="text-xs text-neutral-500 font-mono">
          {t.page} {page}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNext || loading}
          className={`flex items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors border ${
            isLight
              ? 'text-neutral-700 bg-white border-neutral-200 hover:bg-neutral-50'
              : 'text-neutral-300 bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
          }`}
        >
          <span>{t.nextPage}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
