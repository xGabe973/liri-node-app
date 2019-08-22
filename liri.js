// APi Key and Secret
var keys = require("./keys.js");
var Spotify = require('node-spotify-api');
var spotify = new Spotify(keys.spotify);

var moment = require("moment");
var axios = require("axios");
var fs = require("fs");

var command = process.argv[2];
var search = process.argv.slice(3).join(" ");
var movieSearch = false;

function buildSearchURL() {
    if (movieSearch) {
        var queryURL = "http://www.omdbapi.com/?t=" + search + "&y=&plot=short&apikey=trilogy";
   } else {
       var queryURL = "https://rest.bandsintown.com/artists/" + search + "/events?app_id=codingbootcamp"
   }
   getResults(queryURL);
}

function getResults(queryURL) {
    axios.get(queryURL)
    .then(function (response) {
        if (movieSearch) {
            displayMovieInfo(response);
        } else {
            displayConcertInfo(response);
        }
    }).catch(function (error) {
        console.log(error);
        logData(error);
   });
};

function displayMovieInfo(response) {
    var movieInfo = {
        title: response.data.Title,
        released: response.data.Year,
        imdbRating: response.data.imdbRating,
        rottenTomatoes: "",
        country: response.data.Country,
        language: response.data.Language,
        plot: response.data.Plot,
        actors: response.data.Actors
    }
    for (var i=0; i < response.data.Ratings.length; i++) {
        if (response.data.Ratings[i].Source == "Rotten Tomatoes") {
            movieInfo.rottenTomatoes = response.data.Ratings[i].Value
        }
    }
    console.log(movieInfo);
    logData(movieInfo);
}
function displayConcertInfo(response) {
    if (response.data.length < 0) {
        var searchMessage = search + " is playing here: "
        console.log(searchMessage);
        var concertInfo = [searchMessage];
        for (var i=0; i <response.data.length; i++) {
            var concert = "date: " + moment(response.data[i].datetime)
            .format("MM/DD/YYYY") + " Venue: " + response.data[i].venue.name +
            " - " + response.data[i].venue.city + " " + response.data[i].venue.region
                + " " + response.data[i].venue.country;
                
                console.log(concert);
                concert.Info.push(concert);
        }
        logData(concertInfo);
    } else {
        var noResults = "No concerts were found for " + search;
        console.log(noResults);
        logData(noResults);
    }
}
function getSong() {
    spotify.search({
        type: "track",
        query: search,
        limit: 1
    }, function (error, data) {
        if (error) {
            logData(error)
            return console.log("error occured: " + error);
        }
        var songInfo = {
            artists: [],
            songName: data.tracks.items[0].name,
            previewLink: data.tracks.items[0].preview_URL,
            album: data.tracks.items[0].album.name
        }
        for (var i=0; i < data.tracks.items[0].artists.length; i++) {
            songInfo.artists.push(data.tracks.items[0].artists[i].name)
        }
        console.log(songInfo);
        logData(songInfo);
    });
}

function logData(results) {
    fs.appendFile("log.txt", " \n" + command + " " + search + " " + 
    JSON.stringify(results, null, 2), function (error) {
        if (error) {
            console.log(error);
        }
    });
}
if (command === "movie-this") {
    if (!search) {
        search = "Mr.Nobody"
    }
    movieSearch = true;
    buildSearchURL();
} else if (command === "spotify-this-song") {
    if (!search) {
        search = "Ace of Base The Sign";
    }
    getSong();
}    else if (command === "concert-this") {
            displayConcertInfo();
}  else if (command === "do-what-it-says") {
    fs.readFile('random.txt', 'utf8', function (error, data) {
        if (error) {
            logData(error)
            return console.log("Unable to do what it says")
        }
        var random = data.split(", ");
        search = random.slice(1).join(" ");
        search = search.replace(/"/g, "");

        if (random[0] === "movie-this") {
            movieSearch = true;
            buildSearchURL();
        } else if (random [0] === "concert-this") {
            buildSearchURL();
        } else {
            getSong();
        }
    });
} else {
    var unkownCommand = "Sorry, I don't understand"
    console.log(unkownCommand);
    logData(unkownCommand);
}