import React, { useState } from 'react';

const ParticipantForm = ({ addParticipant }) => {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [formMessage, setFormMessage] = useState(''); // For displaying messages on the form

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage(''); // Clear previous messages
    if (name.trim() && projectId.trim()) {
      const result = await addParticipant(name.trim(), projectId.trim());
      if (result.success) {
        setName(''); // Clear the input fields
        setProjectId(''); // Clear the input fields
        setFormMessage("정상 등록되었습니다."); // Display success message on the form
      } else {
        // Display error message from backend (e.g., "이미 등록되었습니다.")
        setFormMessage(result.message || 'An error occurred.');
      }
    } else {
      setFormMessage('Please enter both participant name and project ID.');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'flex-start', // Align form to the top, then center
      padding: '2rem', 
      color: '#e0e0e0', 
      backgroundColor: '#0f0f1e', 
      minHeight: 'calc(100vh - 70px)', // Assuming 70px is header height
      textAlign: 'center'
    }}>
      <div style={{ width: '400px', maxWidth: '1800px' }}> {/* Container for the form elements */}
        <h2>Register New Participant</h2>
        {formMessage && (
          <p style={{ 
            color: formMessage.includes('정상') ? 'green' : 'red', 
            backgroundColor: '#2a2a3e', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {formMessage}
          </p>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          {/* Participant Name Field */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <label 
              htmlFor="participantName" 
              style={{ width: '150px', marginRight: '10px', fontSize: '1.1rem', textAlign: 'right', flexShrink: 0 }}
            >
              Participant Name:
            </label>
            <input
              type="text"
              id="participantName"
              name="participantName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ flexGrow: 1, padding: '8px', fontSize: '1rem', border: '1px solid #555', borderRadius: '4px', backgroundColor: '#1a1a2e', color: '#e0e0e0' }}
              required
            />
          </div>
          
          {/* Project ID Field */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <label 
              htmlFor="projectId" 
              style={{ width: '150px', marginRight: '10px', fontSize: '1.1rem', textAlign: 'right', flexShrink: 0 }}
            >
              Project ID:
            </label>
            <input
              type="text"
              id="projectId"
              name="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{ flexGrow: 1, padding: '8px', fontSize: '1rem', border: '1px solid #555', borderRadius: '4px', backgroundColor: '#1a1a2e', color: '#e0e0e0' }}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit" 
            style={{ 
              padding: '10px 20px', 
              fontSize: '1rem', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              alignSelf: 'center', // Center button within the form
              marginTop: '1rem' // Add some space above the button
            }}
          >
            Register Participant
          </button>
        </form>
      </div>
    </div>
  );
};

export default ParticipantForm;
