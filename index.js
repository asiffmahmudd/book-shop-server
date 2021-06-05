const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config()
const admin = require('firebase-admin');

const app = express();
const port = 4000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

admin.initializeApp({
    credential: admin.credential.cert({
        "type": process.env.JWT_TYPE,
        "project_id": process.env.PROJECT_ID,
        "private_key_id": process.env.PRIVATE_KEY_ID,
        "private_key": process.env.PRIVATE_KEY,
        "client_email": process.env.CLIENT_EMAIL,
        "client_id": process.env.CLIENT_ID,
        "auth_uri": process.env.AUTH_URI,
        "token_uri": process.env.TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL
    }),
    databaseURL: process.env.DB_URL
});

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a3ov0.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    
    const booksCollection = client.db(process.env.DB_NAME).collection("books");
    const orderCollection = client.db(process.env.DB_NAME).collection("orders");
    
    app.post("/addBook", (req, res) => {
        const book = req.body;
        booksCollection.insertOne({book})
        .then(result => res.send(result.insertedCount > 0))
    })
    
    app.get("/books", (req, res) => {
        booksCollection.find({})
        .toArray((err, documents) =>{
            res.send(documents);
        })
    })

    app.get("/book/:search", (req,res) => {
        booksCollection.find({ $text: { $search: req.params.search } })
        .toArray((err, documents) => {
            res.send(documents);
        })
    })

    app.delete("/book/:id", (req,res) => {
        booksCollection.deleteOne({
            _id : ObjectId(req.params.id)
        })
        .then(result => {
            res.send(result.deletedCount > 0);
        })
    })

    app.get("/checkout/:id", (req,res) => {
        booksCollection.find({
            _id : ObjectId(req.params.id)
        })
        .toArray((err, document) => {
            res.send(document);
        })
    })

    app.post("/placeOrder", (req,res) => {
        const order = req.body;
        orderCollection.insertOne({order})
        .then(result => {
            res.send(result.insertedCount > 0)
        })
    })

    app.get('/orders/:email', (req,res) => {
        const bearer = req.headers.authorization;
        if(bearer && bearer.startsWith('Bearer ')){
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
            .then((decodedToken) => {
                const decodeEmail = decodedToken.email;
                const reqEmail = req.params.email;
                if(decodeEmail === reqEmail){
                    orderCollection.find({"order.user.email" : reqEmail}).sort({"order.date":-1})
                    .toArray((err, documents) => {
                        res.send(documents);
                    })
                }
                else{
                    res.status(401).send("Unauthorized access")
                }
            })
            .catch((error) => {
                res.status(401).send("Unauthorized access")
            });
        }
        else{
            res.status(401).send("Unauthorized access")
        }
    })

    app.put('/editInfo/:id', (req,res) => {
        const {bookName, author, price} = req.body.data
        booksCollection.updateOne(
            {_id: ObjectId(req.params.id)}, 
            {
                $set: 
                    {
                        "book.name": bookName, 
                        "book.author": author, 
                        "book.price": price
                    }   
            }
        )
        .then(result => {
            res.send(result.modifiedCount > 0)
        })
    })
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(process.env.PORT || port)