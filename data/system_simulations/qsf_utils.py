#!/usr/bin/env python3
"""
QSF (Qualtrics Survey Format) Utilities
Systematic tools for appending questions and improving display formatting
"""

import json
import uuid
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import re

@dataclass
class QuestionTemplate:
    """Template for creating new Qualtrics questions"""
    question_type: str  # MC, Matrix, TE, DB
    selector: str       # SAVR, Likert, ML, TB
    sub_selector: str   # TX, SingleAnswer, etc.
    question_text: str
    choices: Optional[Dict[str, Dict[str, str]]] = None
    answers: Optional[Dict[str, Dict[str, str]]] = None
    validation_required: bool = True
    data_export_tag: str = ""

class QSFBuilder:
    """Main class for building and manipulating QSF files"""
    
    def __init__(self, qsf_file_path: str = None):
        """Initialize with existing QSF file or create new"""
        self.survey_data = {}
        self.question_counter = 1
        self.block_elements = []
        
        if qsf_file_path:
            self.load_qsf(qsf_file_path)
        else:
            self._initialize_empty_survey()
    
    def load_qsf(self, file_path: str):
        """Load existing QSF file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            self.survey_data = json.load(f)
        
        # Extract existing question counter
        questions = [elem for elem in self.survey_data.get('SurveyElements', []) 
                    if elem.get('Element') == 'SQ']
        if questions:
            # Find highest QID number
            max_qid = 0
            for q in questions:
                qid_match = re.search(r'QID(\d+)', q.get('PrimaryAttribute', ''))
                if qid_match:
                    max_qid = max(max_qid, int(qid_match.group(1)))
            self.question_counter = max_qid + 1
    
    def _initialize_empty_survey(self):
        """Initialize basic QSF structure"""
        survey_id = f"SV_{self._generate_id()}"
        self.survey_data = {
            "SurveyEntry": {
                "SurveyID": survey_id,
                "SurveyName": "New Survey",
                "SurveyDescription": None,
                "SurveyLanguage": "EN",
                "SurveyStatus": "Active",
                "SurveyCreationDate": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "LastModified": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            },
            "SurveyElements": []
        }
    
    def _generate_id(self, length: int = 15) -> str:
        """Generate Qualtrics-style ID"""
        chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return ''.join([chars[ord(c) % len(chars)] for c in str(uuid.uuid4()).replace('-', '')[:length]])
    
    def create_likert_matrix_question(self, 
                                    question_html: str, 
                                    choices: List[str],
                                    scale_labels: List[str] = None,
                                    data_export_tag: str = "",
                                    required: bool = True) -> str:
        """Create a Likert matrix question (like QID2, QID5)"""
        
        qid = f"QID{self.question_counter}"
        self.question_counter += 1
        
        # Default 7-point scale
        if scale_labels is None:
            scale_labels = ["Strongly Disagree", "Strongly Agree"]
        
        # Create answers (scale points)
        answers = {}
        answer_order = []
        for i in range(1, 8):  # 7-point scale
            answers[str(i)] = {"Display": str(i)}
            answer_order.append(str(i))
        
        # Create choices (row items)
        choice_dict = {}
        choice_order = []
        for i, choice_text in enumerate(choices, 1):
            choice_dict[str(i)] = {"Display": choice_text}
            choice_order.append(str(i))
        
        question_payload = {
            "QuestionText": question_html,
            "DefaultChoices": False,
            "DataExportTag": data_export_tag,
            "QuestionType": "Matrix",
            "Selector": "Likert",
            "SubSelector": "SingleAnswer",
            "DataVisibility": {"Private": False, "Hidden": False},
            "Configuration": {
                "QuestionDescriptionOption": "UseText",
                "TextPosition": "inline",
                "ChoiceColumnWidth": 25,
                "RepeatHeaders": "none",
                "WhiteSpace": "OFF",
                "MobileFirst": True
            },
            "QuestionDescription": self._extract_text_from_html(question_html)[:80] + "...",
            "Choices": choice_dict,
            "ChoiceOrder": choice_order,
            "Validation": {
                "Settings": {
                    "ForceResponse": "ON" if required else "OFF",
                    "ForceResponseType": "ON" if required else "OFF",
                    "Type": "None"
                }
            },
            "GradingData": [],
            "Language": [],
            "NextChoiceId": len(choices) + 1,
            "NextAnswerId": 8,
            "ColumnLabels": [
                {"Display": scale_labels[0], "IsLabelDefault": False},
                {"Display": scale_labels[1], "IsLabelDefault": False}
            ],
            "Answers": answers,
            "AnswerOrder": answer_order,
            "ChoiceDataExportTags": False,
            "QuestionID": qid
        }
        
        # Add to survey elements
        question_element = {
            "SurveyID": self.survey_data["SurveyEntry"]["SurveyID"],
            "Element": "SQ",
            "PrimaryAttribute": qid,
            "SecondaryAttribute": self._extract_text_from_html(question_html)[:80] + "...",
            "TertiaryAttribute": None,
            "Payload": question_payload
        }
        
        self.survey_data["SurveyElements"].append(question_element)
        return qid
    
    def create_text_entry_question(self, 
                                 question_text: str, 
                                 data_export_tag: str = "",
                                 required: bool = False,
                                 multiline: bool = True) -> str:
        """Create a text entry question (like QID3, QID6)"""
        
        qid = f"QID{self.question_counter}"
        self.question_counter += 1
        
        selector = "ML" if multiline else "SL"
        
        question_payload = {
            "QuestionText": question_text,
            "DefaultChoices": False,
            "DataExportTag": data_export_tag,
            "QuestionType": "TE",
            "Selector": selector,
            "DataVisibility": {"Private": False, "Hidden": False},
            "Configuration": {"QuestionDescriptionOption": "UseText"},
            "QuestionDescription": question_text,
            "Validation": {
                "Settings": {
                    "ForceResponse": "ON" if required else "OFF",
                    "Type": "None"
                }
            },
            "GradingData": [],
            "Language": [],
            "NextChoiceId": 4,
            "NextAnswerId": 1,
            "SearchSource": {"AllowFreeResponse": "false"},
            "QuestionID": qid
        }
        
        question_element = {
            "SurveyID": self.survey_data["SurveyEntry"]["SurveyID"],
            "Element": "SQ",
            "PrimaryAttribute": qid,
            "SecondaryAttribute": question_text,
            "TertiaryAttribute": None,
            "Payload": question_payload
        }
        
        self.survey_data["SurveyElements"].append(question_element)
        return qid
    
    def create_multiple_choice_question(self,
                                      question_text: str,
                                      choices: List[str],
                                      data_export_tag: str = "",
                                      required: bool = True) -> str:
        """Create multiple choice question (like QID1)"""
        
        qid = f"QID{self.question_counter}"
        self.question_counter += 1
        
        # Create choices
        choice_dict = {}
        choice_order = []
        for i, choice_text in enumerate(choices, 1):
            choice_dict[str(i)] = {"Display": choice_text}
            choice_order.append(str(i))
        
        question_payload = {
            "QuestionText": question_text,
            "DataExportTag": data_export_tag,
            "QuestionType": "MC",
            "Selector": "SAVR",
            "SubSelector": "TX",
            "DataVisibility": {"Private": False, "Hidden": False},
            "Configuration": {"QuestionDescriptionOption": "UseText"},
            "QuestionDescription": self._extract_text_from_html(question_text)[:80] + "...",
            "Choices": choice_dict,
            "ChoiceOrder": choice_order,
            "Validation": {
                "Settings": {
                    "ForceResponse": "ON" if required else "OFF",
                    "ForceResponseType": "ON" if required else "OFF",
                    "Type": "None"
                }
            },
            "Language": [],
            "NextChoiceId": len(choices) + 1,
            "NextAnswerId": 1,
            "QuestionID": qid
        }
        
        question_element = {
            "SurveyID": self.survey_data["SurveyEntry"]["SurveyID"],
            "Element": "SQ",
            "PrimaryAttribute": qid,
            "SecondaryAttribute": self._extract_text_from_html(question_text)[:80] + "...",
            "TertiaryAttribute": None,
            "Payload": question_payload
        }
        
        self.survey_data["SurveyElements"].append(question_element)
        return qid
    
    def create_display_question(self, content_html: str, data_export_tag: str = "") -> str:
        """Create descriptive/instructional display question (like QID4)"""
        
        qid = f"QID{self.question_counter}"
        self.question_counter += 1
        
        question_payload = {
            "QuestionText": content_html,
            "DefaultChoices": False,
            "DataExportTag": data_export_tag,
            "QuestionType": "DB",
            "Selector": "TB",
            "DataVisibility": {"Private": False, "Hidden": False},
            "Configuration": {"QuestionDescriptionOption": "UseText"},
            "QuestionDescription": self._extract_text_from_html(content_html)[:80] + "...",
            "ChoiceOrder": [],
            "Validation": {"Settings": {"Type": "None"}},
            "GradingData": [],
            "Language": [],
            "NextChoiceId": 4,
            "NextAnswerId": 1,
            "QuestionID": qid
        }
        
        question_element = {
            "SurveyID": self.survey_data["SurveyEntry"]["SurveyID"],
            "Element": "SQ",
            "PrimaryAttribute": qid,
            "SecondaryAttribute": self._extract_text_from_html(content_html)[:80] + "...",
            "TertiaryAttribute": None,
            "Payload": question_payload
        }
        
        self.survey_data["SurveyElements"].append(question_element)
        return qid
    
    def create_chart_evaluation_pair(self, 
                                   vague_prompt: str, 
                                   chart_plans: List[Dict[str, str]], 
                                   base_tag: str = "A") -> tuple:
        """Create a paired evaluation question for vague prompt + chart plans"""
        
        # Create the HTML for the prompt and chart plans
        chart_plans_html = ""
        for i, plan in enumerate(chart_plans):
            chart_plans_html += f"""
    <div style="margin-bottom:16px;">
      <p style="margin:0; font-weight:bold; font-size:16px;">{plan['title']}</p>
      <p style="margin:2px 0; color:#555;"><i>{plan['type']}</i></p>
      <p style="margin:4px 0;">{plan['description']}</p>
    </div>"""
        
        evaluation_html = f"""<div style="font-family: Arial, sans-serif; margin: 24px auto; line-height: 1.6;">

  <div style="background:#fff3cd; border:1px solid #f0c36d; border-radius:12px; padding:24px; margin-bottom:20px; box-shadow:0 2px 6px rgba(0,0,0,0.06); text-align:center;">
    <h2 style="color:#7a5c00; margin:0; font-size:22px;">User's Vague Prompt</h2>
    <p style="margin:10px 0 0; font-size:20px; font-weight:bold; color:#333;">
      "{vague_prompt}"
    </p>
  </div>

  <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:10px; padding:20px; margin-bottom:24px;">
    <h3 style="color:#0f6cab; margin-top:0; font-size:18px;">AI-Generated Chart Plan</h3>
{chart_plans_html}
  </div>
</div>"""
        
        # Create evaluation question
        evaluation_choices = [
            "Does the generated chart plan match the intent of the vague prompt?",
            "Does the generated chart plan have the potential to support further exploration?"
        ]
        
        eval_qid = self.create_likert_matrix_question(
            evaluation_html,
            evaluation_choices,
            data_export_tag=base_tag,
            required=True
        )
        
        # Create optional feedback question
        feedback_qid = self.create_text_entry_question(
            "(Optional)&nbsp;Please explain your rating",
            data_export_tag=f"{base_tag}f",
            required=False
        )
        
        return eval_qid, feedback_qid
    
    def _extract_text_from_html(self, html: str) -> str:
        """Extract plain text from HTML for descriptions"""
        # Simple HTML tag removal
        clean = re.sub('<.*?>', '', html)
        return clean.strip()
    
    def add_to_block(self, block_id: str, question_ids: List[str]):
        """Add questions to a specific block"""
        # Find block in survey elements
        for element in self.survey_data.get("SurveyElements", []):
            if element.get("Element") == "BL":
                for block in element.get("Payload", []):
                    if block.get("ID") == block_id:
                        if "BlockElements" not in block:
                            block["BlockElements"] = []
                        for qid in question_ids:
                            block["BlockElements"].append({
                                "Type": "Question",
                                "QuestionID": qid
                            })
                        return True
        return False
    
    def create_new_block(self, name: str, description: str = "") -> str:
        """Create a new block for organizing questions"""
        block_id = f"BL_{self._generate_id()}"
        
        new_block = {
            "Type": "Standard",
            "SubType": "",
            "Description": description or name,
            "ID": block_id,
            "BlockElements": []
        }
        
        # Find blocks element and add new block
        for element in self.survey_data.get("SurveyElements", []):
            if element.get("Element") == "BL":
                element["Payload"].append(new_block)
                break
        
        return block_id
    
    def update_question_count(self):
        """Update the question count element"""
        question_count = len([elem for elem in self.survey_data.get("SurveyElements", []) 
                             if elem.get("Element") == "SQ"])
        
        for element in self.survey_data.get("SurveyElements", []):
            if element.get("Element") == "QC":
                element["SecondaryAttribute"] = str(question_count)
                break
    
    def save_qsf(self, file_path: str, pretty_print: bool = True):
        """Save QSF file"""
        self.update_question_count()
        
        with open(file_path, 'w', encoding='utf-8') as f:
            if pretty_print:
                json.dump(self.survey_data, f, indent=2, ensure_ascii=False)
            else:
                json.dump(self.survey_data, f, ensure_ascii=False)
    
    def format_qsf_file(self, input_path: str, output_path: str):
        """Format an existing QSF file for better readability"""
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


# Example usage and helper functions
def create_chart_evaluation_survey(prompts_and_plans: List[Dict], output_file: str):
    """Create a complete survey for evaluating chart plans"""
    
    builder = QSFBuilder()
    
    # Update survey info
    builder.survey_data["SurveyEntry"]["SurveyName"] = "Chart Plan Evaluation"
    builder.survey_data["SurveyEntry"]["SurveyDescription"] = "Evaluating AI-generated chart plans for vague prompts"
    
    # Create consent form (if needed)
    consent_html = """<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 24px auto; line-height: 1.6;">
  <div style="background:#f9fbfd; border:1px solid #d0d7de; border-radius:12px; padding:20px; margin-bottom:20px;">
    <h1 style="color:#0b6fa4; margin:0 0 8px;">Consent Form</h1>
    <p>Please provide your consent to participate in this study.</p>
  </div>
</div>"""
    
    consent_qid = builder.create_multiple_choice_question(
        consent_html,
        ["I consent", "I do not consent"],
        data_export_tag="consent"
    )
    
    # Create instructions
    instructions_html = """<div style="font-family: Arial, sans-serif; margin: 24px auto; line-height: 1.6;">
  <div style="background:#e8f4fd; border:1px solid #b6d4fe; border-radius:12px; padding:24px; margin-bottom:24px;">
    <h2 style="color:#0b6fa4; margin:0 0 12px; font-size:22px;">Instructions</h2>
    <p>Please evaluate the AI-generated chart plans for each vague prompt.</p>
  </div>
</div>"""
    
    instructions_qid = builder.create_display_question(instructions_html, "instructions")
    
    # Create evaluation questions for each prompt
    evaluation_qids = []
    for i, item in enumerate(prompts_and_plans, 1):
        eval_qid, feedback_qid = builder.create_chart_evaluation_pair(
            item["prompt"],
            item["plans"],
            base_tag=f"A-{i}"
        )
        evaluation_qids.extend([eval_qid, feedback_qid])
    
    # Save the survey
    builder.save_qsf(output_file)
    print(f"Survey saved to {output_file}")
    print(f"Created {len(evaluation_qids)} evaluation questions")

if __name__ == "__main__":
    # Example: Format existing QSF file
    builder = QSFBuilder()
    
    # Load and format the existing file
    input_file = "/Users/h2o/Documents/Projects/Research/Visplora/data/NS-System-Evaluation.qsf"
    output_file = "/Users/h2o/Documents/Projects/Research/Visplora/data/NS-System-Evaluation-formatted.qsf"
    
    builder.format_qsf_file(input_file, output_file)
    print(f"Formatted QSF saved to {output_file}")