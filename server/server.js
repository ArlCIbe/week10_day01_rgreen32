const express = require('express');
const cors = require('cors')

const app = express();
app.use(cors())


const APIKEY = ""
const URL = "https://api.unsplash.com/photos/random/?query=landscape&count=10&client_id=" + APIKEY

app.get('/', async (req, res) => {
    var response = await fetch(URL);
    var data = await response.json();

    var imageData = data.map((image) => {
        return {
            image_url: image.urls.regular,
            location_name: image.location.name,
            latitude: image.location.position.latitude,
            longitude: image.location.position.longitude
        }
    })

    //Part 3: Filter the nulls out of imageData


    res.json(imageData);
});

app.listen(3001, () => {
    console.log('Worldview Api listening on port 3001!');
});