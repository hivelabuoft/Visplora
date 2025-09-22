#!/usr/bin/env python3
"""
Quick Reference and Batch Operations for Participant Event Files

This script provides utility functions for working with all participant event files.

Author: Research Assistant
Date: September 17, 2025
"""

import pandas as pd
from pathlib import Path
import glob


def list_all_participants():
    """Get list of all participants from the CSV files."""
    event_dir = Path(__file__).parent
    baseline_files = list(event_dir.glob("*_baseline.csv"))
    
    participants = []
    for file in baseline_files:
        participant_id = file.stem.replace("_baseline", "")
        participants.append(participant_id)
    
    return sorted(participants)


def get_participant_files(participant_id):
    """Get both baseline and NS file paths for a participant."""
    event_dir = Path(__file__).parent
    baseline_file = event_dir / f"{participant_id}_baseline.csv"
    ns_file = event_dir / f"{participant_id}_ns.csv"
    
    return {
        'baseline': baseline_file,
        'ns': ns_file
    }


def load_all_event_data():
    """Load all participant event data into a combined DataFrame."""
    participants = list_all_participants()
    all_data = []
    
    for participant_id in participants:
        files = get_participant_files(participant_id)
        
        # Load baseline data
        try:
            baseline_df = pd.read_csv(files['baseline'])
            baseline_df['participant_id'] = participant_id
            baseline_df['condition'] = 'baseline'
            all_data.append(baseline_df)
        except Exception as e:
            print(f"Error loading baseline data for {participant_id}: {e}")
        
        # Load NS data
        try:
            ns_df = pd.read_csv(files['ns'])
            ns_df['participant_id'] = participant_id
            ns_df['condition'] = 'ns'
            all_data.append(ns_df)
        except Exception as e:
            print(f"Error loading NS data for {participant_id}: {e}")
    
    if all_data:
        combined_df = pd.concat(all_data, ignore_index=True)
        return combined_df
    else:
        return pd.DataFrame()


def get_event_summary():
    """Get summary statistics of all event data."""
    df = load_all_event_data()
    
    if df.empty:
        print("No event data found.")
        return
    
    print("Event Data Summary")
    print("=" * 50)
    print(f"Total participants: {df['participant_id'].nunique()}")
    print(f"Total events logged: {len(df)}")
    print(f"Events by condition:")
    print(df['condition'].value_counts())
    
    if 'event_type' in df.columns and df['event_type'].notna().any():
        print(f"\nEvent types:")
        print(df['event_type'].value_counts())
    
    print(f"\nEvents per participant:")
    participant_counts = df.groupby(['participant_id', 'condition']).size().reset_index(name='event_count')
    print(participant_counts.head(10))


def export_combined_data(output_file='all_participant_events.csv'):
    """Export all event data to a single CSV file."""
    df = load_all_event_data()
    
    if df.empty:
        print("No event data to export.")
        return
    
    output_path = Path(__file__).parent / output_file
    df.to_csv(output_path, index=False)
    print(f"All event data exported to: {output_path}")


def validate_file_structure():
    """Validate that all expected files exist and have correct structure."""
    participants = list_all_participants()
    print(f"Validating files for {len(participants)} participants...")
    
    missing_files = []
    invalid_files = []
    
    for participant_id in participants:
        files = get_participant_files(participant_id)
        
        for condition, filepath in files.items():
            if not filepath.exists():
                missing_files.append(f"{participant_id}_{condition}.csv")
            else:
                try:
                    df = pd.read_csv(filepath)
                    expected_columns = ['timestamp_normalized', 'event_type']
                    
                    if not all(col in df.columns for col in expected_columns):
                        invalid_files.append(f"{participant_id}_{condition}.csv - missing columns")
                        
                except Exception as e:
                    invalid_files.append(f"{participant_id}_{condition}.csv - {str(e)}")
    
    print(f"\nValidation Results:")
    print(f"Expected files: {len(participants) * 2}")
    print(f"Missing files: {len(missing_files)}")
    print(f"Invalid files: {len(invalid_files)}")
    
    if missing_files:
        print(f"\nMissing files:")
        for file in missing_files:
            print(f"  - {file}")
    
    if invalid_files:
        print(f"\nInvalid files:")
        for file in invalid_files:
            print(f"  - {file}")
    
    if not missing_files and not invalid_files:
        print("✅ All files are present and valid!")


def main():
    """Main function for running quick reference operations."""
    print("Participant Event Files - Quick Reference")
    print("=" * 50)
    
    participants = list_all_participants()
    print(f"Found {len(participants)} participants")
    
    # Validate file structure
    validate_file_structure()
    
    # Get summary
    get_event_summary()
    
    print(f"\nExample operations:")
    print(f"- List participants: list_all_participants()")
    print(f"- Load all data: load_all_event_data()")
    print(f"- Export combined: export_combined_data()")
    print(f"- Get summary: get_event_summary()")


if __name__ == "__main__":
    main()