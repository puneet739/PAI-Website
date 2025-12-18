# Quick Start Guide - PAI Website

## 🚀 Getting Started in 3 Steps

### Step 1: Start the Application

```bash
# Start both the app and MySQL database
docker compose up -d

# Wait for services to be healthy (about 30 seconds)
docker compose ps
```

### Step 2: Access the Website

Open your browser and visit:
- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/login

### Step 3: Test Authentication

Click the **"Login"** button in the header, then use any demo account:

```
Email: pilot@example.com
Password: password123
```

You'll be redirected to your dashboard showing:
- Member since date
- Current pilot rating
- Total flights and hours
- Upcoming events

## 📋 Demo Accounts

| Email | Password | Type | Rating | Use Case |
|-------|----------|------|--------|----------|
| admin@pgaoi.org | password123 | Instructor | Instructor | Admin/instructor view |
| pilot@example.com | password123 | Premium | P4 | Experienced pilot |
| beginner@example.com | password123 | Basic | P2 | New member |

## 🔄 Common Commands

### View Logs
```bash
# All services
docker compose logs -f

# Just the app
docker compose logs -f pai-website

# Just the database
docker compose logs -f mysql
```

### Stop Services
```bash
# Stop (keeps data)
docker compose down

# Stop and delete all data
docker compose down -v
```

### Restart Services
```bash
docker compose restart
```

### Access MySQL Database
```bash
docker exec -it pai-mysql mysql -u pai_user -ppai_password pai_db
```

## 🗺️ Site Map

### Public Pages
- `/` - Homepage with PAI information
- `/login` - Login page

### Protected Pages (Requires Login)
- `/dashboard` - User dashboard with member info and stats

### Actions
- `/logout` - Logout (POST only)

## 🎯 Key Features

### Homepage
- Sticky navigation header
- Hero section with CTAs
- About PAI section
- Popular flying sites (Bir Billing, Kamshet, Nandi Hills, Yelagiri)
- Training & certification info
- Safety guidelines
- Events section
- Membership information
- Contact section
- **Login button** in header

### Login Page
- Email/password form
- Error handling
- Demo account information
- Redirects to dashboard on success

### Dashboard
- Welcome message with user name
- 4 stat cards:
  - Member since date
  - Current pilot rating
  - Total flights
  - Total flight hours
- Member information table
- Upcoming events list
- Logout button

## 🔧 Troubleshooting

### Port Already in Use
If port 3000 or 3306 is already in use:

```bash
# Check what's using the port
lsof -i :3000
lsof -i :3306

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Check if MySQL is healthy
docker compose ps

# View MySQL logs
docker compose logs mysql

# Restart MySQL
docker compose restart mysql
```

### Login Not Working
1. Verify database is running: `docker compose ps`
2. Check if demo users exist:
   ```bash
   docker exec -it pai-mysql mysql -u pai_user -ppai_password pai_db -e "SELECT email, name FROM members;"
   ```
3. Clear browser cookies and try again

### Changes Not Reflecting
```bash
# Rebuild the app container
docker compose up -d --build pai-website

# Or restart everything
docker compose down && docker compose up -d --build
```

## 📚 Documentation

- **[README.md](./README.md)** - Project overview and setup
- **[AUTH.md](./AUTH.md)** - Authentication system details
- **[DATABASE.md](./DATABASE.md)** - Database schema and queries
- **[DOCKER.md](./DOCKER.md)** - Docker deployment guide

## 🎨 Customization

### Change Demo Passwords
1. Generate new hash:
   ```bash
   node scripts/generate-hash.js
   ```
2. Update `mysql-init/01-init.sql` with new hash
3. Rebuild: `docker compose down -v && docker compose up -d`

### Add New Routes
1. Create route file in `app/routes/`
2. Add to `app/routes.ts`
3. Restart dev server

### Modify Dashboard
Edit `app/routes/dashboard.tsx` to customize:
- Stats displayed
- Member information shown
- Events query and display

## 🚢 Deployment

### Production Checklist
- [ ] Change all default passwords
- [ ] Set strong SESSION_SECRET
- [ ] Update database credentials
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure proper backup strategy
- [ ] Set up monitoring and logging
- [ ] Review security settings

### Environment Variables
Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Edit and set production values for:
- `DATABASE_URL`
- `SESSION_SECRET`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`

## 💡 Tips

1. **Development**: Use `npm run dev` for hot reload during development
2. **Database Reset**: Run `docker compose down -v` to start with fresh database
3. **Logs**: Always check logs if something isn't working
4. **Sessions**: Sessions last 7 days by default
5. **Security**: Never commit `.env` file to version control

## 🆘 Need Help?

Check the detailed documentation:
- Authentication issues → [AUTH.md](./AUTH.md)
- Database problems → [DATABASE.md](./DATABASE.md)
- Docker issues → [DOCKER.md](./DOCKER.md)

## 🎉 Success!

If you can:
1. ✅ Access the homepage
2. ✅ Click Login and see the login form
3. ✅ Login with demo credentials
4. ✅ See your dashboard with stats
5. ✅ Logout successfully

**Congratulations! Your PAI website is fully functional!** 🚀
