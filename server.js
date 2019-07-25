var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var path = require("path");
var request = require("request");

// var Note = require("./models/Note.js");
// var Article = require("./models/Article.js");
var db = require("./models");

var PORT = process.env.PORT || 8080;

var app = express();

// middleware
app.use(logger("dev")); // request logging
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
app.use(express.static("public"));

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scraper";

mongoose.connect(MONGODB_URI);

// get request to root then find all articles that arent saved in db
// db call returns an array and put it into and object so it can be used in handlebars
// render that object to home template
app.get("/", function (req, res) {
    db.Article.find({ "saved": false })
    .then(function(data) {
        // console.log(result);
        res.render("home", {article: data});
    }).catch(function(err){
      console.log(err)
    })
});

// get request to saved route , gets all articles that are saved from db
// and gets notes associated with each article
// db call returns an array that is put into an object 
// render that object to saved template
app.get("/saved", function (req, res) {
    db.Article.find({ "saved": true }).populate("notes").exec(function (error, articles) {
        var result = {
            article: articles
        };
        res.render("saved", result);
    });
});

// get request to scrape route
// use request (http request lib) to get all info off nytimes website
// request returns all html from page
// use cheerio lib (acts like jquery server side) to traverse the html
// grabbing each summary, link and title from html
// creating an entry with that data in article collection
// sends back message to client when finished
app.get("/scrape", function(req, res) {
    request("https://www.nytimes.com/", function(error, response, html) {
      var $ = cheerio.load(html);
      $("article").each(function(i, element) {
  
        var result = {};
  
  
        var summary = ""
        if ($(this).find("ul").length) {
          summary = $(this).find("li").first().text();
        } else {
          summary = $(this).find("p").text();
        };
  
        result.title = $(this).find("h2").text();
        result.summary = summary;
        result.link = "https://www.nytimes.com" + $(this).find("a").attr("href");
  
        var entry = new db.Article(result);
  
        entry.save(function(err, doc) {
          if (err) {
            console.log(err);
          }
          else {
            console.log(doc);
          }
        });
  
      });
         res.send("Scrape Complete");
    });
});
  
// get request to articles route to get all articles without filter
// send back all articles found as an array to the client
  app.get("/articles", function(req, res) {
    db.Article.find({}, function(error, doc) {
      if (error) {
        console.log(error);
      }
      else {
        res.json(doc);
      }
    });
  });
  
  // get request to particular articles route (article by id)
  // finding one article that is particle to the id passed through parameter (parameter is passed through the article route)
  app.get("/articles/:id", function(req, res) {
    db.Article.findOne({ "_id": req.params.id })
    .populate("note")
    .exec(function(error, doc) {
      if (error) {
        console.log(error);
      }
      else {
        res.json(doc);
      }
    });
  });
  
  // post request to articles saved by id route
  // finds one article by id and updates saved from false to true
  // sends the updated article back to client
  app.post("/articles/save/:id", function(req, res) {
        db.Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
        .exec(function(err, doc) {
          if (err) {
            console.log(err);
          }
          else {
            res.send(doc);
          }
        });
  });
  

  // post request to articles delete by id route
  // finds one article by id and updates saved from true to false and removes notes references
  // sends back updated article to client
  app.post("/articles/delete/:id", function(req, res) {
       db.Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "notes": []})
        .exec(function(err, doc) {
          if (err) {
            console.log(err);
          }
          else {
            res.send(doc);
          }
        });
  });
  
  

  // post request to notes saved by article id route
  //  create a note with data passed to server from client
  // then finds article by id and add the created notes id as a reference to the article
  // sends back the notes and article info to client
  app.post("/notes/save/:id", function(req, res) {
    var newNote = new db.Note({
      body: req.body.text
    });
  
    newNote.save(function(error, note) {
      if (error) {
        console.log(error);
      }
      else {
        db.Article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "notes": note._id } })
        .exec(function(err) {
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            console.log(note)
            res.send(note);
          }
        });
      }
    });
  });
  
  // delete request to notes delete by note and article id route
  // finds an article by id and remove it from db
  // then finds an article by id and remove the notes reference from it
  // sends back message to client
  app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
    db.Note.findOneAndRemove({ "_id": req.params.note_id }, function(err) {
      if (err) {
        console.log(err);
        res.send(err);
      }
      else {
        db.Article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"notes": req.params.note_id}})
          .exec(function(err) {
            if (err) {
              console.log(err);
              res.send(err);
            }
            else {
              res.send("Note Deleted");
            }
          });
      }
    });
  });


app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
