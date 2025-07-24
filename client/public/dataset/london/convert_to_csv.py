import pandas as pd
import os
from pathlib import Path

def convert_excel_to_csv(excel_file):
    """Convert Excel file to CSV files, excluding metadata sheet"""
    print(f"\nProcessing: {excel_file}")
    
    try:
        # Read the Excel file
        xl = pd.ExcelFile(excel_file)
        
        # Get all sheet names except Metadata
        data_sheets = [sheet for sheet in xl.sheet_names if sheet.lower() != 'metadata']
        
        print(f"  Found sheets: {xl.sheet_names}")
        print(f"  Data sheets (excluding metadata): {data_sheets}")
        
        # Get the base filename without extension
        base_name = Path(excel_file).stem
        
        # Convert each data sheet to CSV
        for sheet_name in data_sheets:
            try:
                # Read the sheet
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                
                # Create CSV filename
                if len(data_sheets) == 1:
                    # If only one data sheet, use the base filename
                    csv_filename = f"{base_name}.csv"
                else:
                    # If multiple data sheets, include sheet name
                    safe_sheet_name = sheet_name.replace(' ', '-').replace('/', '-')
                    csv_filename = f"{base_name}_{safe_sheet_name}.csv"
                
                # Save to CSV
                df.to_csv(csv_filename, index=False)
                print(f"  ✓ Created: {csv_filename} ({len(df)} rows, {len(df.columns)} columns)")
                
            except Exception as e:
                print(f"  ✗ Error processing sheet '{sheet_name}': {str(e)}")
                
    except Exception as e:
        print(f"  ✗ Error reading file: {str(e)}")

def main():
    """Convert all Excel files in the current directory to CSV"""
    print("Excel to CSV Converter")
    print("=" * 50)
    
    # Get all .xls files in current directory
    excel_files = [f for f in os.listdir('.') if f.endswith('.xls')]
    
    if not excel_files:
        print("No .xls files found in current directory")
        return
    
    print(f"Found {len(excel_files)} Excel files:")
    for f in excel_files:
        print(f"  - {f}")
    
    # Convert each file
    for excel_file in excel_files:
        convert_excel_to_csv(excel_file)
    
    print(f"\n✓ Conversion complete! Processed {len(excel_files)} Excel files.")
    
    # List all CSV files created
    csv_files = [f for f in os.listdir('.') if f.endswith('.csv')]
    print(f"\nCSV files in directory ({len(csv_files)}):")
    for f in sorted(csv_files):
        print(f"  - {f}")

if __name__ == "__main__":
    main()
