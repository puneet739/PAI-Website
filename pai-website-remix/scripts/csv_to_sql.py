#!/usr/bin/env python3
"""
Script to convert CSV file with test questions to SQL INSERT statements.
CSV Format: Question,Answer,Option A,Option B,Option C,Option D,test_level
"""

import csv
import sys
import argparse


def escape_sql_string(value):
    """Escape single quotes in SQL strings."""
    if value is None:
        return 'NULL'
    # Replace single quotes with two single quotes for SQL escaping
    return value.replace("'", "''")


def generate_sql_values(row):
    """Generate SQL VALUES clause from CSV row."""
    question = escape_sql_string(row['Question'].strip())
    option_a = escape_sql_string(row['Option A'].strip())
    option_b = escape_sql_string(row['Option B'].strip())
    option_c = escape_sql_string(row['Option C'].strip())
    option_d = escape_sql_string(row['Option D'].strip())
    correct_answer = escape_sql_string(row['Answer'].strip().upper())
    test_level = escape_sql_string(row['test_level'].strip())
    
    values = f"('{test_level}', '{question}', '{option_a}', '{option_b}', '{option_c}', '{option_d}', '{correct_answer}')"
    
    return values


def main():
    parser = argparse.ArgumentParser(
        description='Convert CSV file with test questions to SQL INSERT statements'
    )
    parser.add_argument('csv_file', help='Path to the CSV file')
    parser.add_argument('-o', '--output', help='Output SQL file (default: stdout)')
    
    args = parser.parse_args()
    
    try:
        with open(args.csv_file, 'r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Verify required columns
            required_columns = ['Question', 'Answer', 'Option A', 'Option B', 
                              'Option C', 'Option D', 'test_level']
            if not all(col in reader.fieldnames for col in required_columns):
                print(f"Error: CSV file must contain columns: {', '.join(required_columns)}", 
                      file=sys.stderr)
                print(f"Found columns: {', '.join(reader.fieldnames)}", file=sys.stderr)
                sys.exit(1)
            
            value_clauses = []
            for idx, row in enumerate(reader, start=1):
                try:
                    values = generate_sql_values(row)
                    value_clauses.append(values)
                except KeyError as e:
                    print(f"Error processing row {idx}: Missing column {e}", 
                          file=sys.stderr)
                    sys.exit(1)
            
            # Generate single INSERT statement with multiple VALUES
            if value_clauses:
                output_content = "INSERT INTO test_questions (test_level, question, option_a, option_b, option_c, option_d, correct_answer) VALUES\n"
                output_content += ',\n'.join(value_clauses) + ';'
            else:
                output_content = "-- No data to insert"
            
            if args.output:
                with open(args.output, 'w', encoding='utf-8') as outfile:
                    outfile.write(output_content)
                print(f"Successfully generated SQL INSERT statement with {len(value_clauses)} rows")
                print(f"Output written to: {args.output}")
            else:
                print(output_content)
                print(f"\n-- Generated SQL INSERT statement with {len(value_clauses)} rows", 
                      file=sys.stderr)
    
    except FileNotFoundError:
        print(f"Error: File '{args.csv_file}' not found", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
