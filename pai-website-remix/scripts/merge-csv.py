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
        End date string (start_date + 365 days) in YYYY-MM-DD format or empty string
    """
    # Try multiple date formats
    date_formats = [
        '%Y-%m-%d',
        '%m-%d-%Y',
        '%d-%m-%Y',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%Y/%m/%d',
        '%d/%m/%Y %H:%M:%S',
        '%d/%m/%Y %H:%M',
        '%Y-%m-%d %H:%M:%S'
    ]
    
    start_date = parse_date(start_date_str, date_formats)
    if start_date:
        end_date = start_date + timedelta(days=365)
        return format_date(end_date)  # Returns YYYY-MM-DD format
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


def normalize_date(date_str: str) -> str:
    """
    Normalize date to YYYY-MM-DD format.
    
    Args:
        date_str: Date string in various formats
        
    Returns:
        Date string in YYYY-MM-DD format or empty string
    """
    date_formats = [
        '%Y-%m-%d',
        '%m-%d-%Y',
        '%d-%m-%Y',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%Y/%m/%d',
        '%d/%m/%Y %H:%M:%S',
        '%d/%m/%Y %H:%M',
        '%Y-%m-%d %H:%M:%S'
    ]
    
    date_obj = parse_date(date_str, date_formats)
    return format_date(date_obj) if date_obj else ''


def normalize_insurance_amount(amount_str: str) -> str:
    """
    Normalize insurance amount to full number (remove text like 'L', 'Lakh', etc.).
    
    Args:
        amount_str: Amount string (e.g., '5L', '500000', '5 Lakh', '5 Lacs')
        
    Returns:
        Numeric amount as string or empty string
    """
    if not amount_str or amount_str.strip() == '':
        return ''
    
    amount_str = amount_str.strip().upper()
    
    # Remove common text patterns (order matters - longer patterns first)
    amount_str = amount_str.replace('LAKHS', '').replace('LAKH', '')
    amount_str = amount_str.replace('LACS', '').replace('LAC', '')
    amount_str = amount_str.replace('CRORES', '').replace('CRORE', '').replace('CR', '')
    amount_str = amount_str.replace('THOUSANDS', '').replace('THOUSAND', '').replace('K', '')
    amount_str = amount_str.replace('L', '').replace(',', '').strip()
    
    # Try to convert to float and back to remove decimals if whole number
    try:
        amount = float(amount_str)
        # If it's a small number (< 1000), it might be in lakhs
        if amount < 1000 and amount > 0:
            amount = amount * 100000  # Convert lakhs to full number
        return str(int(amount)) if amount == int(amount) else str(amount)
    except ValueError:
        return ''


def generate_membership_id(member_id: str, email: str) -> str:
    """
    Generate membership ID from member_id or email.
    
    Args:
        member_id: Original member ID from CSV
        email: Email address as fallback
        
    Returns:
        Membership ID string
    """
    if member_id and member_id.strip():
        return member_id.strip()
    # Generate from email if no member_id
    if email:
        return f"PAI-{email.split('@')[0].upper()[:10]}"
    return ''


def normalize_insurance_policy_type(policy_type: str) -> str:
    """
    Normalize insurance policy type.
    
    Args:
        policy_type: Original policy type string
        
    Returns:
        Normalized policy type ('comprehensive', 'basic', or original value)
    """
    if not policy_type or policy_type.strip() == '':
        return ''
    
    policy_type_lower = policy_type.strip().lower()
    
    # Check for tandem pilot -> comprehensive
    if 'tandem' in policy_type_lower and 'pilot' in policy_type_lower:
        return 'comprehensive'
    
    # Check for hobby pilot -> basic
    if 'hobby' in policy_type_lower and 'pilot' in policy_type_lower:
        return 'basic'
    
    # Return original value if no match
    return policy_type.strip()


def normalize_membership_type(membership_type: str) -> str:
    """
    Normalize membership type.
    
    Args:
        membership_type: Original membership type string
        
    Returns:
        Normalized membership type ('life' or 'basic')
    """
    if not membership_type or membership_type.strip() == '':
        return 'basic'
    
    membership_type_lower = membership_type.strip().lower()
    
    # Check for life membership
    if membership_type_lower == 'life':
        return 'life'
    
    # Everything else is basic
    return 'basic'


def normalize_membership_status(membership_status: str) -> str:
    """
    Normalize membership status.
    
    Args:
        membership_status: Original membership status string
        
    Returns:
        Normalized membership status ('active' or 'inactive')
    """
    if not membership_status or membership_status.strip() == '':
        return 'inactive'
    
    membership_status_lower = membership_status.strip().lower()
    
    # Check for active status
    if membership_status_lower == 'active':
        return 'active'
    
    # Everything else is inactive
    return 'inactive'


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
        
        # Normalize all date fields to YYYY-MM-DD format
        active_until = normalize_date(member.get('subscription_ends', ''))
        member_since = normalize_date(member.get('user_registered', ''))
        insurance_start = normalize_date(insurance.get('Covearge Start date ', ''))
        insurance_end = calculate_end_date(insurance.get('Covearge Start date ', '')) if insurance.get('Covearge Start date ', '').strip() else ''
        
        # Normalize insurance coverage amount (remove text like 'L', 'Lakh')
        coverage_amount = normalize_insurance_amount(insurance.get('Sum insured Opted', ''))
        premium_amount = normalize_insurance_amount(insurance.get('premuim  Inc. GST', ''))
        
        # Normalize insurance policy type (tandem pilot -> comprehensive, hobby pilot -> basic)
        policy_type = normalize_insurance_policy_type(insurance.get('Profile details of the Members ', ''))
        
        # Normalize membership type (Life -> life, everything else -> basic)
        membership_type = normalize_membership_type(member.get('membership_level', ''))
        
        # Normalize membership status (active -> active, everything else -> inactive)
        membership_status = normalize_membership_status(member.get('account_state', ''))
        
        # Generate membership ID
        membership_id = generate_membership_id(member.get('membership_number', ''), email)
        
        # Get name, use email username if name is empty
        name = member.get('display_name', '').strip()
        if not name:
            # Extract username from email (part before @)
            name = email.split('@')[0] if email else ''
        
        # Create merged record with exact header sequence
        merged_record = {
            'membership_id': membership_id,
            'name': name,
            'email': email,
            'phone': '',  # No mapping provided
            'active_until': active_until,
            'member_since': member_since,
            'current_rating': member.get('rating_level_1', '').strip(),
            'membership_type': membership_type,
            'membership_status': membership_status,
            'total_flights': '',  # No mapping provided
            'total_flight_hours': '',  # No mapping provided
            'insurance_policy_number': insurance.get('Company Employee Number', '').strip(),
            'insurance_policy_type': policy_type,
            'insurance_coverage_amount': coverage_amount,
            'insurance_premium_amount': premium_amount,
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
        'membership_id',
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
