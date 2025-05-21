/**
 * Local Development Runner for Quiz Application
 * 
 * This script provides a simplified way to run the Quiz Application
 * in a VS Code environment without path-to-regexp errors.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');

// Colors for terminal output
const colors = {
  server: '\x1b[36m', // Cyan
  client: '\x1b[32m', // Green
  error: '\x1b[31m',  // Red
  reset: '\x1b[0m'    // Reset
};

// Server configuration
const PORT = process.env.PORT || 5000;
const HOST = 'localhost';
const JWT_SECRET = process.env.JWT_SECRET || 'quiz-app-secret-key-dev';

// In-memory storage for development purposes
const users = [
  {
    id: "1",
    username: "testuser",
    email: "test@example.com",
    password: "$2a$10$TZUOt6gJlXxXo1xj9Pk14eCr.Kw1yHpRM0t.i5exoZFXCZ9lGYVcm", // "password"
    createdAt: new Date().toISOString()
  }
];

const categories = [
  { id: '1', name: 'Science', color: '#4287f5', icon: 'flask' },
  { id: '2', name: 'Math', color: '#f54242', icon: 'calculator' },
  { id: '3', name: 'History', color: '#42f59e', icon: 'scroll' },
  { id: '4', name: 'Computer Science', color: '#f5a442', icon: 'laptop-code' }
];

const quizzes = [
  { 
    id: '1', 
    title: 'Basic Science Quiz', 
    description: 'Test your knowledge of general science concepts',
    category: { id: '1', name: 'Science', color: '#4287f5', icon: 'flask' },
    questionCount: 10,
    difficulty: 'easy',
    createdAt: new Date().toISOString()
  },
  { 
    id: '2', 
    title: 'World History', 
    description: 'Historical events that shaped our world',
    category: { id: '3', name: 'History', color: '#42f59e', icon: 'scroll' },
    questionCount: 10,
    difficulty: 'medium',
    createdAt: new Date().toISOString()
  },
  { 
    id: '3', 
    title: 'Programming Fundamentals', 
    description: 'Essential programming concepts',
    category: { id: '4', name: 'Computer Science', color: '#f5a442', icon: 'laptop-code' },
    questionCount: 10,
    difficulty: 'hard',
    createdAt: new Date().toISOString()
  },
  { 
    id: '4', 
    title: 'Algebra Basics', 
    description: 'Fundamental algebra concepts and problem solving',
    category: { id: '2', name: 'Math', color: '#f54242', icon: 'calculator' },
    questionCount: 10,
    difficulty: 'medium',
    createdAt: new Date().toISOString()
  }
];

// Helper functions
function parseJSON(body) {
  try {
    return JSON.parse(body);
  } catch (error) {
    return null;
  }
}

function sendJSON(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

function extractToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }
  
  // Parse URL and path
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Get request body for POST/PUT requests
  let body = '';
  
  if (['POST', 'PUT'].includes(req.method)) {
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    // Wait for the request body to be fully received
    await new Promise(resolve => req.on('end', resolve));
  }
  
  // API Routes
  
  // Health check
  if (path === '/api/health' && req.method === 'GET') {
    sendJSON(res, 200, { status: 'OK', message: 'Server is running correctly' });
    return;
  }
  
  // Categories
  if (path === '/api/categories' && req.method === 'GET') {
    sendJSON(res, 200, categories);
    return;
  }
  
  // Quizzes
  if (path === '/api/quizzes' && req.method === 'GET') {
    const categoryId = parsedUrl.query.categoryId;
    
    if (categoryId) {
      const filteredQuizzes = quizzes.filter(quiz => quiz.category.id === categoryId);
      sendJSON(res, 200, filteredQuizzes);
      return;
    }
    
    sendJSON(res, 200, quizzes);
    return;
  }
  
  // Single Quiz
  if (path.startsWith('/api/quizzes/') && path.split('/').length === 4 && req.method === 'GET') {
    const id = path.split('/')[3];
    const quiz = quizzes.find(q => q.id === id);
    
    if (!quiz) {
      sendJSON(res, 404, { message: 'Quiz not found' });
      return;
    }
    
    sendJSON(res, 200, quiz);
    return;
  }
  
  // Quiz Questions
  if (path.startsWith('/api/quizzes/') && path.endsWith('/questions') && req.method === 'GET') {
    const quizId = path.split('/')[3];
    
    // Mock questions data for quizzes
    const quizQuestions = {
      '1': [ // Science Quiz
        {
          id: '101',
          quizId: '1',
          text: 'What is the chemical symbol for water?',
          options: ['H2O', 'CO2', 'NaCl', 'O2'],
          correctOption: 0,
          explanation: 'Water is composed of two hydrogen atoms (H) and one oxygen atom (O).'
        },
        {
          id: '102',
          quizId: '1',
          text: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correctOption: 1,
          explanation: 'Mars appears red because of iron oxide (rust) on its surface.'
        },
        {
          id: '103',
          quizId: '1',
          text: 'What is the largest organ in the human body?',
          options: ['Heart', 'Liver', 'Skin', 'Brain'],
          correctOption: 2,
          explanation: 'The skin is the largest organ, covering about 2 square meters in adults.'
        },
        {
          id: '104',
          quizId: '1',
          text: 'Which gas do plants absorb from the atmosphere?',
          options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
          correctOption: 1,
          explanation: 'Plants absorb carbon dioxide during photosynthesis to produce glucose and oxygen.'
        },
        {
          id: '105',
          quizId: '1',
          text: 'What is the basic unit of life?',
          options: ['Atom', 'Cell', 'Molecule', 'Tissue'],
          correctOption: 1,
          explanation: 'Cells are the basic structural and functional units of all living organisms.'
        },
        {
          id: '106',
          quizId: '1',
          text: 'What is the process called when plants make their own food using sunlight?',
          options: ['Respiration', 'Photosynthesis', 'Digestion', 'Absorption'],
          correctOption: 1,
          explanation: 'Photosynthesis is the process by which plants convert light energy into chemical energy to fuel their activities.'
        },
        {
          id: '107',
          quizId: '1',
          text: 'Which of these is NOT a state of matter?',
          options: ['Solid', 'Liquid', 'Gas', 'Energy'],
          correctOption: 3,
          explanation: 'Energy is not a state of matter. The common states of matter are solid, liquid, and gas (plus plasma, Bose-Einstein condensates, etc.).'
        },
        {
          id: '108',
          quizId: '1',
          text: 'What is the closest star to Earth?',
          options: ['Proxima Centauri', 'The Sun', 'Alpha Centauri', 'Sirius'],
          correctOption: 1,
          explanation: 'The Sun is the closest star to Earth, at an average distance of about 93 million miles.'
        },
        {
          id: '109',
          quizId: '1',
          text: 'Which of these is NOT a type of blood cell?',
          options: ['Red blood cell', 'White blood cell', 'Platelet', 'Neuron'],
          correctOption: 3,
          explanation: 'Neurons are nerve cells, not blood cells. The three types of blood cells are red blood cells, white blood cells, and platelets.'
        },
        {
          id: '110',
          quizId: '1',
          text: 'What element has the chemical symbol K?',
          options: ['Krypton', 'Potassium', 'Kendrium', 'Kelium'],
          correctOption: 1,
          explanation: 'K is the chemical symbol for potassium, from its Latin name Kalium.'
        }
      ],
      '2': [ // History Quiz
        {
          id: '201',
          quizId: '2',
          text: 'In what year did World War II end?',
          options: ['1943', '1945', '1947', '1950'],
          correctOption: 1,
          explanation: 'World War II ended in 1945 with the surrender of Germany in May and Japan in September.'
        },
        {
          id: '202',
          quizId: '2',
          text: 'Who was the first President of the United States?',
          options: ['Thomas Jefferson', 'John Adams', 'George Washington', 'Benjamin Franklin'],
          correctOption: 2,
          explanation: 'George Washington served as the first President from 1789 to 1797.'
        },
        {
          id: '203',
          quizId: '2',
          text: 'Which ancient civilization built the pyramids at Giza?',
          options: ['Greeks', 'Romans', 'Mayans', 'Egyptians'],
          correctOption: 3,
          explanation: 'The ancient Egyptians built the pyramids at Giza between 2550 and 2490 BCE.'
        },
        {
          id: '204',
          quizId: '2',
          text: 'The Industrial Revolution began in which country?',
          options: ['United States', 'France', 'Germany', 'Great Britain'],
          correctOption: 3,
          explanation: 'The Industrial Revolution began in Great Britain in the late 18th century.'
        },
        {
          id: '205',
          quizId: '2',
          text: 'Who wrote the Declaration of Independence?',
          options: ['Thomas Jefferson', 'George Washington', 'Benjamin Franklin', 'John Adams'],
          correctOption: 0,
          explanation: 'Thomas Jefferson was the principal author of the Declaration of Independence.'
        },
        {
          id: '206',
          quizId: '2',
          text: 'The Roman Empire fell in which century?',
          options: ['3rd century', '5th century', '7th century', '9th century'],
          correctOption: 1,
          explanation: 'The Western Roman Empire fell in the 5th century (476 CE) when Romulus Augustus was deposed.'
        },
        {
          id: '207',
          quizId: '2',
          text: 'Which explorer is credited with discovering America in 1492?',
          options: ['Vasco da Gama', 'Ferdinand Magellan', 'Christopher Columbus', 'Amerigo Vespucci'],
          correctOption: 2,
          explanation: 'Christopher Columbus landed in the Americas in 1492, though many indigenous peoples already lived there.'
        },
        {
          id: '208',
          quizId: '2',
          text: 'The French Revolution began in which year?',
          options: ['1776', '1789', '1798', '1804'],
          correctOption: 1,
          explanation: 'The French Revolution began in 1789 with the storming of the Bastille on July 14.'
        },
        {
          id: '209',
          quizId: '2',
          text: 'Which of these countries was NOT part of the Allied Powers during World War II?',
          options: ['United States', 'United Kingdom', 'Soviet Union', 'Italy'],
          correctOption: 3,
          explanation: 'Italy was part of the Axis Powers along with Germany and Japan, not the Allied Powers.'
        },
        {
          id: '210',
          quizId: '2',
          text: 'The Great Wall of China was built primarily during which dynasty?',
          options: ['Tang Dynasty', 'Song Dynasty', 'Ming Dynasty', 'Qing Dynasty'],
          correctOption: 2,
          explanation: 'While parts were built earlier, most of the Great Wall as we know it today was built during the Ming Dynasty (1368-1644 CE).'
        }
      ],
      '3': [ // Computer Science Quiz
        {
          id: '301',
          quizId: '3',
          text: 'What does CPU stand for?',
          options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Process Utility', 'Central Processor Unifier'],
          correctOption: 0,
          explanation: 'CPU stands for Central Processing Unit, which is the main processor in a computer.'
        },
        {
          id: '302',
          quizId: '3',
          text: 'Which programming language is known as the "mother of all languages"?',
          options: ['Java', 'C', 'Python', 'FORTRAN'],
          correctOption: 1,
          explanation: 'C is often called the "mother of all languages" as many modern languages are derived from it.'
        },
        {
          id: '303',
          quizId: '3',
          text: 'What does HTML stand for?',
          options: ['Hyper Text Markup Language', 'High Technology Modern Language', 'Hyper Transfer Markup Language', 'Hyperlink Text Management Language'],
          correctOption: 0,
          explanation: 'HTML stands for Hyper Text Markup Language, used for creating web pages.'
        },
        {
          id: '304',
          quizId: '3',
          text: 'Which of these is not a programming paradigm?',
          options: ['Object-Oriented', 'Functional', 'Procedural', 'Alphabetical'],
          correctOption: 3,
          explanation: 'Alphabetical is not a programming paradigm. The others represent different approaches to programming.'
        },
        {
          id: '305',
          quizId: '3',
          text: 'What is the smallest unit of digital information?',
          options: ['Byte', 'Bit', 'Nibble', 'Word'],
          correctOption: 1,
          explanation: 'A bit (binary digit) is the smallest unit of digital information, represented as either 0 or 1.'
        },
        {
          id: '306',
          quizId: '3',
          text: 'What does SQL stand for?',
          options: ['Structured Query Language', 'Simple Question Language', 'Standard Query Logic', 'System Quality Level'],
          correctOption: 0,
          explanation: 'SQL stands for Structured Query Language, used for managing and manipulating databases.'
        },
        {
          id: '307',
          quizId: '3',
          text: 'Which data structure operates on a Last-In-First-Out principle?',
          options: ['Queue', 'Linked List', 'Stack', 'Tree'],
          correctOption: 2,
          explanation: 'A stack follows the Last-In-First-Out (LIFO) principle, where the last element added is the first one to be removed.'
        },
        {
          id: '308',
          quizId: '3',
          text: 'What type of attack attempts to flood a server with traffic to make it unavailable?',
          options: ['Phishing', 'SQL Injection', 'DDoS (Distributed Denial of Service)', 'Cross-site Scripting'],
          correctOption: 2,
          explanation: 'A DDoS attack floods a target with excessive traffic to disrupt normal service, making it unavailable to users.'
        },
        {
          id: '309',
          quizId: '3',
          text: 'Which of these is NOT a web browser?',
          options: ['Chrome', 'Firefox', 'Linux', 'Safari'],
          correctOption: 2,
          explanation: 'Linux is an operating system, not a web browser. Chrome, Firefox, and Safari are all web browsers.'
        },
        {
          id: '310',
          quizId: '3',
          text: 'What does API stand for?',
          options: ['Application Programming Interface', 'Automated Program Interaction', 'Advanced Protocol Interface', 'Application Process Integration'],
          correctOption: 0,
          explanation: 'API stands for Application Programming Interface, which allows different software applications to communicate with each other.'
        }
      ],
      '4': [ // Math Quiz
        {
          id: '401',
          quizId: '4',
          text: 'What is the value of π (pi) to two decimal places?',
          options: ['3.14', '3.16', '3.12', '3.18'],
          correctOption: 0,
          explanation: 'Pi (π) is approximately equal to 3.14159..., which rounds to 3.14 when expressed to two decimal places.'
        },
        {
          id: '402',
          quizId: '4',
          text: 'Solve for x: 2x + 5 = 13',
          options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
          correctOption: 1,
          explanation: 'Subtracting 5 from both sides: 2x = 8. Then dividing by 2: x = 4.'
        },
        {
          id: '403',
          quizId: '4',
          text: 'What is the square root of 81?',
          options: ['8', '9', '10', '12'],
          correctOption: 1,
          explanation: '9 × 9 = 81, so the square root of 81 is 9.'
        },
        {
          id: '404',
          quizId: '4',
          text: 'If x = 3 and y = 4, what is the value of x² + y²?',
          options: ['7', '12', '25', '49'],
          correctOption: 2,
          explanation: 'x² + y² = 3² + 4² = 9 + 16 = 25'
        },
        {
          id: '405',
          quizId: '4',
          text: 'What is the next number in the sequence: 2, 4, 8, 16, ...?',
          options: ['24', '20', '32', '64'],
          correctOption: 2,
          explanation: 'Each number is doubled to get the next number in the sequence. So, 16 × 2 = 32.'
        },
        {
          id: '406',
          quizId: '4',
          text: 'What is the formula for the area of a circle?',
          options: ['A = 2πr', 'A = πr²', 'A = πd', 'A = 2πr²'],
          correctOption: 1,
          explanation: 'The area of a circle is calculated using the formula A = πr², where r is the radius.'
        },
        {
          id: '407',
          quizId: '4',
          text: 'What is the result of 5! (5 factorial)?',
          options: ['25', '120', '60', '720'],
          correctOption: 1,
          explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120'
        },
        {
          id: '408',
          quizId: '4',
          text: 'In a right triangle, what does the Pythagorean theorem state?',
          options: ['a = b + c', 'a² = b² + c²', 'a³ = b³ + c³', 'ab = c²'],
          correctOption: 1,
          explanation: 'The Pythagorean theorem states that in a right triangle, the square of the length of the hypotenuse (a) equals the sum of the squares of the other two sides (b and c): a² = b² + c².'
        },
        {
          id: '409',
          quizId: '4',
          text: 'What is the slope of a horizontal line?',
          options: ['0', '1', 'undefined', 'infinity'],
          correctOption: 0,
          explanation: 'A horizontal line has a slope of 0, as it does not rise or fall as you move along the x-axis.'
        },
        {
          id: '410',
          quizId: '4',
          text: 'If you roll a standard six-sided die, what is the probability of rolling an even number?',
          options: ['1/6', '1/3', '1/2', '2/3'],
          correctOption: 2,
          explanation: 'There are 3 even numbers (2, 4, 6) out of 6 possible outcomes, so the probability is 3/6 = 1/2.'
        }
      ]
    };
    
    const quiz = quizzes.find(q => q.id === quizId);
    
    if (!quiz) {
      sendJSON(res, 404, { message: 'Quiz not found' });
      return;
    }
    
    const questions = quizQuestions[quizId] || [];
    
    if (questions.length === 0) {
      sendJSON(res, 404, { message: 'No questions found for this quiz' });
      return;
    }
    
    sendJSON(res, 200, questions);
    return;
  }
  
  // Register
  if (path === '/api/auth/register' && req.method === 'POST') {
    try {
      const data = parseJSON(body);
      
      if (!data || !data.username || !data.email || !data.password) {
        sendJSON(res, 400, { message: 'Username, email and password are required' });
        return;
      }
      
      // Check if user exists
      const existingUser = users.find(u => 
        u.username === data.username || u.email === data.email
      );
      
      if (existingUser) {
        sendJSON(res, 400, { message: 'Username or email already exists' });
        return;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);
      
      // Create and save user
      const newUser = {
        id: (users.length + 1).toString(),
        username: data.username,
        email: data.email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      
      // Generate token
      const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
      
      // Remove password from response
      const { password, ...userResponse } = newUser;
      
      sendJSON(res, 201, { user: userResponse, token });
    } catch (error) {
      console.error('Register error:', error);
      sendJSON(res, 500, { message: 'Server error during registration' });
    }
    return;
  }
  
  // Login
  if (path === '/api/auth/login' && req.method === 'POST') {
    try {
      const data = parseJSON(body);
      
      if (!data || !data.username || !data.password) {
        sendJSON(res, 400, { message: 'Username and password are required' });
        return;
      }
      
      // Find user
      const user = users.find(u => u.username === data.username);
      
      if (!user) {
        sendJSON(res, 400, { message: 'Invalid username or password' });
        return;
      }
      
      // Validate password
      const isMatch = await bcrypt.compare(data.password, user.password);
      
      if (!isMatch) {
        sendJSON(res, 400, { message: 'Invalid username or password' });
        return;
      }
      
      // Generate token
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      sendJSON(res, 200, { user: userResponse, token });
    } catch (error) {
      console.error('Login error:', error);
      sendJSON(res, 500, { message: 'Server error during login' });
    }
    return;
  }
  
  // Current User
  if (path === '/api/auth/user' && req.method === 'GET') {
    // Get token from headers
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      sendJSON(res, 401, { message: 'Access token required' });
      return;
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      sendJSON(res, 403, { message: 'Invalid or expired token' });
      return;
    }
    
    // Find user
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      sendJSON(res, 404, { message: 'User not found' });
      return;
    }
    
    // Remove password from response
    const { password, ...userResponse } = user;
    
    sendJSON(res, 200, userResponse);
    return;
  }
  
  // Quiz submission
  if (path.match(/^\/api\/quizzes\/[^\/]+\/submit$/) && req.method === 'POST') {
    // Get token from headers
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      sendJSON(res, 401, { message: 'Access token required' });
      return;
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      sendJSON(res, 403, { message: 'Invalid or expired token' });
      return;
    }
    
    // Parse quiz ID from URL
    const quizId = path.split('/')[3];
    
    // Parse submission data
    const data = parseJSON(body);
    
    if (!data || !Array.isArray(data.answers) || !data.timeTaken) {
      sendJSON(res, 400, { message: 'Invalid submission data' });
      return;
    }
    
    // Mock questions data
    const quizQuestions = {
      '1': [ // Science Quiz
        {
          id: '101',
          quizId: '1',
          text: 'What is the chemical symbol for water?',
          options: ['H2O', 'CO2', 'NaCl', 'O2'],
          correctOption: 0
        },
        {
          id: '102',
          quizId: '1',
          text: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correctOption: 1
        },
        {
          id: '103',
          quizId: '1',
          text: 'What is the largest organ in the human body?',
          options: ['Heart', 'Liver', 'Skin', 'Brain'],
          correctOption: 2
        },
        {
          id: '104',
          quizId: '1',
          text: 'Which gas do plants absorb from the atmosphere?',
          options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
          correctOption: 1
        },
        {
          id: '105',
          quizId: '1',
          text: 'What is the basic unit of life?',
          options: ['Atom', 'Cell', 'Molecule', 'Tissue'],
          correctOption: 1
        }
      ],
      '2': [ // History Quiz questions
        { id: '201', quizId: '2', correctOption: 1 },
        { id: '202', quizId: '2', correctOption: 2 },
        { id: '203', quizId: '2', correctOption: 3 },
        { id: '204', quizId: '2', correctOption: 3 },
        { id: '205', quizId: '2', correctOption: 0 }
      ],
      '3': [ // Computer Science Quiz questions
        { id: '301', quizId: '3', correctOption: 0 },
        { id: '302', quizId: '3', correctOption: 1 },
        { id: '303', quizId: '3', correctOption: 0 },
        { id: '304', quizId: '3', correctOption: 3 },
        { id: '305', quizId: '3', correctOption: 1 }
      ],
      '4': [ // Math Quiz questions
        { id: '401', quizId: '4', correctOption: 0 },
        { id: '402', quizId: '4', correctOption: 1 },
        { id: '403', quizId: '4', correctOption: 1 },
        { id: '404', quizId: '4', correctOption: 2 },
        { id: '405', quizId: '4', correctOption: 2 }
      ]
    };
    
    // User results storage
    const userResults = global.userResults || [];
    global.userResults = userResults;
    
    // Calculate score
    const questions = quizQuestions[quizId] || [];
    if (questions.length === 0) {
      sendJSON(res, 404, { message: 'Quiz not found' });
      return;
    }
    
    let correctCount = 0;
    for (const answer of data.answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && question.correctOption === answer.selectedOption) {
        correctCount++;
      }
    }
    
    const score = Math.round((correctCount / questions.length) * 100);
    
    // Create result
    const result = {
      id: (userResults.length + 1).toString(),
      userId: decoded.id,
      quizId,
      score,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      timeTaken: data.timeTaken,
      completedAt: new Date().toISOString()
    };
    
    // Save result
    userResults.push(result);
    
    // Return result
    sendJSON(res, 201, result);
    return;
  }
  
  // User Quiz Results
  if (path === '/api/user/results' && req.method === 'GET') {
    // Get token from headers
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      sendJSON(res, 401, { message: 'Access token required' });
      return;
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      sendJSON(res, 403, { message: 'Invalid or expired token' });
      return;
    }
    
    // Get user results
    const userResults = global.userResults || [];
    
    // Check if a specific result is requested
    const resultId = parsedUrl.query.resultId;
    
    if (resultId) {
      // Get a specific result
      const result = userResults.find(r => r.id === resultId);
      
      if (!result) {
        sendJSON(res, 404, { message: 'Result not found' });
        return;
      }
      
      // Check if the result belongs to the authenticated user
      if (result.userId !== decoded.id) {
        sendJSON(res, 403, { message: 'Unauthorized access to result' });
        return;
      }
      
      // Attach quiz info to the result
      const quiz = quizzes.find(q => q.id === result.quizId);
      const resultWithQuizInfo = {
        ...result,
        quiz: quiz ? {
          id: quiz.id,
          title: quiz.title,
          category: quiz.category
        } : null
      };
      
      sendJSON(res, 200, resultWithQuizInfo);
      return;
    }
    
    // Get all user results
    const results = userResults.filter(r => r.userId === decoded.id);
    
    // Attach quiz info to each result
    const resultsWithQuizInfo = results.map(result => {
      const quiz = quizzes.find(q => q.id === result.quizId);
      return {
        ...result,
        quiz: quiz ? {
          id: quiz.id,
          title: quiz.title,
          category: quiz.category
        } : null
      };
    });
    
    sendJSON(res, 200, resultsWithQuizInfo);
    return;
  }
  
  // Serve HTML for root route
  if (path === '/' || path === '') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quiz Application VS Code Setup</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .alert {
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 5px;
            }
            .success {
              background-color: #d4edda;
              color: #155724;
            }
            .warning {
              background-color: #fff3cd;
              color: #856404;
            }
            pre {
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 5px;
              overflow-x: auto;
            }
            code {
              background-color: #f5f5f5;
              padding: 2px 5px;
              border-radius: 3px;
            }
          </style>
        </head>
        <body>
          <h1>Quiz Application - VS Code Setup</h1>
          
          <div class="alert success">
            ✅ Backend API server is running at http://${HOST}:${PORT}
          </div>
          
          <div class="alert warning">
            <strong>Note:</strong> The React frontend should start automatically.
            <br>If it doesn't, please run <code>cd client && npm start</code> in a separate terminal.
          </div>
          
          <h2>Available API Endpoints:</h2>
          <ul>
            <li><code>GET /api/health</code> - Health check endpoint</li>
            <li><code>GET /api/categories</code> - Get all categories</li>
            <li><code>GET /api/quizzes</code> - Get all quizzes</li>
            <li><code>GET /api/quizzes/:id</code> - Get quiz by ID</li>
            <li><code>GET /api/quizzes/:id/questions</code> - Get questions for a specific quiz</li>
            <li><code>POST /api/quizzes/:id/submit</code> - Submit quiz answers (requires auth)</li>
            <li><code>GET /api/user/results</code> - Get user quiz results (requires auth)</li>
            <li><code>POST /api/auth/register</code> - Register a new user</li>
            <li><code>POST /api/auth/login</code> - Login a user</li>
            <li><code>GET /api/auth/user</code> - Get current user (requires auth)</li>
          </ul>
          
          <h2>Next Steps:</h2>
          <p>The React frontend should open automatically in your browser at <a href="http://localhost:3000" target="_blank">http://localhost:3000</a></p>
          
          <h2>API Health Status:</h2>
          <pre id="api-response">Loading...</pre>
          
          <script>
            // Fetch health check status
            fetch('/api/health')
              .then(response => response.json())
              .then(data => {
                document.getElementById('api-response').textContent = JSON.stringify(data, null, 2);
              })
              .catch(error => {
                document.getElementById('api-response').textContent = 'Error: ' + error.message;
              });
          </script>
        </body>
      </html>
    `);
    return;
  }
  
  // Not found
  sendJSON(res, 404, { message: 'Endpoint not found' });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`${colors.server}
========================================
🚀 Quiz Application VS Code Setup
========================================
API Server running at: http://${HOST}:${PORT}
API endpoints available at: http://${HOST}:${PORT}/api
Health check: http://${HOST}:${PORT}/api/health
========================================
${colors.reset}`);

  // Start React frontend
  console.log(`${colors.client}Starting React frontend...${colors.reset}`);
  
  // Check if client directory exists
  const clientDir = path.join(__dirname, 'client');
  if (!fs.existsSync(clientDir)) {
    console.error(`${colors.error}Error: Client directory not found at ${clientDir}${colors.reset}`);
    process.exit(1);
  }
  
  // Start React development server
  const frontend = spawn('npm', ['start'], { cwd: clientDir, shell: true });
  
  frontend.stdout.on('data', (data) => {
    console.log(`${colors.client}[FRONTEND] ${data.toString().trim()}${colors.reset}`);
  });
  
  frontend.stderr.on('data', (data) => {
    console.error(`${colors.error}[FRONTEND ERROR] ${data.toString().trim()}${colors.reset}`);
  });
  
  frontend.on('close', (code) => {
    console.log(`${colors.client}[FRONTEND] Process exited with code ${code}${colors.reset}`);
    process.exit(code);
  });
  
  // Handle termination
  process.on('SIGINT', () => {
    console.log(`${colors.reset}
========================================
💤 Shutting down Quiz Application
========================================`);
    frontend.kill();
    process.exit(0);
  });
});