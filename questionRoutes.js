import express from 'express';
import passport from 'passport';
import Question from '../models/Question.js';
import Category from '../models/Category.js';

const router = express.Router();

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

// @route   GET /api/questions
// @desc    Get all questions (with optional filtering)
// @access  Private/Admin
router.get('/', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    
    const questions = await Question.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    res.json(questions);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions/:id
// @desc    Get question by ID
// @access  Private/Admin
router.get('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('category', 'name');
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.json(question);
  } catch (err) {
    console.error('Error fetching question:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions/category/:categoryId
// @desc    Get questions by category
// @access  Private
router.get('/category/:categoryId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const questions = await Question.find({ category: req.params.categoryId })
      .select('-options.isCorrect') // Don't send correct answers to client
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    res.json(questions);
  } catch (err) {
    console.error('Error fetching questions by category:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private/Admin
router.post('/', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const { text, options, explanation, category, difficulty } = req.body;
    
    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Create new question
    const newQuestion = new Question({
      text,
      options,
      explanation,
      category,
      difficulty: difficulty || 'medium'
    });
    
    const question = await newQuestion.save();
    res.status(201).json(question);
  } catch (err) {
    console.error('Error creating question:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question
// @access  Private/Admin
router.put('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const { text, options, explanation, category, difficulty } = req.body;
    
    // Check if question exists
    let question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // If category is being updated, validate it exists
    if (category && category !== question.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }
    
    // Update question
    question = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: { text, options, explanation, category, difficulty } },
      { new: true, runValidators: true }
    );
    
    res.json(question);
  } catch (err) {
    console.error('Error updating question:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Private/Admin
router.delete('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    await question.deleteOne();
    res.json({ message: 'Question removed' });
  } catch (err) {
    console.error('Error deleting question:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;