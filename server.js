var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var path = require("path");

var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

var PORT = 8080;

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

mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });

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


app.get("/scrape", function (req, res) {
    axios.get("https://old.reddit.com/").then(function (response) {
        var $ = cheerio.load(response.data);

        $("article").each(function (i, element) {
            var result = {};

            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            db.Article.create(result)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });

        res.send("Scrape Complete");
    });
});

app.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get("/articles/:id", function (req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("note")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.post("/articles/:id", function (req, res) {
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});


app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
