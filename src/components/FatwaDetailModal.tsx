import React, { useState } from 'react';
import { Lang, i18n } from '../translations.js';
import { FatwaRecord, Theme } from '../types.js';
import { downloadJson, downloadMarkdown } from '../utils/export.js';
import { X, Copy, Check, Download, Printer, Sparkles, Loader2, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';

interface FatwaDetailModalProps {
  fatwa: FatwaRecord | null;
  onClose: () => void;
  lang: Lang;
  theme?: Theme;
  onUpdateFatwa: (updated: FatwaRecord) => void;
}

export const FatwaDetailModal: React.FC<FatwaDetailModalProps> = ({
  fatwa,
  onClose,
  lang,
  theme = 'light',
  onUpdateFatwa,
}) => {
  const t = i18n[lang];
  const isLight = theme === 'light';
  const [activeSubTab, setActiveSubTab] = useState<'original' | 'my' | 'en' | 'json'>('original');
  const [fontSize, setFontSize] = useState<'base' | 'lg' | 'xl'>('lg');
  const [copied, setCopied] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  if (!fatwa) return null;

  const handleCopy = () => {
    const text = `
${fatwa.title}
Fatwa No: ${fatwa.fatwaNo}
Institution: ${fatwa.dar}
Category: ${fatwa.category}
Date: ${fatwa.date}
URL: ${fatwa.url}

[QUESTION / سوال]
${fatwa.question}

[ANSWER / جواب]
${fatwa.answer}

${fatwa.signature || ''}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateSummary = async (targetLang: 'my' | 'en') => {
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fatwa.title,
          question: fatwa.question,
          answer: fatwa.answer,
          targetLang,
        }),
      });

      const data = await res.json();
      if (data.success && data.summary) {
        const updated: FatwaRecord = {
          ...fatwa,
          [targetLang === 'my' ? 'burmeseSummary' : 'englishSummary']: data.summary,
        };
        onUpdateFatwa(updated);
        setActiveSubTab(targetLang);
      } else {
        alert(data.error || 'Failed to generate summary');
      }
    } catch (e: any) {
      alert(e.message || 'Error communicating with AI service');
    } finally {
      setGeneratingAi(false);
    }
  };

  const textSizeClass =
    fontSize === 'base'
      ? 'text-base leading-relaxed'
      : fontSize === 'lg'
      ? 'text-lg leading-[2.4rem]'
      : 'text-xl leading-[2.8rem]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div
        className={`relative w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto border transition-colors ${
          isLight
            ? 'bg-white border-emerald-100'
            : 'bg-neutral-900 border-neutral-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 no-print ${
            isLight
              ? 'bg-emerald-50/60 border-emerald-100'
              : 'bg-neutral-950/60 border-neutral-800'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-2 font-mono">
              <span className="text-emerald-700 font-semibold">{fatwa.fatwaNo || fatwa.id}</span>
              <span aria-hidden="true">·</span>
              <span className={`font-nastaliq font-medium ${isLight ? 'text-emerald-900' : 'text-neutral-200'}`}>
                {fatwa.dar}
              </span>
              {fatwa.category && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-nastaliq">{fatwa.category}</span>
                </>
              )}
              {fatwa.date && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{fatwa.date}</span>
                </>
              )}
            </div>

            <h2
              className={`text-lg sm:text-xl font-bold dir-rtl font-nastaliq leading-relaxed ${
                isLight ? 'text-emerald-950' : 'text-white'
              }`}
            >
              {fatwa.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isLight
                ? 'text-neutral-400 hover:text-neutral-800 hover:bg-emerald-100/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs no-print ${
            isLight
              ? 'bg-white border-neutral-100 text-neutral-700'
              : 'bg-neutral-900 border-neutral-800 text-neutral-300'
          }`}
        >
          {/* Sub tabs */}
          <div
            className={`flex items-center gap-1 p-0.5 rounded-xl border ${
              isLight
                ? 'bg-emerald-50/70 border-emerald-200/60'
                : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            <button
              onClick={() => setActiveSubTab('original')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeSubTab === 'original'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-emerald-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              📖 {lang === 'ur' ? 'اصل فتویٰ (اردو / عربی)' : lang === 'my' ? 'မူရင်း (Urdu)' : 'Original (Urdu)'}
            </button>
            <button
              onClick={() => {
                if (!fatwa.burmeseSummary) {
                  handleGenerateSummary('my');
                } else {
                  setActiveSubTab('my');
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                activeSubTab === 'my'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-emerald-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>🇲🇲 {lang === 'ur' ? 'برمی خلاصہ' : 'မြန်မာဘာသာ'}</span>
              {!fatwa.burmeseSummary && <Sparkles className="w-3 h-3 text-emerald-600" />}
            </button>
            <button
              onClick={() => {
                if (!fatwa.englishSummary) {
                  handleGenerateSummary('en');
                } else {
                  setActiveSubTab('en');
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                activeSubTab === 'en'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-emerald-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>🇬🇧 English</span>
              {!fatwa.englishSummary && <Sparkles className="w-3 h-3 text-emerald-600" />}
            </button>
            <button
              onClick={() => setActiveSubTab('json')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors font-mono ${
                activeSubTab === 'json'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-emerald-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              JSON
            </button>
          </div>

          {/* Tools & Zoom */}
          <div className="flex items-center gap-1.5">
            {activeSubTab === 'original' && (
              <div
                className={`flex items-center gap-1 border-r pr-2 mr-1 ${
                  isLight ? 'border-neutral-200' : 'border-neutral-800'
                }`}
              >
                <button
                  onClick={() => setFontSize(fontSize === 'xl' ? 'lg' : 'base')}
                  className={`p-1 rounded-md transition-colors ${
                    isLight ? 'text-neutral-500 hover:text-emerald-800' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Font smaller"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFontSize(fontSize === 'base' ? 'lg' : 'xl')}
                  className={`p-1 rounded-md transition-colors ${
                    isLight ? 'text-neutral-500 hover:text-emerald-800' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Font larger"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors border ${
                isLight
                  ? 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.copyText}</span>
                </>
              )}
            </button>

            <button
              onClick={() => downloadMarkdown(fatwa, `fatwa_${fatwa.id}.md`)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors border ${
                isLight
                  ? 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
              title="Download Markdown"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>MD</span>
            </button>

            <button
              onClick={() => downloadJson(fatwa, `fatwa_${fatwa.id}.json`)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors border ${
                isLight
                  ? 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
              title="Download JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>JSON</span>
            </button>

            <button
              onClick={() => window.print()}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors border ${
                isLight
                  ? 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
              title="Print Fatwa"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.print}</span>
            </button>

            <a
              href={fatwa.url}
              target="_blank"
              rel="noreferrer noopener"
              className={`p-1.5 rounded-lg transition-colors ml-1 ${
                isLight ? 'text-neutral-500 hover:text-emerald-700' : 'text-neutral-400 hover:text-emerald-400'
              }`}
              title={t.sourceLink}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {generatingAi && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 text-xs border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              }`}
            >
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
              <span>{t.generatingSummary}</span>
            </div>
          )}

          {activeSubTab === 'original' && (
            <div className="space-y-6">
              {/* Question Section */}
              <div className="space-y-2">
                <div
                  className={`flex items-center justify-between text-xs font-bold uppercase tracking-wider ${
                    isLight ? 'text-amber-800' : 'text-amber-400'
                  }`}
                >
                  <span>{t.question}</span>
                  <span className="font-nastaliq text-sm">سوال</span>
                </div>
                <div
                  className={`p-5 rounded-2xl text-right dir-rtl leading-loose whitespace-pre-line shadow-2xs font-nastaliq ${
                    isLight
                      ? 'bg-amber-50/70 border border-amber-200/90 text-neutral-900'
                      : 'bg-amber-950/20 border border-amber-900/40 text-neutral-100'
                  }`}
                >
                  {fatwa.question}
                </div>
              </div>

              {/* Answer Section */}
              <div className="space-y-2">
                <div
                  className={`flex items-center justify-between text-xs font-bold uppercase tracking-wider ${
                    isLight ? 'text-emerald-800' : 'text-emerald-400'
                  }`}
                >
                  <span>{t.answer}</span>
                  <span className="font-nastaliq text-sm">جواب</span>
                </div>
                <div
                  className={`p-6 rounded-2xl text-right dir-rtl whitespace-pre-line shadow-2xs font-nastaliq ${
                    isLight
                      ? 'bg-emerald-50/70 border border-emerald-200/90 text-neutral-900'
                      : 'bg-emerald-950/15 border border-emerald-900/40 text-neutral-100'
                  } ${textSizeClass}`}
                >
                  {fatwa.answer}
                </div>
              </div>

              {/* Verified Signature / Seal */}
              {fatwa.signature && (
                <div
                  className={`p-4 rounded-xl text-right dir-rtl text-xs font-nastaliq border ${
                    isLight
                      ? 'bg-neutral-50/80 border-neutral-200 text-neutral-600'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
                  }`}
                >
                  {fatwa.signature}
                </div>
              )}
            </div>
          )}

          {/* Burmese Translation View */}
          {activeSubTab === 'my' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${isLight ? 'text-emerald-900' : 'text-emerald-400'}`}>
                  🇲🇲 {lang === 'ur' ? 'برمی خلاصہ و فقہی نکات' : t.aiSummaryTitle}
                </h3>
                <button
                  onClick={() => handleGenerateSummary('my')}
                  disabled={generatingAi}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors border ${
                    isLight
                      ? 'text-emerald-900 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      : 'text-emerald-300 bg-emerald-950/50 border-emerald-800/80 hover:bg-emerald-900/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'ur' ? 'دوبارہ خلاصہ بنائیں' : lang === 'my' ? 'ပြန်လည်ထုတ်လုပ်မည်' : 'Regenerate'}</span>
                </button>
              </div>

              {fatwa.burmeseSummary ? (
                <div
                  className={`p-6 rounded-2xl text-sm leading-loose whitespace-pre-line font-burmese border ${
                    isLight
                      ? 'bg-emerald-50/40 border-emerald-100 text-neutral-800 shadow-2xs'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-200'
                  }`}
                >
                  {fatwa.burmeseSummary}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <p className="text-xs mb-3">
                    {lang === 'ur'
                      ? 'برمی زبان میں خلاصہ فی الحال موجود نہیں۔'
                      : lang === 'my'
                      ? 'မြန်မာဘာသာ အနှစ်ချုပ် မရှိသေးပါ။'
                      : 'No Burmese translation generated yet.'}
                  </p>
                  <button
                    onClick={() => handleGenerateSummary('my')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-xs"
                  >
                    {t.translateBurmese}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* English View */}
          {activeSubTab === 'en' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${isLight ? 'text-emerald-900' : 'text-emerald-400'}`}>
                  🇬🇧 English Jurisprudential Breakdown
                </h3>
                <button
                  onClick={() => handleGenerateSummary('en')}
                  disabled={generatingAi}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors border ${
                    isLight
                      ? 'text-emerald-900 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      : 'text-emerald-300 bg-emerald-950/50 border-emerald-800/80 hover:bg-emerald-900/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'ur' ? 'دوبارہ تجزیہ بنائیں' : 'Regenerate Analysis'}</span>
                </button>
              </div>

              {fatwa.englishSummary ? (
                <div
                  className={`p-6 rounded-2xl text-sm leading-relaxed whitespace-pre-line border ${
                    isLight
                      ? 'bg-emerald-50/40 border-emerald-100 text-neutral-800 shadow-2xs'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-200'
                  }`}
                >
                  {fatwa.englishSummary}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <p className="text-xs mb-3">
                    {lang === 'ur'
                      ? 'انگریزی خلاصہ فی الحال موجود نہیں۔'
                      : 'No English summary generated yet.'}
                  </p>
                  <button
                    onClick={() => handleGenerateSummary('en')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-xs"
                  >
                    Generate English Breakdown
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Raw JSON View */}
          {activeSubTab === 'json' && (
            <div className="relative">
              <pre
                dir="ltr"
                className={`p-4 rounded-2xl border text-xs font-mono overflow-x-auto max-h-[500px] ${
                  isLight
                    ? 'bg-neutral-900 text-emerald-300 border-neutral-800'
                    : 'bg-neutral-950 text-emerald-300 border-neutral-800'
                }`}
              >
                {JSON.stringify(fatwa, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
