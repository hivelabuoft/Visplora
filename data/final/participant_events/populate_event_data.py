#!/usr/bin/env python3
"""
Helper script for populating participant event data.

Usage:
    python populate_event_data.py
"""

import pandas as pd
from pathlib import Path

def load_participant_file(participant_id, condition):
    """Load a participant's event file."""
    filename = f"{participant_id}_{condition}.csv"
    filepath = Path(__file__).parent / filename
    return pd.read_csv(filepath)

def save_participant_file(df, participant_id, condition):
    """Save a participant's event file."""
    filename = f"{participant_id}_{condition}.csv"
    filepath = Path(__file__).parent / filename
    df.to_csv(filepath, index=False)
    print(f"Saved {filename}")

def add_event(participant_id, condition, timestamp_normalized, event_type):
    """Add an event to a participant's file."""
    df = load_participant_file(participant_id, condition)
    
    new_event = pd.DataFrame({
        'timestamp_normalized': [timestamp_normalized],
        'event_type': [event_type]
    })
    
    df = pd.concat([df, new_event], ignore_index=True)
    df = df.sort_values('timestamp_normalized').reset_index(drop=True)
    
    save_participant_file(df, participant_id, condition)

def add_multiple_events(participant_id, condition, events):
    """
    Add multiple events to a participant's file.
    
    Args:
        participant_id (str): Participant ID
        condition (str): 'baseline' or 'ns'
        events (list): List of tuples (timestamp_normalized, event_type)
    """
    df = load_participant_file(participant_id, condition)
    
    new_events = pd.DataFrame(events, columns=['timestamp_normalized', 'event_type'])
    df = pd.concat([df, new_events], ignore_index=True)
    df = df.sort_values('timestamp_normalized').reset_index(drop=True)
    
    save_participant_file(df, participant_id, condition)

# Example usage:
if __name__ == "__main__":
    # Example: Add events for a participant
    participant_id = "5f4520ebb012170878012efc"
    
    # Add single event
    add_event(participant_id, "baseline", 0.0, "session_start")
    add_event(participant_id, "baseline", 0.1, "data_exploration_start")
    
    # Add multiple events at once
    events = [
        (0.25, "filter_applied"),
        (0.4, "insight_generated"),
        (0.6, "branch_created"),
        (0.8, "reflection_event"),
        (1.0, "session_end")
    ]
    add_multiple_events(participant_id, "baseline", events)
    
    print("Example events added successfully!")
