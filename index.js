import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import ChartJsImage from "chartjs-to-image";

const port = 3000;
const app = express();
const smartyRequestURL = 'https://us-zipcode.api.smarty.com/lookup?auth-id=af4b5de1-4f62-107e-68df-005bf71e27da&auth-token=tvydaRC1JZsHlc7JwueV';

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.get("/", (req, res) => {
  res.render("index.ejs", {
    message: [
      'Welcome,',
      `This is a tool to generate a graph visualizing the changes in monthly temperature highs over a 20-year period based on today, ${new Date()}, at a specific location in the US. Enter a US zipcode above to begin.`,
      'Please note that this is an evolving, student-lelevel project focused on the basics of Node.js programming and API use. Zipcodes from less-populated areas are likely to return strange results.'],
  });
});

app.post("/zip", async (req, res) => {
  const responseLocation = await axios.get(smartyRequestURL + `&zipcode=${req.body.zipcode}`);
  const options = {
    method: 'GET',
    url: 'https://meteostat.p.rapidapi.com/point/monthly',
    params: {
      lat: responseLocation.data[0].zipcodes[0].latitude,
      lon: responseLocation.data[0].zipcodes[0].longitude,
      start: formatDate(new Date())[1],
      end: formatDate(new Date())[0],
      alt: '43'
    },
    headers: {
      'X-RapidAPI-Key': 'a4f834c5e8mshfbbc3a59eb5451fp1864e1jsn588f990650d6',
      'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
    }
  };
  try {
    const responseWeather = await axios.request(options);
    let dates = [];
    let temps = [];
    responseWeather.data.data.forEach(entry => {
      dates.push(entry.date);
      temps.push(entry.tmax);
    });
    const weatherChart = new ChartJsImage();
    weatherChart.setConfig({
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Average High by Month',
          data: temps
        }]
      }
    })
    .setWidth(800)
    .setHeight(400)
    .setBackgroundColor('transparent')
    res.render('index.ejs', {
      message: [
        `${responseLocation.data[0].city_states[0].city}, ${responseLocation.data[0].city_states[0].state_abbreviation}`,
        `Showing data from ${dates[0]} to ${dates[dates.length - 1]}`,
        'Some dates may not contain temperature data, please see list below for details.'
      ],
      location: {
        latitude: responseLocation.data[0].zipcodes[0].latitude,
        longitude: responseLocation.data[0].zipcodes[0].longitude
      },
      data: responseWeather.data.data,
      chart: weatherChart.getUrl()
    })
  } catch (error) {
    console.error(error);
  }
});

function formatDate(date) {
  let d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear(),
      pastby20 = year - 20;

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [[year, month, day].join('-'), [pastby20, month, day].join('-')];
}