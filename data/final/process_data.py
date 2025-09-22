#!/usr/bin/env python3
"""
Python script to process and merge CSV files according to the following requirements:

1. Sort final.csv by EndDate in descending order
2. Sort demo.csv by "Completed at" in descending order  
3. Assign participant IDs in that order (only participant IDs from demo.csv)
4. Join with recruitment.csv where participant ID matches PROLIFIC_PID
5. Return merged CSV with everything from final.csv, PROLIFIC_PID, first name and last name from recruitment

Author: Generated for data processing task
Date: September 12, 2025
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os

def main():
    # Define file paths
    final_csv_path = "final.csv"
    demo_csv_path = "demo.csv"
    recruitment_csv_path = "recuitment.csv"  # Note: using the actual filename with typo
    output_csv_path = "merged_data.csv"
    
    print("Starting data processing...")
    
    # Read the CSV files
    print("Reading CSV files...")
    
    # Read final.csv - skip the header rows that contain metadata
    print("Processing final.csv...")
    
    # Read the file normally first to see all data
    final_df_all = pd.read_csv(final_csv_path, header=0, encoding='utf-8')
    
    # Filter rows that start with "2025" (actual data rows)
    # Convert to string to handle the filtering
    final_df_all['StartDate_str'] = final_df_all['StartDate'].astype(str)
    final_df = final_df_all[final_df_all['StartDate_str'].str.startswith('2025')].copy()
    final_df = final_df.drop('StartDate_str', axis=1)  # Remove helper column
    
    print(f"Final.csv columns: {list(final_df.columns)[:5]}...")  # Show first 5 columns
    
    # Read demo.csv
    print("Processing demo.csv...")
    demo_df = pd.read_csv(demo_csv_path)
    
    # Read recruitment.csv - similar structure to final.csv
    print("Processing recruitment.csv...")
    
    # For recruitment file, use the first line as headers since it contains proper column names
    recruitment_df_all = pd.read_csv(recruitment_csv_path, encoding='utf-8')
    
    # Filter rows that start with "2025" (actual data rows)
    recruitment_df_all['StartDate_str'] = recruitment_df_all['StartDate'].astype(str)
    recruitment_df = recruitment_df_all[recruitment_df_all['StartDate_str'].str.startswith('2025')].copy()
    recruitment_df = recruitment_df.drop('StartDate_str', axis=1)  # Remove helper column
    
    print(f"Final.csv shape: {final_df.shape}")
    print(f"Demo.csv shape: {demo_df.shape}")
    print(f"Recruitment.csv shape: {recruitment_df.shape}")
    
    # Step 1: Sort final.csv by EndDate in descending order
    print("Sorting final.csv by EndDate...")
    final_df['EndDate'] = pd.to_datetime(final_df['EndDate'])
    final_df_sorted = final_df.sort_values('EndDate', ascending=False).reset_index(drop=True)
    
    # Step 2: Sort demo.csv by "Completed at" in descending order
    print("Sorting demo.csv by Completed at...")
    demo_df['Completed at'] = pd.to_datetime(demo_df['Completed at'])
    demo_df_sorted = demo_df.sort_values('Completed at', ascending=False).reset_index(drop=True)
    
    # Step 3: Assign participant IDs in order (from demo.csv)
    print("Assigning participant IDs...")
    
    # Get participant IDs from sorted demo data
    participant_ids = demo_df_sorted['Participant id'].tolist()
    
    # Create a mapping: assign participant IDs to final.csv records in the sorted order
    if len(participant_ids) != len(final_df_sorted):
        print(f"Warning: Number of participant IDs ({len(participant_ids)}) doesn't match final.csv records ({len(final_df_sorted)})")
        # Take minimum to avoid index errors
        min_length = min(len(participant_ids), len(final_df_sorted))
        participant_ids = participant_ids[:min_length]
        final_df_sorted = final_df_sorted.iloc[:min_length]
    
    # Add participant IDs to final_df_sorted
    final_df_sorted['participant_id'] = participant_ids
    
    # Step 4: Join with recruitment.csv where participant_id matches PROLIFIC_PID
    print("Joining with recruitment data...")
    
    # Select relevant columns from recruitment
    # Names are in Q4 (first name), Q3 seems to be empty/other data
    recruitment_cols = ['PROLIFIC_PID', 'Q4']  # Q4 contains the name
    # Handle case where columns might have different names in recruitment file
    available_recruitment_cols = []
    for col in recruitment_cols:
        if col in recruitment_df.columns:
            available_recruitment_cols.append(col)
    
    recruitment_subset = recruitment_df[available_recruitment_cols].copy()
    
    # Rename columns to match expected names
    if 'Q4' in available_recruitment_cols:
        recruitment_subset = recruitment_subset.rename(columns={'Q4': 'FullName'})
    
    # Merge final_df_sorted with recruitment data
    merged_df = final_df_sorted.merge(
        recruitment_subset,
        left_on='participant_id',
        right_on='PROLIFIC_PID',
        how='left'
    )
    
    print(f"Merged data shape: {merged_df.shape}")
    print(f"Successfully matched records: {merged_df['PROLIFIC_PID'].notna().sum()}")
    
    # Step 5: Save the result
    print(f"Saving merged data to {output_csv_path}...")
    merged_df.to_csv(output_csv_path, index=False)
    
    # Display summary statistics
    print("\n=== SUMMARY ===")
    print(f"Total records in final output: {len(merged_df)}")
    print(f"Records with matched PROLIFIC_PID: {merged_df['PROLIFIC_PID'].notna().sum()}")
    print(f"Records without match: {merged_df['PROLIFIC_PID'].isna().sum()}")
    
    # Show first few rows of key columns
    print("\n=== SAMPLE OUTPUT ===")
    display_cols = ['participant_id', 'PROLIFIC_PID', 'FullName', 'EndDate']
    available_cols = [col for col in display_cols if col in merged_df.columns]
    print(merged_df[available_cols].head(10))
    
    print(f"\nOutput saved to: {output_csv_path}")

if __name__ == "__main__":
    main()