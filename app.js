var createError = require('http-errors');
var express = require('express');
var path = require('path');
const bodyParser = require("body-parser");
const {spawn} = require('child_process');
const { default: axios } = require('axios');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use( function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

//SQL Connection
var SQL = require(path.resolve( __dirname + '/public/javascripts/', 'SQL_Connection.js'));
var sql = SQL.sql;


app.use(bodyParser.urlencoded({ extended:false }));
app.use(bodyParser.json())

app.get('/', (req,res) => {
  res.render('index', {title: 'Hey', message: 'Hello there'});
});

app.get("/All-Games", (req,res) => {
  res.render("All-Games-V2")
})

app.get("/Sale-Today", (req, res) => {
  res.render("Sales-Today-V2");
})

app.get("/Sales-Today-Loading", (req, res) => {
  res.render("Sales-Today-Loading");
})

app.get('/Add-Game', (req,res) =>{
  res.render('Add-Game-V2')
});

app.get('/Game-Data/:id', (req, res) => {
  sql.query("Select * from game_data where App_ID = '" + req.params.id + "'", function (err, result, fields) {
    if (err) throw err;
    res.render('Game-Added', {"result": result})
  });
})

app.post('/Game-Added', (req, res) => {
  var dataToSend;
  const python = spawn('python', [path.join(__dirname,'/public/Python/Insert_Game_Data.py'), req.body.GameID]);
  python.stdout.on('data', function (data) {
    dataToSend = data.toString();
    console.log(dataToSend)
   });
   python.on('close', (code) => {
    console.log(`child process close all stdio with code ${code}`);
    sql.query("Select * from game_data where App_ID = '" + req.body.GameID + "'", function (err, result, fields) {
      if (err) throw err;
      res.render('Game-Added', {"result": result})
    });
  });
});

app.get('/Search-Game', (req, res) => {
  res.render("Search-Game")
});

app.get('/Search-Result', (req, res) => {
  if (req.query.GameID !== '' && req.query.GameName === ''){
    sql.query("Select * from game_data where App_ID = '" + req.query.GameID.toString() + "'", function (err, result, fields){
      if (err) throw err;
      res.render('Search-Result', {"result": result})
    });
  }
  else if (req.query.GameName !== '' && req.query.GameID === ''){
    sql.query("Select * from game_data where Game_Name like '%" + req.query.GameName.toString() + "%'", function (err, result, fields){
      if (err) throw err;
      res.render('Search-Result', {"result": result})
      });
  }
  else{
    console.log("Error - No fields were filled out or both fields were filled out.")
    }
});

app.get('/Update-Daily-Deals-All', (req, res) => {
  const python = spawn('python', [path.join(__dirname,'/public/Python/Update_Discounts_GameData.py')]);
  python.stdout.on('data', function (data) {
    dataToSend = data.toString();
    console.log(dataToSend)
   });
   python.on('close', (code) => {
    console.log(`child process close all stdio with code ${code}`);
    res.redirect("/Sale-Today")
  });
});

app.get('/Sales-Date-Picker', (req, res) => {
  res.render('Sales-Date-Picker')
});

app.get('/Sales-On-Date', (req, res) => {
  Time = req.query.SaleDatePicker
  sql.query("Select * from discounts where Date = '" + Time + "' order by Discount_Percent desc", function (err, result, fields) {
    if (err) throw err;
    Discount_Result = result;
  });
  sql.query("Select * from game_data", function (err, result, fields){
    if (err) throw err;
    res.render('Sales-On-Date', {"Discount_Result": Discount_Result, "Game_Data": result, "date": Time})
  });
});

app.get('/Delete-Game', (req, res) => {
  res.render('Delete-Game')
});

app.get('/Chart', (req, res) => {
  res.render('Chart');
});

app.get('/Chart-Result', (req, res) => { 
  res.render('Chart-Result', {"App_ID":req.query.GameID})
});

app.get('/Copy-Sales-Date', (req, res) => {
  res.render('Copy-Sales-Date');
});

//API'S BELOW
//START OF DISCOUNTS API

app.get("/API/Discounts", (req, res) => {
  sql.query("Select * from discounts order by Discount_Percent desc", function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.get("/API/Discounts-Date", (req, res) => {
  Time = new Date();
  if (Time.getMonth() + 1 < 10){
    DateQuery = "'" + Time.getFullYear() + "-0" + (Time.getMonth() + 1)  + "-" + Time.getDate() + "'";
  }
  else {
    DateQuery = "'" + Time.getFullYear() + "-" + (Time.getMonth() + 1)  + "-" + Time.getDate() + "'";
  }
  sql.query('Select * from discounts where Date = ' + DateQuery + ' order by Discount_Percent desc', function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.get("/API/Discounts/:id", (req, res) => {
  sql.query(`Select * from discounts where App_ID = ${req.params.id} order by Discount_Percent desc`, function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.get("/API/Discounts/OnDate/DateRange", (req, res) => {
  sql.query(`Select * from discounts where App_ID = ${req.query.App_ID} AND Date >= "${req.query.DateBegin}" AND Date <= "${req.query.DateEnd}"`, function (err, result, fields) {
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.get("/API/Discounts/OnDate/Swap", (req, res) => {
  sql.query(`Select * from discounts where Date = "${req.query.From}" order by Discount_Percent desc`, function (err, result, fields) {
    if (err) res.send({error: err, data: null})
    else {
      console.log (`Copying data from ${req.query.From} to ${req.query.To}`)
      var num = 0;
      var end = result.length;
      while (num < end) {
        sql.query(`insert into discounts values (${result[num].App_ID}, "${req.query.To}", ${result[num].Initial_Price}, ${result[num].Discount_Percent}, ${result[num].Discount_Price});`, function (err, results, fields) {
          if (err) {
            console.log ("ERROR - UNABLE TO INSERT INTO DISCOUNTS AT API/DISCOUNTS/ONDATE/SWAP")
            console.log (`Query - insert into discounts values ${result[num].App_ID}, '${req.query.To}', ${result[num].Initial_Price}, ${result[num].Discount_Percent}, ${result[num].Discount_Price};`)
          }
        })
        num = num + 1;
      }
      res.send({error: null, data: result})
    }
  });
});


app.post("/API/Discounts", (req, res) => {
  sql.query("insert into discounts values " + req.Body.App_ID + ", '" + req.Body.Date + "', " + req.Body.Initial_Price + ", " + req.Body.Discount_Percent + ", " +
  req.Body.Discount_Price + ";", function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.delete("/API/Discounts", (req, res) => {
  sql.query("delete from discounts where App_ID = " + req.body.App_ID, function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.delete("/API/Discounts/:id", (req, res) => {
  var id = req.params.id;
  sql.query("delete from discounts where App_ID = " +id, function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

// END OF DISCOUNTS API
// START OF GAME_DATA API

app.get("/API/Game_Data", (req, res) => {
  sql.query("Select * from game_data", function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.get("/API/Game_Data/Order_By_App_ID", (req, res) => {
  sql.query("Select * from game_data order by App_ID", function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.get("/API/Game_Data/Order_By_Name", (req, res) => {
  sql.query("Select * from game_data order by Game_Name", function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.get("/API/Game_Data/Name", (req, res) => {
  sql.query(`Select * from game_data where Game_Name like "${req.query.Game_Name}"`, function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result, query:`Select * from game_data where Game_Name like "${req.query.Game_Name}"`})
  });
});

app.get("/API/Game_Data/:id", (req, res) => {
  sql.query("Select * from game_data where App_ID = " + req.params.id, function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.post("/API/Game_Data", (req, res) => {
  sql.query("insert into game_data values (" + req.body.App_ID + ", '" + req.body.Game_Name + "', '" + req.body.Description + "', " + req.body.Price + ", '" +
  req.body.IMG_Link + "', '" + req.body.Steam_Link + "', " + req.body.Coming_Soon + ", '" + req.body.Release_Date + "' , '" + req.body.Developer + "' , '" + 
  req.body.Publisher + "', " + req.body.Achievements + ", " + req.body.Max_Discount_Price + ", " + req.body.Max_Discount_Percent + ");", function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.delete("/API/Game_Data", (req, res) => {
  sql.query("delete from game_data where App_ID = " + req.body.App_ID, function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.delete("/API/Game_Data/:id", (req, res) => {
  var id = req.params.id;
  sql.query("delete from game_data where App_ID = " + id, function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

// END OF GAME_DATA API
// START OF PRICE_UPDATES API

app.get("/API/Price_Updates", (req, res) => {
  sql.query("Select * from Price_Updates", function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.get("/API/Price_Updates/:id", (req, res) => {
  sql.query("Select * from Price_Updates where App_ID = " + req.params.id, function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.get("/API/Price_Updates/OnDate/DateRange", (req, res) => {
  sql.query(`Select * from Price_Updates where App_ID = ${req.query.App_ID} AND Date > "${req.query.DateBegin}" AND Date < "${req.query.DateEnd}"`, function (err, result, fields) {
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.post("/API/Price_Updates", (req, res) => {
  sql.query("insert into Price_Updates values " + req.Body.App_ID + ", '" + req.Body.Date + "', " + req.Body.Initial_Price + ", " + req.Body.Discount_Percent + ", " +
  req.body.Discount_Percent + ";", function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.delete("/API/Price_Updates", (req, res) => {
  sql.query("delete from Price_Updates where App_ID = " + req.body.App_ID, function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

app.delete("/API/Price_Updates/:id", (req, res) => {
  var id = req.params.id;
  sql.query("delete from Price_Updates where App_ID = " + id, function (err, result, fields){
    if (err) res.send({error: err, data: null})
    else res.send({error: null, data: result})
  });
});

// END OF PRICE_UPDATES API
// STEAM API

app.get("/API/Steam-Game/:id", (req, res) => {
  axios.get(`https://store.steampowered.com/api/appdetails?appids=${req.params.id}&cc=US`)
  .then(response => {
    if (response.data[req.params.id].success === true) {
      res.send(response.data[req.params.id].data)
    }
    else if (response.data[req.params.id].success === false) {
      throw new Error ("False Error")
    }
    else {
      throw new Error ("Other Error")
    }
  }).catch(error => {
    res.send(error.message);
  })
});

// END OF STEAM API


/*OLD PAGES

====ALL GAMES=====

app.get('/All-Games', (req,res) =>{
  sql.query("Select * from game_data order by Game_Name asc", function (err, result, fields) {
    if (err) throw err;
    res.render('All-Games', {"Title" : "All Games", "result": result})
  });
});

app.get('/test', (req,res) => {
    res.render('test')
});

====ALL GAMES END====
====PYTHON TEST====

app.get('/Python-Test', (req, res) => {
  var dataToSend;
  const python = spawn('python', [path.join(__dirname,'/public/Python/script1.py')]);
  python.stdout.on('data', function (data) {
    console.log('Pipe data from python script ...');
    dataToSend = data.toString();
   });
    python.on('close', (code) => {
      console.log(`child process close all stdio with code ${code}`);
      res.send(dataToSend);
    });
});

====PYTHON TEST END====
====DELETE GAME RESULTS====

app.post('/Delete-Game-Result', (req, res) => {
  Data = "";
  var Work1 = 0;
  if (req.body.GameID !== ''){
    sql.query("Select * from game_data where App_ID = '" + req.body.GameID.toString() + "'", function (err, result, fields){
      if (err) throw err;
      Data = result
    });
    sql.query("delete from game_data where App_ID = '" + req.body.GameID.toString() + "'", function (err, result, fields){
      if (err) {Work1 = 0; throw err;}
      Work1 = 1;
    });
    sql.query("delete from discounts where App_ID = '" + req.body.GameID.toString() + "'", function (err, result, fields){
      if (err) throw err;
    });
    sql.query("delete from price_updates where App_ID = '" + req.body.GameID.toString() + "'", function (err, result, fields){
      if (err) throw err;
    });
    if (Work1 == 1){
      res.render('Delete-Game-Result', {"result": data})
    }
    else{
      console.log("Error - Failed to delete game")
    }
  }
  else{
    console.log("Error - No fields were filled out.")
    }
});

====DELETE GAME RESULTS END====
====SALES TODAY START====
/*app.get('/Sale-Today', (req,res) =>{
  Time = new Date();
  var Discount_Result;
  if (Time.getMonth() + 1 < 10){
    DateQuery = "'" + Time.getFullYear() + "-0" + (Time.getMonth() + 1)  + "-" + Time.getDate() + "'";
  }
  else {
    DateQuery = "'" + Time.getFullYear() + "-" + (Time.getMonth() + 1)  + "-" + Time.getDate() + "'";
  }
  sql.query("Select * from discounts where Date = " + DateQuery + " order by Discount_Percent desc", function (err, result, fields) {
    if (err) throw err;
    Discount_Result = result;
  });
  sql.query("Select * from game_data", function (err, result, fields){
    if (err) throw err;
    res.render('Sale-Today', {"Discount_Result": Discount_Result, "Game_Data": result})
  });
});
====SALES TODAY END====
====CHART RESULT====
app.get('/Chart-Result', (req, res) => {
  var gameID = req.query.GameID
  var discount_data;
  sql.query('select * from discounts where App_ID = ' + gameID, function (err, result, fields){
    if (err) throw err;
    discount_data = result;
  });
  sql.query('select Price from game_data where App_ID = ' + gameID, function (err, result, fields){
    if (err) throw err;
    res.render('Chart-Result', {"discount_data": discount_data, "Price": result});
  });
});

====CHART RESULT END====
*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;