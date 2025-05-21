import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  quizzesTaken: [
    {
      quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
      },
      score: Number,
      totalQuestions: Number,
      timeTaken: Number,
      attemptedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  stats: {
    totalQuizzesTaken: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    categoryPerformance: {
      type: Map,
      of: {
        quizzesTaken: Number,
        averageScore: Number
      },
      default: {}
    }
  }
});

// Method to update user statistics after completing a quiz
UserSchema.methods.updateStats = function(quizResult) {
  // Update total quizzes taken
  this.stats.totalQuizzesTaken += 1;
  
  // Calculate new average score
  const totalScores = this.quizzesTaken.reduce((sum, quiz) => sum + quiz.score, 0) + quizResult.score;
  this.stats.averageScore = totalScores / (this.quizzesTaken.length + 1);
  
  // Update category performance
  const category = quizResult.category;
  if (!this.stats.categoryPerformance.has(category)) {
    this.stats.categoryPerformance.set(category, {
      quizzesTaken: 1,
      averageScore: quizResult.score
    });
  } else {
    const categoryStats = this.stats.categoryPerformance.get(category);
    const newQuizzesTaken = categoryStats.quizzesTaken + 1;
    const newAverageScore = (categoryStats.averageScore * categoryStats.quizzesTaken + quizResult.score) / newQuizzesTaken;
    
    this.stats.categoryPerformance.set(category, {
      quizzesTaken: newQuizzesTaken,
      averageScore: newAverageScore
    });
  }
  
  // Add quiz result to quizzesTaken array
  this.quizzesTaken.push({
    quizId: quizResult.quizId,
    score: quizResult.score,
    totalQuestions: quizResult.totalQuestions,
    timeTaken: quizResult.timeTaken,
    attemptedAt: new Date()
  });
  
  return this.save();
};

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

export default User;