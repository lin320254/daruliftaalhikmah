import { useState, useEffect } from 'react';
import { Lang, i18n } from './translations.js';
import { DarDepartment, FatwaRecord, Theme } from './types.js';
import { Header } from './components/Header.js';
import { UrlScraperTab } from './components/UrlScraperTab.js';
import { BrowseTab } from './components/BrowseTab.js';
import { SearchTab } from './components/SearchTab.js';
import { LibraryTab } from './components/LibraryTab.js';
import { FatwaDetailModal } from './components/FatwaDetailModal.js';
import { BatchProgressModal } from './components/BatchProgressModal.js';
import { downloadJson } from './utils/export.js';
import { CheckCircle2, ShieldCheck, Database } from 'lucide-react';

const STORAGE_KEY = 'darulifta_saved_fatwas';
const LANG_KEY = 'fatwa_studio_lang';
const THEME_KEY = 'fatwa_studio_theme';

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem(LANG_KEY) as Lang) || 'ur';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(THEME_KEY) as Theme) || 'light';
  });

  const [activeTab, setActiveTab] = useState<'url' | 'browse' | 'search' | 'library'>('url');
  const [dars, setDars] = useState<DarDepartment[]>([]);
  const [savedFatwas, setSavedFatwas] = useState<FatwaRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [recentScraped, setRecentScraped] = useState<FatwaRecord[]>([]);
  const [selectedFatwa, setSelectedFatwa] = useState<FatwaRecord | null>(null);

  // Batch progress state
  const [batchModal, setBatchModal] = useState<{
    open: boolean;
    total: number;
    completed: number;
    successful: number;
    failed: number;
    currentTitle?: string;
    isFinished: boolean;
  } | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFatwas));
    } catch (e) {
      console.error('Storage full or error saving fatwas:', e);
    }
  }, [savedFatwas]);

  // Load institutions catalog
  useEffect(() => {
    fetch('/api/scrape/dars')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.dars) {
          setDars(data.dars);
        }
      })
      .catch((e) => console.error('Failed to load dars:', e));
  }, []);

  const handleScraped = (fatwa: FatwaRecord) => {
    setSavedFatwas((prev) => {
      const existing = prev.findIndex((f) => f.id === fatwa.id || f.url === fatwa.url);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = fatwa;
        return copy;
      }
      return [fatwa, ...prev];
    });

    setRecentScraped((prev) => {
      const filtered = prev.filter((f) => f.id !== fatwa.id && f.url !== fatwa.url);
      return [fatwa, ...filtered];
    });

    showToast(
      lang === 'ur'
        ? 'فتویٰ کامیابی سے اخذ کر لیا گیا!'
        : lang === 'my'
        ? 'ဖသ်ဝါကို အောင်မြင်စွာ ဆွဲယူပြီးပါပြီ!'
        : 'Fatwa successfully scraped!'
    );
  };

  const handleStartBatch = async (urls: string[]) => {
    if (urls.length === 0) return;

    setBatchModal({
      open: true,
      total: urls.length,
      completed: 0,
      successful: 0,
      failed: 0,
      isFinished: false,
    });

    let succ = 0;
    let fail = 0;
    const scrapedList: FatwaRecord[] = [];

    for (let i = 0; i < urls.length; i++) {
      const currentUrl = urls[i];
      setBatchModal((prev) => (prev ? { ...prev, currentTitle: currentUrl } : null));

      try {
        const res = await fetch('/api/scrape/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentUrl }),
        });

        const data = await res.json();
        if (data.success && data.fatwa) {
          succ++;
          scrapedList.push(data.fatwa);
        } else {
          fail++;
        }
      } catch {
        fail++;
      }

      setBatchModal((prev) =>
        prev
          ? {
              ...prev,
              completed: i + 1,
              successful: succ,
              failed: fail,
            }
          : null
      );

      // Polite 250ms pause between requests
      await new Promise((r) => setTimeout(r, 250));
    }

    // Merge into saved
    if (scrapedList.length > 0) {
      setSavedFatwas((prev) => {
        const map = new Map(prev.map((item) => [item.id, item]));
        for (const item of scrapedList) {
          map.set(item.id, item);
        }
        return Array.from(map.values());
      });

      setRecentScraped((prev) => [...scrapedList, ...prev]);
    }

    setBatchModal((prev) => (prev ? { ...prev, isFinished: true } : null));
    showToast(
      lang === 'ur'
        ? `${succ} فتاویٰ کامیابی سے اخذ ہو چکے ہیں`
        : lang === 'my'
        ? `${succ} ခု အောင်မြင်စွာ ဆွဲယူပြီးပါပြီ`
        : `Batch completed: ${succ} items extracted`
    );
  };

  const handleDeleteFatwa = (id: string) => {
    setSavedFatwas((prev) => prev.filter((f) => f.id !== id));
    showToast(
      lang === 'ur' ? 'ریکارڈ حذف کر دیا گیا' : lang === 'my' ? 'ဖျက်ပြီးပါပြီ' : 'Record removed'
    );
  };

  const handleClearAll = () => {
    setSavedFatwas([]);
    showToast(
      lang === 'ur' ? 'تمام ریکارڈ صاف کر دیے گئے' : lang === 'my' ? 'အားလုံး ရှင်းလင်းပြီးပါပြီ' : 'Library cleared'
    );
  };

  const handleExportAll = () => {
    downloadJson(savedFatwas, `all_darulifta_fatwas_${Date.now()}.json`);
  };

  const handleUpdateFatwa = (updated: FatwaRecord) => {
    setSelectedFatwa(updated);
    setSavedFatwas((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setRecentScraped((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const t = i18n[lang];
  const isLight = theme === 'light';

  return (
    <div
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
      className={`min-h-screen flex flex-col transition-colors selection:bg-emerald-500/20 selection:text-emerald-900 ${
        isLight
          ? 'bg-[#fbfdfc] text-neutral-900'
          : 'bg-neutral-950 text-neutral-100'
      } ${lang === 'ur' ? 'font-nastaliq' : ''}`}
    >
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        savedCount={savedFatwas.length}
        onExportAll={handleExportAll}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header Strip */}
        <div
          className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b transition-colors ${
            isLight ? 'border-emerald-100' : 'border-neutral-800'
          }`}
        >
          <div>
            <div dir="ltr" className="flex items-center gap-2 text-[11px] sm:text-xs font-mono mb-1.5 whitespace-nowrap">
              <span className="text-emerald-700 font-semibold">darulifta.info</span>
              <span className={isLight ? 'text-neutral-400' : 'text-neutral-600'} aria-hidden="true">·</span>
              <span className={isLight ? 'text-neutral-600 font-medium' : 'text-neutral-300'}>
                darulifta-deoband.com
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isLight ? 'text-emerald-950' : 'text-white'
                } ${lang === 'ur' ? 'font-nastaliq leading-relaxed py-0.5' : ''}`}
              >
                {t.appTitle}
              </h1>

              {lang === 'ur' && (
                <span
                  dir="ltr"
                  className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-md border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-neutral-900 text-emerald-400 border-neutral-700'
                  }`}
                >
                  Darulifta Al_HikMah
                </span>
              )}
            </div>

            <p
              className={`text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              } ${lang === 'ur' ? 'font-nastaliq text-base' : ''}`}
            >
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border transition-colors ${
                isLight
                  ? 'bg-white border-emerald-100 text-neutral-700 shadow-2xs'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>
                {t.localCache}:{' '}
                <strong className={`font-mono tabular-nums ${isLight ? 'text-emerald-900' : 'text-white'}`}>
                  {savedFatwas.length}
                </strong>
              </span>
            </div>

            <div
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border transition-colors ${
                isLight
                  ? 'bg-white border-emerald-100 text-neutral-700 shadow-2xs'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t.verifiedVerdicts}</span>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'url' && (
          <UrlScraperTab
            lang={lang}
            theme={theme}
            onScraped={handleScraped}
            onStartBatch={handleStartBatch}
            onSelectFatwa={setSelectedFatwa}
            recentScraped={recentScraped}
          />
        )}

        {activeTab === 'browse' && (
          <BrowseTab
            lang={lang}
            theme={theme}
            dars={dars}
            onSelectFatwa={setSelectedFatwa}
            onBatchScrapeUrls={handleStartBatch}
            onScrapedSingle={handleScraped}
          />
        )}

        {activeTab === 'search' && (
          <SearchTab
            lang={lang}
            theme={theme}
            dars={dars}
            onSelectFatwa={setSelectedFatwa}
            onBatchScrapeUrls={handleStartBatch}
            onScrapedSingle={handleScraped}
          />
        )}

        {activeTab === 'library' && (
          <LibraryTab
            lang={lang}
            theme={theme}
            savedFatwas={savedFatwas}
            onSelectFatwa={setSelectedFatwa}
            onDeleteFatwa={handleDeleteFatwa}
            onClearAll={handleClearAll}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        className={`no-print border-t py-6 text-center text-xs transition-colors ${
          isLight
            ? 'border-emerald-100/80 bg-white/80 text-neutral-500'
            : 'border-neutral-800/80 bg-neutral-950 text-neutral-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className={lang === 'ur' ? 'font-nastaliq text-sm' : ''}>
            {lang === 'ur'
              ? 'دار الافتاء الحکمۃ — دار العلوم دیوبند اور دار الافتاء علمی و فقہی تحقیق کے لیے خودکار اسکریپر پلیٹ فارم'
              : lang === 'my'
              ? 'Darulifta Al_HikMah — သာသနာ့ သုတေသန နှင့် ဖသ်ဝါ လေ့လာဆန်းစစ်မှု အထောက်အကူပြု စနစ်'
              : 'Darulifta Al_HikMah — Scholarly jurisprudential research & automated extraction tool'}
          </p>
          <div className="flex items-center gap-4 font-nastaliq">
            <span className={isLight ? 'text-emerald-900 font-semibold' : 'text-neutral-300'}>
              دار الافتاء الحکمۃ
            </span>
            <span aria-hidden="true" className={isLight ? 'text-emerald-300' : 'text-neutral-700'}>·</span>
            <span dir="ltr" className={isLight ? 'text-emerald-700 font-mono' : 'text-neutral-400'}>
              Darulifta.info
            </span>
          </div>
        </div>
      </footer>

      {/* Reader Modal */}
      {selectedFatwa && (
        <FatwaDetailModal
          fatwa={selectedFatwa}
          onClose={() => setSelectedFatwa(null)}
          lang={lang}
          theme={theme}
          onUpdateFatwa={handleUpdateFatwa}
        />
      )}

      {/* Batch Scraping Progress Modal */}
      {batchModal && batchModal.open && (
        <BatchProgressModal
          lang={lang}
          theme={theme}
          total={batchModal.total}
          completed={batchModal.completed}
          successful={batchModal.successful}
          failed={batchModal.failed}
          currentTitle={batchModal.currentTitle}
          isFinished={batchModal.isFinished}
          onClose={() => {
            setBatchModal(null);
            setActiveTab('library');
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 ${
            lang === 'ur' ? 'left-6' : 'right-6'
          } z-50 flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            lang === 'ur' ? 'font-nastaliq text-sm' : ''
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
