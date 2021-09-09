/* eslint-disable */ 
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
   
   try{
      const res = await axios({
         method: 'POST',
         //url: 'http://127.0.0.1:3000/api/v1/users/login',p
         url: 'http://localhost:3000/api/v1/users/login',
         data: {
            email: email,
            password: password
         }
      });

      if(res.data.status === 'success') {
         showAlert('success', 'Logged in successfully');
         window.setTimeout(()=> {
            location.assign('/');         //location is where to goto, root page here.
         }, 1500);
      }

      // console.log(res);
   } catch(err){              //err will be thrown by axios from api. 
      showAlert('error', err.response.data.message);
   }
};


export const logout = async() => {
   try{
      const res = await axios({
         method: 'GET',
         url:'http://localhost:3000/api/v1/users/logout'
      });

      if(res.data.status === 'success'){
         showAlert('success', 'Logged out successfully');
         window.setTimeout(()=> {
            location.reload(true);
            //location.assign('/');         //location is where to goto, root page here.
         }, 1500);
         
         //location.reload(true);  //'true' will make the reload from the server side. default is from the browser's cache.
      }
   } catch(err){
      console.log(err.response);
      showAlert('error', 'Error logging out! Try again');
   }
};


// "email": "t1@g.com",
// "password": "test1234"
