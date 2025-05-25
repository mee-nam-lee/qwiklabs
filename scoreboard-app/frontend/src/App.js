import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; // Removed Navigate
import './App.css';
import Header from './components/Header';
import Scoreboard from './components/Scoreboard';
import ParticipantForm from './components/ParticipantForm'; // Re-import ParticipantForm
import SetupPage from './components/SetupPage';
import PasswordPrompt from './components/PasswordPrompt'; // Import PasswordPrompt

// Use environment variable for backend URL, with a fallback for local development
const BACKEND_URL = 'http://localhost:8080';
//const BACKEND_URL = 'YOUR BACKEND URL';

const SCOREBOARD_URL = `${BACKEND_URL}/api/scoreboard`;
const PARTICIPANT_URL =  `${BACKEND_URL}/api/participant`;
const UPDATE_RANKS_URL = `${BACKEND_URL}/api/update-ranks`; // New endpoint

function App() {
  const [scores, setScores] = useState([]);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [autoRefreshIntervalId, setAutoRefreshIntervalId] = useState(null);
  const [isSetupAuthenticated, setIsSetupAuthenticated] = useState(false); // State for setup authentication

  const fetchScores = async () => {
    console.log("Fetching scores..."); // For debugging
    try {
      const response = await fetch(SCOREBOARD_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setScores(data);
    } catch (error) {
      console.error("Could not fetch scores:", error);
      // Optionally, set scores to an empty array or show an error message
      setScores([]); 
    }
  };

  const performRefreshCycle = async () => {
    console.log("Performing refresh cycle..."); // For debugging
    try {
      // Call backend to update ranks first
      const updateResponse = await fetch(UPDATE_RANKS_URL, { method: 'POST' });
      if (!updateResponse.ok) {
        console.error("Failed to trigger rank update on backend:", updateResponse.statusText);
        // Optionally, handle this error, e.g., by not proceeding to fetch scores or by stopping auto-refresh
      } else {
        console.log("Backend rank update triggered successfully.");
      }
    } catch (error) {
      console.error("Error triggering rank update:", error);
    }
    // Then fetch the latest scores
    await fetchScores();
  };

  const manualUpdateScores = async () => {
    console.log("Manually updating scores...");
    try {
      const updateResponse = await fetch(UPDATE_RANKS_URL, { method: 'POST' });
      if (!updateResponse.ok) {
        console.error("Failed to trigger rank update on backend (manual):", updateResponse.statusText);
        alert(`Failed to update ranks: ${updateResponse.statusText}`);
      } else {
        console.log("Backend rank update triggered successfully (manual).");
        alert('Ranks update triggered successfully! Scores will now refresh.');
      }
    } catch (error) {
      console.error("Error triggering rank update (manual):", error);
      alert(`Error triggering rank update: ${error.message}`);
    }
    await fetchScores(); // Refresh scores after attempting rank update
  };
  
  const toggleAutoRefresh = () => {
    if (isAutoRefreshing) {
      // Stop refreshing
      if (autoRefreshIntervalId) {
        clearInterval(autoRefreshIntervalId);
        setAutoRefreshIntervalId(null);
        console.log("Auto-refresh stopped.");
      }
      setIsAutoRefreshing(false);
    } else {
      // Start refreshing
      setIsAutoRefreshing(true);
      performRefreshCycle(); // Perform an immediate refresh cycle
      const intervalId = setInterval(performRefreshCycle, 60000); // 60 seconds
      setAutoRefreshIntervalId(intervalId);
      console.log("Auto-refresh started with interval ID:", intervalId);
    }
  };

  const handleSetupAuthentication = () => {
    setIsSetupAuthenticated(true);
  };

  useEffect(() => {
    fetchScores(); // Initial fetch
    // Cleanup interval on component unmount
    return () => {
      if (autoRefreshIntervalId) {
        clearInterval(autoRefreshIntervalId);
        console.log("Cleaned up auto-refresh interval on unmount.");
      }
    };
  }, [autoRefreshIntervalId]); // Rerun effect if autoRefreshIntervalId changes (though mainly for cleanup)

  const addParticipant = async (name, projectId) => {
    try {
      const response = await fetch(PARTICIPANT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participant: name, project: projectId }),
      });
      const data = await response.json(); // Always try to parse JSON
      if (!response.ok) {
        // Throw an error with the data from the server to be caught by the caller
        const error = new Error(data.message || `HTTP error! status: ${response.status}`);
        error.data = data; // Attach the full data object from backend
        error.status = response.status; // Attach status
        throw error;
      }
      fetchScores(); // Refresh scores on success
      return { success: true, data }; // Indicate success
    } catch (error) {
      console.error("Could not add participant:", error);
      // Return an error object that the form can use
      return { 
        success: false, 
        message: error.data?.message || error.message, // Prefer backend message
        status: error.status 
      };
    }
  };

  const getParticipants = async () => {
    try {
      const response = await fetch(PARTICIPANT_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Could not fetch participants:", error);
      return null;
    }
  };

  const deleteParticipant = async (participantId) => {
    try {
      const response = await fetch(`${PARTICIPANT_URL}/${participantId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      fetchScores(); // Refresh scores after deleting a participant as it might affect scores
      return { success: true };
    } catch (error) {
      console.error("Could not delete participant:", error);
      return { success: false, message: error.message };
    }
  };

  return (
    <div className="App">
      <Header 
        toggleAutoRefresh={toggleAutoRefresh} 
        isAutoRefreshing={isAutoRefreshing}
        manualUpdateScores={manualUpdateScores} 
      />
      <main>
        <Routes>
          <Route path="/" element={<Scoreboard scores={scores} />} />
          <Route 
            path="/register" 
            element={
              <ParticipantForm 
                addParticipant={addParticipant} 
              />
            } 
          />
          <Route
            path="/setup"
            element={
              isSetupAuthenticated ? (
                <SetupPage
                  getParticipants={getParticipants}
                  deleteParticipant={deleteParticipant}
                />
              ) : (
                <PasswordPrompt onAuthenticated={handleSetupAuthentication} />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
