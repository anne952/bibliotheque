import React, { useState, useEffect } from 'react';
import '../intermediare/css/noAcces.css';



// Ajouter simplement les types inline
function NoAcces({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !isComplete) {
      setIsComplete(true);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, isComplete, onComplete]);

  return (
    <div className="loading-container">
      <div className="loading-content">
        <h1 className="loading-text">
          Chargement de données à ({progress}%)
        </h1>
        
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="progress-percentage">
          {progress}%
        </div>
        
        <div className="loading-status">
          {progress < 100 ? 'Chargement en cours...' : 'Chargement terminé!'}
        </div>
      </div>
    </div>
  );
}

export default NoAcces;