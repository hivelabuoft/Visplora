#!/usr/bin/env python3
"""
Analyze and Visualize Summary Statistics

This script creates visualizations and detailed analysis of the calculated metrics
from participant event data.

Author: Research Assistant
Date: September 17, 2025
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
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


def analyze_metrics(df):
    """Analyze the calculated metrics by condition."""
    print("\n" + "=" * 80)
    print("DETAILED METRIC ANALYSIS")
    print("=" * 80)
    
    metrics = ['insights_generated', 'branches_created', 'reflection_events', 'reflection_edit_coupled']
    
    for metric in metrics:
        print(f"\n{metric.upper().replace('_', ' ')}")
        print("-" * 50)
        
        for condition in ['Baseline', 'NS']:
            condition_data = df[df['condition'] == condition][metric].dropna()
            
            if not condition_data.empty:
                print(f"{condition:>10}: Mean={condition_data.mean():5.2f}, "
                      f"Std={condition_data.std():5.2f}, "
                      f"Range=[{condition_data.min()}-{condition_data.max()}], "
                      f"n={len(condition_data)}")
        
        # Statistical comparison
        baseline_data = df[df['condition'] == 'Baseline'][metric].dropna()
        ns_data = df[df['condition'] == 'NS'][metric].dropna()
        
        if not baseline_data.empty and not ns_data.empty:
            # Calculate effect size (Cohen's d)
            pooled_std = np.sqrt(((len(baseline_data) - 1) * baseline_data.var() + 
                                 (len(ns_data) - 1) * ns_data.var()) / 
                                (len(baseline_data) + len(ns_data) - 2))
            cohens_d = (ns_data.mean() - baseline_data.mean()) / pooled_std
            
            print(f"      Diff: NS - Baseline = {ns_data.mean() - baseline_data.mean():+5.2f}")
            print(f"   Cohen's d: {cohens_d:5.2f} ({'small' if abs(cohens_d) < 0.5 else 'medium' if abs(cohens_d) < 0.8 else 'large'} effect)")


def create_visualizations(df):
    """Create visualizations of the metrics."""
    print(f"\n" + "=" * 80)
    print("CREATING VISUALIZATIONS")
    print("=" * 80)
    
    # Set up the plotting style
    plt.style.use('default')
    sns.set_palette("husl")
    
    # Metrics to plot
    metrics = ['insights_generated', 'branches_created', 'reflection_events', 'reflection_edit_coupled']
    metric_labels = ['Insights Generated', 'Branches Created', 'Reflection Events', 'Reflection-Edit Coupled']
    
    # Create a 2x2 subplot figure
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Participant Event Metrics: Baseline vs NS Conditions', fontsize=16, fontweight='bold')
    
    for i, (metric, label) in enumerate(zip(metrics, metric_labels)):
        row = i // 2
        col = i % 2
        ax = axes[row, col]
        
        # Prepare data for plotting
        plot_data = []
        for condition in ['Baseline', 'NS']:
            condition_data = df[df['condition'] == condition][metric].dropna()
            for value in condition_data:
                plot_data.append({'Condition': condition, 'Value': value})
        
        if plot_data:
            plot_df = pd.DataFrame(plot_data)
            
            # Create box plot
            sns.boxplot(data=plot_df, x='Condition', y='Value', ax=ax)
            
            # Add individual points
            sns.stripplot(data=plot_df, x='Condition', y='Value', ax=ax, 
                         size=6, alpha=0.7, color='black')
            
            ax.set_title(label, fontweight='bold')
            ax.set_ylabel('Count')
            ax.grid(True, alpha=0.3)
            
            # Add mean values as text
            for j, condition in enumerate(['Baseline', 'NS']):
                condition_data = df[df['condition'] == condition][metric].dropna()
                if not condition_data.empty:
                    mean_val = condition_data.mean()
                    ax.text(j, ax.get_ylim()[1] * 0.9, f'μ = {mean_val:.1f}', 
                           ha='center', va='center', fontweight='bold',
                           bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8))
    
    plt.tight_layout()
    
    # Save the plot
    output_dir = Path('/Users/h2o/Documents/Projects/Research/Visplora/data/final')
    plot_path = output_dir / 'participant_metrics_analysis.png'
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"Saved visualization to: {plot_path}")
    
    # Show the plot
    plt.show()


def create_correlation_analysis(df):
    """Analyze correlations between metrics."""
    print(f"\n" + "=" * 80)
    print("CORRELATION ANALYSIS")
    print("=" * 80)
    
    metrics = ['insights_generated', 'branches_created', 'reflection_events', 'reflection_edit_coupled']
    
    for condition in ['Baseline', 'NS']:
        print(f"\n{condition} Condition Correlations:")
        print("-" * 40)
        
        condition_data = df[df['condition'] == condition][metrics].dropna()
        
        if len(condition_data) > 1:
            corr_matrix = condition_data.corr()
            
            # Print correlation matrix
            for i, metric1 in enumerate(metrics):
                for j, metric2 in enumerate(metrics):
                    if i < j:  # Only print upper triangle
                        corr_val = corr_matrix.loc[metric1, metric2]
                        print(f"  {metric1} ↔ {metric2}: r = {corr_val:5.2f}")


def create_participant_profiles(df):
    """Create individual participant profiles."""
    print(f"\n" + "=" * 80)
    print("PARTICIPANT PROFILES")
    print("=" * 80)
    
    metrics = ['insights_generated', 'branches_created', 'reflection_events', 'reflection_edit_coupled']
    
    # Get unique participants
    participants = df['participant_id'].unique()
    
    print(f"Analyzing {len(participants)} participants...")
    
    # Create summary table
    profile_data = []
    
    for participant_id in participants:
        participant_data = df[df['participant_id'] == participant_id]
        
        if len(participant_data) == 2:  # Both conditions
            baseline_row = participant_data[participant_data['condition'] == 'Baseline'].iloc[0]
            ns_row = participant_data[participant_data['condition'] == 'NS'].iloc[0]
            
            profile = {'participant_id': participant_id}
            
            for metric in metrics:
                baseline_val = baseline_row[metric] if pd.notna(baseline_row[metric]) else 0
                ns_val = ns_row[metric] if pd.notna(ns_row[metric]) else 0
                
                profile[f'{metric}_baseline'] = baseline_val
                profile[f'{metric}_ns'] = ns_val
                profile[f'{metric}_diff'] = ns_val - baseline_val
            
            profile_data.append(profile)
    
    # Convert to DataFrame and display top changes
    profile_df = pd.DataFrame(profile_data)
    
    for metric in metrics:
        diff_col = f'{metric}_diff'
        if diff_col in profile_df.columns:
            print(f"\n{metric.upper().replace('_', ' ')} - Largest Changes (NS - Baseline):")
            print("-" * 50)
            
            # Sort by difference and show top 5 positive and negative changes
            sorted_df = profile_df.sort_values(diff_col, ascending=False)
            
            print("Top Increases:")
            for _, row in sorted_df.head(3).iterrows():
                pid_short = row['participant_id'][:12] + "..."
                print(f"  {pid_short}: {row[f'{metric}_baseline']:3.0f} → {row[f'{metric}_ns']:3.0f} ({row[diff_col]:+3.0f})")
            
            print("Top Decreases:")
            for _, row in sorted_df.tail(3).iterrows():
                pid_short = row['participant_id'][:12] + "..."
                print(f"  {pid_short}: {row[f'{metric}_baseline']:3.0f} → {row[f'{metric}_ns']:3.0f} ({row[diff_col]:+3.0f})")


def main():
    """Main function to analyze and visualize summary statistics."""
    print("Analyzing Summary Statistics from Participant Event Data")
    print("=" * 80)
    
    # Load data
    df = load_summary_data()
    if df is None:
        return 1
    
    # Perform analyses
    analyze_metrics(df)
    create_correlation_analysis(df)
    create_participant_profiles(df)
    
    # Create visualizations
    try:
        create_visualizations(df)
    except Exception as e:
        print(f"Error creating visualizations: {e}")
        print("Skipping visualization step...")
    
    print(f"\n" + "=" * 80)
    print("ANALYSIS COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)