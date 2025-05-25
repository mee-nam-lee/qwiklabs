import React, { useState, useEffect, useCallback } from 'react';

const SetupPage = ({ getParticipants, deleteParticipant }) => {
  const [formMessage, setFormMessage] = useState(''); // For displaying messages
  const [participants, setParticipants] = useState([]);

  const fetchParticipants = useCallback(async () => {
    const fetchedParticipants = await getParticipants();
    if (fetchedParticipants) {
      setParticipants(fetchedParticipants);
    }
  }, [getParticipants]);

  const handleDelete = async (id) => {
    setFormMessage(''); // Clear previous messages
    const result = await deleteParticipant(id);
    if (result.success) {
      setFormMessage("참가자가 삭제되었습니다."); // Display success message
      fetchParticipants(); // Refresh the list
    } else {
      setFormMessage(result.message || '삭제 중 오류가 발생했습니다.'); // Display error message
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants, getParticipants]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem', 
      color: '#e0e0e0', 
      backgroundColor: '#0f0f1e', 
      minHeight: 'calc(100vh - 70px)',
      textAlign: 'center'
    }}>
      <div style={{ width: '400px', maxWidth: '1800px' }}>
        <h2>Manage Participants</h2>
        {formMessage && (
          <p style={{ 
            color: formMessage.includes('삭제되었습니다') ? 'green' : 'red', // Adjusted for delete message
            backgroundColor: '#2a2a3e', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {formMessage}
          </p>
        )}
        
        <h3 style={{ marginTop: '2rem', borderTop: '1px solid #444', paddingTop: '1rem' }}>Registered Participants</h3>
        {participants.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {participants.map((participant) => (
              <li 
                key={participant.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px', 
                  border: '1px solid #333', 
                  borderRadius: '4px', 
                  marginBottom: '0.5rem',
                  backgroundColor: '#1a1a2e'
                }}
              >
                <span style={{ flexGrow: 1 }}>{participant.participant}</span>
                <button
                  onClick={() => handleDelete(participant.id)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '0.9rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No participants registered yet.</p>
        )}
      </div>
    </div>
  );
};

export default SetupPage;
