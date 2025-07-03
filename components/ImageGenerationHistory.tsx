"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, Image, AlertCircle, Download, Copy } from 'lucide-react';

interface ImageGenerationRecord {
  $id: string;
  userId: string;
  prompt: string;
  originalPrompt: string;
  revisedPrompt?: string;
  resolution: string;
  amount: number;
  imageUrls: string[];
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: string;
  generationTime?: number;
  formattedDate: string;
  hasImages: boolean;
}

interface HistoryResponse {
  documents: ImageGenerationRecord[];
  total: number;
  success: boolean;
}

const ImageGenerationHistory: React.FC = () => {
  const [history, setHistory] = useState<ImageGenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history/image');

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data: HistoryResponse = await response.json();
      console.log('Fetched history:', data);
      setHistory(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const openImageModal = (url: string) => {
    setSelectedImage(url);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-400">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">Error loading history</p>
          <p className="text-sm text-gray-300">{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-gray-400">
          <Image className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">No image generations yet</p>
          <p className="text-sm text-gray-500">Your generated images will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-100 mb-2">Image Generation History</h3>
        <p className="text-gray-400">Total generations: {history.length}</p>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {history.map((record) => (
          <div key={record.$id} className="bg-gray-700/50 border border-gray-600 rounded-lg shadow-sm overflow-hidden backdrop-blur-sm">
            {/* Header - Always visible */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-600/30 transition-colors"
              onClick={() => toggleExpanded(record.$id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {expandedItems.has(record.$id) ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-100 truncate">
                      {record.prompt}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {record.createdAt}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${record.status === 'success'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  {record.formattedDate}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedItems.has(record.$id) && (
              <div className="border-t border-gray-600 p-4 bg-gray-800/30">
                {/* Full Prompt */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-200">Original Prompt</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(record.prompt);
                      }}
                      className="p-1 hover:bg-gray-600/50 rounded transition-colors"
                      title="Copy prompt"
                    >
                      <Copy className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-200 bg-gray-700/50 p-3 rounded border border-gray-600">
                    {record.prompt}
                  </p>
                </div>

                {/* Revised Prompt (if available) */}
                {record.revisedPrompt && record.revisedPrompt !== record.prompt && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-200">Revised Prompt</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(record.revisedPrompt!);
                        }}
                        className="p-1 hover:bg-gray-600/50 rounded transition-colors"
                        title="Copy revised prompt"
                      >
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-200 bg-gray-700/50 p-3 rounded border border-gray-600">
                      {record.revisedPrompt}
                    </p>
                  </div>
                )}

                {/* Generation Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
                    <div className="text-xs text-gray-400">Resolution</div>
                    <div className="text-sm font-medium text-gray-200">{record.resolution}</div>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
                    <div className="text-xs text-gray-400">Amount</div>
                    <div className="text-sm font-medium text-gray-200">{record.amount}</div>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
                    <div className="text-xs text-gray-400">Status</div>
                    <div className={`text-sm font-medium ${record.status === 'success' ? 'text-green-400' : 'text-red-400'
                      }`}>
                      {record.status}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {record.errorMessage && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-sm text-red-300">{record.errorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Generated Images */}
                {record.status === "success" && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-200 mb-3">Generated Images</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {record.imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Generated image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-600"
                            onClick={() => openImageModal(url)}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadImage(url, `image-${record.$id}-${index + 1}.png`);
                              }}
                              className="p-2 bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-gray-700/80 transition-colors border border-gray-600"
                              title="Download image"
                            >
                              <Download className="h-4 w-4 text-gray-200" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {
        selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
            <div className="max-w-4xl max-h-full relative">
              <button
                onClick={closeImageModal}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
              <img
                src={selectedImage}
                alt="Full size generated image"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )
      }
    </div >
  );
};

export default ImageGenerationHistory;