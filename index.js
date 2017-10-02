const bodyParser = require('body-parser');
const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request');
const json2csv = require('json2csv');
const moment = require('moment');


function checkDirectory(directory) {
    try {
        fs.statSync(directory);
    } catch(e) {
        fs.mkdirSync(directory);
    }
}
checkDirectory("./data");

//error messages brought up with certain conditions
var errorMessage = (error) => console.log("There was an error in the code: ", error);
//intended url
var contentURL = "http://shirts4mike.com/";
//Labels for the CSV
var labels = ['Price', 'Title', 'ImageUrl', 'url', 'Time'];


var fieldsArray = new Array();
request(contentURL, (error, res, body) => {
    if(!error) {
        var $ = cheerio.load(body);
        //from the outter container to the link that the shirt is on
        var shirtPath = $('.shirts > a').attr('href');
        //combining the shirtPath and contentURL then used in the new request
        var newContentURL = contentURL + shirtPath;
        request(newContentURL, (error, res, body) => {
            if(!error) {
                var $ = cheerio.load(body);
            var finishedURL = $('.products > li > a').length;
            $(".products > li > a").each(function (index) {
            var secondUrl = ("http://shirts4mike.com/"+ $(this).attr('href'));

            request(secondUrl, (error, req, body) => {
                if(!error) {
                //Ability to use jQuery
                var $ = cheerio.load(body);

                //title location
                var title = $('body').find(".shirt-details > h1").text().slice(4);
                //price location
                var price = $('body').find(".price").text();
                //ImageUrl location
                var ImageUrl = $('.shirt-picture').find('img').attr('src');
                //setting the time with moment and then setting a format
                var time = moment().format('YYYY[-]MM[-]DD');
                //create an object to hold all the items
                var fieldsObject = {};
                //adding the title
                fieldsObject.Title = title;
                //adding the price
                fieldsObject.Price = price;
                //adding the ImageUrl
                fieldsObject.ImageUrl = ImageUrl;
                //adding the main url
                fieldsObject.url = secondUrl;
                //setting the time of the created item
                fieldsObject.Time = moment().format('MMMM Do YYYY, h:mm:ss a');
                //pushing the fieldsObject onto fieldsArray
                fieldsArray.push(fieldsObject);
                //if the array has all the items needed
                if (fieldsArray.length == finishedURL) {
                    //json2csv transfers the json into a csv file
                        json2csv({ data: fieldsArray, fields: labels }, function(err, csv) {
                            if(err) return console.log(err);
                            fs.writeFile('./data/' + time + '.csv', csv, function(err) {
                                if (err) throw err;
                                console.log('Your csv file has been saved');
                            });
                        });

                    }
                    return fieldsArray;
                } else {
                    errorMessage(error);
                }
            });
        });
        } else {
            errorMessage(error);
        }
        });
    } else {
        errorMessage(error);
    }
});
