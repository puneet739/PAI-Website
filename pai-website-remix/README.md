# PAI – Paragliding Association of India

Official website for the Paragliding Association of India, built with React Router and Tailwind CSS.

## Project Owner & Creator

**Created and maintained by [Puneet Behl](https://github.com/puneet739)**

This is an open-source community project for the Paragliding Association of India. See [CONTRIBUTORS.md](../CONTRIBUTORS.md) for the full list of contributors.

## License & Usage

This project is licensed under the Apache License 2.0 - see the [LICENSE](../LICENSE) file for details.

### Commercial Use Notice

This project is open source for educational and non-commercial purposes. **For commercial use, explicit permission must be obtained from the project owner, Puneet Behl.**

### Attribution Requirement

When using or modifying this project, you must:
- Maintain visible attribution to **Puneet Behl** as the original project creator
- Keep the contributor acknowledgment visible on all pages
- Include a link to the original repository

For questions about licensing or commercial use, please contact: puneet739@gmail.com

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 🗄️ MySQL 8.0 database with Docker
- 🔐 Complete authentication system (login, sessions, dashboard)
- 👤 User dashboard with member statistics
- 🐳 Full Docker & Docker Compose support
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

#### Quick Start with Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at `http://localhost:3000`

#### Using Docker Commands

```bash
# Build the image
docker build -t pai-website .

# Run the container
docker run -d -p 3000:3000 --name pai-website pai-website

# View logs
docker logs -f pai-website

# Stop and remove
docker stop pai-website && docker rm pai-website
```

📖 For detailed Docker instructions, see [DOCKER.md](./DOCKER.md)

📖 For database documentation, see [DATABASE.md](./DATABASE.md)

📖 For authentication system documentation, see [AUTH.md](./AUTH.md)

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
