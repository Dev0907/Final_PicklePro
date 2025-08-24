import React, { useState, useRef } from 'react';
import { Upload, Video, Play, BarChart3, Zap, Target, Clock, Award, TrendingUp } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
// import { VideoAnalysis } from '../types';

const UploadVideo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        alert('Please select a video file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setTimeout(() => {
      const mockAnalysis = {
        id: Date.now().toString(),
        userId: '1',
        fileName: selectedFile.name,
        uploadDate: new Date(),
        analysis: {
          playerSpeed: 85,
          reactionTime: 0.32,
          accuracy: 78,
          consistency: 82,
          powerRating: 76,
          recommendations: [
            'Work on improving shot accuracy by 15%',
            'Focus on faster reaction times during volleys',
            'Increase power in backhand shots',
            'Practice consistent footwork patterns'
          ]
        },
        status: 'completed'
      };
      setAnalysis(mockAnalysis);
      setIsUploading(false);
    }, 3000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-ivory-whisper">
      <Sidebar />
      <div className="ml-64 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Video className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-deep-navy mb-2">
              AI Game Analysis
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload your pickleball game videos and get detailed AI-powered analysis to improve your performance
            </p>
          </div>

          {!analysis ? (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : selectedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Play className="h-16 w-16 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-deep-navy mb-2">
                        {selectedFile.name}
                      </h3>
                      <p className="text-gray-600">
                        Size: {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <div className="flex space-x-4 justify-center">
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? 'Analyzing...' : 'Start Analysis'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Upload className="h-16 w-16 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-deep-navy mb-2">
                        Upload Your Game Video
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Drag and drop your video file here, or click to browse
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Choose Video File
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Supported formats: MP4, MOV, AVI (Max size: 100MB)
                    </p>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="mt-8 bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="text-purple-700 font-medium">Analyzing your game...</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-sm text-purple-600 mt-2 text-center">
                    This may take a few minutes depending on video length
                  </p>
                </div>
              )}

              {/* Features */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-deep-navy mb-2">Speed Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Measure your movement speed and reaction times
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-deep-navy mb-2">Shot Accuracy</h3>
                  <p className="text-sm text-gray-600">
                    Analyze shot placement and accuracy patterns
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="p-3 bg-yellow-100 rounded-full w-fit mx-auto mb-3">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-deep-navy mb-2">Performance Score</h3>
                  <p className="text-sm text-gray-600">
                    Get overall performance rating and improvement tips
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Analysis Results */
            <div className="space-y-6">
              {/* Analysis Header */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-deep-navy mb-2">Analysis Complete</h2>
                    <p className="text-gray-600">Video: {analysis.fileName}</p>
                    <p className="text-sm text-gray-500">
                      Analyzed on {analysis.uploadDate.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAnalysis(null);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Analyze New Video
                  </button>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Zap className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-deep-navy">Player Speed</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.analysis.playerSpeed)}`}>
                      {analysis.analysis.playerSpeed}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${analysis.analysis.playerSpeed}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Target className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="font-semibold text-deep-navy">Accuracy</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.analysis.accuracy)}`}>
                      {analysis.analysis.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${analysis.analysis.accuracy}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <span className="font-semibold text-deep-navy">Reaction Time</span>
                    </div>
                    <span className="text-2xl font-bold text-deep-navy">
                      {analysis.analysis.reactionTime}s
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Average response time</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="font-semibold text-deep-navy">Consistency</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.analysis.consistency)}`}>
                      {analysis.analysis.consistency}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${analysis.analysis.consistency}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Award className="h-5 w-5 text-red-600" />
                      </div>
                      <span className="font-semibold text-deep-navy">Power Rating</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(analysis.analysis.powerRating)}`}>
                      {analysis.analysis.powerRating}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${analysis.analysis.powerRating}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="font-semibold text-deep-navy">Overall Score</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(Math.round((analysis.analysis.playerSpeed + analysis.analysis.accuracy + analysis.analysis.consistency + analysis.analysis.powerRating) / 4))}`}>
                      {Math.round((analysis.analysis.playerSpeed + analysis.analysis.accuracy + analysis.analysis.consistency + analysis.analysis.powerRating) / 4)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Combined performance rating</p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-deep-navy mb-4 flex items-center">
                  <Award className="h-6 w-6 mr-2 text-lemon-zest" />
                  Improvement Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.analysis.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-sky-mist rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-ocean-teal text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-deep-navy">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadVideo; 