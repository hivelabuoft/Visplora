#!/usr/bin/env python3
"""
Extend existing QSF with remaining questions from Set_A.json
Maintains exact formatting and adds page breaks between question pairs
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

def extend_qsf_with_remaining_questions():
    """Extend the existing QSF with questions 3-50 from Set_A.json"""
    
    # Load existing QSF
    qsf_file = "/Users/h2o/Documents/Projects/Research/Visplora/data/NS-System-Evaluation.qsf"
    builder = QSFBuilder(qsf_file)
    
    # Load Set_A.json data
    with open("/Users/h2o/Documents/Projects/Research/Visplora/data/system_simulations/Set_A.json", 'r', encoding='utf-8') as f:
        set_a_data = json.load(f)
    
    # Get questions 3-50 (indices 2-49)
    remaining_questions = set_a_data[2:50]  # Questions 3-50
    
    print(f"Adding {len(remaining_questions)} questions to existing QSF...")
    
    # Find the "Set A" block to add questions to
    set_a_block_id = "BL_7aHncWIp5QIaTky"  # From your existing QSF
    
    new_question_ids = []
    
    for i, question_data in enumerate(remaining_questions, start=3):
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
            data_export_tag=f"A-{i}",
            required=True
        )
        
        # Create feedback question
        feedback_qid = builder.create_text_entry_question(
            "(Optional)&nbsp;Please explain your rating",
            data_export_tag=f"A-{i}f",
            required=False
        )
        
        new_question_ids.extend([eval_qid, feedback_qid])
        
        # Add page break after each pair (except the last one)
        if i < 50:  # Don't add page break after the last question
            new_question_ids.append("PAGE_BREAK")
        
        print(f"Created questions {eval_qid} and {feedback_qid} for prompt {i}: '{prompt[:50]}...'")
    
    # Add all new questions to the Set A block
    # First, get existing block elements
    for element in builder.survey_data.get("SurveyElements", []):
        if element.get("Element") == "BL":
            for block in element.get("Payload", []):
                if block.get("ID") == set_a_block_id:
                    # Add new questions to existing block elements
                    for qid in new_question_ids:
                        if qid == "PAGE_BREAK":
                            block["BlockElements"].append({"Type": "Page Break"})
                        else:
                            block["BlockElements"].append({
                                "Type": "Question",
                                "QuestionID": qid
                            })
                    break
    
    # Save the extended QSF
    output_file = "/Users/h2o/Documents/Projects/Research/Visplora/data/NS-System-Evaluation-Extended.qsf"
    builder.save_qsf(output_file)
    
    print(f"\n✅ Successfully extended QSF file!")
    print(f"📄 Output saved to: {output_file}")
    print(f"📊 Added {len([q for q in new_question_ids if q != 'PAGE_BREAK'])} new questions")
    print(f"📝 Questions now cover: A-1 through A-50 (with feedback questions A-1f through A-50f)")
    
    # Show summary
    total_questions = len([elem for elem in builder.survey_data.get("SurveyElements", []) 
                          if elem.get("Element") == "SQ"])
    print(f"📈 Total questions in survey: {total_questions}")

if __name__ == "__main__":
    extend_qsf_with_remaining_questions()