import React, { useState, useEffect } from 'react';

// --- Helper Components ---

const SkeletonLoader = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-gray-800 p-4 rounded-lg animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-3/4"></div>
      </div>
    ))}
  </div>
);

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay = ({ message }: ErrorDisplayProps) => (
  <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
    <strong className="font-bold">Error:</strong>
    <span className="block sm:inline ml-2">{message}</span>
  </div>
);

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock = ({
  language, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // For navigator.clipboard.writeText to work, the page needs to be served over HTTPS
    // or on localhost. It may not work in all sandboxed environments.
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers or insecure contexts
      try {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Fallback copy failed: ', e);
      }
    });
  };

  return (
    <div className="bg-gray-900 rounded-md my-4" >
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 rounded-t-md">
        <span className="text-gray-400 text-sm font-sans">{language}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white text-sm font-sans transition-colors"
        >
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto"><code className={`language-${language}`}>{code}</code></pre>
    </div >
  );
};


// --- Main History Component ---

interface ConversationHistoryItem {
  $id: string;
  $createdAt: string;
  question: string;
  response: string;
  codeType: string;
}

const ConversationHistory = () => {
  const [history, setHistory] = useState<ConversationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const getHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data from your API endpoint. 
        // Replace '/api/history' with the actual path to your route handler.
        const response = await fetch('/api/history/code');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch history: ${response.statusText}`);
        }

        const data = await response.json();
        // Sort data by creation date, newest first
        const sortedData = data.sort((a: {
          $createdAt: string
        }, b: { $createdAt: string }) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
        setHistory(sortedData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    getHistory();
  }, []);

  const handleToggle = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const renderContent = () => {
    if (loading) {
      return <SkeletonLoader />;
    }
    if (error) {
      return <ErrorDisplay message={error} />;
    }
    if (history.length === 0) {
      return <p className="text-center text-gray-500 py-10">No conversation history found.</p>
    }

    return history.map((item, index) => (
      <div key={item.$id} className="border-b border-gray-800 last:border-b-0">
        <button
          onClick={() => handleToggle(index)}
          className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-800/50 transition-colors duration-200 focus:outline-none focus:bg-gray-800/60"
        >
          <span className="font-medium text-lg text-gray-200 flex-1 pr-4">{item.question}</span>
          <span className={`transform transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="m6 9 6 6 6-6" /></svg>
          </span>
        </button>
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${activeIndex === index ? 'max-h-[1000px]' : 'max-h-0'}`}
        >
          <div className="px-6 pb-6 pt-2">
            <div className="whitespace-pre-wrap text-gray-300 font-sans leading-relaxed">
              {/* This logic assumes code is wrapped in ```, adapt if needed */}
              {item.response.split(/```([\s\S]*?)```/g).map((part, i) => {
                if (i % 2 === 1) {
                  const [lang, ...codeLines] = part.split('\n');
                  const code = codeLines.join('\n').trim();
                  return <CodeBlock key={i} language={lang.trim()} code={code} />;
                }
                return part.trim();
              })}
            </div>
            <div className="text-xs text-gray-500 mt-4 font-mono flex items-center justify-between">
              <span>{new Date(item.$createdAt).toLocaleString()}</span>
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">{item.codeType}</span>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-100">Conversation History</h1>
          <p className="text-gray-400 mt-2">Review your past interactions and generated code.</p>
        </header>
        <div className="bg-gray-800/40 rounded-lg shadow-2xl border border-gray-700/50 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ConversationHistory;
