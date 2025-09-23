# QSF (Qualtrics Survey Format) Utilities - Usage Guide

This toolkit provides systematic ways to append new questions to QSF files and improve their display formatting.

## Tools Overview

1. **`qsf_utils.py`** - Core utilities for building and manipulating QSF files
2. **`qsf_templates.py`** - Specialized templates for chart evaluation surveys  
3. **`qsf_batch_generator.py`** - Batch processing for multiple questions from data files

## Quick Start Examples

### 1. Format Your Existing QSF File

```python
from qsf_utils import QSFBuilder

# Format for better readability
builder = QSFBuilder()
builder.format_qsf_file(
    "input.qsf", 
    "formatted-output.qsf"
)
```

### 2. Add Single Questions to Existing Survey

```python
from qsf_utils import QSFBuilder

# Load existing survey
builder = QSFBuilder("existing-survey.qsf")

# Add a new Likert matrix question
qid = builder.create_likert_matrix_question(
    question_html="<p>Rate the following aspects:</p>",
    choices=["Usability", "Clarity", "Usefulness"],
    data_export_tag="rating",
    required=True
)

# Add a text entry question  
feedback_qid = builder.create_text_entry_question(
    "(Optional) Please explain your ratings",
    data_export_tag="feedback",
    required=False
)

# Save the updated survey
builder.save_qsf("updated-survey.qsf")
```

### 3. Create Chart Evaluation Questions (Your Use Case)

```python
from qsf_templates import ChartEvaluationSurveyBuilder

# Create a new survey for chart evaluation
survey = ChartEvaluationSurveyBuilder("My Chart Evaluation Study")

# Add consent form
survey.add_consent_form()

# Add instructions
survey.add_instructions(total_prompts=50)

# Add evaluation questions for multiple prompts
prompts_data = [
    {
        "prompt": "Africa continues to draw attention.",
        "plans": [
            {
                "title": "Popularity Over Time",
                "type": "Line chart", 
                "description": "Shows growing interest in Africa over years"
            },
            {
                "title": "Regional Comparison",
                "type": "Bar chart",
                "description": "Compares Africa with other regions"
            }
        ]
    }
    # ... more prompts
]

survey.add_prompt_evaluation_set(prompts_data, "Set A")

# Save complete survey
survey.save_survey("chart-evaluation-survey.qsf")
```

### 4. Batch Generate from Data File

```python
from qsf_batch_generator import create_survey_from_data_file

# From CSV file (recommended for large datasets)
create_survey_from_data_file(
    data_file="prompts.csv",
    output_file="generated-survey.qsf", 
    survey_name="Large Scale Chart Evaluation"
)

# From JSON file  
create_survey_from_data_file(
    data_file="prompts.json",
    output_file="generated-survey.qsf"
)
```

## Data File Formats

### CSV Format (Recommended for 50 prompts)

```csv
prompt,plan1_title,plan1_type,plan1_description,plan2_title,plan2_type,plan2_description,plan3_title,plan3_type,plan3_description
"Africa continues to draw attention.","Popularity Over Time","Line chart","Shows growing interest","Regional Comparison","Bar chart","Compares regions","","",""
"Safety varies by region.","Safety Scores","Bar chart","Regional safety rankings","Safety vs Tourism","Scatter plot","Safety-tourism relationship","","",""
```

### JSON Format

```json
[
  {
    "prompt": "Africa continues to draw attention.",
    "plans": [
      {
        "title": "Popularity Over Time",
        "type": "Line chart",
        "description": "Shows growing interest in Africa over years"
      },
      {
        "title": "Regional Comparison", 
        "type": "Bar chart",
        "description": "Compares Africa with other regions"
      }
    ]
  }
]
```

## Key Features

### ✅ Systematic Question Creation
- Consistent ID generation (QID1, QID2, etc.)
- Proper data export tags
- Validation settings
- Styled HTML formatting

### ✅ Question Types Supported
- **Multiple Choice** (like consent forms)
- **Likert Matrix** (rating scales) 
- **Text Entry** (feedback/explanations)
- **Display Questions** (instructions/content)

### ✅ Better Display Formatting
- Professional CSS styling
- Responsive design
- Consistent visual hierarchy
- Better readability

### ✅ Batch Processing
- Generate multiple similar questions
- Import from CSV/JSON
- Automatic block organization
- Progress tracking

## Best Practices

1. **Start with formatted QSF**: Always format your existing QSF first for better readability
2. **Use consistent naming**: Follow the data export tag pattern (A-1, A-2, etc.)
3. **Organize in blocks**: Group related questions in logical blocks
4. **Test incrementally**: Add a few questions, test, then add more
5. **Backup originals**: Always keep a copy of your original QSF file

## Common Workflows

### For Your 50 Chart Evaluation Questions:

1. **Prepare your data**:
   ```bash
   # Create CSV with your 50 prompts and chart plans
   # Use the sample_prompts.csv as a template
   ```

2. **Generate the survey**:
   ```python
   from qsf_batch_generator import create_survey_from_data_file
   
   create_survey_from_data_file(
       "my-50-prompts.csv",
       "complete-evaluation-survey.qsf",
       "Chart Plan Evaluation - 50 Prompts"
   )
   ```

3. **Import to Qualtrics**:
   - Upload the generated .qsf file to Qualtrics
   - Review and adjust any formatting as needed
   - Test with a small group before full deployment

### For Adding to Existing Survey:

1. **Extend current survey**:
   ```python
   from qsf_batch_generator import extend_existing_survey
   
   extend_existing_survey(
       "NS-System-Evaluation.qsf",
       "additional-prompts.csv", 
       "extended-survey.qsf"
   )
   ```

## Generated Files

Your current directory now contains:
- `NS-System-Evaluation-formatted.qsf` - Formatted version of your original
- `example-chart-evaluation.qsf` - Example survey template
- `batch-generated-survey.qsf` - Sample batch-generated survey  
- `sample_prompts.csv` - Template for data input

## Next Steps

1. Create your data file with 50 prompts following the CSV format
2. Use `create_survey_from_data_file()` to generate your complete survey
3. Import the resulting QSF into Qualtrics for final review and testing