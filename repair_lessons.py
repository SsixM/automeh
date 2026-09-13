"""Repair lesson metadata in lessons.js without regenerating lesson content.

The source file is JavaScript, so Node evaluates only the local literal and emits
JSON; Python then applies deterministic metadata repairs and writes valid JS back.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LESSONS_FILE = ROOT / "lessons.js"
BACKUP_FILE = ROOT / "lessons.js.bak"

# Audio filenames in the generator use the real clock time. Thursday and Friday
# have no first pair, therefore their visible schedule numbers start at 2.
PAIR_OVERRIDES = {
    "2026-09-03-info-intro": 3,
    "2026-09-03-chemistry-1": 2,
    "2026-09-04-history-3": 4,
    "2026-09-09-родная-литература-входной-контроль": 3,
    "2026-09-11_history_3_1": 4,
    "2026-09-10-info-1": 3,
    "2026-09-10-biology-pair1": 2,
    "2026-09-08-p3-chemistry": 3,
    "2026-09-08-intro-specialty": 1,
    "russian-language-science-culture": 4,
    "2026-09-07-math-1": 1,
    "2026-09-09-unknown": 1,
    "2026-09-08-pair-unknown": 1,
}

# 1 September is the first academic week, but the supplied timetable marks
# 14 September as numerator and 13 September as denominator.
NUMERATOR_WEEK_MONDAY = dt.date(2026, 9, 14)

SUBJECT_OVERRIDES = {
    "2026-09-10-info-1": "Информатика",
    "2026-09-10-biology-pair1": "Биология",
    "2026-09-08-p3-chemistry": "Химия",
    "2026-09-08-intro-specialty": "Введение в специальность",
    "russian-language-science-culture": "Русский язык",
    "2026-09-07-math-1": "Математика",
    "2026-09-09-unknown": "Русский язык",
    "2026-09-08-pair-unknown": "Введение в специальность",
}

def week_type(value: str) -> str:
    date = dt.date.fromisoformat(value[:10])
    monday = date - dt.timedelta(days=date.weekday())
    weeks = (monday - NUMERATOR_WEEK_MONDAY).days // 7
    return "numerator" if weeks % 2 == 0 else "denominator"


def load_lessons() -> list[dict]:
    node_script = (
        "const fs=require('fs'),vm=require('vm');"
        "const c={};vm.createContext(c);"
        f"vm.runInContext(fs.readFileSync({json.dumps(str(LESSONS_FILE))},'utf8')+';globalThis.out=lessons',c);"
        "process.stdout.write(JSON.stringify(c.out));"
    )
    result = subprocess.run(["node", "-e", node_script], cwd=ROOT, check=True, capture_output=True, text=True)
    data = json.loads(result.stdout)
    if not isinstance(data, list):
        raise ValueError("lessons.js does not contain an array")
    return data


def normalize_quiz(lesson: dict) -> None:
    valid = []
    for question in lesson.get("quiz", []) or []:
        if not isinstance(question, dict):
            continue
        options = question.get("options")
        correct = question.get("correct")
        if not isinstance(options, list) or len(options) < 2:
            continue
        if not isinstance(correct, int) or not 0 <= correct < len(options):
            continue
        if not str(question.get("question", "")).strip():
            continue
        valid.append({
            "question": str(question["question"]),
            "options": [str(option) for option in options],
            "correct": correct,
            "explanation": str(question.get("explanation", "")),
        })
    lesson["quiz"] = valid


def repair(lessons: list[dict]) -> tuple[list[dict], list[str]]:
    changes: list[str] = []
    for lesson in lessons:
        date = str(lesson.get("date", ""))[:10]
        parsed = dt.date.fromisoformat(date)
        expected_day = parsed.weekday()
        if lesson.get("dayIndex") != expected_day:
            changes.append(f"{lesson.get('id')}: dayIndex {lesson.get('dayIndex')} -> {expected_day}")
            lesson["dayIndex"] = expected_day

        lesson_id = str(lesson.get("id", ""))
        if lesson_id in PAIR_OVERRIDES and lesson.get("pairNumber") != PAIR_OVERRIDES[lesson_id]:
            changes.append(f"{lesson_id}: pairNumber {lesson.get('pairNumber')} -> {PAIR_OVERRIDES[lesson_id]}")
            lesson["pairNumber"] = PAIR_OVERRIDES[lesson_id]

        if lesson_id in SUBJECT_OVERRIDES and lesson.get("subject") != SUBJECT_OVERRIDES[lesson_id]:
            changes.append(f"{lesson_id}: subject {lesson.get('subject')} -> {SUBJECT_OVERRIDES[lesson_id]}")
            lesson["subject"] = SUBJECT_OVERRIDES[lesson_id]

        new_week_type = week_type(date)
        if lesson.get("weekType") != new_week_type:
            changes.append(f"{lesson_id}: weekType -> {new_week_type}")
            lesson["weekType"] = new_week_type
        normalize_quiz(lesson)
    return lessons, changes


def write_lessons(lessons: list[dict]) -> None:
    shutil.copy2(LESSONS_FILE, BACKUP_FILE)
    payload = "const lessons = " + json.dumps(lessons, ensure_ascii=False, indent=4) + ";\n"
    LESSONS_FILE.write_text(payload, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate and report without writing")
    args = parser.parse_args()
    lessons = load_lessons()
    repaired, changes = repair(lessons)
    for change in changes:
        print(change)
    print(f"Проверено уроков: {len(repaired)}; изменений: {len(changes)}")
    if not args.check:
        write_lessons(repaired)
        print(f"Записано: {LESSONS_FILE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
