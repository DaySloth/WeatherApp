//Global Variables to be called later on
let pastCityList = [];
let city;
let lat;
let lon;

//Uses ajax to take the users input to search for the city specified
function searchForWeather(userinput){
    //sets city to the userinput argument taken in on function call
    city = userinput;
    //checks the list to see if the city already exists
    if(pastCityList.includes(city)){
        console.log("city already in list, not adding again")
    //if it doesn't exist it will add it to the list
    } else{
        pastCityList.push(city);
        localStorage.setItem("pastCityList", JSON.stringify(pastCityList));
    };
    //runs init to load in the buttons
    init();

    //api query to get the lon and lat of the city, this will be used in the callWeatherData function
    let queryURL = "https://api.openweathermap.org/data/2.5/weather?q="+ city +"&appid=72de2b75c6774a8a71e7061642ea7d3a"

    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function(response){
        //records the lon and lat of the city searched to use in another ajax call
        lon = response.coord.lon;
        lat = response.coord.lat;
        //calls the callWeatherData function to load in the weather data
        callWeatherData();
        
    });
};

//api query to get selected city weather data
function callWeatherData(){
    $.ajax({
            url: "https://api.openweathermap.org/data/2.5/onecall?lat="+ lat +"&lon="+ lon + "&exclude=hourly,minutely&appid=72de2b75c6774a8a71e7061642ea7d3a",
            method: "GET"
        }).then(function(response){
            //gets variables to be used from returned object
            let fTemp = Math.round(Math.floor(response.current.temp) * 9/5 - 459.67);
            let currentHum = response.current.humidity;
            let wind = response.current.wind_speed;
            let uvi = parseInt(response.current.uvi);
            let conditionIcon = response.current.weather[0].icon;
            let condition = "http://openweathermap.org/img/wn/"+ conditionIcon +"@2x.png";
            let uvDisplay = $("#uvIndexDisplay");

            //sets info to the screen
            $("#cityDisplay").text(city);
            $("#dateDisplay").text("(" + moment().format('l') + ")");
            $("#currentConditionDisplay").attr("src", condition);
            $("#tempDisplay").text(fTemp);
            $("#humidityDisplay").text(currentHum);
            $("#windSpeedDisplay").text(wind);
            uvDisplay.text(uvi);

            //checks the value of the uv index and sets a color badge accordingly to how safe it is
            if(uvi < 3){
                uvDisplay.attr("class", "badge badge-success")
            } else if(3 < uvi && uvi < 6){
                uvDisplay.attr("class", "badge badge-warning")
            } else if(6 < uvi && uvi < 7){
                uvDisplay.attr("class", "badge badge-orange")
            } else {
                uvDisplay.attr("class", "badge badge-danger")
            };

            //Future Forecast cards
            $("#futureForecastDiv").empty();
            for(let i = 0; i < 5; i++){
                let dailyCond = response.daily[i].weather[0].icon;
                let condURL = "http://openweathermap.org/img/wn/"+ dailyCond +"@2x.png";
                let dailyTemp = Math.round(Math.floor(response.daily[i].temp.max) * 9/5 - 459.67);
                let dailyHum = response.daily[i].humidity;
                let cardDiv = $("<div>");
                cardDiv.attr("class", "card weather-card col-lg-2");
                cardDiv.append($("<p>").text(moment().add(i + 1, 'days').format('l')).attr("class", "forecast-title card-title"));
                cardDiv.append($("<img>").attr("src", condURL).attr("class", "weatherIcon"));
                cardDiv.append($("<p>").html("Temp: " + dailyTemp + " &deg;F"));
                cardDiv.append($("<p>").html("Humidity: " + dailyHum + " %"));
                $("#futureForecastDiv").append(cardDiv);
            };

            //console logs the values it pulls
            console.log("temp: " + fTemp);
            console.log("humidity: " + currentHum);
            console.log("uvi: "+ uvi);
            console.log("condition Icon: "+ conditionIcon);
            console.log(response);
        });
};

//initialize the page
function init(){
    //pulls from local storage to get the list
    let storedCityData = localStorage.getItem("pastCityList");
    //checks if the list is empty
    if(storedCityData !== null){
        pastCityList = JSON.parse(storedCityData);
        //empties the div to add in the updated buttons
        $("#pastSearch").empty();
        //runs through the array and adds buttons accordingly
        for(var i = 0; i < pastCityList.length; i++){
            let cityBtn = $("<button>");
            cityBtn.text(pastCityList[i]);
            cityBtn.attr("class", "btn btn-light btn-sm btn-block mb-2");
            $("#pastSearch").prepend(cityBtn);
        };
    //if the list is empty it will get the current location and display your current locations weather data
    } else {
        getLocation();
    };
};
//gets current location if you don't have any previously searched city in storage
function getLocation() {
    // Make sure browser supports this feature
    if (navigator.geolocation) {
        // Provide our showPosition() function to getCurrentPosition
        navigator.geolocation.getCurrentPosition(showPosition);
    } 
    else {
        console.log("Geolocation is not supported by this browser.");
    };
};

// This will get called after getLocation()
function showPosition(position) {
    // Grab coordinates from the given object
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    //logs your coordinates to let you know it worked
    console.log("Your coordinates are Latitude: " + lat + " Longitude " + lon);
    //calls a googleGeoCode() reverse lookup to get city name to search
    googleGeoCode();

};

// calls a google geocode to grab the current city name from lat and lon
//ONLY CALLED IF NO DATA IS IN THE LOCAL STORAGE
function googleGeoCode(){
    var settings = {
    "async": true,
    "crossDomain": true,
    "url": "https://google-maps-geocoding.p.rapidapi.com/geocode/json?language=en&latlng="+ lat +","+ lon,
    "method": "GET",
    "headers": {
        "x-rapidapi-host": "google-maps-geocoding.p.rapidapi.com",
        "x-rapidapi-key": "9493df4a93msh1173120d859372ap12bb8ajsnff91615f339b"
    }
};

$.ajax(settings).done(function (response) {
    city = response.results[5].address_components[0].long_name;
    callWeatherData();
    });
};

$("button").on("click", function(){
    if($(this).attr("id") === "submitBtn"){
        if($("#cityName").val() === ""){
            console.log("no input")
        } else {
            searchForWeather($("#cityName").val());
        }
    };
});

$("#pastSearch").on("click", ".btn", function(){
    searchForWeather($(this).text());
});

$("#currentLocation").on("click", getLocation);

init();
if(pastCityList[0] !== undefined){
    console.log("Last Item Searched: "+pastCityList[pastCityList.length - 1]);
    searchForWeather(pastCityList[pastCityList.length - 1]);
} else {
    console.log("pastCityList array was empty, getting current location");
};