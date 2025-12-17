#!/usr/bin/env python3
"""
CSV Merger Script
Merges two CSV files based on email column and generates a consolidated output.

Usage:
    python merge-csv.py <members_csv> <insurance_csv> <output_csv>

Example:
    python merge-csv.py members.csv insurance.csv merged_output.csv
"""

import csv
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional


def parse_date(date_str: str, formats: List[str]) -> Optional[datetime]:
    """
    Try to parse a date string using multiple formats.
    
    Args:
        date_str: The date string to parse
        formats: List of date format strings to try
        
    Returns:
        datetime object if successful, None otherwise
    """
    if not date_str or date_str.strip() == '':
        return None
    
    date_str = date_str.strip()
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None


def format_date(date_obj: Optional[datetime], output_format: str = '%Y-%m-%d') -> str:
    """
    Format a datetime object to string.
    
    Args:
        date_obj: datetime object to format
        output_format: desired output format
        
    Returns:
        Formatted date string or empty string if date_obj is None
    """
    if date_obj is None:
        return ''
    return date_obj.strftime(output_format)


def calculate_end_date(start_date_str: str) -> str:
    """
    Calculate end date by adding 365 days to start date.
    
    Args:
        start_date_str: Start date string
        
    Returns:
        End date string (start_date + 365 days) or empty string
    """
    # Try multiple date formats
    date_formats = [
        '%Y-%m-%d',
        '%m-%d-%Y',
        '%d-%m-%Y',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%Y/%m/%d'
    ]
    
    start_date = parse_date(start_date_str, date_formats)
    if start_date:
        end_date = start_date + timedelta(days=365)
        return format_date(end_date)
    return ''


def normalize_email(email: str) -> str:
    """
    Normalize email for comparison (lowercase, strip whitespace).
    
    Args:
        email: Email string to normalize
        
    Returns:
        Normalized email string
    """
    if not email:
        return ''
    return email.strip().lower()


def read_members_csv(filepath: str) -> Dict[str, Dict[str, str]]:
    """
    Read the members CSV file and create a dictionary keyed by email.
    
    Args:
        filepath: Path to the members CSV file
        
    Returns:
        Dictionary with normalized email as key and row data as value
    """
    members_data = {}
    
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                email = normalize_email(row.get('user_email', ''))
                if email:
                    members_data[email] = row
        
        print(f"✓ Loaded {len(members_data)} records from members CSV")
        return members_data
    
    except FileNotFoundError:
        print(f"✗ Error: Members CSV file not found: {filepath}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error reading members CSV: {e}")
        sys.exit(1)


def read_insurance_csv(filepath: str) -> Dict[str, Dict[str, str]]:
    """
    Read the insurance CSV file and create a dictionary keyed by email.
    
    Args:
        filepath: Path to the insurance CSV file
        
    Returns:
        Dictionary with normalized email as key and row data as value
    """
    insurance_data = {}
    
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                email = normalize_email(row.get('Email ID', ''))
                if email:
                    insurance_data[email] = row
        
        print(f"✓ Loaded {len(insurance_data)} records from insurance CSV")
        return insurance_data
    
    except FileNotFoundError:
        print(f"✗ Error: Insurance CSV file not found: {filepath}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error reading insurance CSV: {e}")
        sys.exit(1)


def merge_data(members_data: Dict[str, Dict[str, str]], 
               insurance_data: Dict[str, Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Merge members and insurance data based on email.
    
    Args:
        members_data: Dictionary of member records keyed by email
        insurance_data: Dictionary of insurance records keyed by email
        
    Returns:
        List of merged records
    """
    merged_records = []
    
    # Get all unique emails from both datasets
    all_emails = set(members_data.keys()) | set(insurance_data.keys())
    
    for email in all_emails:
        member = members_data.get(email, {})
        insurance = insurance_data.get(email, {})
        
        # Calculate insurance end date
        insurance_start = insurance.get('Covearge Start date ', '').strip()
        insurance_end = calculate_end_date(insurance_start) if insurance_start else ''
        
        # Create merged record with exact header sequence
        merged_record = {
            'name': member.get('display_name', '').strip(),
            'email': email,
            'phone': '',  # No mapping provided
            'active_until': member.get('subscription_ends', '').strip(),
            'member_since': member.get('user_registered', '').strip(),
            'current_rating': member.get('rating_level_1', '').strip(),
            'membership_type': member.get('membership_level', '').strip(),
            'membership_status': member.get('account_state', '').strip(),
            'total_flights': '',  # No mapping provided
            'total_flight_hours': '',  # No mapping provided
            'insurance_policy_number': insurance.get('Company Employee Number', '').strip(),
            'insurance_policy_type': insurance.get('Profile details of the Members ', '').strip(),
            'insurance_coverage_amount': insurance.get('Sum insured Opted', '').strip(),
            'insurance_premium_amount': insurance.get('premuim  Inc. GST', '').strip(),
            'insurance_start_date': insurance_start,
            'insurance_end_date': insurance_end,
            'insurance_status': 'Active' if insurance_start else ''
        }
        
        merged_records.append(merged_record)
    
    print(f"✓ Merged {len(merged_records)} total records")
    return merged_records


def write_output_csv(filepath: str, records: List[Dict[str, str]]):
    """
    Write merged records to output CSV file.
    
    Args:
        filepath: Path to the output CSV file
        records: List of merged records to write
    """
    # Define headers in exact sequence as specified
    headers = [
        'name',
        'email',
        'phone',
        'active_until',
        'member_since',
        'current_rating',
        'membership_type',
        'membership_status',
        'total_flights',
        'total_flight_hours',
        'insurance_policy_number',
        'insurance_policy_type',
        'insurance_coverage_amount',
        'insurance_premium_amount',
        'insurance_start_date',
        'insurance_end_date',
        'insurance_status'
    ]
    
    try:
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(records)
        
        print(f"✓ Successfully wrote {len(records)} records to {filepath}")
    
    except Exception as e:
        print(f"✗ Error writing output CSV: {e}")
        sys.exit(1)


def main():
    """Main function to orchestrate the CSV merge process."""
    
    # Check command line arguments
    if len(sys.argv) != 4:
        print("Usage: python merge-csv.py <members_csv> <insurance_csv> <output_csv>")
        print("\nExample:")
        print("  python merge-csv.py members.csv insurance.csv merged_output.csv")
        sys.exit(1)
    
    members_csv = sys.argv[1]
    insurance_csv = sys.argv[2]
    output_csv = sys.argv[3]
    
    print("=" * 60)
    print("CSV Merger Script")
    print("=" * 60)
    print(f"Members CSV:    {members_csv}")
    print(f"Insurance CSV:  {insurance_csv}")
    print(f"Output CSV:     {output_csv}")
    print("=" * 60)
    print()
    
    # Read input files
    print("Reading input files...")
    members_data = read_members_csv(members_csv)
    insurance_data = read_insurance_csv(insurance_csv)
    print()
    
    # Merge data
    print("Merging data...")
    merged_records = merge_data(members_data, insurance_data)
    print()
    
    # Write output
    print("Writing output file...")
    write_output_csv(output_csv, merged_records)
    print()
    
    print("=" * 60)
    print("✓ Merge completed successfully!")
    print("=" * 60)


if __name__ == '__main__':
    main()
