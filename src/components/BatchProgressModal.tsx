import React from 'react';
import { Lang } from '../translations.js';
import { Theme } from '../types.js';
import { Loader2, CheckCircle2, AlertCircle, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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

  const successLabel = lang === 'ur' ? 'کامیاب' : lang === 'my' ? 'အောင်မြင်မှု' : 'Successful';
  const failedLabel = lang === 'ur' ? 'ناکام' : lang === 'my' ? 'မအောင်မြင်မှု' : 'Failed';

  const chartData = [
    { name: successLabel, value: successful, color: '#059669' }, // Emerald-600
    { name: failedLabel, value: failed, color: '#ef4444' }, // Red-500
  ].filter((item) => item.value > 0);

  const successRatio = completed > 0 ? Math.round((successful / completed) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 border transition-colors my-auto ${
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
            <span className="block mb-1 font-medium">{successLabel}</span>
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
            <span className="block mb-1 font-medium">{failedLabel}</span>
            <span className="text-xl font-bold text-red-600 font-mono tabular-nums">
              {failed}
            </span>
          </div>
        </div>

        {/* Recharts Summary Chart on Finish */}
        {isFinished && (completed > 0) && (
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isLight
                ? 'bg-emerald-50/30 border-emerald-100'
                : 'bg-neutral-950/40 border-neutral-800/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-emerald-950' : 'text-neutral-200'}`}>
                <PieChartIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {lang === 'ur'
                    ? 'کامیابی کا تناسب (Ratio Summary)'
                    : lang === 'my'
                    ? 'အောင်မြင်မှု အချိုး အနှစ်ချုပ်'
                    : 'Scrape Ratio Summary'}
                </span>
              </span>
              <span className="text-emerald-700 font-mono font-bold">
                {successRatio}% {lang === 'ur' ? 'کامیاب' : lang === 'my' ? 'အောင်မြင်' : 'Success'}
              </span>
            </div>

            {chartData.length > 0 ? (
              <div className="h-40 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={3}
                      strokeWidth={1}
                      stroke={isLight ? '#ffffff' : '#171717'}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const itemPercent = Math.round(((data.value as number) / completed) * 100);
                          return (
                            <div
                              className={`px-3 py-1.5 rounded-lg shadow-lg border text-xs font-medium ${
                                isLight
                                  ? 'bg-white border-emerald-200 text-neutral-800'
                                  : 'bg-neutral-900 border-neutral-700 text-white'
                              }`}
                            >
                              <span className="font-semibold">{data.name}:</span>{' '}
                              <span className="font-mono font-bold text-emerald-600">
                                {data.value}
                              </span>{' '}
                              ({itemPercent}%)
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-lg font-black font-mono leading-none text-emerald-700">
                    {successRatio}%
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mt-0.5">
                    {lang === 'ur' ? 'کامیابی' : lang === 'my' ? 'အောင်မြင်' : 'Ratio'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-neutral-400">
                {lang === 'ur' ? 'کوئی ڈیٹا نہیں ملا' : 'No data recorded'}
              </div>
            )}

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-4 text-xs pt-1 border-t border-dashed border-emerald-100/60 dark:border-neutral-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-neutral-600 dark:text-neutral-400">{successLabel}:</span>
                <span className="font-mono font-bold text-emerald-700">{successful}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-neutral-600 dark:text-neutral-400">{failedLabel}:</span>
                <span className="font-mono font-bold text-red-600">{failed}</span>
              </div>
            </div>
          </div>
        )}

        {/* Current URL or item title while in progress */}
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
