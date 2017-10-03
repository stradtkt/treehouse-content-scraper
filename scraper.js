'use strict';
const bodyParser = require('body-parser');
const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request');
const json2csv = require('json2csv');
const moment = require('moment');
/**
 * function for handling errors
 * @constructor
 * @param {object} error - An error object getting thrown
*/

function checkDirectory(directory) {
    try {
        fs.statSync(directory);
    } catch(e) {
        fs.mkdirSync(directory);
    }
}
//makes the directory data
checkDirectory("./data");



    //makes the directory data
var errorMessage = function(error) {
    console.log('Alert: There was an error, check your settings, or try back later');
};
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
        request(newContentURL, function(error, res, body) {
            if(!error) {
                var $ = cheerio.load(body);
            //the last path to the portion of the site
            //now we will be able to target those elements and send them to the csv file
            var finishedURL = $('.products > li > a').length;
            //this loops through all the specified elements with index as a parameter
            $(".products > li > a").each(function (index) {
            var secondUrl = ("http://shirts4mike.com/"+ $(this).attr('href'));

            request(secondUrl, function(error, req, body) {
                if(!error) {
                //loads the body of the request
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
                            //if error
                            if(err) return console.log(err);
                            //writing the csv file
                            fs.writeFile('./data/' + time + '.csv', csv, function(err) {
                                //if there is an error throw an error
                                if (err) throw err;
                                console.log('Your csv file has been saved');
                            });
                        });

                    }
                    return fieldsArray;
                } else {
                    //error message
                    errorMessage(error);
                }
            });
        });
        } else {
            //error message
            errorMessage(error);
        }
        });
    } else {
        //error message
        errorMessage(error);
    }
});
