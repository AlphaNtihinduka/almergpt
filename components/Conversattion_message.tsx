"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, User, Bot, RefreshCw, AlertCircle, Search, Filter } from 'lucide-react';

const ConversationHistoryMessage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/history/conversation');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTokenUsage = (tokenUsageString: string | undefined) => {
    try {
      const usage = JSON.parse(tokenUsageString || '{}');
      return usage.total_tokens || 0;
    } catch {
      return 0;
    }
  };

  const groupConversationsByDate = (conversations: Conversation[]) => {
    const groups: { [date: string]: Conversation[] } = {};
    conversations.forEach(conv => {
      const date = formatDate(conv.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(conv);
    });
    return groups;
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.userMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.assistantMessage.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'recent') {
      const isRecent = new Date(conv.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && isRecent;
    }

    return matchesSearch;
  });

  const conversationGroups = groupConversationsByDate(filteredConversations);

  const LoadingState = () => (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3 text-gray-600">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span>Loading conversations...</span>
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load conversations</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={fetchConversations}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
      >
        <RefreshCw className="h-4 w-4" />
        <span>Retry</span>
      </button>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
      <p className="text-gray-600">Start a new conversation to see it here.</p>
    </div>
  );

  const ConversationCard = ({
    conversation,
    onClick,
  }: {
    conversation: Conversation;
    onClick: (conversation: Conversation) => void;
  }) => (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(conversation)}
    >
      <div className=" flex items-start justify-between mb-3">
        < div className="flex items-center space-x-2" >
          <div className="p-1 bg-blue-100 rounded">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">You</span>
        </div >
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{new Date(conversation.timestamp).toLocaleTimeString()}</span>
        </div>
      </div >

      <div className="mb-3">
        <p className="text-sm text-gray-800 line-clamp-2">{conversation.userMessage}</p>
      </div>

      <div className="flex items-start space-x-2 mb-3">
        <div className="p-1 bg-green-100 rounded">
          <Bot className="h-4 w-4 text-green-600" />
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 flex-1">{conversation.assistantMessage}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="px-2 py-1 bg-gray-100 rounded">{conversation.model}</span>
        <span>{getTokenUsage(conversation.tokenUsage)} tokens</span>
      </div>
    </div >
  );

  interface Conversation {
    $id: string;
    timestamp: string;
    userMessage: string;
    assistantMessage: string;
    model: string;
    tokenUsage: string;
    // add other fields if needed
  }

  interface ConversationModalProps {
    conversation: Conversation;
    onClose: () => void;
  }

  const ConversationModal: React.FC<ConversationModalProps> = ({ conversation, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className=" p-6 border-b border-gray-200">
          < div className="flex items-center justify-between" >
            <h3 className="text-lg font-semibold text-gray-900">Conversation Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div >
        </div >

        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{new Date(conversation.timestamp).toLocaleString()}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">You</p>
                <p className="text-sm text-gray-800">{conversation.userMessage}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bot className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Assistant</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{conversation.assistantMessage}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Model:</span>
                <span className="ml-2 font-medium">{conversation.model}</span>
              </div>
              <div>
                <span className="text-gray-600">Tokens:</span>
                <span className="ml-2 font-medium">{getTokenUsage(conversation.tokenUsage)}</span>
              </div>
            </div>
          </div>
        </div>
      </div >
    </div >
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Conversation History</h1>
        <p className="text-gray-600">Review your past conversations and interactions</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All conversations</option>
              <option value="recent">Recent (7 days)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState />
      ) : Object.keys(conversationGroups).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {Object.entries(conversationGroups).map(([date, conversations]) => {
            const typedConversations = conversations as Conversation[];
            return (
              <div key={date}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>{date}</span>
                  <span className="text-sm text-gray-500 font-normal">({typedConversations.length})</span>
                </h2>
                <div className="grid gap-4 grid-cols-1">
                  {typedConversations.map((conversation) => (
                    <ConversationCard
                      key={conversation.$id}
                      conversation={conversation}
                      onClick={(conversation) => setSelectedConversation(conversation)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedConversation && (
        <ConversationModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </div>
  );
};

// Calendar icon component (since it's not in lucide-react by default)
const Calendar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default ConversationHistoryMessage;