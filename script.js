const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");

const grantLocation = document.querySelector(".grant-location-container");
const searchForm = document.querySelector("[data-searchForm]");
const userInfo = document.querySelector(".user-info-container")

const loadingContainer = document.querySelector(".loading-container")
const apiErrorContainer = document.querySelector(".api-error-container");

let API_KEY = "71ff28f1948ce941b9791a44ee3cb909";
let currentTab = userTab;
currentTab.classList.add("current-tab");

userTab.addEventListener("click", () => {
    switchTab(userTab);
})

searchTab.addEventListener("click", () => {
    switchTab(searchTab);
})

function switchTab(clickedTab){
    apiErrorContainer.classList.remove("active");
    if (clickedTab!=currentTab) {
        currentTab.classList.remove("current-tab");
        currentTab = clickedTab;
        currentTab.classList.add("current-tab");

        if (clickedTab!=userTab) {
            grantLocation.classList.remove("active");
            userInfo.classList.remove("active");
            searchForm.classList.add("active");
        }
        else{
            searchForm.classList.remove("active");
            userInfo.classList.remove("active");
            getFromSessionStorage();
        }
    }
}

function getFromSessionStorage(){
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if (!localCoordinates) {
        grantLocation.classList.add("active");
    }
    else{
        let coordinates = JSON.parse(localCoordinates);
        fetchUserWeatherInfo(coordinates);
    }
}

//calling for when the page loads at user tab (no switching tabs)
getFromSessionStorage();

const apiErrorImage = document.querySelector("[data-notFoundImg]");
const apiErrorMessage = document.querySelector("[data-apiErrorText]");
const apiErrorBtn = document.querySelector("[data-apiErrorBtn]");

function toggleLoading(show) {
    loadingContainer.classList[show ? "add" : "remove"]("active");
}

apiErrorBtn.addEventListener("click", () => {
    const coords = JSON.parse(sessionStorage.getItem("user-coordinates"));
    if (coords) {
        fetchUserWeatherInfo(coords);
    }
});

async function fetchUserWeatherInfo(coordinates){
    // let lat = coordinates.lat;
    // let lon = coordinates.lon;

    //the below does the same work as above, it create the lat,lon variable and extract or destruct values from coordinates
    let {lat, lon} = coordinates;

    toggleLoading(true);

    loadingContainer.classList.add("active");
    try {
        let content = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        let result = await content.json();
        if (!content.ok) {
            throw new Error(result.message || "API Error");
        }
        toggleLoading(false);
        renderUserWeather(result);
    } 
    catch (error) {
        toggleLoading(false);
        apiErrorContainer.classList.add("active");
        apiErrorImage.style.display = "none";
        apiErrorMessage.textContent = `Error: ${error?.message}`;
        apiErrorBtn.style.display = "block";
    }
}

function renderUserWeather(weatherInfo){
    
    userInfo.classList.add("active");
    let cityName = document.querySelector("[data-cityName]");
    let countryFlag = document.querySelector("[data-countryIcon]");
    let weatherDesc = document.querySelector("[data-weatherDesc]");
    let weatherIcon = document.querySelector("[data-weatherIcon]");
    let temp = document.querySelector("[data-temp]");
    let windspeed = document.querySelector("[data-windspeed]");
    let humidity = document.querySelector("[data-humidity]");
    let cloudiness = document.querySelector("[data-clouds]");

    cityName.textContent = weatherInfo?.name;
    countryFlag.src = `https://flagcdn.com/144x108/${weatherInfo?.sys?.country.toLowerCase()}.png`;
    weatherDesc.textContent = weatherInfo?.weather[0]?.description;
    weatherIcon.src = `https://openweathermap.org/img/wn/${weatherInfo?.weather[0]?.icon}@2x.png`;
    //toFixed() method that converts a number to a string and rounds the number to a given number of decimal places.
    temp.textContent = `${weatherInfo?.main?.temp.toFixed(2)} °C`;
    windspeed.textContent = `${weatherInfo?.wind?.speed.toFixed(2)}m/s`;
    humidity.textContent = `${weatherInfo?.main?.humidity}%`;
    cloudiness.textContent = `${weatherInfo?.clouds?.all}%`;
}


const grantAccessbtn = document.querySelector("[data-grantAccess]");

grantAccessbtn.addEventListener("click", getLocation)

function getLocation(){
    if (navigator.geolocation) {
        // This asks the browser to get the user’s location (triggers a permission prompt).
        //If the user allows, the position object is passed to the showPosition function.
        //and if any error occured then it will be passed to the showerror function.
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position){
    let userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
    }

    sessionStorage.setItem("user-coordinates" , JSON.stringify(userCoordinates));
    fetchUserWeatherInfo(userCoordinates);
}

const messageText = document.querySelector("[data-messageText]");

function showError(error){
    switch (error.code) {
        case error.PERMISSION_DENIED:
            messageText.textContent = "You denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            messageText.textContent = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            messageText.textContent = "The request to get user location timed out."    
            break;
        case error.UNKNOWN_ERROR:
            messageText.textContent = "An unknown error occured."
            break;    
    }
}

const searchCity = document.querySelector("[data-searchInput]");
let city = "";

searchForm.addEventListener("submit", (e)=> {
    e.preventDefault();
    if (searchCity.value==city) {
        searchCity.value = "";
        return;
    }
    city = searchCity.value;
    if (city === "") {
        return;
    }
    fetchCityWeatherInfo();
    searchCity.value = "";
})

async function fetchCityWeatherInfo() {
    userInfo.classList.remove("active");
    apiErrorContainer.classList.remove("active");
    toggleLoading(true);
    try {
        let response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        let data = await response.json();
        if (response.status === 404) {
            throw new Error("City not found (404)");
        }// true if the HTTP response status code is in the range 200 to 299 (i.e. success) false for any other status (like 404, 500, etc.)
        else if (!response.ok) {
            throw new Error(response.statusText);
        }
        toggleLoading(false);
        renderUserWeather(data);
    } 
    catch (error) {
        toggleLoading(false);
        if (error.message.includes("404")) {
            apiErrorContainer.classList.add("active");
            apiErrorBtn.style.display = "none";
            apiErrorImage.style.display = "block";
            apiErrorMessage.textContent = `"${city}" City not Found`;
        }
        else{
            apiErrorContainer.classList.add("active");
            apiErrorMessage.textContent = `Other API error: ${error?.message}`;
            apiErrorBtn.style.display = "none";
            apiErrorImage.style.display = "none";
        }
    }
}