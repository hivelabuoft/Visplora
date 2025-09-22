#!/usr/bin/env python3
"""
Simple Analysis of Summary Statistics

This script provides basic statistical analysis of the calculated metrics
from participant event data without advanced visualization dependencies.

Author: Research Assistant  
Date: September 18, 2025
"""

import pandas as pd
import numpy as np
from pathlib import Path


def load_summary_data():
    """Load the participants log summary data."""
    summary_path = '/Users/h2o/Documents/Projects/Research/Visplora/data/final/participants_log_summary.csv'
    
    try:
        df = pd.read_csv(summary_path)
        print(f"Loaded summary data with {len(df)} rows")
        return df
    except Exception as e:
        print(f"Error loading summary file: {e}")
        return None


def analyze_condition_differences(df):
    """Analyze differences between Baseline and NS conditions."""
    print("\n" + "="*60)
    print("CONDITION COMPARISON ANALYSIS")
    print("="*60)
    
    baseline_data = df[df['condition'] == 'Baseline']
    ns_data = df[df['condition'] == 'NS']
    
    metrics = ['insights_generated', 'branches_created', 'reflection_events', 'reflection_edit_coupled']
    
    print(f"\nSample sizes:")
    print(f"  Baseline: {len(baseline_data)} participants")
    print(f"  NS: {len(ns_data)} participants")
    
    for metric in metrics:
        print(f"\n{metric.replace('_', ' ').title()}:")
        
        baseline_vals = baseline_data[metric].dropna()
        ns_vals = ns_data[metric].dropna()
        
        if len(baseline_vals) > 0 and len(ns_vals) > 0:
            print(f"  Baseline: Mean={baseline_vals.mean():.2f}, SD={baseline_vals.std():.2f}, Range={baseline_vals.min()}-{baseline_vals.max()}")
            print(f"  NS:       Mean={ns_vals.mean():.2f}, SD={ns_vals.std():.2f}, Range={ns_vals.min()}-{ns_vals.max()}")
            
            difference = ns_vals.mean() - baseline_vals.mean()
            percent_change = ((ns_vals.mean() - baseline_vals.mean()) / baseline_vals.mean()) * 100
            
            print(f"  Difference: {difference:.2f} ({percent_change:+.1f}%)")
            
            # Simple effect size (Cohen's d approximation)
            pooled_std = np.sqrt(((baseline_vals.std()**2) + (ns_vals.std()**2)) / 2)
            effect_size = difference / pooled_std if pooled_std > 0 else 0
            print(f"  Effect Size (Cohen's d): {effect_size:.2f}")


def analyze_correlations(df):
    """Analyze correlations between metrics within each condition."""
    print("\n" + "="*60)
    print("CORRELATION ANALYSIS")
    print("="*60)
    
    metrics = ['insights_generated', 'branches_created', 'reflection_events', 'reflection_edit_coupled']
    
    for condition in ['Baseline', 'NS']:
        print(f"\n{condition} Condition Correlations:")
        condition_data = df[df['condition'] == condition][metrics].dropna()
        
        if len(condition_data) > 2:
            corr_matrix = condition_data.corr()
            
            for i, metric1 in enumerate(metrics):
                for j, metric2 in enumerate(metrics):
                    if i < j:  # Only show upper triangle
                        corr_val = corr_matrix.loc[metric1, metric2]
                        print(f"  {metric1} × {metric2}: r = {corr_val:.3f}")


def analyze_participant_profiles(df):
    """Analyze individual participant profiles."""
    print("\n" + "="*60)
    print("PARTICIPANT PROFILE ANALYSIS")
    print("="*60)
    
    # Calculate improvement scores (NS - Baseline for each participant)
    participants = df['participant_id'].unique()
    improvements = []
    
    for participant in participants:
        p_data = df[df['participant_id'] == participant]
        if len(p_data) == 2:  # Both conditions present
            baseline_row = p_data[p_data['condition'] == 'Baseline'].iloc[0]
            ns_row = p_data[p_data['condition'] == 'NS'].iloc[0]
            
            improvement = {
                'participant_id': participant,
                'insights_improvement': ns_row['insights_generated'] - baseline_row['insights_generated'],
                'branches_improvement': ns_row['branches_created'] - baseline_row['branches_created'],
                'reflection_improvement': ns_row['reflection_events'] - baseline_row['reflection_events'],
                'coupling_improvement': ns_row['reflection_edit_coupled'] - baseline_row['reflection_edit_coupled']
            }
            improvements.append(improvement)
    
    if improvements:
        improvement_df = pd.DataFrame(improvements)
        
        print(f"\nParticipant Improvements (NS - Baseline):")
        print(f"Number of participants with both conditions: {len(improvement_df)}")
        
        for metric in ['insights_improvement', 'branches_improvement', 'reflection_improvement', 'coupling_improvement']:
            values = improvement_df[metric]
            positive_count = sum(values > 0)
            negative_count = sum(values < 0)
            zero_count = sum(values == 0)
            
            print(f"\n{metric.replace('_improvement', '').replace('_', ' ').title()} Improvement:")
            print(f"  Mean improvement: {values.mean():.2f}")
            print(f"  Participants improved: {positive_count}/{len(values)} ({positive_count/len(values)*100:.1f}%)")
            print(f"  Participants worse: {negative_count}/{len(values)} ({negative_count/len(values)*100:.1f}%)")
            print(f"  No change: {zero_count}/{len(values)} ({zero_count/len(values)*100:.1f}%)")


def main():
    """Main analysis function."""
    print("Summary Statistics Analysis")
    print("="*60)
    
    # Load data
    df = load_summary_data()
    if df is None:
        return 1
    
    # Basic info
    print(f"\nDataset Overview:")
    print(f"  Total rows: {len(df)}")
    print(f"  Participants: {len(df['participant_id'].unique())}")
    print(f"  Conditions: {df['condition'].unique()}")
    
    # Run analyses
    analyze_condition_differences(df)
    analyze_correlations(df)
    analyze_participant_profiles(df)
    
    print("\n" + "="*60)
    print("ANALYSIS COMPLETED!")
    print("="*60)
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)