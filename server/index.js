const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const nodemailer = require("nodemailer");
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const e = require('express')

const stripe = require("stripe")(process.env.VITE_STRIPE_SECRET_KEY)

const port = process.env.PORT || 8000

// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())


// Send Email
const sendEmail = (emailAddress, emailData) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.TRANSPORTER_EMAIL,
      pass: process.env.TRANSPORTER_PASS,
    },
  });


  // verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  const mailBody = {
    from: `"Stay Vista" <${process.envTRANSPORTER_EMAIL}>`, // sender address
    to: emailAddress, // list of receivers
    subject: "Hello", // Subject line
    html: emailData.message, // html body
  }

  transporter.sendMail(mailBody, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email Sent : ' + info.response);
    }
  });

}

// Verify Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token
  console.log(token)
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0cyoac0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0cyoac0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {

    const db = client.db('stay-vista')
    const roomsCollection = db.collection('rooms')
    const userCollection = db.collection('users')
    const bookingsCollection = db.collection('bookings')


    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const user = req.user
      const query = { email: user?.email }
      const result = await userCollection.findOne(query)
      if (!result || result?.role !== 'admin') return res.status(401).send({
        message: 'Unauthorize Access'
      })
      next()
    }


    // verify host
    const verifyHost = async (req, res, next) => {
      const user = req.user
      const query = { email: user?.email }
      const result = await userCollection.findOne(query)
      if (!result || result?.role !== 'host') return res.status(401).send({
        message: 'Unauthorize Access'
      })
      next()
    }



    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })
    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
        console.log('Logout successful')
      } catch (err) {
        res.status(500).send(err)
      }
    })


    // Create payment intent
    app.post("/create-payment-intent", verifyToken, async (req, res) => {
      const price = req.body.price;
      const priceInCent = parseFloat(price)
      if (!price || priceInCent < 1) return;
      const { client_secret } = await stripe.paymentIntents.create({
        amount: price,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      })
      res.send({ clientSecret: client_secret })

    })



    // save a user data in db 
    app.put('/user', async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      // Check if user all ready in db
      const isExists = await userCollection.findOne(query)
      if (isExists) {
        if (user.status === 'Requested') {
          const result = await userCollection.updateOne(query, {
            $set: { status: user?.status }
          });
          return res.send(result)
        } else {
          return res.send(isExists)
        }
      }

      // save user for the first time 
      const options = { upsert: true };

      const UpdateDoc = {
        $set: {
          ...user,
          timestamp: Date.now()
        }
      }
      const result = await userCollection.updateOne(query, UpdateDoc, options);
       // Send Email to host
       sendEmail(user?.email, {
        subject: 'Welcome to Stay Vista',
        message: `Hope you will find tour destination.`
      })
      res.send(result);
    })


    // get a user info by email from db
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    })


    // Get all users data from db
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })


    // update a user role
    app.patch('/user/update/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const query = { email }
      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now()
        }
      }
      const result = await userCollection.updateOne(query, updateDoc)
      res.send(result)
    })


    // get all rooms data 
    app.get('/rooms', async (req, res) => {
      const category = req.query.category;
      let query = {}
      if (category && category !== 'null') query = { category }
      const result = await roomsCollection.find(query).toArray();
      res.send(result);
    })



    // save a room data in db
    app.post('/room', verifyToken, verifyHost, async (req, res) => {
      const roomData = req.body;
      const result = await roomsCollection.insertOne(roomData);
      res.send(result);
    })


    // Get all rooms for hosts
    app.get('/my-listings/:email', verifyToken, verifyHost, async (req, res) => {
      const email = req.params.email;
      const query = { 'host.email': email };
      const result = await roomsCollection.find(query).toArray();
      res.send(result);
    });


    // Delete a Room
    app.delete('/room/:id', verifyToken, verifyHost, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomsCollection.deleteOne(query);
      res.send(result)
    })



    // get a single room data 
    app.get('/room/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomsCollection.findOne(query);
      res.send(result);
    })



    // save a booking data in db
    app.post('/booking', verifyToken, async (req, res) => {
      const bookingData = req.body;
      const result = await bookingsCollection.insertOne(bookingData);
      // Send Email to guest
      sendEmail(bookingData?.guest?.email, {
        subject: 'Booking Successful',
        message: `You have successfully booked a room through Stay Vista. Transaction Id : ${bookingData.transactionId}`
      })
      // Send Email to host
      sendEmail(bookingData?.host?.email, {
        subject: 'Your room got booked',
        message: `Get ready to welcome ${bookingData?.guest?.name}.`
      })
      res.send(result);
    })


    // update room data
    app.put('/room/update/:id', verifyToken, verifyHost, async (req, res) => {
      const id = req.params.id
      const roomData = req.body
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: roomData
      }

      const result = await roomsCollection.updateOne(query, updateDoc)
      res.send(result)
    })


    // change room available status
    app.patch('/room/status/:id', async (req, res) => {
      const id = req.params.id
      const status = req.body.status
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: { booked: status }
      }
      const result = await roomsCollection.updateOne(query, updateDoc)
      res.send(result)
    })


    // Get all booking for a guest
    app.get('/my-bookings/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { 'guest.email': email };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    })


    // Get all booking for a host
    app.get('/manage-bookings/:email', verifyToken, verifyHost, async (req, res) => {
      const email = req.params.email;
      const query = { 'host.email': email };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    })


    // cancel a booked rom
    app.delete('/booking/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result)
    })





    // Admin Statistics
    app.get('/admin-stat', verifyToken, verifyAdmin, async (req, res) => {
      const bookingDetails = await bookingsCollection.find({}, {
        projection: {
          date: 1,
          price: 1,
        }
      }).toArray()

      const totalUsers = await userCollection.countDocuments()
      const totalRooms = await roomsCollection.countDocuments()
      const totalPrice = bookingDetails.reduce((sum, booking) => sum + booking.price, 0)

      const chertData = bookingDetails.map(booking => {
        const day = new Date(booking.date).getDate()
        const month = new Date(booking.date).getMonth() + 1
        const data = [`${day} / ${month}`, booking.price]
        return data
      })

      chertData.unshift(['Day', 'Sales'])
      // chertData.splice(0,0,["Day", "Sales"])

      res.send({ totalUsers, totalRooms, totalPrice, totalBookings: bookingDetails.length, chertData })
    })



    // Host Statistics
    app.get('/host-stat', verifyToken, verifyHost, async (req, res) => {
      const { email } = req.user
      const bookingDetails = await bookingsCollection.find(
        { 'host.email': email },
        {
          projection: {
            date: 1,
            price: 1,
          }
        }).toArray()

      const totalRooms = await roomsCollection.countDocuments({
        'host.email': email
      })
      const totalPrice = bookingDetails.reduce((sum, booking) => sum + booking.price, 0)

      const { timestamp } = await userCollection.findOne({ email }, { projection: { timestamp: 1 } })

      const chertData = bookingDetails.map(booking => {
        const day = new Date(booking.date).getDate()
        const month = new Date(booking.date).getMonth() + 1
        const data = [`${day} / ${month}`, booking.price]
        return data
      })

      chertData.unshift(['Day', 'Sales'])
      // chertData.splice(0,0,["Day", "Sales"])

      res.send({
        totalRooms,
        totalPrice,
        totalBookings: bookingDetails.length,
        chertData,
        hostSince: timestamp
      })
    })



    // Guest Statistics
    app.get('/guest-stat', verifyToken, async (req, res) => {
      const { email } = req.user
      const bookingDetails = await bookingsCollection.find(
        { 'guest.email': email },
        {
          projection: {
            date: 1,
            price: 1,
          }
        }).toArray()

      const totalPrice = bookingDetails.reduce((sum, booking) => sum + booking.price, 0)

      const { timestamp } = await userCollection.findOne({ email }, { projection: { timestamp: 1 } })

      const chertData = bookingDetails.map(booking => {
        const day = new Date(booking.date).getDate()
        const month = new Date(booking.date).getMonth() + 1
        const data = [`${day} / ${month}`, booking.price]
        return data
      })

      chertData.unshift(['Day', 'Sales'])
      // chertData.splice(0,0,["Day", "Sales"])

      res.send({
        totalPrice,
        totalBookings: bookingDetails.length,
        chertData,
        guestSince: timestamp
      })
    })



    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)




app.get('/', (req, res) => {
  res.send('Hello from StayVista Server..')
})

















app.listen(port, () => {
  console.log(`StayVista is running on port ${port}`)
})
