"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock, Music, ChevronDown, ChevronUp } from 'lucide-react';

type MusicHistoryItem = {
  id: string;
  prompt: string;
  status: string;
  processingTime: string;
  audioUrl: string;
  metadata: string;
};

const MusicHistory = () => {
  const [musicHistory, setMusicHistory] = useState<MusicHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [playingAudio, setPlayingAudio] = useState<{ audio: HTMLAudioElement | null; id: string } | null>(null);

  useEffect(() => {
    fetchMusicHistory();
  }, []);

  const fetchMusicHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history/music');

      if (!response.ok) {
        throw new Error('Failed to fetch music history');
      }

      const data = await response.json();
      setMusicHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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

  const handlePlayPause = (audioUrl: string, id: string) => {
    if (playingAudio && playingAudio.id === id) {
      // Pause current audio
      if (playingAudio.audio) {
        playingAudio.audio.pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio?.audio) {
        playingAudio.audio.pause();
      }

      // Play new audio
      const audio = new Audio(audioUrl);
      audio.play();
      setPlayingAudio({ audio, id });

      // Handle audio end
      audio.onended = () => {
        setPlayingAudio(null);
      };
    }
  };

  const formatMetadata = (metadataString: string) => {
    try {
      const metadata = JSON.parse(metadataString);
      return {
        model: metadata.model?.split('/').pop() || 'Unknown',
        timestamp: new Date(metadata.timestamp).toLocaleDateString(),
        fileSize: metadata.fileSize ? `${Math.round(metadata.fileSize / 1024)} KB` : 'Unknown'
      };
    } catch {
      return { model: 'Unknown', timestamp: 'Unknown', fileSize: 'Unknown' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your music history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchMusicHistory}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Music History</h1>
          <p className="text-gray-600">Click on any prompt to reveal the generated music</p>
        </div>

        {musicHistory.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No music generated yet</p>
            <p className="text-gray-400">Start creating some music to see your history here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {musicHistory.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              const metadata = formatMetadata(item.metadata);
              const isPlaying = playingAudio && playingAudio.id === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl"
                >
                  {/* Prompt Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{item.prompt}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-green-600 font-medium">✓ {item.status}</span>
                            <span className="text-sm text-gray-500 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {item.processingTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isExpanded && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPause(item.audioUrl, item.id);
                            }}
                            className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
                          >
                            {isPlaying ? (
                              <Pause className="w-5 h-5 text-purple-600" />
                            ) : (
                              <Play className="w-5 h-5 text-purple-600" />
                            )}
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      <div className="mt-4 space-y-4">
                        {/* Audio Player */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-700">Generated Music</h4>
                            <span className="text-sm text-gray-500">
                              {metadata.fileSize}
                            </span>
                          </div>
                          <audio
                            controls
                            className="w-full"
                            src={item.audioUrl}
                            onPlay={() => setPlayingAudio({ audio: null, id: item.id })}
                            onPause={() => setPlayingAudio(null)}
                          />
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-500 mb-1">Model</div>
                            <div className="text-sm font-medium text-gray-800">{metadata.model}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-500 mb-1">Generated</div>
                            <div className="text-sm font-medium text-gray-800">{metadata.timestamp}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-500 mb-1">Processing Time</div>
                            <div className="text-sm font-medium text-gray-800">{item.processingTime}</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                          <a
                            href={item.audioUrl}
                            download={`${item.prompt.replace(/\s+/g, '_')}.mp3`}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            Download
                          </a>
                          <button
                            onClick={() => navigator.clipboard.writeText(item.audioUrl)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            Copy URL
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicHistory;