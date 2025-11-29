# Database Documentation

## Overview

The PAI website uses MySQL 8.0 as its database, running in a Docker container alongside the application.

## Connection Details

### From Application (Docker Network)
```
DATABASE_URL=mysql://pai_user:pai_password@mysql:3306/pai_db
```

### From Host Machine
```
Host: localhost
Port: 3306
Database: pai_db
User: pai_user
Password: pai_password
Root Password: root_password
```

## Database Schema

### Tables

#### 1. `members`
Stores PAI member information.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| email | VARCHAR(255) | Unique email address |
| name | VARCHAR(255) | Member name |
| phone | VARCHAR(20) | Contact number |
| membership_type | ENUM | basic, premium, instructor |
| membership_status | ENUM | active, inactive, pending |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

#### 2. `flying_sites`
Information about paragliding sites across India.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(255) | Site name |
| location | VARCHAR(255) | Detailed location |
| state | VARCHAR(100) | Indian state |
| description | TEXT | Site description |
| latitude | DECIMAL(10,8) | GPS latitude |
| longitude | DECIMAL(11,8) | GPS longitude |
| altitude | INT | Altitude in meters |
| difficulty_level | ENUM | beginner, intermediate, advanced |
| is_active | BOOLEAN | Site status |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

#### 3. `training_schools`
Accredited paragliding training schools.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(255) | School name |
| location | VARCHAR(255) | School location |
| contact_email | VARCHAR(255) | Contact email |
| contact_phone | VARCHAR(20) | Contact phone |
| website | VARCHAR(255) | School website |
| certification_level | VARCHAR(100) | Certification offered |
| is_accredited | BOOLEAN | PAI accreditation status |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

#### 4. `events`
PAI events, competitions, and training sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| title | VARCHAR(255) | Event title |
| description | TEXT | Event details |
| event_type | ENUM | competition, training, social, safety |
| location | VARCHAR(255) | Event location |
| start_date | DATE | Event start date |
| end_date | DATE | Event end date |
| registration_deadline | DATE | Registration cutoff |
| max_participants | INT | Maximum attendees |
| is_published | BOOLEAN | Visibility status |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

#### 5. `safety_incidents`
Safety incident reports for community learning.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| incident_date | DATE | When incident occurred |
| location | VARCHAR(255) | Incident location |
| severity | ENUM | minor, moderate, serious, fatal |
| description | TEXT | Incident details |
| lessons_learned | TEXT | Key takeaways |
| is_public | BOOLEAN | Public visibility |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

#### 6. `contact_inquiries`
Contact form submissions from website visitors.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(255) | Inquirer name |
| email | VARCHAR(255) | Contact email |
| subject | VARCHAR(255) | Inquiry subject |
| message | TEXT | Inquiry message |
| status | ENUM | new, in_progress, resolved |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Sample Data

The database is initialized with sample flying sites:
- Bir Billing, Himachal Pradesh (Advanced)
- Kamshet, Maharashtra (Beginner)
- Nandi Hills, Karnataka (Intermediate)
- Yelagiri, Tamil Nadu (Beginner)

## Common Operations

### Connect to MySQL CLI
```bash
docker exec -it pai-mysql mysql -u pai_user -ppai_password pai_db
```

### Backup Database
```bash
docker exec pai-mysql mysqldump -u root -proot_password pai_db > backup.sql
```

### Restore Database
```bash
docker exec -i pai-mysql mysql -u root -proot_password pai_db < backup.sql
```

### View All Tables
```sql
SHOW TABLES;
```

### Check Table Structure
```sql
DESCRIBE members;
```

### Sample Queries

#### Get all active flying sites
```sql
SELECT * FROM flying_sites WHERE is_active = TRUE;
```

#### Get beginner-friendly sites
```sql
SELECT name, location, state FROM flying_sites 
WHERE difficulty_level = 'beginner' AND is_active = TRUE;
```

#### Get upcoming events
```sql
SELECT * FROM events 
WHERE start_date >= CURDATE() AND is_published = TRUE
ORDER BY start_date ASC;
```

#### Get active members count
```sql
SELECT COUNT(*) as active_members FROM members 
WHERE membership_status = 'active';
```

## Database Management

### Reset Database
```bash
# Stop containers
docker-compose down

# Remove volume (deletes all data)
docker volume rm pai-website-remix_mysql-data

# Start fresh
docker-compose up -d
```

### View Logs
```bash
docker-compose logs mysql
```

### Monitor Database Size
```sql
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'pai_db'
GROUP BY table_schema;
```

## Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

**Important**: Never commit `.env` to version control. It's already in `.gitignore`.

## Security Considerations

### For Production:
1. Change all default passwords
2. Use strong, randomly generated passwords
3. Restrict MySQL port exposure (remove `ports` from docker-compose)
4. Use environment variables from secure vault
5. Enable SSL/TLS for database connections
6. Regular backups to external storage
7. Implement proper access control and user permissions

### Password Generation
```bash
# Generate secure password
openssl rand -base64 32
```

## Troubleshooting

### MySQL container won't start
```bash
# Check logs
docker-compose logs mysql

# Verify port availability
lsof -i :3306
```

### Connection refused
```bash
# Wait for health check to pass
docker-compose ps

# Check if MySQL is ready
docker exec pai-mysql mysqladmin ping -h localhost -u root -proot_password
```

### Data persistence issues
```bash
# Check volume
docker volume inspect pai-website-remix_mysql-data

# Verify mount
docker exec pai-mysql ls -la /var/lib/mysql
```

## Next Steps

To integrate the database with your React Router application:

1. Install MySQL client library:
   ```bash
   npm install mysql2
   ```

2. Create database utilities in `app/lib/db.server.ts`

3. Add database queries to route loaders and actions

4. Implement proper error handling and connection pooling

5. Add database migrations for schema changes
