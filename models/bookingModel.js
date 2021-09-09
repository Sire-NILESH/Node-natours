const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
   tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A booking must belong to a tour']
   },

   user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A booking must belong to a user']
   },

   price: {
      type: Number,
      required: [true, 'A booking must have a price']
   },

   createdAt: {
      type: Date,
      default: Date.now()
   },

   paid: {
      type: Boolean,
      default: true
   }
});


// populate the stored 'user' and 'tour' fields which are parent references on every query to booking
bookingSchema.pre(/^find/, function (next) {
   this.populate('user').populate({
      path: 'tour',
      select: 'name'
   });

   next();     //vey imp
});


const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;