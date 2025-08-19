/**
 * Template-Based Vega-Lite Chart Generator
 * 
 * Implements systematic chart generation using canonical templates with slot requirements,
 * heuristics, and proposition alignment as proposed by the user.
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateBasedChartGenerator {
    constructor() {
        this.rulesPath = '../../public/data/visualization_rules/all_visualization_rules.json';
        this.propositionsPath = '../../public/data/narrative_propositions/all_generated_propositions.json';
        this.outputDir = '../../public/data/template_charts';
        this.rules = null;
        this.propositions = null;
    }

    /**
     * Define canonical chart templates with requirements and heuristics
     */
    getChartTemplates() {
        return {
            line_chart: {
                name: 'Line Chart',
                required: ['time', 'metric'],
                optional: ['group'],
                heuristics: { 
                    min_time_points: 3,
                    max_time_series: 10 
                },
                description: 'Shows trends over time',
                propositionTypes: ['temporal_trends', 'cross_dimensional']
            },

            bar_chart: {
                name: 'Bar Chart',
                required: ['category_or_geo', 'metric'],
                optional: ['group'],
                heuristics: { 
                    max_categories: 50,
                    min_categories: 2 
                },
                description: 'Compares categories or geographic areas',
                propositionTypes: ['geographic_patterns', 'categorical_analysis']
            },

            choropleth_map: {
                name: 'Choropleth Map',
                required: ['geo', 'metric'],
                optional: [],
                heuristics: { 
                    min_geo_coverage: 3,
                    max_geo_areas: 100 
                },
                description: 'Shows geographic distribution of metrics',
                propositionTypes: ['geographic_patterns', 'cross_dimensional']
            },

            scatter_plot: {
                name: 'Scatter Plot',
                required: ['metric_x', 'metric_y'],
                optional: ['group', 'size'],
                heuristics: { 
                    min_data_points: 10,
                    max_data_points: 5000 
                },
                description: 'Shows correlation between two metrics',
                propositionTypes: ['statistical_patterns', 'cross_dimensional']
            },

            heatmap: {
                name: 'Heatmap',
                required: ['category_x', 'category_y', 'metric'],
                optional: [],
                heuristics: { 
                    max_categories_x: 20, 
                    max_categories_y: 20,
                    min_categories_x: 2,
                    min_categories_y: 2
                },
                description: 'Shows relationships between two categorical dimensions',
                propositionTypes: ['cross_dimensional', 'categorical_analysis']
            },

            histogram: {
                name: 'Histogram',
                required: ['metric'],
                optional: ['group'],
                heuristics: { 
                    min_unique_values: 5,
                    max_unique_values: 1000 
                },
                description: 'Shows distribution of numeric values',
                propositionTypes: ['statistical_patterns']
            },

            grouped_bar: {
                name: 'Grouped Bar Chart',
                required: ['category', 'metric', 'group'],
                optional: [],
                heuristics: { 
                    max_categories: 20,
                    max_groups: 10 
                },
                description: 'Compares multiple groups across categories',
                propositionTypes: ['cross_dimensional', 'categorical_analysis']
            },

            area_chart: {
                name: 'Area Chart',
                required: ['time', 'metric'],
                optional: ['group'],
                heuristics: { 
                    min_time_points: 5,
                    suitable_for_cumulative: true 
                },
                description: 'Shows cumulative trends over time',
                propositionTypes: ['temporal_trends']
            }
        };
    }

    async initialize() {
        console.log('🔧 Initializing Template-Based Chart Generator...');
        
        // Load visualization rules
        const rulesContent = await fs.readFile(this.rulesPath, 'utf8');
        this.rules = JSON.parse(rulesContent);
        
        // Load propositions for alignment
        const propositionsContent = await fs.readFile(this.propositionsPath, 'utf8');
        this.propositions = JSON.parse(propositionsContent);
        
        // Ensure output directory exists
        try {
            await fs.access(this.outputDir);
        } catch {
            await fs.mkdir(this.outputDir, { recursive: true });
        }
        
        console.log(`✅ Loaded ${this.rules.total_datasets} datasets and ${this.getTotalPropositions()} propositions`);
    }

    getTotalPropositions() {
        if (!this.propositions || !this.propositions.datasets) {
            return 0;
        }
        
        return Object.values(this.propositions.datasets).reduce((total, dataset) => {
            if (dataset.categories) {
                return total + Object.values(dataset.categories).reduce((sum, category) => {
                    return sum + (Array.isArray(category) ? category.length : 0);
                }, 0);
            }
            return total + (dataset.total_propositions || 0);
        }, 0) + (this.propositions.cross_dataset?.propositions_by_category ? 
            Object.values(this.propositions.cross_dataset.propositions_by_category).reduce((sum, category) => {
                return sum + (Array.isArray(category) ? category.length : 0);
            }, 0) : 0);
    }

    /**
     * Check if a dataset satisfies a template's requirements
     */
    checkTemplateRequirements(template, fieldRoles) {
        const availableRoles = this.categorizeFields(fieldRoles);
        
        for (const requirement of template.required) {
            if (!this.hasRequiredRole(requirement, availableRoles)) {
                return { satisfied: false, missing: requirement };
            }
        }
        
        return { satisfied: true, available_slots: availableRoles };
    }

    /**
     * Categorize fields by their roles for template matching
     */
    categorizeFields(fieldRoles) {
        return {
            time: fieldRoles.filter(f => f.roles.includes('time')),
            geo: fieldRoles.filter(f => f.roles.includes('geo')),
            metric: fieldRoles.filter(f => f.roles.includes('metric')),
            category: fieldRoles.filter(f => f.roles.includes('category') && !f.roles.includes('geo')),
            category_or_geo: fieldRoles.filter(f => f.roles.includes('category') || f.roles.includes('geo'))
        };
    }

    /**
     * Check if required role is available
     */
    hasRequiredRole(requirement, availableRoles) {
        switch (requirement) {
            case 'time':
                return availableRoles.time.length > 0;
            case 'geo':
                return availableRoles.geo.length > 0;
            case 'metric':
                return availableRoles.metric.length > 0;
            case 'category':
                return availableRoles.category.length > 0;
            case 'category_or_geo':
                return availableRoles.category_or_geo.length > 0;
            case 'metric_x':
            case 'metric_y':
                return availableRoles.metric.length >= 2;
            case 'category_x':
            case 'category_y':
                return availableRoles.category.length >= 2;
            case 'group':
                return availableRoles.category.length > 0 || availableRoles.geo.length > 1;
            default:
                return false;
        }
    }

    /**
     * Apply heuristics to filter out poor quality charts
     */
    applyHeuristics(template, dataset, slots) {
        const heuristics = template.heuristics;
        
        // Skip if template doesn't align with dataset's proposition types
        if (!this.alignsWithPropositions(template, dataset)) {
            return { valid: false, reason: 'No proposition alignment' };
        }
        
        // Apply specific heuristics based on template type
        for (const [rule, threshold] of Object.entries(heuristics)) {
            if (!this.checkHeuristic(rule, threshold, slots, dataset)) {
                return { valid: false, reason: `Failed heuristic: ${rule}` };
            }
        }
        
        return { valid: true };
    }

    /**
     * Check if template aligns with available propositions
     */
    alignsWithPropositions(template, dataset) {
        // Find dataset propositions
        const datasetPropositions = this.propositions.datasets[dataset.dataset_id];
        if (!datasetPropositions) return true; // Allow if no specific alignment required
        
        // Check if any proposition categories match template types
        if (datasetPropositions.categories) {
            const propositionCategories = Object.keys(datasetPropositions.categories);
            return template.propositionTypes.some(type => 
                propositionCategories.includes(type)
            );
        }
        
        return true; // Allow if structure doesn't match expected format
    }

    /**
     * Check individual heuristic rules
     */
    checkHeuristic(rule, threshold, slots, dataset) {
        switch (rule) {
            case 'min_time_points':
                // Would need actual data to check, assume valid for now
                return true;
            case 'max_categories':
                const categoryField = slots.category?.[0] || slots.category_or_geo?.[0];
                return !categoryField || !categoryField.sample_values || 
                       categoryField.sample_values.length <= threshold;
            case 'min_geo_coverage':
                const geoField = slots.geo?.[0];
                return !geoField || !geoField.sample_values || 
                       geoField.sample_values.length >= threshold;
            case 'min_categories':
                const catField = slots.category?.[0] || slots.category_or_geo?.[0];
                return !catField || !catField.sample_values || 
                       catField.sample_values.length >= threshold;
            default:
                return true;
        }
    }

    /**
     * Generate interactive Vega-Lite specification for template
     */
    generateTemplateSpec(template, dataset, slots) {
        const baseSpec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": {
                "text": `${dataset.dataset_name} - ${template.name}`,
                "subtitle": template.description,
                "fontSize": 16,
                "anchor": "start"
            },
            "data": {
                "url": dataset.file_path
            },
            "params": [
                {
                    "name": "highlight",
                    "select": {"type": "point", "on": "mouseover"}
                },
                {
                    "name": "select",
                    "select": "point"
                }
            ]
        };

        // Generate template-specific specs
        switch (template.name.toLowerCase().replace(' ', '_')) {
            case 'line_chart':
                return this.generateInteractiveLineChart(baseSpec, slots);
            case 'bar_chart':
                return this.generateInteractiveBarChart(baseSpec, slots);
            case 'choropleth_map':
                return this.generateInteractiveChoropleth(baseSpec, slots);
            case 'scatter_plot':
                return this.generateInteractiveScatter(baseSpec, slots);
            case 'heatmap':
                return this.generateInteractiveHeatmap(baseSpec, slots);
            case 'histogram':
                return this.generateInteractiveHistogram(baseSpec, slots);
            case 'grouped_bar':
                return this.generateInteractiveGroupedBar(baseSpec, slots);
            case 'area_chart':
                return this.generateInteractiveAreaChart(baseSpec, slots);
            default:
                return baseSpec;
        }
    }

    generateInteractiveLineChart(baseSpec, slots) {
        return {
            ...baseSpec,
            "mark": {
                "type": "line",
                "point": {
                    "filled": false,
                    "fill": "white"
                },
                "tooltip": true,
                "strokeWidth": 3
            },
            "encoding": {
                "x": {
                    "field": slots.time[0].name,
                    "type": "temporal",
                    "title": this.formatFieldName(slots.time[0].name)
                },
                "y": {
                    "field": slots.metric[0].name,
                    "type": "quantitative",
                    "title": this.formatFieldName(slots.metric[0].name)
                },
                "color": slots.category?.[0] ? {
                    "field": slots.category[0].name,
                    "type": "nominal",
                    "title": this.formatFieldName(slots.category[0].name),
                    "scale": {"scheme": "category10"}
                } : undefined,
                "opacity": {
                    "condition": {"param": "select", "value": 1.0},
                    "value": 0.3
                },
                "strokeWidth": {
                    "condition": [
                        {"param": "select", "value": 4},
                        {"param": "highlight", "value": 3}
                    ],
                    "value": 2
                }
            },
            "width": 600,
            "height": 400
        };
    }

    generateInteractiveBarChart(baseSpec, slots) {
        return {
            ...baseSpec,
            "mark": {
                "type": "bar",
                "tooltip": true,
                "stroke": "white",
                "strokeWidth": 1
            },
            "encoding": {
                "x": {
                    "field": slots.category_or_geo[0].name,
                    "type": "nominal",
                    "title": this.formatFieldName(slots.category_or_geo[0].name),
                    "axis": {"labelAngle": -45}
                },
                "y": {
                    "field": slots.metric[0].name,
                    "type": "quantitative",
                    "title": this.formatFieldName(slots.metric[0].name)
                },
                "color": {
                    "condition": {
                        "param": "select",
                        "field": slots.category_or_geo[0].name,
                        "scale": {"scheme": "blues"}
                    },
                    "value": "lightgray"
                },
                "stroke": {
                    "condition": [
                        {"param": "select", "value": "black"},
                        {"param": "highlight", "value": "red"}
                    ],
                    "value": null
                }
            },
            "width": 500,
            "height": 400
        };
    }

    generateInteractiveChoropleth(baseSpec, slots) {
        return {
            ...baseSpec,
            "mark": {
                "type": "rect",
                "tooltip": true,
                "stroke": "white",
                "strokeWidth": 1
            },
            "encoding": {
                "x": {
                    "field": slots.geo[0].name,
                    "type": "nominal",
                    "title": this.formatFieldName(slots.geo[0].name),
                    "axis": {"labelAngle": -45}
                },
                "y": {"value": 20},
                "color": {
                    "field": slots.metric[0].name,
                    "type": "quantitative",
                    "title": this.formatFieldName(slots.metric[0].name),
                    "scale": {"scheme": "viridis"},
                    "legend": {"title": this.formatFieldName(slots.metric[0].name)}
                },
                "stroke": {
                    "condition": {"param": "select", "value": "black"},
                    "value": null
                },
                "strokeWidth": {
                    "condition": {"param": "select", "value": 3},
                    "value": 1
                }
            },
            "width": 800,
            "height": 100
        };
    }

    generateInteractiveScatter(baseSpec, slots) {
        return {
            ...baseSpec,
            "mark": {
                "type": "circle",
                "tooltip": true,
                "size": 100,
                "stroke": "white",
                "strokeWidth": 1
            },
            "encoding": {
                "x": {
                    "field": slots.metric[0].name,
                    "type": "quantitative",
                    "title": this.formatFieldName(slots.metric[0].name)
                },
                "y": {
                    "field": slots.metric[1].name,
                    "type": "quantitative",
                    "title": this.formatFieldName(slots.metric[1].name)
                },
                "color": slots.category?.[0] ? {
                    "field": slots.category[0].name,
                    "type": "nominal",
                    "scale": {"scheme": "category10"}
                } : undefined,
                "size": slots.metric[2] ? {
                    "field": slots.metric[2].name,
                    "type": "quantitative",
                    "scale": {"range": [50, 500]}
                } : {"value": 100},
                "opacity": {
                    "condition": {"param": "select", "value": 1.0},
                    "value": 0.7
                },
                "stroke": {
                    "condition": {"param": "highlight", "value": "red"},
                    "value": "white"
                }
            },
            "width": 500,
            "height": 400
        };
    }

    generateInteractiveHeatmap(baseSpec, slots) {
        return {
            ...baseSpec,
            "mark": {
                "type": "rect",
                "tooltip": true,
                "stroke": "white",
                "strokeWidth": 1
            },
            "encoding": {
                "x": {
                    "field": slots.category[0].name,
                    "type": "nominal",
                    "title": this.formatFieldName(slots.category[0].name)
                },
                "y": {
                    "field": slots.category[1].name,
                    "type": "nominal",
                    "title": this.formatFieldName(slots.category[1].name)
                },
                "color": {
                    "field": slots.metric[0].name,
                    "type": "quantitative",
                    "title": this.formatFieldName(slots.metric[0].name),
                    "scale": {"scheme": "blues"}
                },
                "stroke": {
                    "condition": {"param": "select", "value": "black"},
                    "value": null
                },
                "strokeWidth": {
                    "condition": {"param": "select", "value": 3},
                    "value": 1
                }
            },
            "width": 400,
            "height": 300
        };
    }

    generateInteractiveHistogram(baseSpec, slots) {
        return {
            ...baseSpec,
            "mark": {
                "type": "bar",
                "tooltip": true,
                "binSpacing": 1,
                "stroke": "white",
                "strokeWidth": 1
            },
            "encoding": {
                "x": {
                    "field": slots.metric[0].name,
                    "type": "quantitative",
                    "bin": {"maxbins": 30},
                    "title": this.formatFieldName(slots.metric[0].name)
                },
                "y": {
                    "aggregate": "count",
                    "type": "quantitative",
                    "title": "Frequency"
                },
                "color": {
                    "condition": {"param": "select", "value": "steelblue"},
                    "value": "lightgray"
                },
                "stroke": {
                    "condition": {"param": "highlight", "value": "red"},
                    "value": null
                }
            },
            "width": 500,
            "height": 300
        };
    }

    generateInteractiveGroupedBar(baseSpec, slots) {
        return {
            ...baseSpec,
            "mark": {
                "type": "bar",
                "tooltip": true,
                "stroke": "white",
                "strokeWidth": 1
            },
            "encoding": {
                "x": {
                    "field": slots.category[0].name,
                    "type": "nominal",
                    "title": this.formatFieldName(slots.category[0].name),
                    "axis": {"labelAngle": -45}
                },
                "y": {
                    "field": slots.metric[0].name,
                    "type": "quantitative",
                    "title": this.formatFieldName(slots.metric[0].name)
                },
                "color": {
                    "field": slots.category[1].name,
                    "type": "nominal",
                    "title": this.formatFieldName(slots.category[1].name),
                    "scale": {"scheme": "category10"}
                },
                "xOffset": {
                    "field": slots.category[1].name,
                    "type": "nominal"
                },
                "opacity": {
                    "condition": {"param": "select", "value": 1.0},
                    "value": 0.7
                }
            },
            "width": 500,
            "height": 400
        };
    }

    generateInteractiveAreaChart(baseSpec, slots) {
        return {
            ...baseSpec,
            "mark": {
                "type": "area",
                "tooltip": true,
                "opacity": 0.7,
                "stroke": "white",
                "strokeWidth": 2
            },
            "encoding": {
                "x": {
                    "field": slots.time[0].name,
                    "type": "temporal",
                    "title": this.formatFieldName(slots.time[0].name)
                },
                "y": {
                    "field": slots.metric[0].name,
                    "type": "quantitative",
                    "title": this.formatFieldName(slots.metric[0].name),
                    "stack": slots.category?.[0] ? "zero" : null
                },
                "color": slots.category?.[0] ? {
                    "field": slots.category[0].name,
                    "type": "nominal",
                    "scale": {"scheme": "category10"}
                } : undefined,
                "opacity": {
                    "condition": {"param": "select", "value": 0.9},
                    "value": 0.6
                }
            },
            "width": 600,
            "height": 400
        };
    }

    formatFieldName(fieldName) {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Generate all valid charts using template system
     */
    async generateTemplateCharts() {
        console.log('🎨 Generating charts using template system...\n');
        
        const templates = this.getChartTemplates();
        const validCharts = [];
        let totalGenerated = 0;
        let totalSkipped = 0;

        for (const dataset of this.rules.visualization_rules) {
            console.log(`📊 Processing dataset: ${dataset.dataset_name}`);
            const datasetCharts = [];

            for (const [templateKey, template] of Object.entries(templates)) {
                // Check if dataset satisfies template requirements
                const requirements = this.checkTemplateRequirements(template, dataset.field_roles);
                
                if (!requirements.satisfied) {
                    console.log(`  ❌ ${template.name}: Missing ${requirements.missing}`);
                    totalSkipped++;
                    continue;
                }

                // Apply heuristics
                const heuristics = this.applyHeuristics(template, dataset, requirements.available_slots);
                if (!heuristics.valid) {
                    console.log(`  ⚠️  ${template.name}: ${heuristics.reason}`);
                    totalSkipped++;
                    continue;
                }

                // Generate chart spec
                const chartSpec = this.generateTemplateSpec(template, dataset, requirements.available_slots);
                
                const chart = {
                    id: `${dataset.dataset_id}_${templateKey}`,
                    dataset_id: dataset.dataset_id,
                    dataset_name: dataset.dataset_name,
                    template: templateKey,
                    template_name: template.name,
                    description: template.description,
                    proposition_types: template.propositionTypes,
                    spec: chartSpec,
                    slots_used: {
                        required: template.required,
                        filled: requirements.available_slots
                    }
                };

                datasetCharts.push(chart);
                console.log(`  ✅ ${template.name}: Generated`);
                totalGenerated++;
            }

            if (datasetCharts.length > 0) {
                validCharts.push({
                    dataset_id: dataset.dataset_id,
                    dataset_name: dataset.dataset_name,
                    category: dataset.category,
                    charts: datasetCharts
                });
            }
        }

        // Save results
        const outputFile = path.join(this.outputDir, 'template_based_charts.json');
        const output = {
            generated_at: new Date().toISOString(),
            generation_method: 'template_based_with_heuristics',
            templates_used: Object.keys(templates),
            statistics: {
                total_datasets: this.rules.total_datasets,
                total_charts_generated: totalGenerated,
                total_charts_skipped: totalSkipped,
                datasets_with_charts: validCharts.length
            },
            charts: validCharts
        };

        await fs.writeFile(outputFile, JSON.stringify(output, null, 2), 'utf8');

        console.log(`\n📈 TEMPLATE GENERATION SUMMARY`);
        console.log(`==============================`);
        console.log(`📊 Charts generated: ${totalGenerated}`);
        console.log(`⚠️  Charts skipped: ${totalSkipped}`);
        console.log(`📂 Datasets with valid charts: ${validCharts.length}/${this.rules.total_datasets}`);
        console.log(`📄 Output file: ${outputFile}`);

        return output;
    }

    async run() {
        try {
            await this.initialize();
            const results = await this.generateTemplateCharts();
            
            console.log('\n🎉 SUCCESS! Template-based charts generated successfully!');
            return results;
            
        } catch (error) {
            console.error('\n💥 TEMPLATE GENERATION FAILED:', error.message);
            console.error(error.stack);
            throw error;
        }
    }
}

// Run the generator
if (require.main === module) {
    const generator = new TemplateBasedChartGenerator();
    generator.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = TemplateBasedChartGenerator;
