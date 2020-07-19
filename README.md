# 1. Built_API
The aim of this project is to build get and post apis in nodejs using express for importing the csv files from user,store it in database and fetching the data to user.

This project consists of two tasks.

* To make GET and POST APIs using express and to modify the MySQL database.
* To build a script which checks every day for the changes in the csv files of **data** directory.

## Task-1 :-

    This task is to create Get API call for getting the contents of a "data" table from the database provided in connection object and to create Post API call for appending the contents of attached csv file to "data" table in the database provided.

### Prerequisites:

* npm       6.1.0
* Node      10.3,0
* MySQL     8.0.21
* Postman  7.28.0
* modules of Node:
    "express": "^4.17.1",
    "fast-csv": "^4.3.1",
    "fs": "0.0.1-security",
    "multer": "^1.4.2",
    "mysql": "^2.18.1",
    "node-cron": "^2.0.3",
    "promise": "^8.1.0" ,
    "nodemon": "^2.0.4"




_Before executing the main file (index.js) , need to change the credentials in connection object._
_The key of the file uploaded in Post API call is **csv**._

## Execute:
    
    You can execute the program by the command `npm start` .

### What it does ?

    It connects to the database of provided credentials.
    For Post API call, It takes the file uploaded and checks whether it is csv file or not, appends the contents of csv file to data table in the provided database.
    For Get API call,  If data table present in the provided database then it returns the table contents in JSON object else it returns the error (data table doesn't exists).


## Task-2 :

    This task is to build a script so that it checks for the modified csv files in **data** directory and updates the corresponding tables in database with those modified csv files contents. 


### Prerequisites:

* npm       6.1.0
* Node      10.3,0
* MySQL     8.0.21
* modules of Node:
    "fast-csv": "^4.3.1",
    "fs": "0.0.1-security",
    "mysql": "^2.18.1",
    "node-cron": "^2.0.3",
    "promise": "^8.1.0" ,


Constraints : The csv files in the data directory shouldn't contain the '-' in file names. It needed to be converted into underscore('_') .

## Execute:
    
    You can execute the program by the command `node run.js` .

## What it does ?

    It connects to the database of provided credentials.
    Checks for the csv modified files in the **data** directory at 11:59 pm everyday.
    Modifies the tables of corresponding modified csv files in the database with contents of the modified files.


