import { useSelector } from 'react-redux';

function Result() {
  const {
    loading,
    progress,
    currentStep,
    result,
    aiProcessing,
  } = useSelector((state) => state.app);

  // Steps with proper completion logic
  const isStepCompleted = (stepNum) => {
    if (!loading && result) return true;
    return currentStep > stepNum;
  };

  const isStepActive = (stepNum) => {
    if (!loading) return false;
    return currentStep === stepNum;
  };

  const steps = [
    { num: 1, label: 'Extract Audio' },
    { num: 2, label: 'Transcribe' },
    { num: 3, label: 'Chunk Text' },
    { num: 4, label: 'AI Processing' },
    { num: 5, label: 'Complete' },
  ];

  // Handle export - works even during processing
  const handleExportTranscript = () => {
    if (!result || !result.transcript) return;

    let content = 'TRANSCRIPT\n==========\n\n';
    content += result.transcript || '';
    
    // If AI summary is ready, add it too
    if (result.topics && result.topics.length > 0) {
      content += '\n\n\nSTRUCTURED NOTES\n===============\n\n';
      result.topics.forEach((topic, index) => {
        content += `${index + 1}. ${topic.title}\n`;
        content += `${topic.summary}\n`;
        if (topic.key_points && topic.key_points.length > 0) {
          topic.key_points.forEach((point) => {
            content += `  • ${point}\n`;
          });
        }
        content += '\n';
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription-result.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tab-content">
      {/* Progress with Steps */}
      <div className="progress-card">
        <div className="progress-header-row">
          <div className="steps-indicator">
            <div className="steps-line"></div>
            <div
              className="steps-line-fill"
              style={{
                width: loading
                  ? `${((currentStep - 1) / 4) * 100}%`
                  : result ? '100%' : '0%',
              }}
            ></div>
            {steps.map((step) => {
              const completed = isStepCompleted(step.num);
              const active = isStepActive(step.num);
              return (
                <div
                  key={step.num}
                  className={`step-item ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}
                >
                  <span className="step-circle">
                    {completed ? '✓' : step.num}
                  </span>
                  <span className="step-label">{step.label}</span>
                </div>
              );
            })}
          </div>
          <span className="progress-percent">
            {loading ? `${progress}%` : result ? '100%' : '0%'}
          </span>
        </div>
        
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: loading ? `${progress}%` : result ? '100%' : '0%' }}
          ></div>
        </div>
      </div>

      {/* Show transcript as soon as it's ready */}
      {result && result.transcript && (
        <>
          {/* Full Transcript Card - Always available */}
          <div className="card">
            <div className="card-header-row">
              <h2 className="card-title">Full Transcript</h2>
              <button
                onClick={handleExportTranscript}
                className="btn-secondary btn-export"
              >
                Export TXT
              </button>
            </div>
            <textarea
              className="transcript-textarea"
              value={result.transcript || ''}
              readOnly
            />
          </div>

          {/* AI Processing Status */}
          {aiProcessing && (
            <div className="card ai-processing-card">
              <div className="ai-processing-message">
                <span className="ai-icon">🤖</span>
                <span>AI Summary is being generated... This may take a while depending on video length.</span>
              </div>
            </div>
          )}

          {/* Structured Notes - Only show when AI is done */}
          {result.topics && result.topics.length > 0 && !aiProcessing && (
            <div className="card">
              <div className="card-header-row">
                <h2 className="card-title">Detailed Summary</h2>
              </div>
              <div className="notes-container">
                {result.topics.map((topic, index) => (
                  <div key={index} className="note-item">
                    <h3 className="note-title">{topic.title}</h3>
                    <p className="note-summary">{topic.summary}</p>
                    {topic.key_points && topic.key_points.length > 0 && (
                      <ul className="note-points">
                        {topic.key_points.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="card stats-bar">
            <div className="stat-item">
              <span className="stat-label">Word Count</span>
              <span className="stat-value">{result.word_count || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Chunk Count</span>
              <span className="stat-value">
                {result.chunk_count || 0}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Model Used</span>
              <span className="stat-value">
                {result.model_used || 'N/A'}
              </span>
            </div>
          </div>
        </>
      )}

      {/* No results yet */}
      {!result && (
        <div className="card">
          <p className="no-result">
            No results yet. Go to Home tab to process a video or YouTube URL.
          </p>
        </div>
      )}
    </div>
  );
}

export default Result;
