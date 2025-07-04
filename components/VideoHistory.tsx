"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Calendar,
  Clock,
  Settings,
  Eye,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Grid,
  List,
  Loader2,
  AlertCircle,
  Video
} from 'lucide-react';

interface VideoGenerationHistory {
  $id: string;
  userId: string;
  prompt: string;
  fps: number;
  width: number;
  height: number;
  guidance_scale: number;
  negative_prompt: string;
  duration: number;
  priority: string;
  num_inference_steps: number;
  success: boolean;
  video_url?: string;
  prediction_id?: string;
  status: string;
  cached: boolean;
  metadata?: string;
  created_at: string;
  updated_at: string;
  model_version?: string;
  seed?: number;
  processing_time?: number;
}

interface VideoHistoryResponse {
  success: boolean;
  data?: VideoGenerationHistory[];
  total?: number;
  error?: string;
  code?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'prompt';

const VideoHistory: React.FC = () => {
  const [history, setHistory] = useState<VideoGenerationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoGenerationHistory | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const itemsPerPage = 20;

  // Fetch video history
  const fetchHistory = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/history/video?page=${page}&limit=${itemsPerPage}`);
      const data: VideoHistoryResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video history');
      }

      if (data.success && data.data) {
        setHistory(data.data);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        throw new Error(data.error || 'Invalid response format');
      }

    } catch (error) {
      console.error('Error fetching video history:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage, fetchHistory]);

  // Filter and sort history
  const filteredAndSortedHistory = React.useMemo(() => {
    let filtered = history;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'prompt':
          return a.prompt.localeCompare(b.prompt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [history, searchTerm, sortBy]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  // Handle video click
  const handleVideoClick = (video: VideoGenerationHistory) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  // Close video modal
  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  // Handle download
  const handleDownload = async (video: VideoGenerationHistory) => {
    if (!video.video_url) return;

    try {
      const response = await fetch(video.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_${video.$id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Handle share
  const handleShare = async (video: VideoGenerationHistory) => {
    if (!video.video_url) return;

    try {
      await navigator.share({
        title: `Generated Video: ${video.prompt.substring(0, 50)}...`,
        text: `Check out this AI-generated video: "${video.prompt}"`,
        url: video.video_url
      });
    } catch {
      // Fallback to clipboard
      navigator.clipboard.writeText(video.video_url);
    }
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Loading state
  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your video history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading History</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchHistory(currentPage)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Yet</h3>
          <p className="text-gray-600">Start creating videos to see your history here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Generation History</h1>
        <p className="text-gray-600">View and manage your AI-generated videos</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by prompt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="prompt">By Prompt</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="flex items-center border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedHistory.map((video) => (
            <div
              key={video.$id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3
                    className="text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleVideoClick(video)}
                  >
                    {video.prompt}
                  </h3>
                  <button
                    onClick={() => handleVideoClick(video)}
                    className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(video.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    <span>{video.width}×{video.height} • {video.fps}fps • {formatDuration(video.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="capitalize">{video.priority} priority</span>
                    {video.cached && <span className="text-green-600">• Cached</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleVideoClick(video)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(video)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleShare(video)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredAndSortedHistory.map((video) => (
              <div key={video.$id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                      onClick={() => handleVideoClick(video)}
                    >
                      {video.prompt}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{formatDate(video.created_at)}</span>
                      <span>{video.width}×{video.height}</span>
                      <span>{video.fps}fps</span>
                      <span>{formatDuration(video.duration)}</span>
                      <span className="capitalize">{video.priority}</span>
                      {video.cached && <span className="text-green-600">Cached</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleVideoClick(video)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Video"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(video)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleShare(video)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="px-3 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Video Modal */}
      {isVideoModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Generated Video</h2>
                <button
                  onClick={closeVideoModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Video Player */}
              {selectedVideo.video_url && (
                <div className="mb-6">
                  <video
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '400px' }}
                  >
                    <source src={selectedVideo.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Video Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Prompt</h3>
                  <p className="text-gray-900">{selectedVideo.prompt}</p>
                </div>

                {selectedVideo.negative_prompt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Negative Prompt</h3>
                    <p className="text-gray-900">{selectedVideo.negative_prompt}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Resolution</h3>
                    <p className="text-gray-900">{selectedVideo.width}×{selectedVideo.height}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">FPS</h3>
                    <p className="text-gray-900">{selectedVideo.fps}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Duration</h3>
                    <p className="text-gray-900">{formatDuration(selectedVideo.duration)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Priority</h3>
                    <p className="text-gray-900 capitalize">{selectedVideo.priority}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Guidance Scale</h3>
                    <p className="text-gray-900">{selectedVideo.guidance_scale}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Inference Steps</h3>
                    <p className="text-gray-900">{selectedVideo.num_inference_steps}</p>
                  </div>
                  {selectedVideo.seed && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Seed</h3>
                      <p className="text-gray-900">{selectedVideo.seed}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Created: {formatDate(selectedVideo.created_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(selectedVideo)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleShare(selectedVideo)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoHistory;