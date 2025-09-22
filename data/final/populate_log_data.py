#!/usr/bin/env python3
"""
Helper Script for Populating Participants Log Summary

This script provides utility functions to help populate the participants_log_summary.csv
with actual data.

Usage:
    python populate_log_data.py

Author: Research Assistant  
Date: September 15, 2025
"""

import pandas as pd
import numpy as np


def load_template():
    """Load the participants log summary template."""
    template_path = '/Users/h2o/Documents/Projects/Research/Visplora/data/final/participants_log_summary.csv'
    return pd.read_csv(template_path)


def save_template(df):
    """Save the updated template."""
    template_path = '/Users/h2o/Documents/Projects/Research/Visplora/data/final/participants_log_summary.csv'
    df.to_csv(template_path, index=False)
    print(f"Updated template saved to: {template_path}")


def update_participant_data(df, participant_id, condition, **kwargs):
    """
    Update data for a specific participant and condition.
    
    Args:
        df (pd.DataFrame): The template DataFrame
        participant_id (str): Participant ID
        condition (str): 'Baseline' or 'NS'
        **kwargs: Column values to update
    
    Returns:
        bool: True if update was successful, False otherwise
    """
    mask = (df['participant_id'] == participant_id) & (df['condition'] == condition)
    
    if not mask.any():
        print(f"Error: No row found for participant {participant_id} with condition {condition}")
        return False
    
    for column, value in kwargs.items():
        if column in df.columns:
            df.loc[mask, column] = value
        else:
            print(f"Warning: Column '{column}' not found in template")
    
    print(f"Updated {participant_id} ({condition}): {kwargs}")
    return True


def show_participant_summary(df):
    """Show summary of current data completeness."""
    print("\nData Completeness Summary:")
    print("=" * 50)
    
    total_rows = len(df)
    print(f"Total rows: {total_rows}")
    
    for col in df.columns:
        if col not in ['participant_id', 'condition']:
            non_null_count = df[col].notna().sum()
            completion_rate = (non_null_count / total_rows) * 100
            print(f"{col}: {non_null_count}/{total_rows} ({completion_rate:.1f}%)")


def example_data_entry():
    """Example of how to populate data for participants."""
    df = load_template()
    
    # Example data entry for first participant
    participant_id = "5f4520ebb012170878012efc"
    
    # Update Baseline condition
    update_participant_data(
        df, participant_id, "Baseline",
        final_time=3600,  # 1 hour
        insights_generated=12,
        insights_retained=8,
        factors_explored=5,
        factors_included_in_story=3,
        factors_used_in_decision=4,
        branches_created=2,
        divergence_semantic_distance_avg=0.65,
        divergence_semantic_distance_min=0.42,
        divergence_semantic_distance_max=0.88,
        reflection_events=7,
        reflection_edit_coupled=5
    )
    
    # Update NS condition
    update_participant_data(
        df, participant_id, "NS",
        final_time=4200,  # 1 hour 10 minutes
        insights_generated=15,
        insights_retained=11,
        factors_explored=7,
        factors_included_in_story=5,
        factors_used_in_decision=6,
        branches_created=4,
        divergence_semantic_distance_avg=0.72,
        divergence_semantic_distance_min=0.38,
        divergence_semantic_distance_max=0.95,
        reflection_events=12,
        reflection_edit_coupled=9
    )
    
    show_participant_summary(df)
    save_template(df)


def batch_update_from_dict(df, updates_dict):
    """
    Update multiple participants from a dictionary.
    
    Args:
        df (pd.DataFrame): Template DataFrame
        updates_dict (dict): Dictionary with structure:
            {
                'participant_id': {
                    'Baseline': {column: value, ...},
                    'NS': {column: value, ...}
                }
            }
    """
    for participant_id, conditions in updates_dict.items():
        for condition, data in conditions.items():
            update_participant_data(df, participant_id, condition, **data)


def main():
    """Main function for interactive data entry."""
    print("Participants Log Summary Data Entry Helper")
    print("=" * 50)
    
    # Run example
    print("Running example data entry...")
    example_data_entry()
    
    print("\nTo add more data, use the update_participant_data function:")
    print("df = load_template()")
    print("update_participant_data(df, 'participant_id', 'Baseline', final_time=3600, insights_generated=10)")
    print("save_template(df)")


if __name__ == "__main__":
    main()