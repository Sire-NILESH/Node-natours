/* eslint-disable */ 

import axios from 'axios';
import { showAlert } from './alerts';
//const stripe = Stripe('pk_test_51JWJ70SHkzkRG21mPCIgtqOGMcws87vJ5ZX2tx4BV5wDaOzyDVwXwhQ2FCb6LMXTUInLeYLg8tDSBIbXjrBK7wqN00xMWPeeOz');

export const bookTour = async tourId => {
   try{
      const stripe = Stripe('pk_test_51JWJ70SHkzkRG21mPCIgtqOGMcws87vJ5ZX2tx4BV5wDaOzyDVwXwhQ2FCb6LMXTUInLeYLg8tDSBIbXjrBK7wqN00xMWPeeOz');
      
      // 1) Get the checkout session from the API
      const session = await axios(`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`);      // this is how to req for simple 'get'.

      console.log(session);

      // 2) Create checkout form + charge the credit card
      await stripe.redirectToCheckout({
         sessionId: session.data.session.id
      });
   } catch (err) {
      console.log(err);
      showAlert('error', err);
   }
};








// /* eslint-disable */
// import axios from 'axios';
// import { showAlert } from './alerts';
// const stripe = Stripe('pk_test_51JWJ70SHkzkRG21mPCIgtqOGMcws87vJ5ZX2tx4BV5wDaOzyDVwXwhQ2FCb6LMXTUInLeYLg8tDSBIbXjrBK7wqN00xMWPeeOz');

// export const bookTour = async tourId => {
//   try {
//     // 1) Get checkout session from API
//     const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
//     // console.log(session);

//     // 2) Create checkout form + chanre credit card
//     await stripe.redirectToCheckout({
//       sessionId: session.data.session.id
//     });
//   } catch (err) {
//     console.log(err);
//     showAlert('error', err);
//   }
// };
