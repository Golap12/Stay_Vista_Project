import { createBrowserRouter } from 'react-router-dom'
import Main from '../layouts/Main'
import Home from '../pages/Home/Home'
import ErrorPage from '../pages/ErrorPage'
import Login from '../pages/Login/Login'
import SignUp from '../pages/SignUp/SignUp'
import RoomDetails from '../pages/RoomDetails/RoomDetails'
import PrivateRoute from './PrivateRoute'
import DashboardLayout from './../layouts/DashboardLayout';
import Statistics from '../pages/Dashboard/Common/Statistics'
import AddRoom from './../pages/Dashboard/Host/AddRoom';
import MyListings from './../pages/Dashboard/Host/MyListings';
import Profile from '../pages/Dashboard/Common/Profile'
import ManageUser from '../pages/Dashboard/Admin/ManageUser';
import AdminRoute from './AdminRoute'
import HostRoute from './Hostroute'
import MyBookings from '../pages/Dashboard/Guest/MyBookings'
import ManageBookings from '../pages/Dashboard/Host/ManageBookings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Main />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/room/:id',
        element: <PrivateRoute><RoomDetails /></PrivateRoute>,
      },
    ],
  },

  { path: '/login', element: <Login /> },
  { path: '/signup', element: <SignUp /> },

  {
    path: '/dashboard',
    element: <PrivateRoute><DashboardLayout></DashboardLayout></PrivateRoute>,
    children: [
      {
        index: true,
        element: <PrivateRoute><Statistics></Statistics></PrivateRoute>
      },

      {
        path: 'add-room',
        element:
          <PrivateRoute>
            <HostRoute>
              <AddRoom></AddRoom>
            </HostRoute>
          </PrivateRoute>
      },

      {
        path: 'my-listings',
        element:
          <PrivateRoute>
            <HostRoute>
              <MyListings></MyListings>
            </HostRoute>
          </PrivateRoute>
      },

      {
        path: 'manage-bookings',
        element:
          <PrivateRoute>
            <HostRoute>
              <ManageBookings></ManageBookings>
            </HostRoute>
          </PrivateRoute>
      },

      {
        path: 'my-bookings',
        element:
          <PrivateRoute>
              <MyBookings></MyBookings>
          </PrivateRoute>
      },



      {
        path: 'profile',
        element: <PrivateRoute><Profile></Profile></PrivateRoute>
      },
      {
        path: 'manage-users',
        element: <PrivateRoute><AdminRoute><ManageUser></ManageUser></AdminRoute></PrivateRoute>
      },
    ],
  },
])
