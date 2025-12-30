# CSV to SQL Converter Script

## Purpose
Converts CSV files containing test questions into SQL INSERT statements for the `test_questions` table.

## CSV Format
Your CSV file must have the following columns (in any order):
- `Question` - The question text
- `Answer` - The correct answer (A, B, C, or D)
- `Option A` - First option text
- `Option B` - Second option text
- `Option C` - Third option text
- `Option D` - Fourth option text
- `test_level` - The test level (e.g., 'beginner', 'intermediate', 'advanced')

### Example CSV
```csv
Question,Answer,Option A,Option B,Option C,Option D,test_level
What is the minimum age for paragliding?,C,16 years,17 years,18 years,21 years,beginner
What does APPI stand for?,A,Association of Paragliding Pilots and Instructors,Advanced Pilot Program International,Air Pilots Professional Institute,None of the above,beginner
```

## Usage

### Basic usage (output to console):
```bash
python3 scripts/csv_to_sql.py your_questions.csv
```

### Save to SQL file:
```bash
python3 scripts/csv_to_sql.py your_questions.csv -o output.sql
```

### Make script executable:
```bash
chmod +x scripts/csv_to_sql.py
./scripts/csv_to_sql.py your_questions.csv -o output.sql
```

## Features
- Automatically escapes single quotes in text
- Validates CSV column headers
- Provides helpful error messages
- Can output to file or stdout
- Handles UTF-8 encoding

## Example Output
```sql
INSERT INTO test_questions (test_level, question, option_a, option_b, option_c, option_d, correct_answer) VALUES ('beginner', 'What is the minimum age for paragliding?', '16 years', '17 years', '18 years', '21 years', 'C');
INSERT INTO test_questions (test_level, question, option_a, option_b, option_c, option_d, correct_answer) VALUES ('beginner', 'What does APPI stand for?', 'Association of Paragliding Pilots and Instructors', 'Advanced Pilot Program International', 'Air Pilots Professional Institute', 'None of the above', 'A');
```
