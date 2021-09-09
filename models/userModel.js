const crypto = require('crypto');       //built in
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


//name, email, pass, photo, passConfirm

//create  user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },

    email: { 
        type: String,
        required:[true, 'Please provide a email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },

    photo: {
        type: String,
        default: 'default.jpg'
    },

    role: {
        type: String,
        enum: ['admin', 'user', 'guide', 'lead-guide'],
        default: 'user'
    },

    password: {
        type: String,
        required: [true, 'Please provide a password'],      
        minLength: 8,
        select: false,
    },

    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],   //required means only need to be in the request field but can be actually ignored to be stored in DB.
        validate: {
            validator: function(el){
                return el === this.password;
            },
            message: 'Passwords did not match.'
        }
    },

    passwordChangedAt: Date,

    passwordResetToken: String,

    passwordResetExpires: Date,

    active: {
        type: Boolean,
        default: true,
        select: false
    },

});


//pipeline hooks
userSchema.pre('save', async function(next){
    //Only run this if password was actually modified.
    if(!this.isModified('password')) return next();

    //Hash the password with cost of 12.
    this.password = await bcrypt.hash(this.password, 12);

    //Delete passwordConfirm field.
    this.passwordConfirm = undefined;

    next();
});


//hook to update passwordChangedAt field automatically on every 'save'.
userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; // -1sec to compensate the delay on updating DB and new Token generation.
    next();
});


//hook to remove the 'active' field from any find results
userSchema.pre(/^find/, function(next) {
    //'.this' will point to current query
    this.find({ active: { $ne: false} });   //will first fetch all the active users before any find query.
    next();
});


//create an instance method on schema that will be available to all its instances/models
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    //this.password will not be availabe here because that field was set to 'select: false' inside schema, for others use this.fieldName.
    return await bcrypt.compare(candidatePassword, userPassword);
};


userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        //divide by 1000 to convert millissecs to secs.

        return JWTTimestamp < changedTimestamp;
    }   
    
    return false;
}


userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;    //10minutes = 600000ms.
    //these 'this.' are not yet saved inside the DB, so await model.save() in the calling function 

    //console.log( {resetToken}, this.passwordResetToken);

    return resetToken;      //return the unhashed token.
}


//create model of that Schema
const User = mongoose.model('User', userSchema);

//exports
module.exports = User;
