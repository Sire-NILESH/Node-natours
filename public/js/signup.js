/* eslint-disable */ 
import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
   
   //console.log(`signup ${email} ${password} ${passwordConfirm}`);
   try{
      const res = await axios({
         method: 'POST',
         //url: 'http://127.0.0.1:3000/api/v1/users/signup',p
         url: '/api/v1/users/signup',
         data: {
            name: name,
            email: email,
            password: password,
            passwordConfirm: passwordConfirm
         }
      });

      if(res.data.status === 'success') {
         showAlert('success', 'Signup successfull, Welcome');
         window.setTimeout(()=> {
            location.assign('/');         //location is where to goto, root page here.
         }, 1500);
      }

   } catch(err){              //err will be thrown by axios from api. 
      showAlert('error', err.response.data.message);
   }

};