# GoSync - Online Bus Ticket Booking System

![GoSync Logo](Frontend/public/assets/GoSync-Logo_Length2.png)

## Overview

GoSync is a comprehensive online bus ticket booking system designed to streamline the process of booking and managing bus trips. It offers an intuitive interface for passengers to book tickets, and a robust admin panel for managing routes, buses, schedules, and more.

## Features

### User Management

- User registration and authentication system
- User profiles with personal information management
- Profile picture upload functionality
- Security log tracking for user activities
- Custom notification preferences (Email, SMS, Push)

### Booking Management

- Real-time seat reservation system
- Interactive seat selection
- QR code generation for tickets
- Booking confirmation emails
- Payment status tracking
- Cancellation functionality with automated refund calculation
- Booking history for users

### Route & Stop Management

- Create and manage bus routes
- Add, edit, and delete bus stops
- Set stop types (boarding/dropping)
- Route analytics with usage statistics
- Interactive maps for routes visualization

### Bus Management

- Bus fleet management
- Bus operator assignments
- Bus maintenance scheduling
- Capacity and fare configuration
- Bus analytics with utilization metrics

### Schedule Management

- Create and manage bus schedules
- Availability checking
- Real-time schedule updates
- Schedule analytics

### Notification System

- Email notifications for bookings, cancellations, etc.
- SMS notifications for important updates
- Scheduled notifications for future events
- Travel disruption alerts

### Admin Dashboard

- Comprehensive analytics dashboard
- Revenue tracking and reporting
- Booking statistics and trends
- Export functionality (PDF, Excel, CSV)
- System health monitoring

### Reporting

- Advanced report generation
- Multiple export formats (PDF, Excel, CSV)
- Customizable filters and parameters
- Visual data representation with charts and graphs

## Technologies Used

### Frontend

- **React**: JavaScript library for building user interfaces
- **Vite**: Modern frontend build tool
- **React Router**: For application routing
- **TailwindCSS**: Utility-first CSS framework
- **Material UI**: React component library
- **Chart.js**: JavaScript charting library
- **Socket.io Client**: Real-time bidirectional communication
- **Zustand**: State management
- **Axios**: HTTP client
- **Framer Motion**: Animation library
- **React-Toastify**: Toast notifications
- **jsPDF & xlsx**: Document generation

### Backend

- **Node.js**: JavaScript runtime
- **Express**: Web framework for Node.js
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Socket.io**: Real-time communication
- **JWT**: User authentication
- **Bcrypt**: Password hashing
- **Nodemailer**: Email sending capability
- **Multer**: File upload handling
- **QRCode**: Ticket QR code generation
- **Winston**: Logging library

### DevOps & Deployment

- **Docker**: Containerization
- **Docker Compose**: Multi-container Docker applications
- **GitHub Actions**: CI/CD pipeline
- **Nginx**: Web server for serving frontend assets

## Docker Configuration

The project uses Docker for containerization, making deployment simple and consistent across different environments.

### Docker Compose Setup

The application is split into two main services:

1. **Backend Service**:

   - Built from `./Backend/Dockerfile`
   - Runs on port 5000
   - Environment variables configured for production
   - Volume mounts for persistent data (uploads and logs)
   - Health check to ensure availability

2. **Frontend Service**:
   - Built from `./Frontend/Dockerfile`
   - Served on port 80 using Nginx
   - Configured to communicate with the backend
   - Depends on backend service

### Network Configuration

Both services are on a dedicated network to ensure secure communication:

```yaml
networks:
  gosync-network:
    driver: bridge
```

### Environment Configuration

The application uses environment variables for configuration, with fallbacks for development:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT tokens
- `EMAIL_USER` and `EMAIL_PASS`: For email notifications
- `TWILIO` settings: For SMS functionality
- `CLIENT_URL`: Frontend URL for CORS

## CI/CD Pipeline

The project includes a GitHub Actions workflow for continuous integration and deployment:

1. **Build Job**:

   - Sets up Node.js environment
   - Installs dependencies for both frontend and backend
   - Builds Docker images to verify integrity

2. **Deploy Job**:
   - Triggered only on push to production branch
   - Uses Docker Buildx for efficient builds
   - Builds and pushes Docker images to Docker Hub
   - Deploys to production server via SSH

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- Docker and Docker Compose
- MongoDB instance

### Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/gosync.git
   cd gosync
   ```

2. Create environment files:

   ```bash
   # Backend/.env
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password

   # Frontend/.env
   VITE_API_URL=http://localhost:5000
   ```

3. Install dependencies:

   ```bash
   # Install Backend dependencies
   cd Backend
   npm install

   # Install Frontend dependencies
   cd ../Frontend
   npm install
   ```

4. Start development servers:

   ```bash
   # Start Backend
   cd Backend
   npm run dev

   # Start Frontend (in another terminal)
   cd Frontend
   npm run dev
   ```

### Docker Deployment

1. Build and start containers:

   ```bash
   docker-compose up -d
   ```

2. Stop containers:
   ```bash
   docker-compose down
   ```

## License

[MIT License](LICENSE)

## Contact

For any inquiries, please contact support@gosync.com
