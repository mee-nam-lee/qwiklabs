import React, { useState } from 'react';
import './Scoreboard.css';

const ITEMS_PER_PAGE = 10;

const Scoreboard = ({ scores }) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (!scores || scores.length === 0) {
    return <div className="scoreboard-container"><p>No scores to display.</p></div>;
  }

  // Sort scores in descending order
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  // Pagination logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentScores = sortedScores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedScores.length / ITEMS_PER_PAGE);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          disabled={currentPage === i}
          style={{
            margin: '0 5px',
            padding: '5px 10px',
            cursor: 'pointer',
            backgroundColor: currentPage === i ? '#4CAF50' : '#1a1a2e',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="scoreboard-container">
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <h1>Scoreboard</h1>
      </div>
      {scores.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}> {/* Centered and added more bottom margin */}
          <p style={{ fontSize: '1rem', color: '#aaa', margin: 0 }}>
            Total Participants: {scores.length}
          </p>
        </div>
      )}
      <table className="scoreboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Participant</th>
            <th>Project</th>
            <th>Score</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {currentScores.map((item, index) => { // Use currentScores for rendering
            const rank = indexOfFirstItem + index + 1; // Calculate rank based on sorted order and pagination
            let avatarClassName = "avatar";
            if (rank === 1) {
              avatarClassName += " gold";
            } else if (rank === 2) {
              avatarClassName += " silver";
            } else if (rank === 3) {
              avatarClassName += " bronze";
            }
            // For ranks > 3, it will just use the base 'avatar' class.

            return (
              <tr key={item.id || rank}> {/* Use a unique key, fallback to rank if id is not present */}
                <td>{rank}</td>
                <td>
                  {rank <= 3 && (
                    <span className={avatarClassName}>
                      {item.participant ? item.participant.charAt(0).toUpperCase() : '?'}
                    </span>
                  )}
                  {item.participant}
                </td>
                <td>{item.project}</td>
                <td>{item.score}</td>
                <td>{item.lastUpdated}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            style={{
              margin: '0 5px',
              padding: '8px 15px',
              cursor: 'pointer',
              backgroundColor: '#1a1a2e',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          {renderPageNumbers()}
          <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            style={{
              margin: '0 5px',
              padding: '8px 15px',
              cursor: 'pointer',
              backgroundColor: '#1a1a2e',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
