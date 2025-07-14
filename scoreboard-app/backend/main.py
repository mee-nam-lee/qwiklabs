import os
import sqlite3
from datetime import datetime, timezone, timedelta
from flask import Flask, jsonify, request
from google.cloud import storage

app = Flask(__name__)
#app.debug = True

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', '*')
    return response

# Path to the SQLite database file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_FILE = os.path.join(BASE_DIR, 'scoreboard.db')

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn

def init_db():
    """Initializes the database and creates the participants table if it doesn't exist."""
    print("Initializing database...")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rank INTEGER,
            participant TEXT NOT NULL,
            project TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            lastUpdated TEXT NOT NULL,
            UNIQUE(participant, project)
        )
    ''')
    cursor.execute('DROP TABLE IF EXISTS processed_blobs')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS processed_blobs (
            participant_id INTEGER NOT NULL,
            blob_name TEXT NOT NULL,
            PRIMARY KEY (participant_id, blob_name)
        )
    ''')
    conn.commit()
    conn.close()

def update_ranks():
    print("Updating ranks...")
    """Recalculates and updates ranks for all participants based on score."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # First, fetch all participants to update their scores from GCS
    cursor.execute("SELECT id, project, score FROM participants")
    all_participants = cursor.fetchall()

    # Get all already processed blob names to avoid re-processing
    cursor.execute("SELECT participant_id, blob_name FROM processed_blobs")
    processed_blobs = {(row['participant_id'], row['blob_name']) for row in cursor.fetchall()}
    
    storage_client = storage.Client.create_anonymous_client() # For public buckets

    for participant_data in all_participants:
        participant_db_id = participant_data['id']
        project_name = participant_data['project']
        current_participant_score = participant_data['score']

        score_folder_prefix = "score/"
        #score_folder_prefix = f"score_{participant_db_id - 16}/"
        bucket_name = f"{project_name}-bucket"
        
        newly_processed_blobs = []
        latest_datetime_str_from_file = ""
        score_to_add = 0

        try:
            bucket = storage_client.bucket(bucket_name)
            print(f"Fetching scores for {participant_db_id} (project: {project_name}) from bucket '{bucket_name}', prefix '{score_folder_prefix}'")
            blobs = bucket.list_blobs(prefix=score_folder_prefix)

            for blob in blobs:
                if blob.name.endswith('.csv') and blob.name != score_folder_prefix:
                    if (participant_db_id, blob.name) in processed_blobs:
                        print(f"{blob.name} is in the DB, skipping.")
                        continue

                    try:
                        file_content = blob.download_as_text().strip()
                        if not file_content:
                            print(f"Warning: File {blob.name} is empty.")
                            continue

                        parts = file_content.split(',')
                        if len(parts) == 2:
                            score_str, datetime_str = parts[0].strip(), parts[1].strip()
                            score_to_add += int(score_str)
                            
                            if not latest_datetime_str_from_file or datetime_str > latest_datetime_str_from_file:
                                latest_datetime_str_from_file = datetime_str
                            
                            newly_processed_blobs.append(blob.name)
                        else:
                            print(f"Warning: Could not parse content of {blob.name}. Expected 'score,datetime', got '{file_content}'")
                    except ValueError as ve:
                        print(f"Warning: Could not convert score part of {blob.name}. Content: '{file_content}'. Error: {ve}")
                    except Exception as e:
                        print(f"Error processing file {blob.name}: {e}")
            
            if newly_processed_blobs:
                log_message_suffix = ""
                if latest_datetime_str_from_file:
                    update_time_for_db = latest_datetime_str_from_file
                    log_message_suffix = "(from file)"
                else:
                    korea_offset = timezone(timedelta(hours=9))
                    update_time_for_db = datetime.now(korea_offset).strftime("%Y-%m-%dT%H:%M:%S%:z")
                    log_message_suffix = f"(no valid datetime in files, used current KST: {update_time_for_db})"

                final_score = current_participant_score + score_to_add
                cursor.execute("UPDATE participants SET score = ?, lastUpdated = ? WHERE id = ?", 
                               (final_score, update_time_for_db, participant_db_id))
                
                # Add newly processed blobs to the tracking table
                for blob_name in newly_processed_blobs:
                    cursor.execute("INSERT INTO processed_blobs (participant_id, blob_name) VALUES (?, ?)", 
                                   (participant_db_id, blob_name))
                
                print(f"Updated score for participant ID {participant_db_id} to {final_score}. lastUpdated to {update_time_for_db} {log_message_suffix}")

        except Exception as e:
            print(f"Error accessing bucket {bucket_name} or its contents for prefix {score_folder_prefix} (participant ID {participant_db_id}): {e}")

    conn.commit() # Commit score updates

    # Now, proceed with ranking based on the potentially updated scores
    # Fetch all participants, ordered by score DESC, then by lastUpdated ASC (earlier time is better for ties)
    # lastUpdated is stored as TEXT in ISO 8601 format, so lexicographical sort works.
    print("Updating ranks++++++++++++++++++++++++")
    cursor.execute("SELECT id, score, lastUpdated FROM participants ORDER BY score DESC, lastUpdated ASC")
    participants_to_rank = cursor.fetchall()
    
    # Update ranks
    # Since participants_to_rank is already sorted by score (desc) and then lastUpdated (asc),
    # the rank is simply their position in this sorted list (1-indexed).
    if participants_to_rank: # Ensure there are participants
        for i, p_data in enumerate(participants_to_rank):
            current_rank = i + 1  # Assign rank based on the order in the sorted list
            cursor.execute("UPDATE participants SET rank = ? WHERE id = ?", 
                           (current_rank, p_data['id']))
            print(f"RANK : {current_rank} : {p_data['id']}")
            
    conn.commit()
    conn.close()

@app.route('/api/scoreboard', methods=['GET'])
def get_scoreboard(): # Renamed to avoid conflict with any potential local variable
    """Endpoint to get all participants, ordered by rank."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, rank, participant, project, score, lastUpdated FROM participants ORDER BY rank ASC, score DESC")
    scoreboard_list = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(scoreboard_list)

@app.route('/api/participant', methods=['GET', 'POST'])
def handle_participants():
    if request.method == 'GET':
        return get_all_participants()
    elif request.method == 'POST':
        return add_participant()

def get_all_participants():
    """Endpoint to get all participants."""
    conn = get_db_connection()
    cursor = conn.cursor()
    # Order by name or ID, as rank might not be relevant for a simple list display in the form
    cursor.execute("SELECT id, participant, project, score, lastUpdated FROM participants ORDER BY id ASC")
    participants_list = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(participants_list)

def add_participant():
    """Endpoint to add a new participant."""
    data = request.get_json()
    participant_name = (data.get('participant')).strip()
    project_id = (data.get('project')).strip()
    # score = data.get('score', 0) # Allow score to be passed, default to 0

    print(f"Received data: {data}")
    print(f"Participant name: {participant_name}")
    print(f"Project ID: {project_id}")


    if not participant_name or not project_id:
        return jsonify({"message": "Participant name and project ID are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    last_updated_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        cursor.execute(
            "INSERT INTO participants (participant, project, score, lastUpdated) VALUES (?, ?, ?, ?)",
            (participant_name, project_id, 0, last_updated_time) # New participants start with score 0
        )
        conn.commit()
        new_participant_id = cursor.lastrowid
    except sqlite3.IntegrityError: # Participant and project combination already exists
        # For now, let's just indicate it's a duplicate.
        # Future enhancement: update existing entry or handle as an error.
        conn.close()
        # Attempting to fetch the existing one to return, though this might be better handled by an update mechanism
        existing_conn = get_db_connection()
        existing_cursor = existing_conn.cursor()
        existing_cursor.execute("SELECT * FROM participants WHERE participant = ? AND project = ?", (participant_name, project_id))
        existing_participant_row = existing_cursor.fetchone()
        existing_conn.close()
        if existing_participant_row:
             existing_participant = dict(existing_participant_row)
             return jsonify({"message": "Participant already exists.", "participant": existing_participant}), 409 # Conflict
        # This case should ideally not be reached if the UNIQUE constraint is on (participant, project)
        # and the IntegrityError is specifically for that.
        # However, to be safe, we can return a more generic message or the specific Korean message.
        return jsonify({"message": "Other error."}), 409


    conn.close() # Close initial connection
    
    # update_ranks() # Update ranks after adding/updating - Removed for performance

    # Fetch the newly added or updated participant to return it
    final_conn = get_db_connection()
    final_cursor = final_conn.cursor()
    final_cursor.execute("SELECT * FROM participants WHERE id = ?", (new_participant_id,))
    participant_to_return = dict(final_cursor.fetchone())
    final_conn.close()
    
    return jsonify(participant_to_return), 201

@app.route('/api/participant/<int:participant_id>', methods=['DELETE'])
def delete_participant_by_id(participant_id):
    """Endpoint to delete a participant by their ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Also delete their records from the processed_blobs table
    cursor.execute("DELETE FROM processed_blobs WHERE participant_id = ?", (participant_id,))
    cursor.execute("DELETE FROM participants WHERE id = ?", (participant_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"message": "Participant not found."}), 404
    
    conn.close()
    # update_ranks() # Update ranks after deletion - Removed for performance
    return jsonify({"message": "Participant deleted successfully."}), 200

@app.route('/api/update-ranks', methods=['POST']) # Changed to POST as it's an action
def trigger_update_ranks():
    """Endpoint to explicitly trigger the rank update process."""
    try:
        update_ranks()
        return jsonify({"message": "Ranks updated successfully."}), 200
    except Exception as e:
        # Log the exception e if you have logging setup
        print(f"Error updating ranks: {e}")
        return jsonify({"message": "Failed to update ranks."}), 500

if __name__ == '__main__':
    init_db()  # Initialize the database when the app starts
    app.run(debug=False, host='0.0.0.0', port=8080)
