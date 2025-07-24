"""
Convert LSOA shapefiles to GeoJSON format for use with Vega-Lite
Requirements: pip install geopandas

This script converts all London borough LSOA shapefiles to GeoJSON format
"""

import geopandas as gpd
import os
import json
from pathlib import Path

def convert_shapefiles_to_geojson():
    """Convert all LSOA shapefiles in the current directory to GeoJSON"""
    
    current_dir = Path(__file__).parent
    
    # Get all shapefile names (without extension)
    shapefiles = []
    for file in current_dir.glob("*.shp"):
        shapefiles.append(file.stem)
    
    print(f"Found {len(shapefiles)} shapefiles to convert:")
    for shapefile in shapefiles:
        print(f"  - {shapefile}")
    
    # Convert each shapefile to GeoJSON
    for shapefile_name in shapefiles:
        try:
            print(f"\nProcessing {shapefile_name}...")
            
            # Read the shapefile
            shapefile_path = current_dir / f"{shapefile_name}.shp"
            gdf = gpd.read_file(shapefile_path)
            
            # Convert to WGS84 (EPSG:4326) if not already
            if gdf.crs and gdf.crs.to_epsg() != 4326:
                print(f"  Converting from {gdf.crs} to EPSG:4326")
                gdf = gdf.to_crs(epsg=4326)
            
            # Simplify geometry to reduce file size (optional)
            # gdf['geometry'] = gdf['geometry'].simplify(tolerance=0.0001)
            
            # Output path
            output_path = current_dir / f"{shapefile_name}.json"
            
            # Convert to GeoJSON and save
            gdf.to_file(output_path, driver='GeoJSON')
            
            # Get file size for reporting
            file_size = os.path.getsize(output_path) / 1024  # KB
            print(f"  ✓ Created {output_path.name} ({file_size:.1f} KB)")
            print(f"  Contains {len(gdf)} LSOA features")
            
            # Show sample of properties
            if len(gdf) > 0:
                sample_props = list(gdf.columns)
                print(f"  Properties: {sample_props}")
            
        except Exception as e:
            print(f"  ✗ Error processing {shapefile_name}: {str(e)}")
    
    print(f"\n✓ Conversion complete!")
    print(f"Generated GeoJSON files can now be used with Vega-Lite")

def create_borough_lsoa_index():
    """Create an index of all boroughs and their LSOA counts"""
    
    current_dir = Path(__file__).parent
    index = {}
    
    for geojson_file in current_dir.glob("*.json"):
        try:
            with open(geojson_file, 'r') as f:
                data = json.load(f)
                
            borough_name = geojson_file.stem
            feature_count = len(data.get('features', []))
            
            # Get sample properties
            sample_properties = []
            if data.get('features') and len(data['features']) > 0:
                sample_properties = list(data['features'][0].get('properties', {}).keys())
            
            index[borough_name] = {
                'lsoa_count': feature_count,
                'properties': sample_properties,
                'file_path': f"data/lsoa-london/{geojson_file.name}"
            }
            
        except Exception as e:
            print(f"Error reading {geojson_file}: {e}")
    
    # Save index
    index_path = current_dir / "lsoa_index.json"
    with open(index_path, 'w') as f:
        json.dump(index, f, indent=2)
    
    print(f"\nCreated LSOA index: {index_path}")
    print(f"Total boroughs: {len(index)}")
    
    return index

if __name__ == "__main__":
    print("Converting LSOA shapefiles to GeoJSON format...")
    print("=" * 50)
    
    try:
        convert_shapefiles_to_geojson()
        create_borough_lsoa_index()
        
        print("\n" + "=" * 50)
        print("Next steps:")
        print("1. The GeoJSON files are now ready for use with Vega-Lite")
        print("2. Update your dashboard to use the converted files")
        print("3. Test the LSOA visualization with a sample borough")
        
    except ImportError:
        print("Error: geopandas is required for this script")
        print("Install it with: pip install geopandas")
    except Exception as e:
        print(f"Unexpected error: {e}")
