const express = require('express');
const mysql = require('mysql');
const fs = require("fs");
const fastcsv = require("fast-csv");
const multer = require("multer");
const app = express();
const PORT = 3000;
const path =require('path');

var Promise = require('promise');
global.__basedir = __dirname;

// database credentials
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "practise"
  });

// connection to database
var connectdb = new Promise(function(resolve, reject) { 
    connection.connect((err,response) =>{
        if(err) {
            reject(err);
        }
        else {
            console.log("Connected to database");
            resolve(err);
        }
    })
});

// creates table in database if it doesn't exists
var createTable = function(query) {    
    return new Promise(function(resolve, reject) {
        connection.query(query, (err,response) =>{
            if(err){
                reject(err);
            }
            else {
                console.log("Created table if it doesn't exists");
                resolve(response);
            }
        });
    });
}

// Inserts data into the table data if present.
var insertData = function(query, [csvData] ) {    
    return new Promise(function(resolve, reject) { 
        connection.query(query, [csvData], (err,response) =>{
            if(err) {
                console.log("Error inserting data into a table: ",err);
                reject(err);
            }
            else {
                console.log("Inserted the data into table");
               resolve(response);
            }
        });
    });
}

// gets data from the database if present.
function getData(query) { 
    return new  Promise(function(resolve, reject) { 
        connection.query(query,function (err, rows, fields){
            if (err) {
                console.log("Error getting data from the table: ",err);
                reject(err);
            }
            else {
                console.log("Retrieved the data from table");
                rws = JSON.parse(JSON.stringify(rows));
                fie = JSON.parse(JSON.stringify(fields));
                resolve([rows, fields]);
            }
        });
    });   
    
}


//  Multer Upload Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
       cb(null, __basedir + '/tmp/')
    },
    filename: (req, file, cb) => {
       cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
    }
  });
   
const upload = multer({storage: storage});

// GET API takes request and returns the json object of "data" table in the database.

app.get('/get', function (req, res) {
    var result;
    fromDataBase()
    .then((response)=>{
        result = JSON.parse(JSON.stringify(response));
        res.status(200);
        res.end(JSON.stringify(result));
    })
    .catch((err) => {
        res.status(404);
        res.end(err.toString());
    });
 })

// POST API checks whether the file uploaded was csv or not and creates the data table with contents of csv file.

app.post('/uploads/', upload.single('csv'), (req, res) =>{

    var file_ext = path.extname(req.file.filename);
      if (file_ext !== ".csv") {
        return res.status(403).json({ error: validationError });
      }
      else {
        ToDataBase(__basedir + '/tmp/' + req.file.filename);
        res.status(200);
        res.json({
              'msg': 'File uploaded/import successfully!', 'file': req.file
            });
      }

      return res
    });


//Creates the table "data" in database if not present and appends the csv contents to the table.

function ToDataBase(filepath){

    let stream = fs.createReadStream(filepath);
    // deleting the temporary file uploaded after read.
    fs.unlink(filepath, function(err) {
        if (err) {
          throw err
        } else {
          console.log("Successfully deleted the file.")
        }
      })
    let csvData = [];
    let create_query = "CREATE TABLE IF NOT EXISTS data( id INT, name VARCHAR(40), date BIGINT, steps INT, calories INT)";    // query to create table if not present
    let insert_query ="INSERT INTO data (id, name, date, steps, calories) VALUES ?";  // query to insert the data into table
    let csvStream = fastcsv
    .parse()
    .on("data", function(data) {
        csvData.push(data);
    })
    .on("end", function() {
            csvData.shift();
            //connection
            connectdb
                .then((response)=>{
                    // creating Table if not present before;
                    createTable(create_query)
                    .then(function(){
                        // inserting the data to the table created before.
                        insertData(insert_query, [csvData])
                        .catch((err) => console.log("Error while inserting data into the table.",err));
                    })
                    .catch((err) => console.log("Error in creating table: ",err));
                })
                .catch((err) => console.log("Error connecting to database. ",err));
            });
    
    stream.pipe(csvStream);
}

// gets the data from "data" table if data table was present in database.
async function fromDataBase(){
    var result;
    var fields;
    var error;
    let query3 = "SELECT * from data";
    await connectdb
        .then(async function (){
        await getData(query3)
        .then((response) =>{
            result = response[0];
            console.log("Data was retrieved from the database.");
            fields = response[1];
        })
        .catch((err) => {
            console.log("Error in getting data: "); 
            error =err;
        });
        })
        .catch((err) => {console.log("Error connecting to database. ",err);
        error =err;
        });
        return new  Promise(function(resolve, reject) { 
            if(result) {resolve(result);}
            else {reject(error); }
        });
}

app.listen(PORT,function(){
    console.log("server is running on port ",PORT);
 });