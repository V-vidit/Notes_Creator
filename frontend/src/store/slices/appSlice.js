import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Navigation
  activeTab: "home",

  // Models
  models: [],
  selectedModel: "",
  modelLoading: false,

  // Processing
  loading: false,
  loadingSource: null, // 'youtube' or 'file'

  // Input
  youtubeUrl: "",
  videoFile: null,

  // Result
  result: null,
  transcriptReady: false, // when transcript is available but AI still processing
  aiProcessing: false, // when AI is generating summary

  // Messages
  error: null,
  success: null,

  // Progress
  progress: null,
  currentStep: 0,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    // Navigation
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    // Models
    setModels: (state, action) => {
      state.models = action.payload;
    },
    setSelectedModel: (state, action) => {
      state.selectedModel = action.payload;
    },
    setModelLoading: (state, action) => {
      state.modelLoading = action.payload;
    },

    // Processing
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setLoadingSource: (state, action) => {
      state.loadingSource = action.payload;
    },

    // Input
    setYoutubeUrl: (state, action) => {
      state.youtubeUrl = action.payload;
    },
    setVideoFile: (state, action) => {
      state.videoFile = action.payload;
    },

    // Result
    setResult: (state, action) => {
      state.result = action.payload;
    },
    updatePartialResult: (state, action) => {
      // Update partial result while processing
      if (action.payload.transcript) {
        state.result = {
          ...state.result,
          transcript: action.payload.transcript,
          word_count: action.payload.word_count,
          topics: action.payload.topics || [],
          chunk_count: action.payload.chunk_count,
          model_used: action.payload.model_used,
        };
      }
    },
    setTranscriptReady: (state, action) => {
      state.transcriptReady = action.payload;
    },
    setAiProcessing: (state, action) => {
      state.aiProcessing = action.payload;
    },
    clearResult: (state) => {
      state.result = null;
      state.transcriptReady = false;
      state.aiProcessing = false;
    },

    // Messages
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSuccess: (state, action) => {
      state.success = action.payload;
    },
    clearSuccess: (state) => {
      state.success = null;
    },

    // Progress
    setProgress: (state, action) => {
      state.progress = action.payload;
    },
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    setDownloadProgress: (state, action) => {
      state.downloadProgress = action.payload;
    },
    resetProgress: (state) => {
      state.progress = null;
      state.currentStep = 0;
      state.downloadProgress = "";
    },

    // Reset
    reset: (state) => {
      state.loading = false;
      state.loadingSource = null;
      state.result = null;
      state.error = null;
      state.success = null;
      state.progress = null;
      state.currentStep = 0;
      state.downloadProgress = "";
    },
  },
});

export const {
  setActiveTab,
  setModels,
  setSelectedModel,
  setModelLoading,
  setLoading,
  setLoadingSource,
  setYoutubeUrl,
  setVideoFile,
  setResult,
  updatePartialResult,
  setTranscriptReady,
  setAiProcessing,
  clearResult,
  setError,
  clearError,
  setSuccess,
  clearSuccess,
  setProgress,
  setCurrentStep,
  setDownloadProgress,
  resetProgress,
  reset,
} = appSlice.actions;

export default appSlice.reducer;
