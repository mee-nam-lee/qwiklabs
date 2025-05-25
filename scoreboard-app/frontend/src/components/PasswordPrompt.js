import React, { useState } from 'react';
import './PasswordPrompt.css'; // We'll create this CSS file next

const CORRECT_PASSWORD = "google"; // For demonstration purposes. In a real app, manage this securely.

function PasswordPrompt({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setError('');
      onAuthenticated();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword(''); // Clear the password field
    }
  };

  return (
    <div className="password-prompt-container">
      <form onSubmit={handleSubmit} className="password-form">
        <h2>Enter Password to Access Setup</h2>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
}

export default PasswordPrompt;
