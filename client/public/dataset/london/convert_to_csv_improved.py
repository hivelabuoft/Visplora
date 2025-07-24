import pandas as pd
import os
from pathlib import Path

def clean_dataframe(df):
    """Clean the dataframe by finding the proper header row and removing empty rows/columns"""
    # Find the row that contains 'Area code' - this is usually the header row
    header_row = None
    for idx, row in df.iterrows():
        if any(str(cell).strip().lower() == 'area code' for cell in row if pd.notna(cell)):
            header_row = idx
            break
    
    if header_row is None:
        # If no 'Area code' found, look for first row with substantial data
        for idx, row in df.iterrows():
            non_null_count = row.notna().sum()
            if non_null_count > len(df.columns) * 0.5:  # More than 50% non-null
                header_row = idx
                break
    
    if header_row is not None:
        # Get the header row and the years row (usually next row)
        header_data = df.iloc[header_row].fillna('')
        years_data = df.iloc[header_row + 1].fillna('') if header_row + 1 < len(df) else pd.Series([''] * len(df.columns))
        
        # Create column names by combining header and years where appropriate
        columns = []
        for i, (header, year) in enumerate(zip(header_data, years_data)):
            header_str = str(header).strip()
            year_str = str(year).strip()
            
            if header_str in ['Area code', 'Area name']:
                columns.append(header_str)
            elif year_str and year_str.replace('.0', '').isdigit():
                columns.append(year_str.replace('.0', ''))
            elif header_str and header_str != 'nan':
                columns.append(header_str)
            else:
                columns.append(f'Column_{i}')
        
        # Start data from after the header rows, removing empty rows
        data_start = header_row + 2
        clean_df = df.iloc[data_start:].copy()
        clean_df.columns = columns
        
        # Remove rows where Area code is empty or NaN
        if 'Area code' in clean_df.columns:
            clean_df = clean_df[clean_df['Area code'].notna()]
            clean_df = clean_df[clean_df['Area code'].astype(str).str.strip() != '']
        
        # Remove completely empty columns
        clean_df = clean_df.dropna(axis=1, how='all')
        
        # Reset index
        clean_df = clean_df.reset_index(drop=True)
        
        return clean_df
    
    return df

def convert_excel_to_csv_improved(excel_file):
    """Convert Excel file to CSV files with improved cleaning"""
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
                # Read the sheet without assuming headers
                df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None)
                
                # Clean the dataframe
                clean_df = clean_dataframe(df)
                
                # Create CSV filename
                if len(data_sheets) == 1:
                    # If only one data sheet, use the base filename
                    csv_filename = f"{base_name}.csv"
                else:
                    # If multiple data sheets, include sheet name
                    safe_sheet_name = sheet_name.replace(' ', '-').replace('/', '-')
                    csv_filename = f"{base_name}_{safe_sheet_name}.csv"
                
                # Save to CSV
                clean_df.to_csv(csv_filename, index=False)
                print(f"  ✓ Created: {csv_filename} ({len(clean_df)} rows, {len(clean_df.columns)} columns)")
                
                # Show first few column names for verification
                if len(clean_df.columns) > 0:
                    cols_preview = list(clean_df.columns[:5])
                    if len(clean_df.columns) > 5:
                        cols_preview.append('...')
                    print(f"    Columns: {cols_preview}")
                
            except Exception as e:
                print(f"  ✗ Error processing sheet '{sheet_name}': {str(e)}")
                
    except Exception as e:
        print(f"  ✗ Error reading file: {str(e)}")

def main():
    """Convert all Excel files in the current directory to CSV with improved cleaning"""
    print("Improved Excel to CSV Converter")
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
        convert_excel_to_csv_improved(excel_file)
    
    print(f"\n✓ Improved conversion complete! Processed {len(excel_files)} Excel files.")

if __name__ == "__main__":
    main()
