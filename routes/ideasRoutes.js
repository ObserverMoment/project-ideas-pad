const router = require('express').Router();
const mongoose = require('mongoose');

// Load the IdeaSchema.
require('../models/Idea');
// Then access it via mongoose.model and save it into a variable.
const Idea = mongoose.model('ideas');

// Ideas Page Route
router.get('/', (req, res) => {
  // Retrieve all ideas from the database that match the current users email address.
  Idea.find({ user: req.user.id })
  .sort('-date')
  .then((ideas) => {
    res.render('ideas', { ideas });
  })
  .catch(err => console.log(err));
});

// Process new idea post request to the /ideas Route
router.post('/', (req, res) => {
  // Save an array of error objects for each error found with the form.
  let errors = [];
  // Validate the incoming data from req.body.
  // Usually you would carry out more validation here and also make sure that the data is safe.
  if (!req.body.title) {
    errors.push({ errorText: "Please enter a title for your idea" });
  }
  if (!req.body.details) {
    errors.push({ errorText: "Please enter the details of your idea" });
  }

  // If there are errors send the user back to the /ideas/add route and include the error objects.
  // Otherwise push the idea to the database and then send them to the ideas page.
  if (errors.length !== 0) {
    res.render('add-idea', {
      errors: errors,
      title: req.body.title,
      details: req.body.details
    });
  } else {
    // Push to database and then re-route user.
    const newIdea = {
      title: req.body.title,
      details: req.body.details,
      user: req.user.id
    }
    // Create a new idea via the mongoose schema.
    // The .save() will return a promise that will resolve when the item is saved to the database.
    new Idea(newIdea)
      .save()
      .then((savedIdea) => {
        req.flash('success_msg', `New idea '${savedIdea.title}', has been saved.`);
        res.redirect('/ideas');
      })
      .catch((err) => {
        // If something goes wrong trying to save to the database then send the user back to the form page and display an error.
        console.log(err);
        if (err) throw err;
    });
  }

});

// Add Idea Route - Goes to a page with a form on it
router.get('/add', (req, res) => {
  res.render('add-idea');
});

// Add Idea Route - Goes to a page with a form on it - and gets passed the idea object from the database.
router.get('/edit/:id', (req, res) => {
  Idea.findOne({ _id: req.params.id })
    .then((idea) => {
      // Here we need to do a check to make sure users cannot edit each others ideas.
      // Otherwise some other logged in user could manually enter a url route with a valid ID and be able to edit it.
      if (idea.user === req.user.id) {
        let data = idea || {ideaNotFound: `Sorry, could not find a Project Idea with ID of ${req.params.id}`};
        res.render('edit-idea', data);
      } else {
        // Return the user to the ideas page.
        req.flash('error_msg', 'Sorry, you are not authorised to edit this.')
        res.redirect('/ideas');
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

router.delete('/delete/:id', (req, res) => {
  Idea.findByIdAndRemove(req.params.id)
    .then((deletedIdea) => {
      req.flash('success_msg', `Idea '${deletedIdea.title}', has been deleted.`);
      res.redirect('/ideas');
    }).catch(err => console.log(err));

});

router.put('/:id', (req, res) => {
  const { title, details } = req.body;
  const newIdeaData = { title, details };
  Idea.findOneAndUpdate({ _id: req.params.id }, newIdeaData, {new: true})
    .then((updatedIdea) => {
      req.flash('success_msg', `Idea '${updatedIdea.title}', has been updated.`);
      res.redirect('/ideas');
    });
});

module.exports = router;
