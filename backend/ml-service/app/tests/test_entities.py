from app.nlp.entity_extractor import extract_entities


def test_extracts_task_deadline_priority_and_duration():
    result = extract_entities("remind me to finish my FYP report tomorrow at 9 with high priority")
    types = {entity["type"] for entity in result["entities"]}
    assert {"taskTitle", "deadline", "time", "priority"} <= types

    focus = extract_entities("start focus for 25 minutes")
    assert any(entity["type"] == "duration" and entity["value"] == 25 for entity in focus["entities"])
