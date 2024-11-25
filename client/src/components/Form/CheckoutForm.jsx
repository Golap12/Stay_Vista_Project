
import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { ImSpinner9 } from "react-icons/im";
import './CheckoutForm.css';
import useAxiosSecure from './../../hooks/useAxiosSecure';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CheckoutForm = ({ closeModal, bookingInfo, refetch }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState('');
  const [cardError, setCardError] = useState('');
  const [processing, setProcessing] = useState(false);
  const axiosSecure = useAxiosSecure()

// console.log(bookingInfo);

  useEffect(() => {
    if (bookingInfo?.price > 1) {
      getClientSecret({ price: bookingInfo?.price*100 })
    }
  }, [bookingInfo?.price])


  // get client secret 
  const getClientSecret = async price => {
    const { data } = await axiosSecure.post(`/create-payment-intent`, price)
    // console.log(data);
    setClientSecret(data.clientSecret)
  }




  const handleSubmit = async (event) => {
    event.preventDefault();

    setProcessing(true)
    if (!stripe || !elements) {
      return;
    }

    const card = elements.getElement(CardElement);

    if (card == null) {
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card,
    });

    if (error) {
      console.log('[error]', error);
      setCardError(error.message)
      setProcessing(false)
      return
    } else {
      console.log('[PaymentMethod]', paymentMethod);
      setCardError('')
    }


    // confirm payment
    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
        billing_details: {
          email: user?.email,
          name: user?.displayName,
        },
      },
    });

    if (confirmError) {
      // console.log(confirmError);
      setCardError(confirmError.message)
      setProcessing(false)
      return
    }

    if (paymentIntent.status === 'succeeded') {
      
      const paymentInfo = {
        ...bookingInfo,
        roomId: bookingInfo._id,
        transactionId: paymentIntent.id,
        date: new Date(),
      }
      delete paymentInfo._id

      try {
        await axiosSecure.post('/booking', paymentInfo)

        // Change room availability
        await axiosSecure.patch(`/room/status/${bookingInfo?._id}`,{
          status : true,
        })

        
        
        refetch()
        closeModal(false)
        toast.success('Room booked successfully')
        navigate('/dashboard/my-bookings')
      } catch (error) {
        console.log(error.message);
      }

    }
    setProcessing(false)
    
    
    

  };

  return (
    <>

      <form onSubmit={handleSubmit}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />

        <div className='flex mt-2 justify-around'>
          <button
            type="submit" disabled={!stripe || !clientSecret || processing}
            className='inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2'

          >

            {
              processing ? <ImSpinner9 className='animate-spin mx-auto' size={20}></ImSpinner9> :
                `Pay ${bookingInfo?.price}`
            }

          </button>
          <button
            onClick={closeModal}
            type='button'
            className='inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
          >
            Cancel
          </button>

        </div>
      </form>
      {cardError && <p className='text-red-600 ml-8'>{cardError}</p>}
    </>
  );
};

const stripePromise = loadStripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');


export default CheckoutForm;