#!/usr/bin/env python3
"""
Calculate Summary Statistics from Participant Event Data

This script reads all participant event CSV files and calculates:
- insights_generated: Count of insight_generated events
- branches_created: Count of alternative_explored events (proxy for branches)
- reflection_events: Count of all reflection_* events
- reflection_edit_coupled: Count of writing events within 30 seconds after reflection events

Author: Research Assistant
Date: September 17, 2025
"""

import pandas as pd
import numpy as np
from pathlib import Path
import glob


def load_participant_event_data(participant_id, condition):
    """
    Load event data for a specific participant and condition.
    
    Args:
        participant_id (str): Participant ID
        condition (str): 'baseline' or 'ns'
    
    Returns:
        pandas.DataFrame: Event data with timestamp_normalized and event_type
    """
    events_dir = Path('/Users/h2o/Documents/Projects/Research/Visplora/data/final/participant_events')
    filename = f"{participant_id}_{condition}.csv"
    filepath = events_dir / filename
    
    if not filepath.exists():
        print(f"Warning: File not found: {filepath}")
        return pd.DataFrame()
    
    try:
        df = pd.read_csv(filepath)
        if df.empty:
            return df
        
        # Ensure timestamp is sorted
        df = df.sort_values('timestamp_normalized').reset_index(drop=True)
        return df
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return pd.DataFrame()


def calculate_insights_generated(df):
    """Count insight_generated events."""
    if df.empty:
        return 0
    if 'event_type' not in df.columns:
        print(f"Warning: 'event_type' column not found in DataFrame. Columns: {df.columns.tolist()}")
        return 0
    return len(df[df['event_type'] == 'insight_generated'])


def calculate_branches_created(df):
    """Count alternative_explored events as proxy for branches."""
    if df.empty:
        return 0
    if 'event_type' not in df.columns:
        print(f"Warning: 'event_type' column not found in DataFrame. Columns: {df.columns.tolist()}")
        return 0
    return len(df[df['event_type'] == 'alternative_explored'])


def calculate_reflection_events(df):
    """Count all reflection events (reflection_insight, reflection_inquiry, reflection_sentence)."""
    if df.empty:
        return 0
    
    if 'event_type' not in df.columns:
        print(f"Warning: 'event_type' column not found in DataFrame. Columns: {df.columns.tolist()}")
        return 0
    
    reflection_types = ['reflection_insight', 'reflection_inquiry', 'reflection_sentence']
    reflection_mask = df['event_type'].isin(reflection_types)
    return len(df[reflection_mask])


def calculate_reflection_edit_coupled(df, time_window_seconds=30, session_duration_minutes=30):
    """
    Calculate reflection-edit coupling: writing events within 30 seconds after reflection events.
    
    Args:
        df (pandas.DataFrame): Event data
        time_window_seconds (int): Time window in seconds (default 30)
        session_duration_minutes (int): Total session duration in minutes (default 30)
    
    Returns:
        int: Count of writing events within time window after reflection events
    """
    if df.empty:
        return 0
    
    # Convert normalized time to seconds
    session_duration_seconds = session_duration_minutes * 60
    df = df.copy()
    df['timestamp_seconds'] = df['timestamp_normalized'] * session_duration_seconds
    
    # Find reflection events
    reflection_types = ['reflection_insight', 'reflection_inquiry', 'reflection_sentence']
    reflection_events = df[df['event_type'].isin(reflection_types)].copy()
    
    # Find writing events
    writing_types = ['narrative_event_new_writing', 'narrative_event_refinement']
    writing_events = df[df['event_type'].isin(writing_types)].copy()
    
    if reflection_events.empty or writing_events.empty:
        return 0
    
    coupled_count = 0
    
    # For each reflection event, check if there's a writing event within the time window
    for _, reflection_row in reflection_events.iterrows():
        reflection_time = reflection_row['timestamp_seconds']
        
        # Find writing events within the time window after this reflection
        time_window_end = reflection_time + time_window_seconds
        
        # Check if any writing event occurs within the window
        writing_in_window = writing_events[
            (writing_events['timestamp_seconds'] > reflection_time) &
            (writing_events['timestamp_seconds'] <= time_window_end)
        ]
        
        if not writing_in_window.empty:
            coupled_count += 1
    
    return coupled_count


def process_participant(participant_id, condition):
    """
    Process a single participant-condition combination.
    
    Args:
        participant_id (str): Participant ID
        condition (str): 'baseline' or 'ns'
    
    Returns:
        dict: Calculated metrics
    """
    df = load_participant_event_data(participant_id, condition)
    
    if df.empty:
        print(f"No data for {participant_id} {condition}")
        return {
            'insights_generated': 0,
            'branches_created': 0,
            'reflection_events': 0,
            'reflection_edit_coupled': 0
        }
    
    metrics = {
        'insights_generated': calculate_insights_generated(df),
        'branches_created': calculate_branches_created(df),
        'reflection_events': calculate_reflection_events(df),
        'reflection_edit_coupled': calculate_reflection_edit_coupled(df)
    }
    
    return metrics


def get_all_participants():
    """Get list of all participants from event files."""
    events_dir = Path('/Users/h2o/Documents/Projects/Research/Visplora/data/final/participant_events')
    baseline_files = list(events_dir.glob("*_baseline.csv"))
    
    participants = []
    for file in baseline_files:
        participant_id = file.stem.replace("_baseline", "")
        participants.append(participant_id)
    
    return sorted(participants)


def update_summary_file():
    """Update the participants_log_summary.csv file with calculated metrics."""
    summary_path = '/Users/h2o/Documents/Projects/Research/Visplora/data/final/participants_log_summary.csv'
    
    # Load existing summary
    try:
        summary_df = pd.read_csv(summary_path)
        print(f"Loaded existing summary with {len(summary_df)} rows")
    except Exception as e:
        print(f"Error loading summary file: {e}")
        return
    
    # Get all participants
    participants = get_all_participants()
    print(f"Found {len(participants)} participants")
    
    # Process each participant and condition
    for participant_id in participants:
        for condition in ['Baseline', 'NS']:
            # Find the row in summary DataFrame
            mask = (summary_df['participant_id'] == participant_id) & (summary_df['condition'] == condition)
            row_indices = summary_df[mask].index
            
            if len(row_indices) == 0:
                print(f"Warning: No row found for {participant_id} {condition}")
                continue
            
            row_idx = row_indices[0]
            
            # Process the participant data
            condition_lower = condition.lower()
            metrics = process_participant(participant_id, condition_lower)
            
            # Update the summary DataFrame
            summary_df.loc[row_idx, 'insights_generated'] = metrics['insights_generated']
            summary_df.loc[row_idx, 'branches_created'] = metrics['branches_created']
            summary_df.loc[row_idx, 'reflection_events'] = metrics['reflection_events']
            summary_df.loc[row_idx, 'reflection_edit_coupled'] = metrics['reflection_edit_coupled']
            
            print(f"Updated {participant_id} {condition}: "
                  f"insights={metrics['insights_generated']}, "
                  f"branches={metrics['branches_created']}, "
                  f"reflections={metrics['reflection_events']}, "
                  f"coupled={metrics['reflection_edit_coupled']}")
    
    # Save updated summary
    try:
        summary_df.to_csv(summary_path, index=False)
        print(f"\nSuccessfully updated {summary_path}")
    except Exception as e:
        print(f"Error saving summary file: {e}")
        return
    
    # Display summary statistics
    print(f"\n" + "=" * 60)
    print("SUMMARY STATISTICS")
    print("=" * 60)
    
    for condition in ['Baseline', 'NS']:
        condition_data = summary_df[summary_df['condition'] == condition]
        print(f"\n{condition} Condition (n={len(condition_data)}):")
        
        for metric in ['insights_generated', 'branches_created', 'reflection_events', 'reflection_edit_coupled']:
            values = condition_data[metric].dropna()
            if not values.empty:
                print(f"  {metric}:")
                print(f"    Mean: {values.mean():.2f}")
                print(f"    Std:  {values.std():.2f}")
                print(f"    Min:  {values.min()}")
                print(f"    Max:  {values.max()}")


def main():
    """Main function to calculate and update summary statistics."""
    print("Calculating Summary Statistics from Participant Event Data")
    print("=" * 60)
    
    try:
        update_summary_file()
        print("\n" + "=" * 60)
        print("CALCULATION COMPLETED SUCCESSFULLY!")
        print("Summary file has been updated with event-based metrics.")
        
    except Exception as e:
        print(f"Error in main execution: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)