# Parcel

Parcel is a modern music platform that connects artists with listeners. It provides a seamless experience for artists to upload, manage, and monetize their music, while offering listeners a curated space to discover and enjoy unique tracks.

## Features

- **Artist Dashboard**: Upload and manage your music tracks
- **Music Discovery**: Explore and discover new music
- **Secure Licensing**: Protect your music with our licensing system
- **Real-time Analytics**: Track your music's performance
- **User Authentication**: Secure sign-in with NextAuth.js
- **Responsive Design**: Works seamlessly across all devices

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel
- **Development**: Node.js, npm

## Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- Docker and Docker Compose
- PostgreSQL (if running locally without Docker)

## Getting Started

#### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/parcel.git
   cd parcel
   ```

2. Build the database:
   ```bash
   docker-compose up -d
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parcel?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secure-secret-here"  # Generate with `openssl rand -base64 32`
   BLOB_READ_WRITE_TOKEN="your-secure-token-here"  # From Vercel settings
   ```

5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

6. Seed the database:
   ```bash
   npm run prisma:seed
   ```
   This will create a default admin user with the email `admin@parcel.com` and password `password`.

7. Start the development server:
   ```bash
   npm run dev
   ```

7. The application will be available at `http://localhost:3000`

#### Using Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/parcel.git
   cd parcel
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parcel?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secure-secret-here"  # Generate with `openssl rand -base64 32`
   BLOB_READ_WRITE_TOKEN="your-secure-token-here"  # From Vercel settings
   ```

3. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Run database migrations:
   ```bash
   docker-compose exec app npx prisma migrate dev
   ```

5. The application will be available at `http://localhost:3000`

## Project Structure

```
parcel/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Utility functions and configurations
│   ├── prisma/          # Database schema and migrations
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── prisma/             # Prisma configuration
├── .env                # Environment variables
├── .gitignore          # Git ignore rules
├── docker-compose.yml  # Docker Compose configuration
├── Dockerfile          # Docker configuration
├── next.config.js      # Next.js configuration
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

3. Push your changes and create a pull request

4. Merge your changes into the main branch
