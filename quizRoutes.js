import express from 'express';
import passport from 'passport';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import Category from '../models/Category.js';

const router = express.Router();

// @route   GET /api/quizzes
// @desc    Get all published quizzes
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isPublished: true };
    
    if (category) filter.category = category;
    
    const quizzes = await Quiz.find(filter)
      .populate('category', 'name description icon color')
      .populate('createdBy', 'username')
      .select('-questions')
      .sort({ createdAt: -1 });
    
    res.json(quizzes);
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quizzes/:id
// @desc    Get quiz by ID (without answers)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ 
      _id: req.params.id,
      isPublished: true 
    })
      .populate('category', 'name description icon color')
      .populate('createdBy', 'username')
      .populate({
        path: 'questions',
        select: 'text options.text difficulty',
        options: { sort: { createdAt: 1 } }
      });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Update view count
    quiz.attempts += 1;
    await quiz.save();
    
    res.json(quiz);
  } catch (err) {
    console.error('Error fetching quiz:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quizzes/:id/full
// @desc    Get quiz by ID with answers (for admin)
// @access  Private/Admin
router.get('/:id/full', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    // Check if user is admin or creator of the quiz
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    if (!req.user.isAdmin && quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Fetch full quiz with questions and answers
    const fullQuiz = await Quiz.findById(req.params.id)
      .populate('category', 'name description icon color')
      .populate('createdBy', 'username')
      .populate({
        path: 'questions',
        options: { sort: { createdAt: 1 } }
      });
    
    res.json(fullQuiz);
  } catch (err) {
    console.error('Error fetching full quiz:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/quizzes
// @desc    Create a new quiz
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { title, description, category, questions, timeLimit, isPublished } = req.body;
    
    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Create new quiz
    const newQuiz = new Quiz({
      title,
      description,
      category,
      questions,
      timeLimit,
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: req.user.id
    });
    
    const quiz = await newQuiz.save();
    
    res.status(201).json(quiz);
  } catch (err) {
    console.error('Error creating quiz:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quizzes/:id
// @desc    Update a quiz
// @access  Private
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { title, description, category, questions, timeLimit, isPublished } = req.body;
    
    // Check if quiz exists
    let quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user is authorized to update
    if (quiz.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this quiz' });
    }
    
    // If category is being updated, validate it exists
    if (category && category !== quiz.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }
    
    // Update quiz
    quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, category, questions, timeLimit, isPublished } },
      { new: true }
    );
    
    res.json(quiz);
  } catch (err) {
    console.error('Error updating quiz:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/quizzes/:id
// @desc    Delete a quiz
// @access  Private
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user is authorized to delete
    if (quiz.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this quiz' });
    }
    
    await quiz.deleteOne();
    res.json({ message: 'Quiz removed' });
  } catch (err) {
    console.error('Error deleting quiz:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/quizzes/:id/submit
// @desc    Submit quiz answers
// @access  Private
router.post('/:id/submit', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    
    // Find quiz
    const quiz = await Quiz.findById(req.params.id)
      .populate({
        path: 'questions',
        select: 'options'
      });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Calculate score
    let score = 0;
    const results = [];
    
    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i];
      const answer = answers.find(a => a.questionId === question._id.toString());
      const correctOption = question.options.find(o => o.isCorrect);
      
      if (answer && answer.selectedOption === correctOption._id.toString()) {
        score += 1;
        results.push({
          questionId: question._id,
          correct: true,
          selectedOption: answer.selectedOption,
          correctOption: correctOption._id
        });
      } else {
        results.push({
          questionId: question._id,
          correct: false,
          selectedOption: answer ? answer.selectedOption : null,
          correctOption: correctOption._id
        });
      }
    }
    
    // Calculate percentage score
    const percentageScore = (score / quiz.questions.length) * 100;
    
    // Update quiz stats
    await quiz.updateStats(percentageScore);
    
    // Update user stats
    await req.user.updateStats({
      quizId: quiz._id,
      category: quiz.category.toString(),
      score: percentageScore,
      totalQuestions: quiz.questions.length,
      timeTaken
    });
    
    res.json({
      score,
      totalQuestions: quiz.questions.length,
      percentageScore,
      timeTaken,
      results
    });
  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;