#!/usr/bin/env python3
"""
Add Set B questions to the extended QSF file
Creates a new "Set B" block with B-1, B-1f, B-2, B-2f... pattern
"""

import json
from qsf_utils import QSFBuilder

def create_chart_plans_html(plans):
    """Create HTML for chart plans section"""
    plans_html = ""
    for plan in plans:
        plans_html += f"""
    <div style="margin-bottom:16px;">
      <p style="margin:0; font-weight:bold; font-size:16px;">{plan['title']}</p>
      <p style="margin:2px 0; color:#555;"><i>{plan['type']}</i></p>
      <p style="margin:4px 0;">{plan['description']}</p>
    </div>"""
    
    return plans_html

def create_evaluation_question_html(prompt, plans):
    """Create the full HTML for evaluation question"""
    chart_plans_html = create_chart_plans_html(plans)
    
    return f"""<div style="font-family: Arial, sans-serif; margin: 24px auto; line-height: 1.6;">

  <div style="background:#fff3cd; border:1px solid #f0c36d; border-radius:12px; padding:24px; margin-bottom:20px; box-shadow:0 2px 6px rgba(0,0,0,0.06); text-align:center;">
    <h2 style="color:#7a5c00; margin:0; font-size:22px;">User's Vague Prompt</h2>
    <p style="margin:10px 0 0; font-size:20px; font-weight:bold; color:#333;">
      "{prompt}"
    </p>
  </div>

  <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:10px; padding:20px; margin-bottom:24px;">
    <h3 style="color:#0f6cab; margin-top:0; font-size:18px;">AI-Generated Chart Plan</h3>
{chart_plans_html}
  </div>
</div>"""

def add_set_b_to_qsf():
    """Add Set B questions to the extended QSF file"""
    
    # Load the extended QSF file
    extended_qsf_file = "/Users/h2o/Documents/Projects/Research/Visplora/data/NS-System-Evaluation-Extended.qsf"
    builder = QSFBuilder(extended_qsf_file)
    
    # Load Set_B.json data
    with open("/Users/h2o/Documents/Projects/Research/Visplora/data/system_simulations/Set_B.json", 'r', encoding='utf-8') as f:
        set_b_data = json.load(f)
    
    print(f"Adding {len(set_b_data)} questions from Set B...")
    
    # Create a new "Set B" block
    set_b_block_id = builder.create_new_block("Set B", "Set B Evaluation Questions")
    
    set_b_question_ids = []
    
    for i, question_data in enumerate(set_b_data, start=1):
        prompt = question_data["sentence_content"]
        plans = question_data["charts_display"]
        
        # Create evaluation question HTML
        evaluation_html = create_evaluation_question_html(prompt, plans)
        
        # Create the evaluation question (Likert matrix)
        eval_qid = builder.create_likert_matrix_question(
            evaluation_html,
            [
                "Does the generated chart plan match the intent of the vague prompt?",
                "Does the generated chart plan have the potential to support further exploration?"
            ],
            ["Strongly Disagree", "Strongly Agree"],
            data_export_tag=f"B-{i}",
            required=True
        )
        
        # Create feedback question
        feedback_qid = builder.create_text_entry_question(
            "(Optional)&nbsp;Please explain your rating",
            data_export_tag=f"B-{i}f",
            required=False
        )
        
        set_b_question_ids.extend([eval_qid, feedback_qid])
        
        # Add page break after each pair (except the last one)
        if i < len(set_b_data):  # Don't add page break after the last question
            set_b_question_ids.append("PAGE_BREAK")
        
        print(f"Created questions {eval_qid} and {feedback_qid} for B-{i}: '{prompt[:50]}...'")
    
    # Add all Set B questions to the Set B block
    for element in builder.survey_data.get("SurveyElements", []):
        if element.get("Element") == "BL":
            for block in element.get("Payload", []):
                if block.get("ID") == set_b_block_id:
                    # Add questions to Set B block
                    for qid in set_b_question_ids:
                        if qid == "PAGE_BREAK":
                            block["BlockElements"].append({"Type": "Page Break"})
                        else:
                            block["BlockElements"].append({
                                "Type": "Question",
                                "QuestionID": qid
                            })
                    break
    
    # Update the survey flow to include Set B block
    for element in builder.survey_data.get("SurveyElements", []):
        if element.get("Element") == "FL":
            flow_payload = element.get("Payload", {})
            # Add Set B block to the flow
            next_flow_id = f"FL_{flow_payload.get('Properties', {}).get('Count', 4) + 1}"
            flow_payload["Flow"].append({
                "ID": set_b_block_id,
                "Type": "Standard", 
                "FlowID": next_flow_id
            })
            # Update count
            flow_payload["Properties"]["Count"] = flow_payload.get("Properties", {}).get("Count", 4) + 1
            break
    
    # Save the final QSF with both Set A and Set B
    output_file = "/Users/h2o/Documents/Projects/Research/Visplora/data/NS-System-Evaluation-Complete.qsf"
    builder.save_qsf(output_file)
    
    print(f"\n✅ Successfully added Set B to QSF file!")
    print(f"📄 Output saved to: {output_file}")
    print(f"📊 Added {len([q for q in set_b_question_ids if q != 'PAGE_BREAK'])} new Set B questions")
    print(f"📝 Set B questions: B-1 through B-50 (with feedback questions B-1f through B-50f)")
    
    # Show summary
    total_questions = len([elem for elem in builder.survey_data.get("SurveyElements", []) 
                          if elem.get("Element") == "SQ"])
    print(f"📈 Total questions in survey: {total_questions}")
    
    # Show survey structure
    print(f"\n📋 Survey Structure:")
    print(f"   📁 Consent Form")
    print(f"   📁 Set A: Questions A-1 through A-50 (+ A-1f through A-50f)")
    print(f"   📁 Set B: Questions B-1 through B-50 (+ B-1f through B-50f)")
    print(f"   📊 Total: {total_questions} questions")

if __name__ == "__main__":
    add_set_b_to_qsf()