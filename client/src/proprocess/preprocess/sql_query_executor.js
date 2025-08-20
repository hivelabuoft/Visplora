const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

// Dataset to file path mapping
const DATASET_FILE_MAPPING = {
    'crime-rates': 'public/dataset/london/crime-rates/london_crime_data_2022_2023.csv',
    'ethnicity': 'public/dataset/london/ethnicity/Ethnic group.csv',
    'country-of-births': 'public/dataset/london/country-of-births/cob-borough.csv',
    'population': 'public/dataset/london/population/population 1801 to 2021.csv',
    'income': 'public/dataset/london/income/income-of-tax-payers.csv',
    'house-prices': 'public/dataset/london/house-prices/land-registry-house-prices-borough.csv',
    'schools-colleges': 'public/dataset/london/schools-colleges/2022-2023_england_school_information.csv',
    'vehicles': 'public/dataset/london/vehicles/vehicles-licensed-type-borough_2023.csv',
    'restaurants': 'public/dataset/london/restaurants/licensed-restaurants-cafes-borough_Restaurants-units.csv',
    'private-rent': 'public/dataset/london/private-rent/voa-average-rent-borough_Raw-data.csv',
    'gyms': 'public/dataset/london/gyms/london_gym_facilities_2024.csv',
    'libraries': 'public/dataset/london/libraries/libraries-by-areas-chart.csv'
};

// Simple SQL-like query parser and executor for CSV data
class CSVQueryExecutor {
    constructor() {
        this.data = [];
    }

    // Load CSV data into memory
    async loadCSV(filePath) {
        const fullPath = path.join(__dirname, '../../..', filePath);
        console.log(`📂 Loading data from: ${fullPath}`);
        
        return new Promise((resolve, reject) => {
            const results = [];
            
            createReadStream(fullPath)
                .pipe(csv())
                .on('data', (row) => {
                    // Clean up column names (remove spaces, special chars)
                    const cleanedRow = {};
                    for (const [key, value] of Object.entries(row)) {
                        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
                        cleanedRow[cleanKey] = value;
                    }
                    results.push(cleanedRow);
                })
                .on('end', () => {
                    this.data = results;
                    console.log(`✅ Loaded ${results.length} rows`);
                    resolve(results);
                })
                .on('error', (error) => {
                    console.error('❌ Error loading CSV:', error);
                    reject(error);
                });
        });
    }

    // Simple SELECT implementation
    select(columns = '*') {
        if (columns === '*') {
            return this.data;
        }
        
        const columnList = Array.isArray(columns) ? columns : columns.split(',').map(c => c.trim());
        
        return this.data.map(row => {
            const selectedRow = {};
            columnList.forEach(col => {
                const cleanCol = col.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                if (row.hasOwnProperty(cleanCol)) {
                    selectedRow[col] = row[cleanCol];
                }
            });
            return selectedRow;
        });
    }

    // Simple WHERE implementation
    where(condition) {
        if (!condition) return this.data;
        
        // Very basic condition parsing - you can extend this
        return this.data.filter(row => {
            // Handle simple conditions like "borough_name = 'Westminster'"
            if (condition.includes('=')) {
                const [field, value] = condition.split('=').map(s => s.trim());
                const cleanField = field.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                const cleanValue = value.replace(/['"]/g, '');
                return row[cleanField] && row[cleanField].toLowerCase().includes(cleanValue.toLowerCase());
            }
            
            // Handle LIKE conditions
            if (condition.includes('LIKE')) {
                const [field, value] = condition.split('LIKE').map(s => s.trim());
                const cleanField = field.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                const cleanValue = value.replace(/['"]/g, '').replace(/%/g, '');
                return row[cleanField] && row[cleanField].toLowerCase().includes(cleanValue.toLowerCase());
            }
            
            return true;
        });
    }

    // Execute a simplified SQL query
    executeQuery(sqlQuery) {
        console.log(`🔍 Executing query: ${sqlQuery}`);
        
        let result = [...this.data];
        
        // Extract WHERE clause
        const whereMatch = sqlQuery.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
        if (whereMatch) {
            const whereCondition = whereMatch[1];
            result = this.where(whereCondition);
        }
        
        // Handle GROUP BY and aggregations
        const groupByMatch = sqlQuery.match(/GROUP\s+BY\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
        const selectMatch = sqlQuery.match(/SELECT\s+(.+?)\s+FROM/i);
        
        if (groupByMatch && selectMatch) {
            const groupByColumn = groupByMatch[1].trim();
            const selectClause = selectMatch[1];
            
            // Handle aggregation functions like SUM(count), COUNT(*), etc.
            const aggregations = [];
            const selectParts = selectClause.split(',').map(s => s.trim());
            
            for (const part of selectParts) {
                if (part.includes('SUM(')) {
                    const sumMatch = part.match(/SUM\((.+?)\)(?:\s+AS\s+(.+))?/i);
                    if (sumMatch) {
                        const column = sumMatch[1];
                        const alias = sumMatch[2] || 'sum';
                        aggregations.push({ type: 'SUM', column, alias });
                    }
                } else if (part.includes('COUNT(')) {
                    const countMatch = part.match(/COUNT\((.+?)\)(?:\s+AS\s+(.+))?/i);
                    if (countMatch) {
                        const alias = countMatch[2] || 'count';
                        aggregations.push({ type: 'COUNT', column: '*', alias });
                    }
                } else {
                    // Regular column (should be in GROUP BY)
                    let alias = part;
                    let originalCol = part;
                    if (part.includes(' AS ')) {
                        [originalCol, alias] = part.split(' AS ').map(s => s.trim());
                    }
                    aggregations.push({ type: 'GROUP', column: originalCol, alias });
                }
            }
            
            // Group the data
            const groupedData = new Map();
            const cleanGroupBy = groupByColumn.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            
            for (const row of result) {
                const groupKey = row[cleanGroupBy] || 'null';
                
                if (!groupedData.has(groupKey)) {
                    groupedData.set(groupKey, []);
                }
                groupedData.get(groupKey).push(row);
            }
            
            // Perform aggregations
            result = [];
            for (const [groupKey, rows] of groupedData) {
                const aggregatedRow = {};
                
                for (const agg of aggregations) {
                    if (agg.type === 'GROUP') {
                        aggregatedRow[agg.alias] = groupKey;
                    } else if (agg.type === 'COUNT') {
                        aggregatedRow[agg.alias] = rows.length;
                    } else if (agg.type === 'SUM') {
                        // If the column exists, sum it; otherwise count rows (for SUM(count) when count column doesn't exist)
                        const cleanCol = agg.column.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                        if (rows[0] && rows[0].hasOwnProperty(cleanCol)) {
                            aggregatedRow[agg.alias] = rows.reduce((sum, row) => {
                                const value = parseFloat(row[cleanCol]) || 0;
                                return sum + value;
                            }, 0);
                        } else {
                            // If column doesn't exist, treat as count
                            aggregatedRow[agg.alias] = rows.length;
                        }
                    }
                }
                
                result.push(aggregatedRow);
            }
        } else if (selectMatch) {
            // Handle SELECT without GROUP BY
            const columns = selectMatch[1];
            if (columns !== '*') {
                const columnList = columns.split(',').map(c => c.trim());
                result = result.map(row => {
                    const selectedRow = {};
                    columnList.forEach(col => {
                        // Handle aliases (AS keyword)
                        let originalCol = col;
                        let alias = col;
                        if (col.includes(' AS ')) {
                            [originalCol, alias] = col.split(' AS ').map(s => s.trim());
                        }
                        
                        const cleanOriginal = originalCol.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                        if (row.hasOwnProperty(cleanOriginal)) {
                            selectedRow[alias] = row[cleanOriginal];
                        }
                    });
                    return selectedRow;
                });
            }
        }
        
        // Handle ORDER BY
        const orderByMatch = sqlQuery.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/i);
        if (orderByMatch) {
            const orderBy = orderByMatch[1].trim();
            const [column, direction = 'ASC'] = orderBy.split(/\s+/);
            const cleanCol = column.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            
            result.sort((a, b) => {
                const aVal = a[cleanCol] || a[column] || '';
                const bVal = b[cleanCol] || b[column] || '';
                
                if (direction.toUpperCase() === 'DESC') {
                    return bVal.localeCompare(aVal);
                } else {
                    return aVal.localeCompare(bVal);
                }
            });
        }
        
        // Handle LIMIT
        const limitMatch = sqlQuery.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
            const limit = parseInt(limitMatch[1]);
            result = result.slice(0, limit);
        }
        
        console.log(`📊 Query returned ${result.length} rows`);
        return result;
    }
}

// Find proposition by ID in output files
async function findPropositionById(propositionId) {
    console.log(`🔍 Searching for proposition: ${propositionId}`);
    
    const searchDirs = [
        path.join(__dirname, 'output2'), // Check Layer2 first (has SQL queries)
    ];
    
    for (const searchDir of searchDirs) {
        try {
            const files = await findJsonFiles(searchDir);
            
            for (const file of files) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    const data = JSON.parse(content);
                    
                    // Search in different file structures
                    let propositions = [];
                    if (data.sample_propositions) {
                        propositions = data.sample_propositions; // Layer2 structure
                    } else if (data.propositions) {
                        propositions = data.propositions;
                    } else if (Array.isArray(data)) {
                        propositions = data;
                    } else if (data.input && data.input.proposition_id) {
                        propositions = [data.input];
                    }
                    
                    const found = propositions.find(p => p.proposition_id === propositionId);
                    if (found) {
                        console.log(`✅ Found proposition in: ${file}`);
                        return found;
                    }
                } catch (parseError) {
                    // Skip files that can't be parsed
                    continue;
                }
            }
        } catch (dirError) {
            // Skip directories that don't exist
            continue;
        }
    }
    
    throw new Error(`Proposition with ID '${propositionId}' not found`);
}

// Recursively find all JSON files
async function findJsonFiles(dir) {
    const files = [];
    
    try {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = await fs.stat(fullPath);
            
            if (stat.isDirectory()) {
                const subFiles = await findJsonFiles(fullPath);
                files.push(...subFiles);
            } else if (item.endsWith('.json')) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        // Directory doesn't exist or can't be read
    }
    
    return files;
}

// Main function to execute SQL query for a proposition
async function executePropositionQuery(propositionId) {
    try {
        console.log(`🚀 Processing proposition: ${propositionId}`);
        
        // 1. Find the proposition
        const proposition = await findPropositionById(propositionId);
        
        // 2. Extract SQL query and dataset
        let sqlQuery = null;
        let dataset = null;
        
        if (proposition.sql_query) {
            sqlQuery = proposition.sql_query;
            dataset = proposition.dataset;
        } else if (proposition.analysis && typeof proposition.analysis === 'string') {
            // Try to extract SQL from analysis text
            const sqlMatch = proposition.analysis.match(/```sql\s*(.*?)\s*```/s);
            if (sqlMatch) {
                sqlQuery = sqlMatch[1].trim();
            }
            dataset = proposition.datasets_involved ? proposition.datasets_involved[0] : proposition.dataset;
        }
        
        if (!sqlQuery) {
            throw new Error('No SQL query found in proposition');
        }
        
        if (!dataset) {
            throw new Error('No dataset specified in proposition');
        }
        
        console.log(`📊 Dataset: ${dataset}`);
        console.log(`🔍 SQL Query: ${sqlQuery}`);
        
        // 3. Map dataset to file path
        const filePath = DATASET_FILE_MAPPING[dataset];
        if (!filePath) {
            throw new Error(`No file mapping found for dataset: ${dataset}`);
        }
        
        // 4. Execute the query
        const executor = new CSVQueryExecutor();
        await executor.loadCSV(filePath);
        const results = executor.executeQuery(sqlQuery);
        
        // 5. Return results with metadata
        return {
            proposition_id: propositionId,
            dataset: dataset,
            file_path: filePath,
            sql_query: sqlQuery,
            results: results,
            result_count: results.length,
            execution_timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`❌ Error executing query for ${propositionId}:`, error.message);
        return {
            proposition_id: propositionId,
            error: error.message,
            execution_timestamp: new Date().toISOString()
        };
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node sql_query_executor.js <proposition_id> [output_file.json]');
        console.log('Example: node sql_query_executor.js crime-rates_categorical_analysis_cat_001');
        process.exit(1);
    }
    
    const propositionId = args[0];
    const outputFile = args[1];
    
    try {
        const result = await executePropositionQuery(propositionId);
        
        if (result.error) {
            console.error(`❌ Execution failed: ${result.error}`);
            process.exit(1);
        }
        
        console.log(`\n✅ Query executed successfully!`);
        console.log(`📊 Results: ${result.result_count} rows`);
        
        if (outputFile) {
            await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
            console.log(`💾 Results saved to: ${outputFile}`);
        } else {
            // Show first 5 results as preview
            console.log('\n📋 Preview (first 5 rows):');
            console.log(JSON.stringify(result.results.slice(0, 5), null, 2));
        }
        
    } catch (error) {
        console.error(`❌ Fatal error: ${error.message}`);
        process.exit(1);
    }
}

// Export for use as module
module.exports = {
    executePropositionQuery,
    CSVQueryExecutor,
    DATASET_FILE_MAPPING
};

// Run CLI if called directly
if (require.main === module) {
    main();
}
