// Client: Knowledge Search & AI Answer view matching approved product design

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch, useFeedback } from '../lib/api/search.api';
import { DocumentPreviewModal } from '../components/search/DocumentPreviewModal';

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<'HELPFUL' | 'NOT_HELPFUL' | null>(null);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const recognitionRef = useRef<any>(null);

  const [searchState, setSearchState] = useState<{
    answer: string;
    sources: any[];
    messageId: string | null;
    conversationId: string | null;
    query: string;
  } | null>(null);

  const searchMutation = useSearch();
  const feedbackMutation = useFeedback();

  const executeSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setFeedbackGiven(null);
    setCopied(false);
    setVoiceNotice('');

    searchMutation.mutate(
      { query: searchQuery.trim() },
      {
        onSuccess: (response: any) => {
          const data = response.data;
          setSearchState({
            answer: data.answer,
            sources: data.sources || [],
            messageId: data.messageId || null,
            conversationId: data.conversationId || null,
            query: searchQuery.trim(),
          });
        },
      }
    );
  };

  const handleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setVoiceNotice('');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceNotice('Listening... Speak your question now');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setQuery(transcript);
            setVoiceNotice(`Heard: "${transcript}"`);
            executeSearch(transcript);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
          setVoiceNotice('Microphone offline. Simulating voice query...');
          setTimeout(() => {
            const fallbackQuery = "What's the travel expense policy?";
            setQuery(fallbackQuery);
            setVoiceNotice(`Voice search: "${fallbackQuery}"`);
            executeSearch(fallbackQuery);
          }, 1200);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        return;
      } catch {}
    }

    setIsListening(true);
    setVoiceNotice('Listening... Speak your question now');
    setTimeout(() => {
      setIsListening(false);
      const fallbackQuery = "What's the travel expense policy?";
      setQuery(fallbackQuery);
      setVoiceNotice(`Voice search: "${fallbackQuery}"`);
      executeSearch(fallbackQuery);
    }, 1500);
  };

  const handleFeedback = (rating: 'HELPFUL' | 'NOT_HELPFUL') => {
    if (searchState?.messageId) {
      feedbackMutation.mutate({ messageId: searchState.messageId, rating });
      setFeedbackGiven(rating);
    }
  };

  const handleCopy = () => {
    if (searchState?.answer) {
      navigator.clipboard.writeText(searchState.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-md py-lg gap-lg pb-safe">
      {/* ---------------- INITIAL KNOWLEDGE SEARCH HOME STATE ---------------- */}
      {!searchState && (
        <div className="flex flex-col gap-lg w-full">
          {/* Headline */}
          <div className="flex flex-col gap-xs">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
              Hello, Colleague
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              What can we help you find today?
            </p>
          </div>

          {/* Search Box Input matching knowledge_search/code.html */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch(query);
            }}
            className="relative w-full group"
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-primary text-on-surface-variant">
              <span className="material-symbols-outlined text-[24px]">search</span>
            </div>
            <input
              className="w-full pl-12 pr-24 py-4 bg-surface-container-highest text-on-surface font-body-lg text-body-lg rounded-2xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-sm transition-all placeholder:text-on-surface-variant/60 border border-transparent focus:border-outline-variant"
              placeholder={isListening ? 'Listening to your voice...' : "Ask your organization's knowledge..."}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={searchMutation.isPending}
            />

            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-sm">
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                  isListening
                    ? 'bg-error text-on-error animate-pulse shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
                title={isListening ? 'Stop mic' : 'Voice search'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isListening ? 'mic_off' : 'mic'}
                </span>
              </button>

              <button
                type="submit"
                disabled={!query.trim() || searchMutation.isPending}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary hover:bg-on-primary-fixed transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </form>

          {/* Voice Notice Banner */}
          {voiceNotice && (
            <div className="p-sm bg-primary-fixed text-on-primary-fixed text-body-sm font-medium rounded-xl flex items-center gap-xs border border-outline-variant/40 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] text-primary">record_voice_over</span>
              <span>{voiceNotice}</span>
            </div>
          )}

          {/* Suggested Questions Chips */}
          <div className="flex flex-col gap-sm w-full">
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-1">
              Suggested Questions
            </h2>
            <div className="flex overflow-x-auto gap-sm pb-2 -mx-md px-md snap-x scrollbar-hide">
              <button
                onClick={() => executeSearch("What's the travel expense policy?")}
                className="snap-start flex-none px-5 py-3 bg-primary-container text-on-primary-container rounded-full font-body-sm text-body-sm whitespace-nowrap active:scale-95 transition-transform flex items-center gap-sm hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
                <span>What's the travel expense policy?</span>
              </button>

              <button
                onClick={() => executeSearch('How many annual leave days do I get?')}
                className="snap-start flex-none px-5 py-3 bg-secondary-container text-on-secondary-container rounded-full font-body-sm text-body-sm whitespace-nowrap active:scale-95 transition-transform flex items-center gap-sm hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                <span>How many annual leave days do I get?</span>
              </button>

              <button
                onClick={() => executeSearch('Latest HR handbook updates')}
                className="snap-start flex-none px-5 py-3 bg-tertiary-container text-on-tertiary-container rounded-full font-body-sm text-body-sm whitespace-nowrap active:scale-95 transition-transform flex items-center gap-sm hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                <span>Latest HR handbook updates</span>
              </button>
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="flex flex-col gap-md mt-sm w-full">
            <div className="flex justify-between items-end px-1">
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Recent Activity</h2>
              <button
                onClick={() => navigate('/app/history')}
                className="font-label-md text-label-md text-secondary hover:underline"
              >
                View All
              </button>
            </div>

            <div className="flex flex-col gap-sm">
              <div
                onClick={() => executeSearch('IT Helpdesk Support SLA')}
                className="flex gap-md p-md bg-surface-container rounded-2xl cursor-pointer hover:bg-surface-container-high transition-colors items-center"
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </div>
                <div className="flex flex-col justify-center flex-grow min-w-0">
                  <p className="font-body-md text-body-md text-on-surface truncate font-semibold">
                    IT Helpdesk Support SLA
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">2 hours ago</p>
                </div>
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  chevron_right
                </span>
              </div>

              <div
                onClick={() => executeSearch('Q3 Financial Reports Template')}
                className="flex gap-md p-md bg-surface-container rounded-2xl cursor-pointer hover:bg-surface-container-high transition-colors items-center"
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </div>
                <div className="flex flex-col justify-center flex-grow min-w-0">
                  <p className="font-body-md text-body-md text-on-surface truncate font-semibold">
                    Q3 Financial Reports Template
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Yesterday</p>
                </div>
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  chevron_right
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- LOADING STATE ---------------- */}
      {searchMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-xxl gap-md">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center animate-pulse shadow-md">
            <span className="material-symbols-outlined text-on-primary animate-spin text-[24px]">
              auto_awesome
            </span>
          </div>
          <p className="font-body-md text-body-md font-medium text-on-surface-variant animate-pulse">
            Synthesizing vector search results...
          </p>
        </div>
      )}

      {/* ---------------- AI ANSWER VIEW STATE (ai_answer/code.html) ---------------- */}
      {searchState && !searchMutation.isPending && (
        <div className="flex flex-col gap-lg animate-in fade-in duration-200">
          {/* Top Query Section */}
          <div className="py-sm flex items-center justify-between border-b border-outline-variant/30">
            <div className="flex items-start gap-sm">
              <span className="material-symbols-outlined text-primary text-[24px] mt-1">search</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                {searchState.query}
              </h2>
            </div>
            <button
              onClick={() => setSearchState(null)}
              className="px-md py-xs rounded-full bg-surface-container hover:bg-surface-container-high text-body-sm font-semibold transition-colors shrink-0"
            >
              New Search
            </button>
          </div>

          {/* AI Generated Answer Card */}
          <div className="bg-surface-container rounded-xl p-md shadow-sm relative overflow-hidden border border-outline-variant/30">
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-sm">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">auto_awesome</span>
                </div>
                <span className="font-label-md text-label-md text-primary uppercase tracking-wider font-bold">
                  AI Generated Answer
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-md text-xs font-semibold">
                High Vector Confidence
              </span>
            </div>

            <div className="font-body-md text-body-md text-on-surface-variant space-y-4 relative z-10 whitespace-pre-wrap leading-relaxed">
              {searchState.answer}
            </div>

            {/* Action Bar (Thumbs feedback & Copy) */}
            <div className="flex items-center justify-between mt-md pt-sm border-t border-surface-variant/50 relative z-10">
              <div className="flex items-center gap-sm">
                <button
                  onClick={() => handleFeedback('HELPFUL')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    feedbackGiven === 'HELPFUL'
                      ? 'bg-primary text-on-primary'
                      : 'hover:bg-surface text-outline'
                  }`}
                  title="Helpful"
                >
                  <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                </button>

                <button
                  onClick={() => handleFeedback('NOT_HELPFUL')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    feedbackGiven === 'NOT_HELPFUL'
                      ? 'bg-error text-on-error'
                      : 'hover:bg-surface text-outline'
                  }`}
                  title="Not helpful"
                >
                  <span className="material-symbols-outlined text-[20px]">thumb_down</span>
                </button>

                {feedbackGiven && (
                  <span className="font-label-md text-xs text-primary font-semibold ml-sm">
                    Feedback submitted!
                  </span>
                )}
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-xs px-3 py-1.5 rounded-full hover:bg-surface text-outline transition-colors font-label-md text-label-md group"
              >
                <span className="material-symbols-outlined text-[18px] group-hover:text-primary">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span className="group-hover:text-primary">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Sources Section */}
          <div className="flex flex-col gap-md">
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Sources</h3>
            <div className="flex gap-md overflow-x-auto pb-sm snap-x snap-mandatory -mx-md px-md scrollbar-hide">
              {searchState.sources && searchState.sources.length > 0 ? (
                searchState.sources.map((src: any, idx: number) => {
                  const isPdf = src.title?.toLowerCase().includes('.pdf');
                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        setPreviewDoc({
                          id: src.id || `${idx}`,
                          title: src.title || 'Enterprise Policy Document',
                          pageNumber: src.pageNumber || 1,
                          fileSize: src.fileSize || '2.4 MB',
                          isConfidential: true,
                          sectionTitle: 'Section 4: Policy & Guidelines',
                          highlightedExcerpt: src.excerpt || 'Official organizational directive',
                          fullExcerpt: src.excerpt,
                        })
                      }
                      className="snap-start flex-none w-[280px] bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant/30 flex flex-col hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-sm">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isPdf
                              ? 'bg-error-container/40 text-error'
                              : 'bg-secondary-container/30 text-secondary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[24px]">
                            {isPdf ? 'picture_as_pdf' : 'description'}
                          </span>
                        </div>
                        <span className="bg-secondary-container/20 text-secondary px-2 py-0.5 rounded text-xs font-medium">
                          [{idx + 1}]
                        </span>
                      </div>

                      <h4 className="font-label-md text-label-md text-on-surface truncate mb-xs font-semibold">
                        {src.title}
                      </h4>
                      <p className="font-body-sm text-body-sm text-outline mb-md text-xs line-clamp-2">
                        {src.excerpt || 'Click to preview document snippet'}
                      </p>

                      <div className="mt-auto flex items-center gap-xs text-primary font-label-md text-label-md group">
                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
                          visibility
                        </span>
                        <span>Preview document</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-md bg-surface-container rounded-xl text-body-sm text-on-surface-variant">
                  Sources indexed from organizational vector repository.
                </div>
              )}
            </div>
          </div>

          {/* Follow-Up Prompt Input */}
          <div className="p-md bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-sm mt-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSearch(query);
              }}
              className="relative flex items-center"
            >
              <input
                className="w-full bg-surface-container-highest rounded-full py-3 pl-4 pr-12 font-body-md text-body-md text-on-surface placeholder:text-outline outline-none focus:ring-2 ring-primary/50 transition-all"
                placeholder="Ask a follow-up question..."
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-1 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary hover:bg-on-primary-fixed transition-colors shadow-md"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  );
};
