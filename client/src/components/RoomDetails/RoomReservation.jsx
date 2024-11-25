import PropTypes from 'prop-types'
import Button from '../Shared/Button/Button'
import { useState } from 'react';
import { DateRange } from 'react-date-range';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import BookingModal from '../Modal/BookingModal';
import useAuth from './../../hooks/useAuth';

const RoomReservation = ({ room, refetch }) => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false);

  const [state, setState] = useState([
    {
      startDate: new Date(room.from),
      endDate: new Date(room.to),
      key: 'selection'
    }
  ]);


  const closeModal = () => {
    setIsOpen(false)
  }


  const totalPrice = parseInt(
    differenceInCalendarDays(new Date(room.to), new Date(room.from)) * room?.price
  )


  return (
    <div className='rounded-xl border-[1px] border-neutral-200 overflow-hidden bg-white'>
      <div className='flex items-center gap-1 p-4'>
        <div className='text-2xl font-semibold'>$ {room?.price}</div>
        <div className='font-light text-neutral-600'>night</div>
      </div>
      <hr />
      <div className='flex justify-center'>
        <DateRange
          rangeColors={['#F43F5E']}
          showDateDisplay={false}
          dragSelectionEnabled={false}
          // editableDateInputs={true}
          onChange={item => setState([{
            startDate: new Date(room.from),
            endDate: new Date(room.to),
            key: 'selection'
          }])}
          moveRangeOnFirstSelection={false}
          ranges={state}
        />
      </div>
      <hr />
      <div className='p-4'>
        <Button 
        disabled={room.booked === true} 
        onClick={() => setIsOpen(true)} 
        label={room.booked === true? 'Booked':'Reserve'} />
      </div>

      {/* Modal */}
      <BookingModal
        refetch={refetch}
        closeModal={closeModal}
        isOpen={isOpen}
        bookingInfo={{
          ...room,
          price: totalPrice,
          guest: {
            name: user?.displayName,
            email: user?.email,
            image: user.photoURL
          }
        }}
      >

      </BookingModal>


      <hr />
      <div className='p-4 flex items-center justify-between font-semibold text-lg'>
        <div>Total</div>
        <div>${totalPrice}</div>
      </div>
    </div>
  )
}

RoomReservation.propTypes = {
  room: PropTypes.object,
}

export default RoomReservation
