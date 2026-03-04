const API_BASE_URL = 'http://127.0.0.1:8000';

// Get all available Ollama models using ollama list command
export async function getModels() {
  try {
    const response = await fetch(`${API_BASE_URL}/models`);
    const data = await response.json();
    
    const models = data.models || [];
    let error = data.error || null;
    
    if (models.length === 0 && error) {
      error = `Ollama Error: ${error}. Make sure Ollama is running.`;
    } else if (models.length === 0) {
      error = "No models found. Make sure Ollama is running and you have downloaded models.";
    }
    
    return { models, error };
  } catch (error) {
    return { 
      models: [], 
      error: `Connection failed: ${error.message}. Is the backend running?`
    };
  }
}

// Load a specific Ollama model
export async function loadModel(modelName) {
  try {
    const response = await fetch(`${API_BASE_URL}/load-model?model_name=${encodeURIComponent(modelName)}`, {
      method: 'POST',
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Kill/stop the running Ollama model
export async function killModel() {
  try {
    const response = await fetch(`${API_BASE_URL}/kill-model`, {
      method: 'POST',
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Transcribe video from file upload
export async function transcribeVideo(file, model = null) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    let url = `${API_BASE_URL}/transcribe`;
    if (model) {
      url += `?model=${encodeURIComponent(model)}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

// Transcribe YouTube with progress streaming
export function transcribeYouTubeWithProgress(url, model = null, onProgress) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const body = { url };
    if (model) {
      body.model = model;
    }
    
    requestOptions.body = JSON.stringify(body);
    
    fetch(`${API_BASE_URL}/transcribe-youtube`, requestOptions)
      .then(response => {
        if (!response.ok) {
          if (response.status === 403) {
            reject({ 
              error: "403 Forbidden - Authentication may be required",
              warning: "Try adding a cookie.txt file in the frontend folder with your authentication cookies."
            });
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        function read() {
          reader.read().then(({ done, value }) => {
            if (done) {
              return;
            }
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  onProgress(data);
                  
                  if (data.result) {
                    resolve(data.result);
                  }
                  if (data.error) {
                    reject({ error: data.message });
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
            
            read();
          });
        }
        
        read();
      })
      .catch(error => {
        reject({ error: error.message });
      });
  });
}

// Transcribe video from YouTube URL (sync version)
export async function transcribeYouTube(url, model = null) {
  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const body = { url };
    if (model) {
      body.model = model;
    }
    
    requestOptions.body = JSON.stringify(body);
    
    const response = await fetch(`${API_BASE_URL}/transcribe-youtube-sync`, requestOptions);
    
    if (response.status === 403) {
      return { 
        error: "403 Forbidden - Authentication may be required",
        warning: "Try adding a cookie.txt file in the frontend folder with your authentication cookies."
      };
    }
    
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}
