const fs = require('fs').promises;
const path = require('path');

/**
 * Visualization Rules Generator
 * 
 * This script analyzes the london_metadata.json and generates visualization rules
 * for auto-generating Vega-Lite charts by detecting column roles (time, geo, metric, category)
 */

class VisualizationRulesGenerator {
    constructor() {
        this.metadataPath = '../../public/data/london_metadata.json';
        this.outputDir = '../../public/data/visualization_rules';
        this.rules = [];
    }

    /**
     * Determine field roles based on column name, type, and sample values
     */
    determineFieldRoles(fieldName, fieldType, sampleValues = []) {
        const roles = [];
        const lowerName = fieldName.toLowerCase();
        
        // TIME DETECTION
        if (this.isTimeField(lowerName, fieldType, sampleValues)) {
            roles.push('time');
        }
        
        // GEO DETECTION  
        if (this.isGeoField(lowerName, fieldType, sampleValues)) {
            roles.push('geo');
            // Geographic fields can also be used as categories for faceting
            roles.push('category');
            roles.push('facet');
        }
        
        // METRIC DETECTION
        if (this.isMetricField(lowerName, fieldType, sampleValues)) {
            roles.push('metric');
        }
        
        // CATEGORY DETECTION
        if (this.isCategoryField(lowerName, fieldType, sampleValues)) {
            if (!roles.includes('category')) {
                roles.push('category');
            }
            // Categories can be used for faceting
            if (!roles.includes('facet')) {
                roles.push('facet');
            }
        }

        // Default to category if no roles detected
        if (roles.length === 0) {
            roles.push('category');
        }

        return roles;
    }

    /**
     * Detect time fields
     */
    isTimeField(fieldName, fieldType, sampleValues) {
        // Field name patterns
        const timeNames = [
            'year', 'date', 'time', 'month', 'day', 'period', 
            'quarter', 'season', 'timestamp', 'created_at', 'updated_at'
        ];
        
        // Type-based detection
        if (fieldType === 'datetime' || fieldType === 'temporal') {
            return true;
        }
        
        // Name-based detection
        if (timeNames.some(timeName => fieldName.includes(timeName))) {
            return true;
        }
        
        // Sample value patterns
        if (sampleValues.length > 0) {
            const firstSample = String(sampleValues[0]);
            // Detect date patterns like "2022-01", "2023", "2022-01-15"
            if (/^\d{4}(-\d{2})?(-\d{2})?$/.test(firstSample)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Detect geographic fields
     */
    isGeoField(fieldName, fieldType, sampleValues) {
        // Geographic field name patterns
        const geoNames = [
            'borough', 'area', 'region', 'district', 'ward', 'postcode', 
            'zip', 'city', 'town', 'county', 'state', 'country',
            'lsoa', 'msoa', 'oa', 'constituency', 'local_authority'
        ];
        
        // Name-based detection
        if (geoNames.some(geoName => fieldName.includes(geoName))) {
            return true;
        }
        
        // Sample value patterns for UK postcodes and codes
        if (sampleValues.length > 0) {
            const firstSample = String(sampleValues[0]);
            // LSOA codes like "E09000002002"
            if (/^E\d{8}\d+$/.test(firstSample)) {
                return true;
            }
            // UK Postcode patterns
            if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(firstSample)) {
                return true;
            }
            // Borough name patterns (contains "and" suggesting compound place names)
            if (firstSample.includes(' and ') || firstSample.includes(' & ')) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Detect metric fields (quantitative measures)
     */
    isMetricField(fieldName, fieldType, sampleValues) {
        // Type-based detection
        if (['numeric', 'quantitative', 'number', 'integer', 'float'].includes(fieldType)) {
            // Name-based patterns for metrics
            const metricNames = [
                'count', 'total', 'sum', 'average', 'mean', 'median',
                'price', 'cost', 'value', 'amount', 'income', 'salary',
                'population', 'density', 'rate', 'percentage', 'ratio',
                'score', 'index', 'level', 'quantity', 'number',
                'size', 'area', 'volume', 'weight', 'distance'
            ];
            
            // Check if field name suggests it's a metric
            if (metricNames.some(metricName => fieldName.includes(metricName))) {
                return true;
            }
            
            // If it's numeric but doesn't match geo or time patterns, likely a metric
            if (!this.isTimeField(fieldName, fieldType, sampleValues) && 
                !this.isGeoField(fieldName, fieldType, sampleValues)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Detect categorical fields
     */
    isCategoryField(fieldName, fieldType, sampleValues) {
        // Type-based detection
        if (['categorical', 'nominal', 'ordinal', 'string'].includes(fieldType)) {
            return true;
        }
        
        // Name-based patterns
        const categoryNames = [
            'type', 'category', 'class', 'group', 'status', 'level',
            'grade', 'rank', 'ethnicity', 'gender', 'occupation',
            'sector', 'industry', 'phase', 'key_stage'
        ];
        
        if (categoryNames.some(catName => fieldName.includes(catName))) {
            return true;
        }
        
        return false;
    }

    /**
     * Generate chart type suggestions based on field roles
     */
    suggestChartTypes(fieldRoles) {
        const hasTime = fieldRoles.some(f => f.roles.includes('time'));
        const hasGeo = fieldRoles.some(f => f.roles.includes('geo'));
        const hasMetric = fieldRoles.some(f => f.roles.includes('metric'));
        const hasCategory = fieldRoles.some(f => f.roles.includes('category'));
        const categories = fieldRoles.filter(f => f.roles.includes('category'));
        
        const suggestions = [];
        
        // Time-based charts
        if (hasTime && hasMetric) {
            suggestions.push({
                type: 'line_chart',
                description: 'Time series analysis',
                encoding: {
                    x: fieldRoles.find(f => f.roles.includes('time')),
                    y: fieldRoles.find(f => f.roles.includes('metric')),
                    color: categories.length > 0 ? categories[0] : null
                }
            });
        }
        
        // Geographic charts
        if (hasGeo) {
            if (hasMetric) {
                suggestions.push({
                    type: 'choropleth_map',
                    description: 'Geographic distribution of metrics',
                    encoding: {
                        geo: fieldRoles.find(f => f.roles.includes('geo')),
                        color: fieldRoles.find(f => f.roles.includes('metric'))
                    }
                });
            }
            
            suggestions.push({
                type: 'bar_chart',
                description: 'Comparison across geographic areas',
                encoding: {
                    x: fieldRoles.find(f => f.roles.includes('geo')),
                    y: fieldRoles.find(f => f.roles.includes('metric')) || { name: 'count', roles: ['metric'] }
                }
            });
        }
        
        // Categorical analysis
        if (hasCategory && hasMetric) {
            suggestions.push({
                type: 'bar_chart', 
                description: 'Category comparison',
                encoding: {
                    x: categories[0],
                    y: fieldRoles.find(f => f.roles.includes('metric'))
                }
            });
            
            if (categories.length > 1) {
                suggestions.push({
                    type: 'stacked_bar_chart',
                    description: 'Multi-category analysis', 
                    encoding: {
                        x: categories[0],
                        y: fieldRoles.find(f => f.roles.includes('metric')),
                        color: categories[1]
                    }
                });
            }
        }
        
        // Distribution analysis
        if (hasMetric) {
            suggestions.push({
                type: 'histogram',
                description: 'Distribution analysis',
                encoding: {
                    x: fieldRoles.find(f => f.roles.includes('metric'))
                }
            });
        }
        
        // Default fallback
        if (suggestions.length === 0) {
            suggestions.push({
                type: 'bar_chart',
                description: 'Basic categorical view',
                encoding: {
                    x: fieldRoles[0],
                    y: { name: 'count', roles: ['metric'] }
                }
            });
        }
        
        return suggestions;
    }

    /**
     * Process all datasets and generate rules
     */
    async generateRules() {
        console.log('🔍 Loading London metadata...');
        
        const metadataContent = await fs.readFile(this.metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);
        
        console.log(`📊 Found ${metadata.categories.length} dataset categories`);
        
        for (const category of metadata.categories) {
            console.log(`\n📁 Processing category: ${category.name}`);
            
            for (const file of category.files) {
                console.log(`  📄 Processing file: ${file.name}`);
                
                const rule = {
                    dataset_id: file.id,
                    dataset_name: file.name,
                    category: category.name,
                    description: file.description,
                    file_path: file.path,
                    field_roles: [],
                    suggested_charts: [],
                    generated_at: new Date().toISOString()
                };
                
                // Process each column
                if (file.file_summary && file.file_summary.column_names) {
                    for (const columnName of file.file_summary.column_names) {
                        const columnType = file.file_summary.column_types?.[columnName] || 'unknown';
                        const sampleValues = file.file_summary.value_examples?.[columnName] || [];
                        
                        const roles = this.determineFieldRoles(columnName, columnType, sampleValues);
                        
                        rule.field_roles.push({
                            name: columnName,
                            type: columnType,
                            roles: roles,
                            sample_values: sampleValues.slice(0, 3) // Keep first 3 examples
                        });
                    }
                }
                
                // Generate chart suggestions
                rule.suggested_charts = this.suggestChartTypes(rule.field_roles);
                
                this.rules.push(rule);
                
                console.log(`    ✅ Generated ${rule.field_roles.length} field roles, ${rule.suggested_charts.length} chart suggestions`);
            }
        }
        
        console.log(`\n📈 Generated rules for ${this.rules.length} datasets`);
        
        // Save individual rule files
        await this.saveIndividualRules();
        
        // Save consolidated rules
        await this.saveConsolidatedRules();
        
        // Generate summary
        await this.generateSummary();
    }

    /**
     * Save individual rule files for each dataset
     */
    async saveIndividualRules() {
        console.log('\n💾 Saving individual rule files...');
        
        for (const rule of this.rules) {
            const filename = `${rule.dataset_id}_rules.json`;
            const filepath = path.join(this.outputDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(rule, null, 2), 'utf8');
        }
        
        console.log(`✅ Saved ${this.rules.length} individual rule files`);
    }

    /**
     * Save consolidated rules file
     */
    async saveConsolidatedRules() {
        console.log('\n💾 Saving consolidated rules file...');
        
        const consolidatedRules = {
            generated_at: new Date().toISOString(),
            total_datasets: this.rules.length,
            visualization_rules: this.rules,
            summary: {
                categories: [...new Set(this.rules.map(r => r.category))],
                total_fields: this.rules.reduce((sum, r) => sum + r.field_roles.length, 0),
                field_role_distribution: this.getFieldRoleDistribution()
            }
        };
        
        const filepath = path.join(this.outputDir, 'all_visualization_rules.json');
        await fs.writeFile(filepath, JSON.stringify(consolidatedRules, null, 2), 'utf8');
        
        console.log(`✅ Saved consolidated rules file: ${filepath}`);
    }

    /**
     * Get field role distribution statistics
     */
    getFieldRoleDistribution() {
        const distribution = {};
        
        for (const rule of this.rules) {
            for (const field of rule.field_roles) {
                for (const role of field.roles) {
                    distribution[role] = (distribution[role] || 0) + 1;
                }
            }
        }
        
        return distribution;
    }

    /**
     * Generate summary report
     */
    async generateSummary() {
        console.log('\n📊 Generating summary report...');
        
        const summary = {
            generation_summary: {
                generated_at: new Date().toISOString(),
                total_datasets: this.rules.length,
                total_fields: this.rules.reduce((sum, r) => sum + r.field_roles.length, 0),
                categories: [...new Set(this.rules.map(r => r.category))]
            },
            field_role_statistics: this.getFieldRoleDistribution(),
            chart_type_suggestions: this.getChartTypeSuggestions(),
            datasets_by_category: this.getDatasetsByCategory(),
            field_patterns: this.analyzeFieldPatterns()
        };
        
        const filepath = path.join(this.outputDir, 'rules_summary.json');
        await fs.writeFile(filepath, JSON.stringify(summary, null, 2), 'utf8');
        
        console.log(`✅ Generated summary report: ${filepath}`);
        
        // Console summary
        console.log('\n📈 GENERATION SUMMARY');
        console.log('=====================');
        console.log(`📊 Total datasets processed: ${summary.generation_summary.total_datasets}`);
        console.log(`🏷️  Total fields analyzed: ${summary.generation_summary.total_fields}`);
        console.log(`📁 Categories: ${summary.generation_summary.categories.join(', ')}`);
        console.log('\n🎯 Field Role Distribution:');
        Object.entries(summary.field_role_statistics).forEach(([role, count]) => {
            console.log(`   ${role}: ${count} fields`);
        });
        console.log('\n📊 Chart Type Suggestions:');
        Object.entries(summary.chart_type_suggestions).forEach(([chartType, count]) => {
            console.log(`   ${chartType}: ${count} datasets`);
        });
    }

    /**
     * Get chart type suggestion statistics
     */
    getChartTypeSuggestions() {
        const suggestions = {};
        
        for (const rule of this.rules) {
            for (const chart of rule.suggested_charts) {
                suggestions[chart.type] = (suggestions[chart.type] || 0) + 1;
            }
        }
        
        return suggestions;
    }

    /**
     * Get datasets grouped by category
     */
    getDatasetsByCategory() {
        const byCategory = {};
        
        for (const rule of this.rules) {
            if (!byCategory[rule.category]) {
                byCategory[rule.category] = [];
            }
            byCategory[rule.category].push({
                id: rule.dataset_id,
                name: rule.dataset_name
            });
        }
        
        return byCategory;
    }

    /**
     * Analyze common field patterns
     */
    analyzeFieldPatterns() {
        const patterns = {
            common_time_fields: [],
            common_geo_fields: [],
            common_metric_fields: [],
            common_category_fields: []
        };
        
        const fieldCounts = {};
        
        for (const rule of this.rules) {
            for (const field of rule.field_roles) {
                const key = `${field.name}|${field.roles.join(',')}`;
                fieldCounts[key] = (fieldCounts[key] || 0) + 1;
            }
        }
        
        // Find common patterns (appearing in multiple datasets)
        Object.entries(fieldCounts).forEach(([key, count]) => {
            if (count > 1) {
                const [name, roles] = key.split('|');
                const rolesList = roles.split(',');
                
                if (rolesList.includes('time')) {
                    patterns.common_time_fields.push({ name, count, roles: rolesList });
                }
                if (rolesList.includes('geo')) {
                    patterns.common_geo_fields.push({ name, count, roles: rolesList });
                }
                if (rolesList.includes('metric')) {
                    patterns.common_metric_fields.push({ name, count, roles: rolesList });
                }
                if (rolesList.includes('category')) {
                    patterns.common_category_fields.push({ name, count, roles: rolesList });
                }
            }
        });
        
        return patterns;
    }

    /**
     * Main execution method
     */
    async run() {
        try {
            console.log('🚀 Starting Visualization Rules Generation...\n');
            
            // Ensure output directory exists
            try {
                await fs.access(this.outputDir);
            } catch {
                await fs.mkdir(this.outputDir, { recursive: true });
            }
            
            await this.generateRules();
            
            console.log('\n🎉 SUCCESS! Visualization rules generated successfully!');
            console.log(`📁 Check results in: ${this.outputDir}`);
            
        } catch (error) {
            console.error('\n💥 GENERATION FAILED:', error.message);
            console.error(error.stack);
            throw error;
        }
    }
}

// Run the generator
if (require.main === module) {
    const generator = new VisualizationRulesGenerator();
    generator.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = VisualizationRulesGenerator;
