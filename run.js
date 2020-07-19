const mysql = require('mysql');
const fs = require("fs");
const fastcsv = require("fast-csv");
const path =require('path');
const date_ob = new Date();
var Promise = require('promise');
const cron  = require('node-cron');
global.__basedir = __dirname;


// credenntials for database
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

// creates table in database with file name without extension if not exists
var createTable = function(file) {    
    return new Promise(function(resolve, reject) { 
        var query = "CREATE TABLE IF NOT EXISTS "+ file.slice(0,-4) +" ( id INT, name VARCHAR(40), date BIGINT, steps INT, calories INT)";
        connection.query(query, (err,response) =>{
            if(err){reject(err);}
            else {
                console.log("Created table or table present before. ",file.slice(0,-4));
                resolve(file);
            }
        });
    });
}


// inserts data into the respective table of csv file
var insertData = async function(file, [csvData] ) {    
    return await new Promise(function(resolve, reject) { 
        var query ="INSERT INTO "+ file.slice(0,-4) + " (id, name, date, steps, calories) VALUES ?";
        connection.query(query, [csvData], (err,response) =>{
            error =err;
            if(err) {
                console.log("Error inserting data into a table: ",err);
                reject(err);
            }
            else {
                console.log("Inserted the data into table ",file.slice(0,-4));
                resolve(file);
            }
        });
    });
    
}

// Drops the table of mentioned file if it exists
async function dropTable(file) { 
    return await new  Promise(function(resolve, reject) { 
        const query = "DROP TABLE IF EXISTS " + file.slice(0,-4);
        connection.query(query,(err, res) => {
            if (err) {
                console.log("Error while dropping the table.",err);
                reject(err);
            }
            else {
                console.log("Dropped the table from Database");
                resolve(file);
            }
        });
    });   
    
}

const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

// function which does Drop,Create, Insert operations for each modified file.
function eachFile(dir_path,files,day) { 
    return new Promise(function(resolve, reject) { 
        var error;
        var num_modified_files =0 ;     // number of modified files in the folder.
        var count =0;   // counts number of insert operations occured.
        for ( var index = 0; index < files.length; index++) {
            const file = files[index];
            // check for csv files
            var file_ext = path.extname(file);
            if(file_ext == ".csv"){
                var filePath = path.join(dir_path, file);
                var fileStats = fs.statSync(filePath);
                var modifiedDay = fileStats.mtime.toDateString().substr(8,2);
                // if file was modified today.
                if(modifiedDay === day){
                    num_modified_files++;
                    let csvData = [];
                    let stream = fs.createReadStream(filePath);
                    let csvStream = fastcsv
                    .parse()
                    .on("data", function(data) {
                        csvData.push(data);
                    })
                    .on("end",function() {
                            csvData.shift();
                            // dropping the table from database.
                            dropTable(file)
                            .then((res)=>{
                                console.log("Dropping the table: ",res.slice(0,-4));
                                // creating Table if not present before;
                                 createTable(res)
                                .then(function(res){
                                    // inserting the data to the table created before.
                                     insertData(res,[csvData])
                                    .then(()=>{count++;
                                        if(count === num_modified_files) {
                                            var res; 
                                            waitFor(1).then((resp)=>{res=resp;}); 
                                            return resolve(res);
                                        }
                                    })
                                    .catch((err) => {
                                        error =err;
                                        console.log("Error while inserting data into the table.",err);
                                    });
                                })
                                .catch((err) => {
                                    error =err;
                                    console.log("Error in creating table: ",err);
                                });
                            })
                            .catch((err)=>{ 
                                error =err;
                                console.log("Error while dropping the table");
                            });
                    })
                    stream.pipe(csvStream);
                }
            } 
        }
        if(error) {reject(error);}
        if(num_modified_files === 0) {
            var res;
            waitFor(1).then((resp)=>{res=resp;});
            resolve(res);
        }
    }); 
}

// function which gets all the files in the given directory path.
 function checkDir(dir_path,day) { 
    return  new  Promise(function(resolve, reject) { 
        fs.readdir(dir_path, async function (err, files) {
            if (err) {
                console.log('Unable to find or open the directory: ' + err);
                reject(err);
            }
            // each files
            else {
                await eachFile(dir_path,files,day)
                .then((res)=>resolve(res))
                .catch((err)=>reject(err));
            }
        });

    });   
    
}

cron.schedule("59 23 * * * ", function(){
    const dir_path = path.join(__dirname, '/data/');        // path of directory to check.
    const day =  ("0" + date_ob.getDate()).slice(-2);       // today
    // db connection
    connectdb
    .then( async()=>{
        await checkDir(dir_path,day)
        .then(()=> {console.log("Successfully modified the database.");})
        .catch((err)=>console.log("Error: ",err));
    })
    .catch((err) => console.log("Error connecting to database. ",err));

})


