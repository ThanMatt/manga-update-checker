const request = require('request-promise');
const _ = require('lodash');
const cheerio = require('cheerio');
const readline = require('readline');
const chalk = require('chalk');
const Spinner = require('cli-spinner').Spinner;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let counter = 0;
let date;
let latestChapterURL;
let mangaList = [];

const url = 'https://www.mangareader.net'; //!! The base URL
const spinner = new Spinner('Loading manga list...%s');

spinner.setSpinnerString('|/-\\');
spinner.start(); //!! Starts the loading spinner

request(`${url}/alphabetical`)
  .then(html => {
    const $ = cheerio.load(html);
    const mangaItems = $('.series_alpha li');

    //!! Retrieves all the manga titles on mangareader.net
    mangaItems.each((i, el) => {
      counter++;
      mangaList.push(_.toLower($(el).text()));
    })

    spinner.stop(); //!! Stops the loading after retrieval

    //!! User prompt
    rl.question("What manga: ", title => {

      serializeTitle = _.kebabCase(_.toLower(title)); //!! serializes the title into a url-readable format

      request(`${url}/${serializeTitle}`)
        .then(html => {
          title = _.startCase(_.toLower(title));
          counter = 0;
          const $ = cheerio.load(html);
          const anchor = $('#listing tr:last-child a').attr('href');

          latestChapterURL = url + anchor; //!! concats the base url and the manga url

          $('#listing tr td:last-child').each((i, el) => { //!! Counts how many chapters and retrieves the latest date
            counter++;
            date = $(el).text();
          })

          //!! Output
          console.log(`
          Selected manga: ${chalk.cyan(title)}
          ${title} chapters loaded: ${chalk.cyan(counter)}
          Latest chapter date: ${chalk.cyan(date)}
          Latest chapter URL: ${chalk.cyan(latestChapterURL)}
          `)

        }).catch(err => {
          if (err.statusCode === 404) {
            console.log('No manga found')
            const relatedSearch = mangaList.filter(value => { //!! Related search criteria
              return (
                value.indexOf(_.toLower(title)) >= 0 || //!! makes it case-insensitive
                value.indexOf(title.replace(/\s/g, '')) >= 0 //!! removes spaces
              )

            });

            if (relatedSearch.length) {
              console.log(`Did you mean: \n${chalk.cyan(relatedSearch.join('\n'))}?`);
            }


          } else {
            console.log('There was an error')
          }
        })

      rl.close();
    })


  }).catch(err => {
    console.log(err)
  })


