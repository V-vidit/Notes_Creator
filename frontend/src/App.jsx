import { useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Layout from './components/Layout';
import Home from './pages/Home';
import Models from './pages/Models';
import Result from './pages/Result';
import { setModels, setError } from './store/slices/appSlice';
import { getModels } from './services/api';
import './App.css';

function App() {
  const dispatch = useDispatch();

  const fetchModels = useCallback(async () => {
    dispatch(setError(null));
    const response = await getModels();
    if (response.error) {
      dispatch(setError(response.error));
      dispatch(setModels([]));
    } else {
      dispatch(setModels(response.models || []));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/models" element={<Models />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </Layout>
  );
}

export default App;
