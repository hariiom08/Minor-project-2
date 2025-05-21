import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }
  ],
  timeLimit: {
    type: Number, // Time limit in seconds
    default: 600 // Default: 10 minutes
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual field for the number of questions in this quiz
QuizSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Method to update quiz statistics
QuizSchema.methods.updateStats = function(score) {
  this.attempts += 1;
  this.averageScore = ((this.averageScore * (this.attempts - 1)) + score) / this.attempts;
  return this.save();
};

const Quiz = mongoose.model('Quiz', QuizSchema);

export default Quiz;