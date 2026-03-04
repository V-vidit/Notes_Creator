import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setYoutubeUrl,
  setVideoFile,
  setLoading,
  setLoadingSource,
  setError,
  setSuccess,
  clearResult,
  setProgress,
  setCurrentStep,
  setResult,
  updatePartialResult,
  setTranscriptReady,
  setAiProcessing,
} from "../store/slices/appSlice";
import {
  transcribeVideo,
  transcribeYouTubeWithProgress,
} from "../services/api";

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, loadingSource, youtubeUrl, videoFile, selectedModel } =
    useSelector((state) => state.app);

  const handleYouTubeSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) {
      dispatch(setError("Please enter a YouTube URL"));
      return;
    }
    if (!selectedModel) {
      dispatch(setError("Please select a model first in the Models tab"));
      return;
    }
    dispatch(setLoading(true));
    dispatch(setLoadingSource("youtube"));
    dispatch(setError(null));
    dispatch(setSuccess(null));
    dispatch(clearResult());
    dispatch(setProgress(null));
    dispatch(setCurrentStep(0));
    dispatch(setTranscriptReady(false));
    dispatch(setAiProcessing(false));
    navigate("/result");

    try {
      await transcribeYouTubeWithProgress(
        youtubeUrl,
        selectedModel || null,
        (data) => {
          if (data.error) {
            dispatch(setError(data.message));
          } else {
            dispatch(setProgress(data.progress));
            dispatch(setCurrentStep(data.step));
            dispatch(setSuccess(data.message));
            
            // If but transcript is ready AI still processing
            if (data.transcript_ready && data.transcript) {
              dispatch(updatePartialResult({
                transcript: data.transcript,
                word_count: data.word_count,
                topics: [],
                chunk_count: 0,
                model_used: selectedModel,
              }));
              dispatch(setTranscriptReady(true));
              dispatch(setAiProcessing(true));
            }
            
            // If chunks are ready but AI still processing
            if (data.chunks_ready && data.chunk_count) {
              dispatch(updatePartialResult({
                chunk_count: data.chunk_count,
              }));
            }
            
            // If AI is processing with partial data
            if (data.ai_processing && data.transcript) {
              dispatch(updatePartialResult({
                transcript: data.transcript,
                topics: data.topics || [],
                word_count: data.word_count,
                chunk_count: data.chunk_count,
                model_used: data.model_used,
              }));
            }
            
            // Final complete result
            if (data.result) {
              dispatch(setResult(data.result));
              dispatch(setAiProcessing(false));
              dispatch(setTranscriptReady(false));
            }
          }
        },
      );
    } catch (err) {
      dispatch(setError(err.error || err.message || "Unknown error"));
    }
    dispatch(setLoading(false));
    dispatch(setLoadingSource(null));
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      dispatch(setError("Please select a video file"));
      return;
    }
    if (!selectedModel) {
      dispatch(setError("Please select a model first in the Models tab"));
      return;
    }
    dispatch(setLoading(true));
    dispatch(setLoadingSource("file"));
    dispatch(setError(null));
    dispatch(setSuccess(null));
    dispatch(clearResult());
    navigate("/result");

    const response = await transcribeVideo(videoFile, selectedModel || null);
    if (response.error) {
      dispatch(setError(response.error));
    } else {
      dispatch(
        setResult({
          transcript: response.transcript,
          topics: response.topics || [],
          word_count: response.word_count,
          chunk_count: response.chunk_count,
          model_used: response.model_used || selectedModel,
        }),
      );
    }
    dispatch(setLoading(false));
    dispatch(setLoadingSource(null));
  };

  return (
    <div className="tab-content">
      {/* YouTube Transcription Card */}
      <div className="card">
        <h2 className="card-title">YouTube Transcription</h2>
        <form onSubmit={handleYouTubeSubmit}>
          <input
            type="text"
            className="input-field"
            placeholder="Enter YouTube URL"
            value={youtubeUrl}
            onChange={(e) => dispatch(setYoutubeUrl(e.target.value))}
            disabled={loading}
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && loadingSource === "youtube"
              ? "Processing..."
              : "Transcribe"}
          </button>
        </form>
      </div>

      {/* Upload Video File Card */}
      <div className="card">
        <h2 className="card-title">Upload Video File</h2>
        <form onSubmit={handleFileUpload}>
          <div className="file-upload-area">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => dispatch(setVideoFile(e.target.files[0]))}
              disabled={loading}
              id="file-input"
              className="file-input-hidden"
            />
            <label htmlFor="file-input" className="file-upload-label">
              {videoFile
                ? videoFile.name
                : "Drag and drop files here (.mp4, .avi, .mov)"}
            </label>
          </div>
          {videoFile && (
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && loadingSource === "file"
                ? "Processing..."
                : "Transcribe"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default Home;
