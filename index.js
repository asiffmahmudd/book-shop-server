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
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a3ov0.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    
    const booksCollection = client.db(process.env.DB_NAME).collection("books");
    
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
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(process.env.PORT || port)