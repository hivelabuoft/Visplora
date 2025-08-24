#!/usr/bin/env python3
"""
Master Layer2 SQL Validation Script
Provides multiple validation approaches for Layer2 output files.
"""

import os
import sys
import argparse
from pathlib import Path
import subprocess

def check_requirements():
    """Check if required files exist"""
    required_files = [
        "vanna_setup.py",
        "validate_all_layer2_queries.py", 
        "process_individual_files.py",
        "batch_validate_layer2.py"
    ]
    
    missing_files = []
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {', '.join(missing_files)}")
        return False
    
    return True

def run_comprehensive_validation():
    """Run comprehensive validation of all queries"""
    print("🔄 Running comprehensive validation...")
    print("This processes the master file with all 522 queries")
    
    try:
        result = subprocess.run([sys.executable, "validate_all_layer2_queries.py"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Comprehensive validation completed successfully!")
            print(result.stdout)
        else:
            print("❌ Comprehensive validation failed!")
            print(result.stderr)
            
    except Exception as e:
        print(f"💥 Error running comprehensive validation: {e}")

def run_individual_file_processing():
    """Run individual file processing"""
    print("🔄 Running individual file processing...")
    print("This processes each output file separately for detailed tracking")
    
    try:
        result = subprocess.run([sys.executable, "process_individual_files.py"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Individual file processing completed successfully!")
            print(result.stdout)
        else:
            print("❌ Individual file processing failed!")
            print(result.stderr)
            
    except Exception as e:
        print(f"💥 Error running individual file processing: {e}")

def run_batch_processing():
    """Run batch processing"""
    print("🔄 Running batch processing...")
    print("This processes files in organized batches with performance tracking")
    
    try:
        result = subprocess.run([sys.executable, "batch_validate_layer2.py"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Batch processing completed successfully!")
            print(result.stdout)
        else:
            print("❌ Batch processing failed!")
            print(result.stderr)
            
    except Exception as e:
        print(f"💥 Error running batch processing: {e}")

def run_all_methods():
    """Run all validation methods"""
    print("🚀 Running all validation methods...")
    print("=" * 60)
    
    print("\n1️⃣ Starting comprehensive validation...")
    run_comprehensive_validation()
    
    print("\n2️⃣ Starting individual file processing...")
    run_individual_file_processing()
    
    print("\n3️⃣ Starting batch processing...")
    run_batch_processing()
    
    print("\n🎉 All validation methods completed!")

def show_validation_options():
    """Show available validation options"""
    print("🔍 Layer2 SQL Validation Options:")
    print("=" * 50)
    print("1. Comprehensive Validation")
    print("   - Processes master file with all 522 queries")
    print("   - Single consolidated report")
    print("   - Best for overall statistics")
    print()
    print("2. Individual File Processing")
    print("   - Processes each output file separately")
    print("   - Detailed per-file tracking")
    print("   - Best for debugging specific datasets/chart types")
    print()
    print("3. Batch Processing")
    print("   - Organizes files into logical batches")
    print("   - Performance and speed optimization")
    print("   - Best for large-scale processing")
    print()
    print("4. Run All Methods")
    print("   - Executes all validation approaches")
    print("   - Comprehensive analysis from all perspectives")
    print("   - Best for complete validation coverage")

def check_layer2_output():
    """Check if Layer2 output exists"""
    layer2_dir = Path("../preprocess/output_layer2/sql_queries")
    
    if not layer2_dir.exists():
        print(f"❌ Layer2 output directory not found: {layer2_dir}")
        print("Please run layer2.js first to generate SQL queries")
        return False
    
    # Check for files
    master_file = layer2_dir / "all_sql_queries_complete.json"
    by_dataset_dir = layer2_dir / "by_dataset"
    underused_dir = layer2_dir / "underused_charts"
    
    files_found = []
    if master_file.exists():
        files_found.append("master file")
    if by_dataset_dir.exists() and any(by_dataset_dir.iterdir()):
        files_found.append("by_dataset files")
    if underused_dir.exists() and any(underused_dir.iterdir()):
        files_found.append("underused_charts files")
    
    if not files_found:
        print(f"❌ No Layer2 output files found in {layer2_dir}")
        return False
    
    print(f"✅ Found Layer2 output: {', '.join(files_found)}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Layer2 SQL Validation Master Script")
    parser.add_argument("--method", "-m", 
                       choices=["comprehensive", "individual", "batch", "all"],
                       help="Validation method to run")
    parser.add_argument("--list", "-l", action="store_true",
                       help="List available validation options")
    parser.add_argument("--check", "-c", action="store_true", 
                       help="Check if Layer2 output exists")
    
    args = parser.parse_args()
    
    print("🚀 Layer2 SQL Validation Master Script")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Handle specific arguments
    if args.list:
        show_validation_options()
        return
    
    if args.check:
        if check_layer2_output():
            print("✅ Ready for validation!")
        else:
            sys.exit(1)
        return
    
    # Check if Layer2 output exists
    if not check_layer2_output():
        sys.exit(1)
    
    # Run validation based on method
    if args.method == "comprehensive":
        run_comprehensive_validation()
    elif args.method == "individual":
        run_individual_file_processing()
    elif args.method == "batch":
        run_batch_processing()
    elif args.method == "all":
        run_all_methods()
    else:
        # Interactive mode
        print("\nSelect validation method:")
        print("1. Comprehensive Validation")
        print("2. Individual File Processing") 
        print("3. Batch Processing")
        print("4. Run All Methods")
        print("5. Show Options Details")
        
        try:
            choice = input("\nEnter choice (1-5): ").strip()
            
            if choice == "1":
                run_comprehensive_validation()
            elif choice == "2":
                run_individual_file_processing()
            elif choice == "3":
                run_batch_processing()
            elif choice == "4":
                run_all_methods()
            elif choice == "5":
                show_validation_options()
            else:
                print("❌ Invalid choice")
                sys.exit(1)
                
        except KeyboardInterrupt:
            print("\n\n👋 Validation cancelled by user")
            sys.exit(0)

if __name__ == "__main__":
    main()
