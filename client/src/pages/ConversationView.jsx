// Client: Conversation Detail View matching Cognitive Enterprise Design System
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversationDetail } from '../lib/api/conversations.api';
import { useSearch } from '../lib/api/search.api';
export const ConversationView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, refetch } = useConversationDetail(id);
    const searchMutation = useSearch();
    const bottomRef = useRef(null);
    const [followUpQuery, setFollowUpQuery] = useState('');
    // Auto-scroll to bottom on update
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [data, searchMutation.isPending]);
    // Refetch when response arrives
    useEffect(() => {
        if (searchMutation.isSuccess) {
            refetch();
            setFollowUpQuery('');
        }
    }, [searchMutation.isSuccess, refetch]);
    const handleSend = (e) => {
        e.preventDefault();
        if (!followUpQuery.trim() || searchMutation.isPending)
            return;
        searchMutation.mutate({ query: followUpQuery.trim(), conversationId: id });
    };
    if (isLoading) {
        return (<div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="material-symbols-outlined text-primary animate-spin text-[28px]">progress_activity</span>
        <p className="text-xs text-on-surface-variant">Loading conversation thread...</p>
      </div>);
    }
    const conversation = data?.data;
    const messages = conversation?.messages || [];
    return (<div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto">
      {/* Conversation Thread Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/history')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors" title="Back to history">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-on-surface truncate max-w-lg">
              {conversation?.title || 'Knowledge Conversation'}
            </h2>
            <span className="text-[11px] text-on-surface-variant">
              {messages.length} messages in thread
            </span>
          </div>
        </div>

        <button onClick={() => navigate('/app/search')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary transition-colors">
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Query</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => {
            const isUser = msg.role === 'USER';
            return (<div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-xl shadow-xs ${isUser
                    ? 'bg-primary-container text-on-primary rounded-br-none'
                    : 'bg-surface-container-lowest border border-outline-variant/60 text-on-surface rounded-bl-none'}`}>
                {!isUser && (<div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    <span>AI Assistant</span>
                  </div>)}
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {msg.content}
                </p>
                <div className={`text-[10px] mt-2 flex items-center justify-end ${isUser ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>);
        })}

        {searchMutation.isPending && (<div className="flex justify-start">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary animate-spin text-[18px]">progress_activity</span>
              <span>Thinking and searching knowledge base...</span>
            </div>
          </div>)}

        <div ref={bottomRef}/>
      </div>

      {/* Sticky Bottom Search Bar */}
      <div className="pt-3 border-t border-outline-variant/40 shrink-0">
        <form onSubmit={handleSend} className="relative w-full shadow-sm rounded-xl bg-surface-container-lowest border border-outline-variant/60 flex items-center px-4 py-2.5 gap-2 focus-within:ring-2 focus-within:ring-primary-container focus-within:border-transparent transition-all">
          <span className="material-symbols-outlined text-outline text-[20px]">chat</span>
          <input type="text" value={followUpQuery} onChange={(e) => setFollowUpQuery(e.target.value)} placeholder="Ask a follow-up question in this thread..." disabled={searchMutation.isPending} className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-outline-variant outline-none font-normal min-w-0"/>
          <button type="submit" disabled={!followUpQuery.trim() || searchMutation.isPending} className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors disabled:opacity-40 shrink-0">
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>);
};
