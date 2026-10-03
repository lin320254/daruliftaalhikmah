import React from 'react';
import { Lang } from '../translations.js';
import { Theme } from '../types.js';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface BatchProgressModalProps {
  lang: Lang;
  theme?: Theme;
  total: number;
  completed: number;
  successful: number;
  failed: number;
  currentTitle?: string;
  isFinished: boolean;
  onClose: () => void;
}

export const BatchProgressModal: React.FC<BatchProgressModalProps> = ({
  lang,
  theme = 'light',
  total,
  completed,
  successful,
  failed,
  currentTitle,
  isFinished,
  onClose,
}) => {
  const isLight = theme === 'light';
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 border transition-colors ${
          isLight
            ? 'bg-white border-emerald-100 text-neutral-900'
            : 'bg-neutral-900 border-neutral-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3
            className={`text-base font-bold ${
              isLight ? 'text-emerald-950' : 'text-white'
            } ${lang === 'ur' ? 'font-nastaliq' : ''}`}
          >
            {isFinished
              ? lang === 'ur'
                ? 'بیچ اخراج مکمل ہو گیا'
                : lang === 'my'
                ? 'ဆွဲယူမှု ပြီးစီးပါပြီ'
                : 'Batch Scraping Completed'
              : lang === 'ur'
              ? 'فتاویٰ اخذ کیے جا رہے ہیں...'
              : lang === 'my'
              ? 'ဖသ်ဝါများကို အစုလိုက်ဆွဲယူနေပါသည်...'
              : 'Batch Scraping in Progress...'}
          </h3>
          {isFinished ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
            <span>{percent}%</span>
            <span>
              {completed} / {total}
            </span>
          </div>
          <div
            className={`w-full h-2.5 rounded-full overflow-hidden ${
              isLight ? 'bg-emerald-100' : 'bg-neutral-800'
            }`}
          >
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              isLight
                ? 'bg-emerald-50/60 border-emerald-100 text-neutral-700'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
            }`}
          >
            <span className="block mb-1 font-medium">
              {lang === 'ur' ? 'کامیاب' : lang === 'my' ? 'အောင်မြင်မှု' : 'Successful'}
            </span>
            <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
              {successful}
            </span>
          </div>
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              isLight
                ? 'bg-red-50/60 border-red-100 text-neutral-700'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
            }`}
          >
            <span className="block mb-1 font-medium">
              {lang === 'ur' ? 'ناکام' : lang === 'my' ? 'မအောင်မြင်မှု' : 'Failed'}
            </span>
            <span className="text-xl font-bold text-red-600 font-mono tabular-nums">
              {failed}
            </span>
          </div>
        </div>

        {/* Current URL or item title */}
        {!isFinished && currentTitle && (
          <div
            className={`text-xs truncate p-2.5 rounded-xl border ${
              isLight
                ? 'bg-neutral-50 border-neutral-200 text-neutral-600'
                : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-400'
            }`}
          >
            <span className="text-neutral-400 mr-1">
              {lang === 'ur' ? 'فی الوقت:' : lang === 'my' ? 'လက်ရှိ:' : 'Current:'}
            </span>
            <span className="font-mono text-emerald-700">{currentTitle}</span>
          </div>
        )}

        {isFinished && failed > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'ur'
                ? `${failed} لنکس اخذ نہیں ہو سکے، باقی کامیاب فتاویٰ محفوظ ہو چکے ہیں۔`
                : lang === 'my'
                ? `${failed} ခု ဆာဗာမှ ပြန်ကြားမှုမရသဖြင့် ကျန်ရှိသည်များကို အောင်မြင်စွာ သိမ်းဆည်းခဲ့သည်။`
                : `${failed} URLs could not be scraped. Successful items have been saved.`}
            </span>
          </div>
        )}

        {isFinished && (
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs ${
              lang === 'ur' ? 'font-nastaliq' : ''
            }`}
          >
            {lang === 'ur'
              ? 'محفوظ شدہ فتاویٰ کی فہرست دیکھیں'
              : lang === 'my'
              ? 'သိမ်းဆည်းထားသော စာရင်းကြည့်မည်'
              : 'View Extracted Fatwas'}
          </button>
        )}
      </div>
    </div>
  );
};
