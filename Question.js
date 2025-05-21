import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  options: {
    type: [{
      text: {
        type: String,
        required: true
      },
      isCorrect: {
        type: Boolean,
        required: true
      }
    }],
    validate: [
      {
        validator: function(options) {
          return options.length === 4;
        },
        message: 'Each question must have exactly 4 options'
      },
      {
        validator: function(options) {
          return options.filter(option => option.isCorrect).length === 1;
        },
        message: 'Each question must have exactly one correct answer'
      }
    ]
  },
  explanation: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Question = mongoose.model('Question', QuestionSchema);

export default Question;