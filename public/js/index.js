/* eslint-disable */

import '@babel/polyfill';  //no need to save in any variable, only needs to be included on the very top of the code to polyfill for backwards compatibility of newer JS.
import { displayMap } from './mapbox';
import {login, logout} from './login';
import {signup} from './signup';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';


//DOM elements present on page?
const mapbox = document.getElementById('map');
const loginForm = document.querySelector('.login-form')
const signupForm = document.querySelector('.signup-form')
const logOutBtn = document.querySelector('.nav__el--logout');  //inside the header.pug
const userDataForm = document.querySelector('.form-user-data');   //inside account.pug
const userPasswordForm = document.querySelector('.form-user-password');   //inside account.pug
const bookBtn = document.getElementById('book-tour'); //inside tour.pug
// const bookBtn = document.querySelector('#book-tour'); //inside tour.pug


if(mapbox){
   //get data from UI for mapbox
   const locations = JSON.parse(document.getElementById('map').dataset.locations);

   //call mapbox
   displayMap(locations);
}


if(loginForm){
   //logging in
   loginForm.addEventListener('submit', e => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      login(email, password);
   });
}


if(logOutBtn){
   logOutBtn.addEventListener('click', logout);
}


if(signupForm){
   //signup
   signupForm.addEventListener('submit', e => {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;
      signup(name, email, password, passwordConfirm);
   });
}


if(userDataForm) {
   userDataForm.addEventListener('submit', e => {
      e.preventDefault();

      //for multpart/formdata like photos
      const form = new FormData();
      form.append('name', document.getElementById('name').value);
      form.append('email', document.getElementById('email').value);
      form.append('photo', document.getElementById('photo').files[0]);

      updateSettings(form, 'data');

      // //for simple use case
      // const name = document.getElementById('name').value;
      // const email = document.getElementById('email').value;
      //updateSettings({name, email}, 'data');

   });
}


if(userPasswordForm) {
   userPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      //let the user know its loading
      document.querySelector('.btn--save-password').textContent = 'Updating...';

      const passwordCurrent = document.getElementById('password-current').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('password-confirm').value;
      
      //await this func to perform below actions after function is processed.
      await updateSettings({
               passwordCurrent,
               password,
               passwordConfirm
               },
               'password'
            );


      //reset every field
      document.querySelector('.btn--save-password').textContent = 'Save password';
      document.getElementById('password-current').value = '';
      document.getElementById('password-confirm').value = '';
      document.getElementById('password').value = '';

   });

};


if(bookBtn) {
   bookBtn.addEventListener('click', e => {
      e.target.textContent = 'Processing...';      //'target' is element from where it was clicked, 'book-tour' button here.

      // const tourId = e.target.dataset.tourId;   // 'tour-id' saved on dataset in the html page gets converted to 'tourId' when recieved in JS.
      //above can also be done like below.
      const { tourId } = e.target.dataset;   
      bookTour(tourId);

   });
}
