'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, FileText, Loader2, Sparkles, Check, ArrowRight, Zap, Shield } from 'lucide-react';

export default function PremiumDocumentConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate conversion progress
  useEffect(() => {
    if (converting) {
      const interval = setInterval(() => {
        setConversionProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [converting]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setDownloadUrl('');
      setConversionProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
      setDownloadUrl('');
      setConversionProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError('');
    setConversionProgress(0);

    // Simulate API call with realistic timing
    setTimeout(() => {
      setConversionProgress(100);
      setTimeout(() => {
        const blob = new Blob(['Mock DOCX content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setConverting(false);
      }, 500);
    }, 2000);
  };

  const resetConverter = () => {
    setFile(null);
    setDownloadUrl('');
    setError('');
    setConversionProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const features = [
    { icon: Zap, text: "Lightning Fast Conversion" },
    { icon: Shield, text: "100% Secure & Private" },
    { icon: Check, text: "Premium Quality Output" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-green-300/30 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-200/30 to-emerald-300/30 rounded-full blur-3xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-200/20 to-emerald-200/20 rounded-full blur-3xl"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-semibold mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Sparkles className="w-4 h-4" />
            Premium Document Converter
          </motion.div>
          
          <motion.h1
            className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Transform Your
            <br />
            <span className="relative">
              Documents
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              />
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Experience the most advanced PDF to DOCX conversion with stunning speed, 
            unmatched quality, and enterprise-grade security.
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-emerald-200 px-4 py-2 rounded-full shadow-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <feature.icon className="w-4 h-4 text-emerald-600" />
                <span className="text-gray-700 font-medium text-sm">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Main Converter Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-8 md:p-12">
              {/* File Upload Area */}
              <motion.div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-emerald-400 bg-emerald-50 scale-105'
                    : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                
                <AnimatePresence mode="wait">
                  {!file ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key="upload-prompt"
                    >
                      <motion.div
                        className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ type: "spring" }}
                      >
                        <Upload className="w-10 h-10 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">
                        Drop your PDF here
                      </h3>
                      <p className="text-gray-500 mb-6">or click to browse your files</p>
                      <motion.label
                        htmlFor="file-upload"
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FileText className="w-5 h-5" />
                        Choose PDF File
                        <ArrowRight className="w-4 h-4" />
                      </motion.label>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key="file-selected"
                    >
                      <motion.div
                        className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        initial={{ rotate: -10, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: "spring", delay: 0.1 }}
                      >
                        <FileText className="w-10 h-10 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {file.name}
                      </h3>
                      <div className="flex items-center justify-center gap-4 text-gray-600 mb-6">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                          PDF Document
                        </span>
                      </div>
                      <motion.button
                        onClick={resetConverter}
                        className="text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-2 mx-auto"
                        whileHover={{ scale: 1.05 }}
                      >
                        Choose Different File
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Convert Button */}
              <AnimatePresence>
                {file && !downloadUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8"
                  >
                    <motion.button
                      onClick={handleConvert}
                      disabled={converting}
                      className="w-full bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white py-6 rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
                      whileHover={{ scale: converting ? 1 : 1.02, y: converting ? 0 : -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        {converting ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Converting... {Math.round(conversionProgress)}%
                          </>
                        ) : (
                          <>
                            <Zap className="w-6 h-6" />
                            Convert to DOCX
                            <Sparkles className="w-5 h-5" />
                          </>
                        )}
                      </div>
                      
                      {converting && (
                        <motion.div
                          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${conversionProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Download Section */}
              <AnimatePresence>
                {downloadUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <motion.div
                      className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                    >
                      <motion.div
                        className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 0.8 }}
                      >
                        <Check className="w-12 h-12 text-white" />
                      </motion.div>
                      
                      <h3 className="text-3xl font-bold text-gray-800 mb-3">
                        Conversion Complete! 🎉
                      </h3>
                      <p className="text-gray-600 mb-8">
                        Your document has been successfully converted with premium quality
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <motion.a
                          href={downloadUrl}
                          download={`${file?.name?.replace('.pdf', '')}.docx`}
                          className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Download className="w-6 h-6" />
                          Download DOCX
                        </motion.a>
                        
                        <motion.button
                          onClick={resetConverter}
                          className="inline-flex items-center gap-3 bg-white text-emerald-600 border-2 border-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all duration-300"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ArrowRight className="w-6 h-6" />
                          Convert Another
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="mt-6 p-6 bg-red-50 border-l-4 border-red-400 rounded-lg"
                  >
                    <p className="text-red-700 font-semibold">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}