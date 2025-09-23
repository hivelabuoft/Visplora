#!/usr/bin/env python3
"""
QSF Batch Question Generator
Generate multiple questions from data files
"""

import json
import csv
from qsf_templates import ChartEvaluationSurveyBuilder
from typing import List, Dict, Any
import os

def load_prompts_from_csv(csv_file: str) -> List[Dict]:
    """Load prompts and chart plans from CSV file
    
    Expected CSV format:
    prompt, plan1_title, plan1_type, plan1_description, plan2_title, plan2_type, plan2_description, ...
    """
    prompts_data = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            prompt = row['prompt']
            plans = []
            
            # Extract plans (assuming up to 4 plans per prompt)
            for i in range(1, 5):
                title_key = f'plan{i}_title'
                type_key = f'plan{i}_type'
                desc_key = f'plan{i}_description'
                
                if title_key in row and row[title_key].strip():
                    plans.append({
                        'title': row[title_key].strip(),
                        'type': row[type_key].strip(),
                        'description': row[desc_key].strip()
                    })
            
            if prompt and plans:
                prompts_data.append({
                    'prompt': prompt.strip(),
                    'plans': plans
                })
    
    return prompts_data

def load_prompts_from_json_lines(jsonl_file: str) -> List[Dict]:
    """Load from JSON Lines format (one JSON object per line)"""
    prompts_data = []
    
    with open(jsonl_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                data = json.loads(line.strip())
                prompts_data.append(data)
    
    return prompts_data

def create_survey_from_data_file(data_file: str, 
                                output_file: str,
                                survey_name: str = "Chart Plan Evaluation",
                                include_consent: bool = True) -> None:
    """Create complete survey from data file"""
    
    # Determine file format and load data
    file_ext = os.path.splitext(data_file)[1].lower()
    
    if file_ext == '.csv':
        prompts_data = load_prompts_from_csv(data_file)
    elif file_ext == '.jsonl':
        prompts_data = load_prompts_from_json_lines(data_file)
    elif file_ext == '.json':
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                prompts_data = data
            else:
                prompts_data = [data]
    else:
        raise ValueError(f"Unsupported file format: {file_ext}")
    
    print(f"Loaded {len(prompts_data)} prompts from {data_file}")
    
    # Create survey
    survey = ChartEvaluationSurveyBuilder(survey_name)
    
    # Add consent form if requested
    if include_consent:
        survey.add_consent_form()
    
    # Add instructions
    survey.add_instructions(total_prompts=len(prompts_data))
    
    # Split into manageable chunks (e.g., 10 questions per set)
    chunk_size = 10
    for i in range(0, len(prompts_data), chunk_size):
        chunk = prompts_data[i:i+chunk_size]
        set_name = f"Set {chr(65 + i // chunk_size)}"  # Set A, Set B, etc.
        
        print(f"Creating {set_name} with {len(chunk)} questions...")
        survey.add_prompt_evaluation_set(chunk, set_name)
    
    # Save survey
    survey.save_survey(output_file)
    print(f"Survey saved to: {output_file}")
    print(f"Total questions created: {len(prompts_data) * 2}")  # Each prompt creates 2 questions

def create_sample_data_file():
    """Create sample CSV file for testing"""
    sample_data = [
        {
            "prompt": "Certain regions are reportedly safer than others.",
            "plan1_title": "Safety Score by Region",
            "plan1_type": "Bar chart",
            "plan1_description": "The 'Safety Score by Region' bar chart reveals how different regions rank in terms of safety.",
            "plan2_title": "Safety vs Popularity",
            "plan2_type": "Bubble chart",
            "plan2_description": "Shows the relationship between safety scores and popularity scores.",
            "plan3_title": "",
            "plan3_type": "",
            "plan3_description": "",
            "plan4_title": "",
            "plan4_type": "",
            "plan4_description": ""
        },
        {
            "prompt": "Africa continues to draw a lot of attention.",
            "plan1_title": "Popularity of Africa Over Time",
            "plan1_type": "Line chart", 
            "plan1_description": "Shows how interest in visiting Africa has grown over the years.",
            "plan2_title": "Comparative Popularity of Regions",
            "plan2_type": "Bar chart",
            "plan2_description": "Contrasts Africa's appeal with Asia and Europe.",
            "plan3_title": "Africa's Popularity by Country",
            "plan3_type": "Pie chart",
            "plan3_description": "Shows relative popularity of different African countries.",
            "plan4_title": "",
            "plan4_type": "",
            "plan4_description": ""
        }
    ]
    
    csv_file = "/Users/h2o/Documents/Projects/Research/Visplora/data/sample_prompts.csv"
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=sample_data[0].keys())
        writer.writeheader()
        writer.writerows(sample_data)
    
    print(f"Sample CSV file created: {csv_file}")
    return csv_file

def extend_existing_survey(existing_qsf: str, 
                         new_data_file: str, 
                         output_file: str) -> None:
    """Add new questions to existing survey"""
    
    # Load existing survey
    from qsf_utils import QSFBuilder
    builder = QSFBuilder(existing_qsf)
    
    # Load new data
    file_ext = os.path.splitext(new_data_file)[1].lower()
    if file_ext == '.csv':
        new_prompts = load_prompts_from_csv(new_data_file)
    elif file_ext == '.json':
        with open(new_data_file, 'r', encoding='utf-8') as f:
            new_prompts = json.load(f)
    else:
        raise ValueError(f"Unsupported file format: {file_ext}")
    
    print(f"Adding {len(new_prompts)} new prompts to existing survey...")
    
    # Find existing block or create new one
    existing_blocks = []
    for element in builder.survey_data.get("SurveyElements", []):
        if element.get("Element") == "BL":
            for block in element.get("Payload", []):
                if block.get("Type") in ["Standard", "Default"]:
                    existing_blocks.append(block.get("ID"))
    
    # Create new block for new questions
    new_block_id = builder.create_new_block("Additional Questions", "New evaluation questions")
    
    # Add questions to new block
    new_qids = []
    for i, prompt_data in enumerate(new_prompts, 1):
        eval_qid, feedback_qid = builder.create_chart_evaluation_pair(
            prompt_data["prompt"],
            prompt_data["plans"],
            base_tag=f"NEW-{i}"
        )
        new_qids.extend([eval_qid, feedback_qid])
    
    builder.add_to_block(new_block_id, new_qids)
    
    # Save extended survey
    builder.save_qsf(output_file)
    print(f"Extended survey saved to: {output_file}")
    print(f"Added {len(new_qids)} new questions")

def analyze_existing_qsf(qsf_file: str) -> Dict[str, Any]:
    """Analyze existing QSF file structure"""
    
    with open(qsf_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    analysis = {
        "survey_name": data.get("SurveyEntry", {}).get("SurveyName", "Unknown"),
        "total_questions": 0,
        "question_types": {},
        "blocks": [],
        "data_export_tags": []
    }
    
    # Analyze questions
    for element in data.get("SurveyElements", []):
        if element.get("Element") == "SQ":
            analysis["total_questions"] += 1
            
            payload = element.get("Payload", {})
            q_type = payload.get("QuestionType", "Unknown")
            
            if q_type in analysis["question_types"]:
                analysis["question_types"][q_type] += 1
            else:
                analysis["question_types"][q_type] = 1
            
            # Collect export tags
            export_tag = payload.get("DataExportTag", "")
            if export_tag:
                analysis["data_export_tags"].append(export_tag)
        
        # Analyze blocks
        elif element.get("Element") == "BL":
            for block in element.get("Payload", []):
                block_info = {
                    "id": block.get("ID", ""),
                    "description": block.get("Description", ""),
                    "type": block.get("Type", ""),
                    "question_count": len(block.get("BlockElements", []))
                }
                analysis["blocks"].append(block_info)
    
    return analysis

if __name__ == "__main__":
    # Example usage
    
    # 1. Create sample data file
    sample_csv = create_sample_data_file()
    
    # 2. Create survey from sample data
    create_survey_from_data_file(
        sample_csv,
        "/Users/h2o/Documents/Projects/Research/Visplora/data/batch-generated-survey.qsf",
        "Batch Generated Chart Evaluation"
    )
    
    # 3. Analyze the existing QSF file
    existing_qsf = "/Users/h2o/Documents/Projects/Research/Visplora/data/NS-System-Evaluation.qsf"
    analysis = analyze_existing_qsf(existing_qsf)
    
    print("\n=== Existing QSF Analysis ===")
    print(f"Survey Name: {analysis['survey_name']}")
    print(f"Total Questions: {analysis['total_questions']}")
    print(f"Question Types: {analysis['question_types']}")
    print(f"Blocks: {len(analysis['blocks'])}")
    for block in analysis['blocks']:
        print(f"  - {block['description']} ({block['type']}): {block['question_count']} questions")
    print(f"Export Tags: {analysis['data_export_tags']}")