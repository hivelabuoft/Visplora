/**
 * Vega-Lite Chart Generator
 * 
 * This utility uses the generated visualization rules to automatically create 
 * Vega-Lite chart specifications for London datasets
 */

const fs = require('fs').promises;
const path = require('path');

class VegaLiteChartGenerator {
    constructor() {
        this.rulesPath = '../../public/data/visualization_rules/all_visualization_rules.json';
        this.outputDir = '../../public/data/vega_charts';
        this.rules = null;
    }

    async initialize() {
        console.log('🔧 Initializing Vega-Lite Chart Generator...');
        
        // Load visualization rules
        const rulesContent = await fs.readFile(this.rulesPath, 'utf8');
        this.rules = JSON.parse(rulesContent);
        
        // Ensure output directory exists
        try {
            await fs.access(this.outputDir);
        } catch {
            await fs.mkdir(this.outputDir, { recursive: true });
        }
        
        console.log(`✅ Loaded rules for ${this.rules.total_datasets} datasets`);
    }

    /**
     * Generate a bar chart specification
     */
    generateBarChart(dataset, encoding) {
        const spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": {
                "text": `${dataset.dataset_name} - Bar Chart`,
                "subtitle": dataset.description
            },
            "data": {
                "url": dataset.file_path
            },
            "mark": {
                "type": "bar",
                "tooltip": true
            },
            "encoding": {
                "x": {
                    "field": encoding.x.name,
                    "type": this.getVegaType(encoding.x),
                    "title": this.formatFieldName(encoding.x.name),
                    "axis": {
                        "labelAngle": -45
                    }
                },
                "y": {
                    "field": encoding.y.name,
                    "type": this.getVegaType(encoding.y),
                    "title": this.formatFieldName(encoding.y.name),
                    "aggregate": encoding.y.name === 'count' ? 'count' : 'sum'
                }
            },
            "width": 600,
            "height": 400
        };

        // Add color encoding if available
        if (encoding.color) {
            spec.encoding.color = {
                "field": encoding.color.name,
                "type": this.getVegaType(encoding.color),
                "title": this.formatFieldName(encoding.color.name)
            };
        }

        return spec;
    }

    /**
     * Generate a line chart specification
     */
    generateLineChart(dataset, encoding) {
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": {
                "text": `${dataset.dataset_name} - Time Series`,
                "subtitle": dataset.description
            },
            "data": {
                "url": dataset.file_path
            },
            "mark": {
                "type": "line",
                "point": true,
                "tooltip": true
            },
            "encoding": {
                "x": {
                    "field": encoding.x.name,
                    "type": this.getVegaType(encoding.x),
                    "title": this.formatFieldName(encoding.x.name)
                },
                "y": {
                    "field": encoding.y.name,
                    "type": this.getVegaType(encoding.y),
                    "title": this.formatFieldName(encoding.y.name),
                    "aggregate": encoding.y.name === 'count' ? 'count' : 'mean'
                },
                "color": encoding.color ? {
                    "field": encoding.color.name,
                    "type": this.getVegaType(encoding.color),
                    "title": this.formatFieldName(encoding.color.name)
                } : undefined
            },
            "width": 700,
            "height": 400
        };
    }

    /**
     * Generate a choropleth map specification (simplified)
     */
    generateChoroplethMap(dataset, encoding) {
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": {
                "text": `${dataset.dataset_name} - Geographic Distribution`,
                "subtitle": dataset.description
            },
            "data": {
                "url": dataset.file_path
            },
            "mark": {
                "type": "rect",
                "tooltip": true
            },
            "encoding": {
                "x": {
                    "field": encoding.geo.name,
                    "type": "nominal",
                    "title": this.formatFieldName(encoding.geo.name),
                    "axis": {
                        "labelAngle": -45
                    }
                },
                "y": {
                    "value": 20
                },
                "color": {
                    "field": encoding.color.name,
                    "type": this.getVegaType(encoding.color),
                    "title": this.formatFieldName(encoding.color.name),
                    "aggregate": "mean",
                    "scale": {
                        "scheme": "blues"
                    }
                }
            },
            "width": 800,
            "height": 100
        };
    }

    /**
     * Generate a stacked bar chart specification
     */
    generateStackedBarChart(dataset, encoding) {
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": {
                "text": `${dataset.dataset_name} - Stacked Analysis`,
                "subtitle": dataset.description
            },
            "data": {
                "url": dataset.file_path
            },
            "mark": {
                "type": "bar",
                "tooltip": true
            },
            "encoding": {
                "x": {
                    "field": encoding.x.name,
                    "type": this.getVegaType(encoding.x),
                    "title": this.formatFieldName(encoding.x.name),
                    "axis": {
                        "labelAngle": -45
                    }
                },
                "y": {
                    "field": encoding.y.name,
                    "type": this.getVegaType(encoding.y),
                    "title": this.formatFieldName(encoding.y.name),
                    "aggregate": encoding.y.name === 'count' ? 'count' : 'sum'
                },
                "color": {
                    "field": encoding.color.name,
                    "type": this.getVegaType(encoding.color),
                    "title": this.formatFieldName(encoding.color.name)
                }
            },
            "width": 600,
            "height": 400
        };
    }

    /**
     * Generate a histogram specification
     */
    generateHistogram(dataset, encoding) {
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": {
                "text": `${dataset.dataset_name} - Distribution`,
                "subtitle": dataset.description
            },
            "data": {
                "url": dataset.file_path
            },
            "mark": {
                "type": "bar",
                "tooltip": true
            },
            "encoding": {
                "x": {
                    "field": encoding.x.name,
                    "type": this.getVegaType(encoding.x),
                    "bin": true,
                    "title": this.formatFieldName(encoding.x.name)
                },
                "y": {
                    "aggregate": "count",
                    "type": "quantitative",
                    "title": "Count"
                }
            },
            "width": 500,
            "height": 300
        };
    }

    /**
     * Convert field roles to Vega-Lite data types
     */
    getVegaType(field) {
        if (field.roles.includes('time')) {
            return 'temporal';
        }
        if (field.roles.includes('metric')) {
            return 'quantitative';
        }
        if (field.roles.includes('geo') || field.roles.includes('category')) {
            return 'nominal';
        }
        // Default fallback based on original type
        if (field.type === 'numeric') return 'quantitative';
        if (field.type === 'datetime') return 'temporal';
        return 'nominal';
    }

    /**
     * Format field names for display
     */
    formatFieldName(fieldName) {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Generate charts for a specific dataset
     */
    async generateChartsForDataset(datasetRule) {
        console.log(`  📊 Generating charts for: ${datasetRule.dataset_name}`);
        
        const charts = [];
        
        // Generate each suggested chart
        for (const suggestion of datasetRule.suggested_charts) {
            let chartSpec;
            
            switch (suggestion.type) {
                case 'bar_chart':
                    chartSpec = this.generateBarChart(datasetRule, suggestion.encoding);
                    break;
                case 'line_chart':
                    chartSpec = this.generateLineChart(datasetRule, suggestion.encoding);
                    break;
                case 'choropleth_map':
                    chartSpec = this.generateChoroplethMap(datasetRule, suggestion.encoding);
                    break;
                case 'stacked_bar_chart':
                    chartSpec = this.generateStackedBarChart(datasetRule, suggestion.encoding);
                    break;
                case 'histogram':
                    chartSpec = this.generateHistogram(datasetRule, suggestion.encoding);
                    break;
                default:
                    console.log(`    ⚠️  Unknown chart type: ${suggestion.type}`);
                    continue;
            }
            
            charts.push({
                type: suggestion.type,
                description: suggestion.description,
                spec: chartSpec
            });
        }
        
        // Save charts for this dataset
        const datasetCharts = {
            dataset_id: datasetRule.dataset_id,
            dataset_name: datasetRule.dataset_name,
            category: datasetRule.category,
            generated_at: new Date().toISOString(),
            charts: charts
        };
        
        const filename = `${datasetRule.dataset_id}_charts.json`;
        const filepath = path.join(this.outputDir, filename);
        await fs.writeFile(filepath, JSON.stringify(datasetCharts, null, 2), 'utf8');
        
        console.log(`    ✅ Generated ${charts.length} chart specifications`);
        return datasetCharts;
    }

    /**
     * Generate sample HTML page for viewing charts
     */
    generateSampleHTML(allCharts) {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>London Data Visualization Gallery</title>
    <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .dataset { margin-bottom: 40px; border-bottom: 1px solid #ddd; padding-bottom: 20px; }
        .chart { margin-bottom: 30px; }
        .chart-title { font-weight: bold; color: #333; margin-bottom: 10px; }
        .chart-description { color: #666; font-style: italic; margin-bottom: 15px; }
        .vis { margin-bottom: 20px; }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; }
    </style>
</head>
<body>
    <h1>🏙️ London Data Visualization Gallery</h1>
    <p>Auto-generated Vega-Lite charts based on dataset field roles</p>
    
    ${allCharts.map(dataset => `
    <div class="dataset">
        <h2>${dataset.dataset_name}</h2>
        <p><strong>Category:</strong> ${dataset.category}</p>
        
        ${dataset.charts.map((chart, index) => `
        <div class="chart">
            <div class="chart-title">${chart.type.replace('_', ' ').toUpperCase()}</div>
            <div class="chart-description">${chart.description}</div>
            <div id="vis_${dataset.dataset_id}_${index}" class="vis"></div>
            <script>
                vegaEmbed('#vis_${dataset.dataset_id}_${index}', ${JSON.stringify(chart.spec)});
            </script>
        </div>
        `).join('')}
    </div>
    `).join('')}
    
</body>
</html>`;
        
        return html;
    }

    /**
     * Generate all charts
     */
    async generateAllCharts() {
        console.log('🎨 Generating Vega-Lite charts for all datasets...\n');
        
        const allCharts = [];
        
        for (const datasetRule of this.rules.visualization_rules) {
            try {
                const datasetCharts = await this.generateChartsForDataset(datasetRule);
                allCharts.push(datasetCharts);
            } catch (error) {
                console.error(`  ❌ Failed to generate charts for ${datasetRule.dataset_name}:`, error.message);
            }
        }
        
        // Save consolidated charts file
        const consolidatedFile = path.join(this.outputDir, 'all_vega_charts.json');
        await fs.writeFile(consolidatedFile, JSON.stringify({
            generated_at: new Date().toISOString(),
            total_datasets: allCharts.length,
            total_charts: allCharts.reduce((sum, ds) => sum + ds.charts.length, 0),
            datasets: allCharts
        }, null, 2), 'utf8');
        
        // Generate sample HTML
        const html = this.generateSampleHTML(allCharts);
        const htmlFile = path.join(this.outputDir, 'visualization_gallery.html');
        await fs.writeFile(htmlFile, html, 'utf8');
        
        console.log(`\n📊 CHART GENERATION SUMMARY`);
        console.log(`===============================`);
        console.log(`📂 Datasets processed: ${allCharts.length}`);
        console.log(`📈 Total charts generated: ${allCharts.reduce((sum, ds) => sum + ds.charts.length, 0)}`);
        console.log(`📁 Output directory: ${this.outputDir}`);
        console.log(`📄 Consolidated file: ${consolidatedFile}`);
        console.log(`🌐 Sample gallery: ${htmlFile}`);
        
        return allCharts;
    }

    async run() {
        try {
            await this.initialize();
            await this.generateAllCharts();
            
            console.log('\n🎉 SUCCESS! Vega-Lite charts generated successfully!');
            
        } catch (error) {
            console.error('\n💥 CHART GENERATION FAILED:', error.message);
            console.error(error.stack);
            throw error;
        }
    }
}

// Run the generator
if (require.main === module) {
    const generator = new VegaLiteChartGenerator();
    generator.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = VegaLiteChartGenerator;
