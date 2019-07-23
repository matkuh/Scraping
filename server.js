var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var path = require("path");
var request = require("request");

var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

var PORT = process.env.PORT || 8080;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://heroku_xgjl43l4:6lssdt70bers6nffon1st9t7nv@ds253857.mlab.com:53857/heroku_xgjl43l4";

mongoose.connect(MONGODB_URI);


app.get("/", function (req, res) {
    Article.find({ "saved": false }, function (error, data) {
        var result = {
            article: data
        };
        console.log(result);
        res.render("home", result);
    });
});

app.get("/saved", function (req, res) {
    Article.find({ "saved": true }).populate("notes").exec(function (error, articles) {
        var result = {
            article: articles
        };
        res.render("saved", result);
    });
});


app.get("/scrape", function(req, res) {
    request("https://www.nytimes.com/", function(error, response, html) {
      var $ = cheerio.load(html);
      $("article").each(function(i, element) {
  
        var result = {};
  
  
        summary = ""
        if ($(this).find("ul").length) {
          summary = $(this).find("li").first().text();
        } else {
          summary = $(this).find("p").text();
        };
  
        result.title = $(this).find("h2").text();
        result.summary = summary;
        result.link = "https://www.nytimes.com" + $(this).find("a").attr("href");
  
        var entry = new Article(result);
  
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
  
  app.get("/articles", function(req, res) {
    Article.find({}, function(error, doc) {
      if (error) {
        console.log(error);
      }
      else {
        res.json(doc);
      }
    });
  });
  
  app.get("/articles/:id", function(req, res) {
    Article.findOne({ "_id": req.params.id })
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
  
  
  app.post("/articles/save/:id", function(req, res) {
        Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
        .exec(function(err, doc) {
          if (err) {
            console.log(err);
          }
          else {
            res.send(doc);
          }
        });
  });
  
  app.post("/articles/delete/:id", function(req, res) {
        Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "notes": []})
        .exec(function(err, doc) {
          if (err) {
            console.log(err);
          }
          else {
            res.send(doc);
          }
        });
  });
  
  
  app.post("/notes/save/:id", function(req, res) {
    var newNote = new Note({
      body: req.body.text,
      article: req.params.id
    });
    console.log(req.body)
    newNote.save(function(error, note) {
      if (error) {
        console.log(error);
      }
      else {
        Article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "notes": note } })
        .exec(function(err) {
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            res.send(note);
          }
        });
      }
    });
  });
  
  app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
    Note.findOneAndRemove({ "_id": req.params.note_id }, function(err) {
      if (err) {
        console.log(err);
        res.send(err);
      }
      else {
        Article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"notes": req.params.note_id}})
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
