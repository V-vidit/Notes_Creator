import { useDispatch, useSelector } from 'react-redux';
import {
  setSelectedModel,
  setModelLoading,
  setError,
  setSuccess,
} from '../store/slices/appSlice';
import { loadModel, killModel } from '../services/api';

function Models() {
  const dispatch = useDispatch();
  const {
    models,
    selectedModel,
    modelLoading,
  } = useSelector((state) => state.app);

  const handleLoadModel = async () => {
    if (!selectedModel) {
      dispatch(setError('Please select a model first'));
      return;
    }
    dispatch(setModelLoading(true));
    dispatch(setError(null));
    dispatch(setSuccess(null));
    
    const response = await loadModel(selectedModel);
    if (response.success) {
      dispatch(setSuccess(`Model "${selectedModel}" is ready!`));
    } else {
      dispatch(setError(response.error || 'Failed to load model'));
    }
    dispatch(setModelLoading(false));
  };

  const handleKillModel = async () => {
    dispatch(setModelLoading(true));
    dispatch(setError(null));
    dispatch(setSuccess(null));
    
    const response = await killModel();
    if (response.success) {
      dispatch(setSuccess('Model stopped!'));
    } else {
      dispatch(setError(response.error || 'Failed to stop model'));
    }
    dispatch(setModelLoading(false));
  };

  return (
    <div className="tab-content">
      <div className="card model-selection">
        <h2 className="card-title">Select LLM Model</h2>
        <div className="model-selection-row">
          <div className="model-actions-full">
            <select
              value={selectedModel}
              onChange={(e) => dispatch(setSelectedModel(e.target.value))}
              className="model-select"
            >
              <option value="">Choose a model...</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <div className="model-buttons-row">
              <button
                onClick={handleLoadModel}
                disabled={modelLoading || !selectedModel}
                className="btn-primary"
              >
                {modelLoading ? 'Loading...' : 'Load Model'}
              </button>
              <button
                onClick={handleKillModel}
                disabled={modelLoading}
                className="btn-secondary"
              >
                Stop Model
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Models;
