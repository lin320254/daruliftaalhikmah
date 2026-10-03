import React, { useState } from 'react';
import { Lang, i18n } from '../translations.js';
import { FatwaRecord, Theme } from '../types.js';
import { downloadCsv, downloadJson } from '../utils/export.js';
import { Search as SearchIcon, Download, Trash2, Eye, FileText } from 'lucide-react';

interface LibraryTabProps {
  lang: Lang;
  theme?: Theme;
  savedFatwas: FatwaRecord[];
  onSelectFatwa: (fatwa: FatwaRecord) => void;
  onDeleteFatwa: (id: string) => void;
  onClearAll: () => void;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({
  lang,
  theme = 'light',
  savedFatwas,
  onSelectFatwa,
  onDeleteFatwa,
  onClearAll,
}) => {
  const t = i18n[lang];
  const isLight = theme === 'light';
  const [search, setSearch] = useState('');
  const [filterDar, setFilterDar] = useState('');

  const dars = Array.from(new Set(savedFatwas.map((f) => f.dar))).filter(Boolean);

  const filtered = savedFatwas.filter((f) => {
    const matchesSearch =
      !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.fatwaNo.toLowerCase().includes(search.toLowerCase()) ||
      (f.romanTitle && f.romanTitle.toLowerCase().includes(search.toLowerCase()));

    const matchesDar = !filterDar || f.dar === filterDar;

    return matchesSearch && matchesDar;
  });

  const handleExportJson = () => {
    downloadJson(filtered, `fatwas_export_${Date.now()}.json`);
  };

  const handleExportCsv = () => {
    downloadCsv(filtered, `fatwas_export_${Date.now()}.csv`);
  };

  const confirmMsg =
    lang === 'ur'
      ? 'کیا آپ تمام محفوظ شدہ فتاویٰ کو حذف کرنا چاہتے ہیں؟'
      : lang === 'my'
      ? 'အားလုံးကို ဖျက်ပစ်ရန် သေချာပါသလား?'
      : 'Clear all saved records?';

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
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
                ? 'محفوظ شدہ فتاویٰ کی لائبریری'
                : lang === 'my'
                ? 'ဆွဲယူသိမ်းဆည်းထားသော ဖသ်ဝါများ'
                : 'Scraped Fatwa Library'}
            </h2>
            <p
              className={`text-xs ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}
            >
              {lang === 'ur'
                ? 'آپ کے اخذ کردہ تمام فتاویٰ یہاں محفوظ ہیں جنہیں آپ با آسانی تلاش، مطالعہ اور JSON/CSV میں ڈاؤنلوڈ کر سکتے ہیں'
                : lang === 'my'
                ? 'စက်ထဲတွင် သိမ်းဆည်းထားပြီးဖြစ်သော ဖသ်ဝါများကို ရှာဖွေ၊ ဖတ်ရှု၊ JSON နှင့် CSV ဖြင့် ဒေါင်းလုဒ်ဆွဲပါ'
                : 'Locally cached verdicts ready for instant reading, filtering, and bulk data export'}
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportJson}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportJson}</span>
            </button>
            <button
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 border ${
                isLight
                  ? 'text-emerald-900 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                  : 'text-neutral-300 bg-neutral-900 border-neutral-700 hover:bg-neutral-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.exportCsv}</span>
            </button>
            {savedFatwas.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(confirmMsg)) {
                    onClearAll();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.clearAll}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                lang === 'ur'
                  ? 'محفوظ فتاویٰ میں تلاش کریں...'
                  : lang === 'my'
                  ? 'သိမ်းဆည်းထားသည်များထဲမှ ရှာဖွေပါ...'
                  : 'Filter saved library...'
              }
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs transition-colors border focus:outline-none ${
                isLight
                  ? 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-600 shadow-2xs'
                  : 'bg-neutral-950 border-neutral-700 text-white placeholder-neutral-500 focus:border-emerald-500'
              } ${lang === 'ur' ? 'font-nastaliq' : ''}`}
            />
          </div>

          {dars.length > 1 && (
            <select
              value={filterDar}
              onChange={(e) => setFilterDar(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs focus:outline-none font-nastaliq border ${
                isLight
                  ? 'bg-white border-neutral-300 text-neutral-800 focus:border-emerald-600'
                  : 'bg-neutral-950 border-neutral-700 text-white focus:border-emerald-500'
              }`}
            >
              <option value="">{t.allDars}</option>
              {dars.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Fatwas List */}
      {savedFatwas.length === 0 ? (
        <div
          className={`py-20 text-center rounded-2xl border space-y-2 ${
            isLight
              ? 'bg-white border-emerald-100 text-neutral-600'
              : 'bg-neutral-900/20 border-neutral-800 text-neutral-400'
          }`}
        >
          <FileText className="w-10 h-10 text-emerald-600/60 mx-auto" />
          <p className="text-sm font-medium">{t.noData}</p>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            {lang === 'ur'
              ? 'براہِ راست لنک سے یا ابواب کی فہرست سے فتاویٰ اخذ کریں، وہ سب یہاں خودبخود محفوظ ہو جائیں گے۔'
              : lang === 'my'
              ? 'URL ဆွဲယူခြင်း သို့မဟုတ် ခေါင်းစဉ်ရှာဖွေခြင်းမှ ဖသ်ဝါများကို ဆွဲယူပါက ဤနေရာတွင် အလိုအလျောက် သိမ်းဆည်းပေးမည်ဖြစ်သည်။'
              : 'Scrape fatwas using the URL scraper or Browse tab to store them here.'}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className={`py-12 text-center rounded-2xl border ${
            isLight
              ? 'bg-white border-emerald-100 text-neutral-600'
              : 'bg-neutral-900/20 border-neutral-800 text-neutral-400'
          }`}
        >
          <p className="text-sm">
            {lang === 'ur'
              ? 'تلاش کے مطابق کوئی فتویٰ نہیں ملا۔'
              : lang === 'my'
              ? 'ကိုက်ညီသော ဖသ်ဝါ မရှိပါ။'
              : 'No records match your filter.'}
          </p>
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
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isLight ? 'hover:bg-emerald-50/40' : 'hover:bg-neutral-800/40'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1.5 font-mono">
                    <span className="text-emerald-700 font-semibold">{item.fatwaNo || item.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-nastaliq text-emerald-900 font-medium">{item.dar}</span>
                    {item.category && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-nastaliq">{item.category}</span>
                      </>
                    )}
                    {item.date && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{item.date}</span>
                      </>
                    )}
                  </div>

                  <h3
                    onClick={() => onSelectFatwa(item)}
                    className={`text-base font-semibold transition-colors cursor-pointer dir-rtl font-nastaliq leading-relaxed ${
                      isLight
                        ? 'text-neutral-900 hover:text-emerald-700'
                        : 'text-white hover:text-emerald-300'
                    }`}
                  >
                    {item.title}
                  </h3>

                  <p className="text-xs text-neutral-500 line-clamp-1 mt-1 dir-rtl font-nastaliq">
                    {item.question}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => onSelectFatwa(item)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                      isLight
                        ? 'text-emerald-900 bg-white border-emerald-200 hover:bg-emerald-50'
                        : 'text-white bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.viewDetails}</span>
                  </button>

                  <button
                    onClick={() => onDeleteFatwa(item.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isLight
                        ? 'text-neutral-400 hover:text-red-600 hover:bg-red-50'
                        : 'text-neutral-400 hover:text-red-400 hover:bg-red-950/30'
                    }`}
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
