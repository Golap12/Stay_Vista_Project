import React, { useState } from 'react';
import AddRoomForm from '../../../components/Form/AddRoomForm';
import { toast } from 'react-hot-toast';
import useAuth from './../../../hooks/useAuth';
import { imageUpload } from '../../../Api/Utils';
import { Helmet } from 'react-helmet-async';
import { useMutation } from '@tanstack/react-query';
import useAxiosSecure from './../../../hooks/useAxiosSecure';
import { useNavigate } from 'react-router-dom';

const AddRoom = () => {
    const navigate = useNavigate()
    const {loading, setLoading } = useAuth()
    const axiosSecure = useAxiosSecure()
    const [imagePreview, setImagePreview] = useState();
    const [imageText, setImageText] = useState('Upload Image');
    const { user } = useAuth()

    const [date, setDate] = useState(
        {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection'
        }
    );
    const handleDate = range => {
        setDate(range.selection)
    }


    const { mutateAsync } = useMutation({
        mutationFn: async (roomData) => {
            const { data } = await axiosSecure.post(`/room`, roomData)
            return data
        },
        onSuccess: () => {
            
            toast.success('Room Added Successful')
            navigate('/dashboard/my-listings')
            setLoading(false)
        }

    })


    const handleSubmit = async e => {
        
        e.preventDefault()
        setLoading(true)
        const form = e.target
        const location = form.location.value
        const title = form.title.value
        const category = form.category.value
        const to = date.endDate
        const from = date.startDate
        const price = form.price.value
        const guests = form.total_guest.value
        const bathrooms = form.bathrooms.value
        const description = form.description.value
        const bedrooms = form.bedrooms.value
        const image = form.image.files[0]
        const host = {
            name: user?.displayName,
            image: user?.photoURL,
            email: user?.email
        }

        try {
            const image_Url = await imageUpload(image)
            const roomData = {
                location,
                title,
                category,
                to,
                from,
                price,
                guests,
                bathrooms,
                description,
                bedrooms,
                host,
                image: image_Url,
            }

            // send room data to server 

            await mutateAsync(roomData)

        } catch (error) {
            toast.error(error.message)
            setLoading(false)
        }


    }

    const handleImage = image => {
        setImagePreview(URL.createObjectURL(image))
        setImageText(image.name)
    }



    return (

        <>

            <Helmet>
                <title>Add Room | Dashboard</title>
            </Helmet>
            <AddRoomForm
                date={date}
                handleDate={handleDate}
                handleSubmit={handleSubmit}
                setImagePreview={setImagePreview}
                imagePreview={imagePreview}
                handleImage={handleImage}
                imageText={imageText}
                loading={loading}
            >
            </AddRoomForm>
        </>
    );
};

export default AddRoom;