import React from 'react';
import { Lang, i18n } from '../translations.js';
import { Theme } from '../types.js';
import { Download, Globe, BookOpen, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'url' | 'browse' | 'search' | 'library';
  setActiveTab: (tab: 'url' | 'browse' | 'search' | 'library') => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  savedCount: number;
  onExportAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  theme,
  setTheme,
  savedCount,
  onExportAll,
}) => {
  const t = i18n[lang];
  const isLight = theme === 'light';

  return (
    <header
      className={`no-print border-b backdrop-blur-md sticky top-0 z-40 transition-colors ${
        isLight
          ? 'border-emerald-100 bg-white/95 shadow-xs'
          : 'border-neutral-800 bg-neutral-950/90'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Bar: Brand + Controls */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold shadow-xs shrink-0 ${
                isLight
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-950 border border-emerald-800/60 text-emerald-400'
              }`}
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="min-w-0">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('url');
                }}
                className={`text-sm sm:text-base font-bold tracking-tight whitespace-nowrap block transition-colors leading-none py-0.5 ${
                  isLight
                    ? 'text-emerald-950 hover:text-emerald-700'
                    : 'text-white hover:text-emerald-400'
                } ${lang === 'ur' ? 'font-nastaliq text-base sm:text-lg' : ''}`}
              >
                {lang === 'ur' ? 'دار الافتاء الحکمۃ' : 'Darulifta Al_HikMah'}
              </a>
              <span
                dir="ltr"
                className={`text-[10px] sm:text-xs font-mono font-medium block whitespace-nowrap ${
                  isLight ? 'text-emerald-700/80' : 'text-neutral-400'
                }`}
              >
                {lang === 'ur' ? 'Darulifta Al_HikMah' : 'Islamic Research'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (hidden on mobile, shown on md+) */}
          <nav
            className={`hidden md:flex items-center gap-1 text-sm font-medium ${
              isLight ? 'text-neutral-600' : 'text-neutral-400'
            }`}
          >
            <button
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                lang === 'ur' ? 'font-nastaliq text-xs' : ''
              } ${
                activeTab === 'url'
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80 shadow-xs'
                    : 'bg-neutral-800 text-emerald-400 shadow-sm'
                  : isLight
                  ? 'hover:text-emerald-800 hover:bg-emerald-50/50'
                  : 'hover:text-neutral-200'
              }`}
            >
              {t.navUrlScrape}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                lang === 'ur' ? 'font-nastaliq text-xs' : ''
              } ${
                activeTab === 'search'
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80 shadow-xs'
                    : 'bg-neutral-800 text-emerald-400 shadow-sm'
                  : isLight
                  ? 'hover:text-emerald-800 hover:bg-emerald-50/50'
                  : 'hover:text-neutral-200'
              }`}
            >
              {t.navSearch}
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                lang === 'ur' ? 'font-nastaliq text-xs' : ''
              } ${
                activeTab === 'browse'
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80 shadow-xs'
                    : 'bg-neutral-800 text-emerald-400 shadow-sm'
                  : isLight
                  ? 'hover:text-emerald-800 hover:bg-emerald-50/50'
                  : 'hover:text-neutral-200'
              }`}
            >
              {t.navBrowse}
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap relative ${
                lang === 'ur' ? 'font-nastaliq text-xs' : ''
              } ${
                activeTab === 'library'
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80 shadow-xs'
                    : 'bg-neutral-800 text-emerald-400 shadow-sm'
                  : isLight
                  ? 'hover:text-emerald-800 hover:bg-emerald-50/50'
                  : 'hover:text-neutral-200'
              }`}
            >
              {t.navLibrary}
              {savedCount > 0 && (
                <span
                  className={`ml-1.5 text-xs tabular-nums font-mono font-bold ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  ({savedCount})
                </span>
              )}
            </button>
          </nav>

          {/* Right Controls: Theme + Language (+ Export) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {savedCount > 0 && (
              <button
                onClick={onExportAll}
                title={t.exportJson}
                className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isLight
                    ? 'text-emerald-900 bg-white border border-emerald-200 hover:bg-emerald-50'
                    : 'text-neutral-300 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.exportJson}</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(isLight ? 'dark' : 'light')}
              className={`inline-flex items-center justify-center w-8 h-8 sm:w-auto sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
              }`}
              title={isLight ? t.themeDark : t.themeWhiteGreen}
            >
              {isLight ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="hidden xl:inline ml-1 font-sans">
                    {lang === 'ur' ? 'سفید و سبز' : lang === 'my' ? 'အဖြူ-အစိမ်း' : 'White & Green'}
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="hidden xl:inline ml-1 font-sans">
                    {lang === 'ur' ? 'ڈارک تھیم' : lang === 'my' ? 'အမဲရောင်' : 'Dark'}
                  </span>
                </>
              )}
            </button>

            {/* Language Selector */}
            <div
              className={`relative inline-flex items-center rounded-lg p-0.5 border ${
                isLight
                  ? 'bg-white border-emerald-200'
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <Globe
                className={`w-3.5 h-3.5 ml-1.5 mr-0.5 shrink-0 ${
                  isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}
              />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className={`bg-transparent text-xs py-1 pl-1 pr-1.5 rounded focus:outline-none cursor-pointer font-medium ${
                  isLight ? 'text-neutral-800' : 'text-neutral-200'
                }`}
              >
                <option value="ur" className={isLight ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}>اردو</option>
                <option value="my" className={isLight ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}>🇲🇲 မြန်မာ</option>
                <option value="en" className={isLight ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}>🇬🇧 En</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row (Horizontal Scroll on mobile so nothing wraps/overlaps) */}
        <div className="md:hidden border-t py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab('url')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-xs font-semibold shrink-0 ${
              lang === 'ur' ? 'font-nastaliq' : ''
            } ${
              activeTab === 'url'
                ? isLight
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-neutral-800 text-emerald-400 shadow-sm'
                : isLight
                ? 'text-neutral-600 hover:bg-emerald-50'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.navUrlScrape}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-xs font-semibold shrink-0 ${
              lang === 'ur' ? 'font-nastaliq' : ''
            } ${
              activeTab === 'search'
                ? isLight
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-neutral-800 text-emerald-400 shadow-sm'
                : isLight
                ? 'text-neutral-600 hover:bg-emerald-50'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.navSearch}
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-xs font-semibold shrink-0 ${
              lang === 'ur' ? 'font-nastaliq' : ''
            } ${
              activeTab === 'browse'
                ? isLight
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-neutral-800 text-emerald-400 shadow-sm'
                : isLight
                ? 'text-neutral-600 hover:bg-emerald-50'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.navBrowse}
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-xs font-semibold shrink-0 ${
              lang === 'ur' ? 'font-nastaliq' : ''
            } ${
              activeTab === 'library'
                ? isLight
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-neutral-800 text-emerald-400 shadow-sm'
                : isLight
                ? 'text-neutral-600 hover:bg-emerald-50'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.navLibrary}
            {savedCount > 0 && (
              <span className="ml-1 text-[11px] font-mono tabular-nums opacity-90">
                ({savedCount})
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
