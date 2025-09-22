#!/usr/bin/env python3
"""
Clean merged_data.csv by removing specified columns and adding Baseline/NS columns.
"""

import pandas as pd
import numpy as np

def clean_merged_data():
    """
    Remove specified columns and add Baseline/NS columns with proper distribution.
    """
    
    # Read the merged data
    print("Reading merged_data.csv...")
    df = pd.read_csv('merged_data.csv')
    
    print(f"Original data shape: {df.shape}")
    print(f"Original columns: {list(df.columns)}")
    
    # Remove specified columns
    columns_to_remove = ['RecipientLastName', 'RecipientFirstName', 'RecipientEmail', 'ExternalReference']
    
    # Check which columns actually exist before removing
    existing_columns_to_remove = [col for col in columns_to_remove if col in df.columns]
    missing_columns = [col for col in columns_to_remove if col not in df.columns]
    
    if missing_columns:
        print(f"Warning: These columns were not found and will be skipped: {missing_columns}")
    
    if existing_columns_to_remove:
        print(f"Removing columns: {existing_columns_to_remove}")
        df = df.drop(columns=existing_columns_to_remove)
    
    # Add Baseline and NS columns
    print("\nAdding Baseline and NS columns...")
    
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Create baseline assignment: 8 participants with Baseline=1, 9 with Baseline=2
    total_participants = len(df)
    print(f"Total participants: {total_participants}")
    
    # Create baseline values: 8 ones and 9 twos
    baseline_values = [1] * 8 + [2] * (total_participants - 8)
    
    # Shuffle to randomize assignment
    np.random.shuffle(baseline_values)
    
    # Add Baseline column
    df['Baseline'] = baseline_values
    
    # Add NS column (opposite of Baseline)
    df['NS'] = df['Baseline'].apply(lambda x: 2 if x == 1 else 1)
    
    # Verify the distribution
    baseline_counts = df['Baseline'].value_counts().sort_index()
    ns_counts = df['NS'].value_counts().sort_index()
    
    print(f"\nBaseline distribution:")
    print(f"  Baseline = 1: {baseline_counts.get(1, 0)} participants")
    print(f"  Baseline = 2: {baseline_counts.get(2, 0)} participants")
    
    print(f"\nNS distribution:")
    print(f"  NS = 1: {ns_counts.get(1, 0)} participants")
    print(f"  NS = 2: {ns_counts.get(2, 0)} participants")
    
    # Save the cleaned data
    output_file = 'merged_data_cleaned.csv'
    df.to_csv(output_file, index=False)
    
    print(f"\nCleaned data saved to: {output_file}")
    print(f"Final data shape: {df.shape}")
    print(f"Final columns: {list(df.columns)}")
    
    # Show first few rows of new columns
    print(f"\nFirst 10 rows showing Baseline and NS assignment:")
    print(df[['Baseline', 'NS']].head(10))
    
    return df

if __name__ == "__main__":
    cleaned_df = clean_merged_data()