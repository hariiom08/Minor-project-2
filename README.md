# Quiz Application

An interactive quiz platform that delivers engaging, dynamic learning experiences through a modern and intuitive interface.

## Features

- Authentication (Login and Registration)
- Interactive Quiz Taking
- Quiz Categories and Subjects
- Results and Performance Analytics
- Responsive and Mobile-Friendly Design
- Blue and White themed UI with smooth animations

## Technology Stack

- **Frontend**: React.js, React Router, Context API
- **Backend**: Node.js, Express.js
- **Data Storage**: In-memory with persistence
- **Authentication**: JWT-based authentication

## Running Locally in VS Code

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- VS Code

### Setup Instructions

1. Clone the repository
   ```
   git clone [repository-url]
   cd quiz-application
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the application
   ```
   node run-local.js
   ```

This single command will:
- Start the backend API server on port 5000
- Start the React frontend on port 3000
- Open your default browser automatically to http://localhost:3000

### Alternative Methods

If you encounter any issues with the combined script, you can run the backend and frontend separately:

**Terminal 1 (Backend):**
```
node backend-only.js
```

**Terminal 2 (Frontend):**
```
cd client
npm start
```

### Test Account

You can use the following test account to log in:
- Username: `testuser`
- Password: `password`

## API Endpoints

The application provides the following API endpoints:

- `GET /api/health` - Health check endpoint
- `GET /api/categories` - Get all categories
- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `GET /api/quizzes/:id/questions` - Get questions for a specific quiz
- `POST /api/quizzes/:id/submit` - Submit quiz answers (requires auth)
- `GET /api/user/results` - Get user quiz results (requires auth)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/user` - Get current user (requires auth)

## Troubleshooting

1. **Port Conflicts**: If port 5000 is already in use, set a different port in the `.env` file or pass it as an environment variable:
   ```
   PORT=5001 node run-local.js
   ```

2. **Path-to-regexp Error**: If you see this error, make sure you're using our special scripts:
   - Use `run-local.js` or `backend-only.js` 
   - Do NOT use `server.js` directly

3. **API Connection Issues**: The React app should automatically connect to the backend at http://localhost:5000
   - Check that both servers are running
   - Check for any CORS errors in your browser console

4. **Quiz 404 Errors**: If clicking "Start Quiz" results in a 404 error:
   - Make sure you're running the latest version of the server scripts which include the `/api/quizzes/:id/questions` endpoint

## Quiz Functionality

### Taking a Quiz

1. Navigate to the Dashboard
2. Select a quiz category (Science, Math, History, or Computer Science)
3. Click "Start Quiz" on any quiz card
4. Read the instructions and click "Start Quiz"
5. Answer each question by selecting one of the multiple-choice options
6. Navigate between questions using the "Previous" and "Next" buttons
7. Submit your answers when you reach the final question

### Quiz Timer

Each quiz has a 10-minute timer. The quiz will automatically submit when time expires, so pace yourself accordingly.

### Quiz Results

After submitting a quiz, you will see your results including:

- Overall score percentage
- Number of correct answers
- Number of incorrect answers
- Time taken to complete the quiz
- Performance evaluation message

You can retry the quiz or return to the dashboard from the results page.

### Quiz Categories

1. **Science** - General science concepts including chemistry, physics, and biology
2. **Math** - Algebra, geometry, and general mathematics problems
3. **History** - World history including major events, figures, and civilizations
4. **Computer Science** - Programming concepts, data structures, and technology terms