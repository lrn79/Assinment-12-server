const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const { ObjectId, MongoClient, ServerApiVersion } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);




// middleware
app.use(cors());
app.use(express.json());

// main Works
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5vhbt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const productCollection = client.db('manufactureDB').collection('tools')
        const reviewCollection = client.db('manufactureDB').collection('review')
        const orderCollection = client.db('manufactureDB').collection('order')
        const userCollection = client.db('manufactureDB').collection('users')
        const paymentCollection = client.db('manufactureDB').collection('payment')

        // Start

        // Payment intent
        app.post('/create-payment-intent', async (req, res) => {
            const service = req.body;
            const price = service.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        });
        // Get all users Api
        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users)
            // LINK : http://localhost:5000/user
        })
        // requre admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })
        // put all users
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;

            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });
        // Make Admin

        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;

            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })
        // All Tools API 
        app.get('/allTools', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
            // ALL Tools LINK : http://localhost:5000/allTools
        });
        // Add New tools Or Products 
        app.post('/addTools', async (req, res) => {
            const newtools = req.body;
            const result = await productCollection.insertOne(newtools);
            res.send(result)
        });
        // delete tools

        app.delete("/deleteTools/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(filter);
            res.send(result);
        });

        // Get Order Now fdg

        app.get('/orderNow/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const service = await productCollection.findOne(query);
            res.send(service);
            // Link : http://localhost:5000/orderNow/${id}.....
        });
        // get Review Server
        app.get('/allReview', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
            // ALL Tools LINK : http://localhost:5000/allReview
        });
        // For adding a new Reviews
        app.post('/addReview', async (req, res) => {
            const newReview = req.body;
            const result = await reviewCollection.insertOne(newReview);
            res.send(result)
        });
        // ordered person data
        app.post('/order', async (req, res) => {
            const newOrder = req.body;
            const result = await orderCollection.insertOne(newOrder);
            res.send(result)
            // LINK : http://localhost:5000/order
        });
        // All ordered API 
        app.get('/allOrdered', async (req, res) => {
            const query = {};
            const cursor = orderCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
            // ALL Tools LINK : http://localhost:5000/allOrdered
        });
        // For payment 
        app.get('/allOrdered/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) };
            const service = await orderCollection.findOne(query);
            res.send(service);
            // Link : http://localhost:5000/allOrdered/${id}
            // Link : http://localhost:5000/allOrdered/628f4ffa321cc4cc8859a6c1
        });
        // get my order
        app.get('/ordered/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const myOrder = await orderCollection.find(filter).toArray()
            res.send(myOrder);
            // ALL Tools LINK : http://localhost:5000/allOrdered
        });
        // For update
        app.patch('/ordered/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }

            const result = await paymentCollection.insertOne(payment);
            const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
            res.send(updatedDoc);
        })
        // End
    }
    finally {

    }
}
run().catch(console.dir())


app.get('/', (req, res) => {
    res.send('Running My Node CRUD Server');
});

app.listen(port, () => {
    console.log('CRUD Server is running');
})

// pass : jIh8yAbUYhKe6Hw8
// userName: manufactureDB 