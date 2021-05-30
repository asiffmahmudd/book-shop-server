const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config()

const app = express();
const port = 4000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

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
        const email = req.params.email;
        orderCollection.find({"order.user.email" : email}).sort({"order.date":-1})
        .toArray((err, documents) => {
            res.send(documents);
        })
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