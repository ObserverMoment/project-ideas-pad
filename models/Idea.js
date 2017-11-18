const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This creates the schema. You pass it an object detailing the field names and the options specs for each field.
const ideaSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now()
  },
  user: {
    type: String,
    required: true
  }
});

// Then you create a model with the model method. The first arg is the "table" name - plural usually.
// The second arg is the schema that you created above.
mongoose.model('ideas', ideaSchema);
