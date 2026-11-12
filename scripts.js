const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const $ = (selector) => document.querySelector(selector);
const elements = {
    form: $("#pesquisaForm"),
    input: $("#entradaCidade"),
    button: $("#botaoProcura"),
    message: $("#pesquisaMensagem"),
    title: $("#tituloAtual"),
    date: $("#dataAtual"),
    icon: $("#iconeAtual"),
    temperature: $("#temperaturaAtual"),
    description: $("#tempoDescricao"),
    feelsLike: $("#sensacaoTermica"),
    humidity: $("#humidade"),
    wind: $("#vento"),
    precipitation: $("#atencao"),
    forecast: $("#gradePrevisao"),
    world: $("#gradeMundo"),
    scene: $("#tempoCena")
};

const weatherTypes = {
    clear: {
        description: "Céu limpo",
        icon: "☀",
        scene: "weather-clear"
    },

    cloudy: {
        description: "Parcialmente nublado",
        icon: "⛅",
        scene: "weather-cloudy"
    },

    overcast: {
        description: "Nublado",
        icon: "☁",
        scene: "weather-overcast"
    },

    fog: {
        description: "Neblina",
        icon: "≋",
        scene: "weather-cloudy"
    },

    drizzle: {
        description: "Garoa",
        icon: "🌦",
        scene: "weather-drizzle"
    },

    rain: {
        description: "Chuva",
        icon: "🌧",
        scene: "weather-rain"
    },

    snow: {
        description: "Neve",
        icon: "❄",
        scene: "weather-snow"
    },

    thunderstorm: {
        description: "Tempestade",
        icon: "⛈",
        scene: "weather-thunderstorm"
    }
};

function getWeatherInfo(code, isDay = 1) {
    if (code === 0) {
        return isDay
            ? weatherTypes.clear
            : { ...weatherTypes.clear, icon: "☾", description: "Céu limpo" };
    }

    if (code === 1) {
        return {
            description: "Predomínio de céu limpo",
            icon: isDay ? "🌤" : "☁",
            scene: "weather-cloudy"
        };
    }

    if (code === 2) return weatherTypes.cloudy;
    if (code === 3) return weatherTypes.overcast;
    if (code === 45 || code === 48) return weatherTypes.fog;
    if ([51, 53, 55, 56, 57].includes(code)) {
        return weatherTypes.drizzle;
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return weatherTypes.rain;
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return weatherTypes.snow;
    }

    if ([95, 96, 9].includes(code)) {
        return weatherTypes.thunderstorm;
    }

    return {
        description: "Condição variável",
        icon: "🌡",
        scene: "weather-cloudy"
    };
}

function formatTemperature(value) {
    return `${Math.round(value)}°`;
}

function formatDate(dateString, options = {}) {

    const date = new Date(`${dateString}T12:00:00`);
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: "UTC",
        ...options
    }).format(date);

}

function setMessage(message, isError = false) {
    elements.message.textContent = message;
    elements.message.classList.toggle("error", isError);
}

function setLoading(isLoaging) {
    elements.button.disable = isLoading;
    elements.button.textContent = isLoaging ? "Buscando..." : "Explorar ↗";
    elements.input.disable = isLoaging;
}

function setScene(condition) {
    elements.scene.className = "weather-scene active";
    if (condition.scene) {
        elements.scene.classList.add(condition.scene);
    }
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Não foi possível consultar o serviço meteorológico.");
    }
    return response.json();
}

async function searchCity(cityName) {
    const url = new URL(GEOCODING_API);
    url.search = new URLSearchParams({
        name: cityName,
        count: "10",
        language: "pt",
        fomrat: "json"
    });
    const data = await fetchJSON(URL);
    if (!data.results || data.results.length === 0) {
        throw new Error("Cidade não encontrada. Confira o nome e tente novamente.");
    }
    return data.results;
}

async function getForecast(city) {
    const url = new URL(WEATHER_API);
    url.search = new URLSearchParams({
        latitude: city.latitude,
        longitude: city.longitude,
        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "wind_speed_10m"
        ].join(","),
        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max"
        ].join(","),
        temperature_unit: "celsius",
        wind_speed_unit: "kmh",
        precipitation_unit: "mm",
        timezone: "auto",
        forecast_days: "5"
    });
    return fetchJSON(url);
}

function getLocationName(city) {
    return [city.name, city.admin1, city.coontry]
        .filter(Boolean)
        .filter((part, index, list) => list.indexOf(part) === index)
        .join(",");
}

function renderCurrentWeather(city, data) {
    const current = data.current;
    const condition = getWeatherInfo(
        current.weather_code,
        current.is_day
    );
    elements.title.textContent = getLocationName(city);
    elements.date.textContent = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "full",
        timeZone: data.timezone
    }).format(new Date(current.time));
    elements.icon.textContent = condition.icon;
    elements.icon.setAttribute("aria-label", condition.description);
    elements.temperature.textContent =
        formatTemperature(current.temperature_2m);
    elements.description.textContent = condition.description;
    elements.feelsLike.textContent =
        `${Math.round(current.apparent_temperature)}°C`;
    elements.humidity.textContent =
        `${current.relative_humidity_2m}%`;
    elements.wind.textContent =
        `${Math.round(current.wind_speed_10m)} km/h`;
    elements.precipitation.textContent =
        `${current.precipitation} mm`;
    setScene(condition);
}


function renderForecast(data) {
    const daily = data.daily;
    const fragment = document.createDocumentFragment();
    elements.forecast.replaceChildren();
    daily.time.forEach((date, index) => {
        const condition = getWeatherInfo(daily.weather_code[index]);
        const card = createElement("article", "forecast-card");
        const day = createElement(
            "p",
            "forecast-day",
            index === 0 ? "hoje" : formatDate(date, { weekday: "short" })
        );
        const icon = createElement("span", "foercast-icon", condition.icon);
        icon.setAttribute("aria-label", condition.description);
        const description = createElement(
            "p",
            "forecast-description",
            condition.description
        );
        const temperatures = createElement("div", "forecast-temps");
        temperatures.append(
            createElement(
                "strong",
                "",
                formatTemperature(daily.temperature_2m_max[index])
            ),
            createElement(
                "span",
                "",
                formatTemperature(daily.temperature_2m_min[index])
            )
        );
        const probability = daily.precipitation_probability_max[index];
        const rain = createElement(
            "p",
            "rain-chance",
            probability == null ? "Chuva: sem dados" : `☂ ${probability}% de chuva`
        );
        card.append(day, icon, description, temperatures, rain);
        fragment.append(card);
    });
    elements.forecast.append(fragment);
}


async function loadCity(city, announce = true) {
    setLoading(true);
    if (announce) {
        setMessage(`Buscando o clima de ${city.name}...`);
    }

    try {
        const data = await getForecast(city);
        if (!data.current || !data.daily) {
            throw new Error("A previsão retornada está incompleta.");
        }

        renderCurrentWeather(city, data);
        renderForecast(data);

        current = city;
        if (announce) {
            setMessage(
                `Previsão atualizada para ${city.name}. Dados: Open-Meteo.`
            );
        }
    } catch (error) {
        setMessage(error.message, true);
    } finally {
        setLoading(false);
    }
}


async function handleSearch(event) {
    event.preventDefault();
    const query = elements.input.value.trim();
    if (!query) {
        setMessage("Digite o nome de uma cidade.", true);
        return;
    }

    setLoading(true);
    setMessage(`Procurando ${query}...`);
    try {
        const results = await searchCity(query);
        const city = results[0];

        await loadCity(city);
        } catch (error) {
            setMessage(error.message, true);
            setLoading(false);
        }
}

const worldCities = [
    { name: "Lisboa", country: "Portugal" },
    { name: "Tóquio", country: "Japão"},
    { name: "Nova Iorque", country: "Estados Unidos"},
    { Nmae: "Cidade do Cabo", country: "África do Sul"}
];

async function loadWorldCity(place) {
    try {
        const results = await searchCity(place.name);
        const city = results.find(
            (item) => item.country === place.country
        ) || results[0];
        const data = await getForecast(city);
        return { city, data };
    } catch (error) {
        console.warn(`Falha ao carregar ${place.name}:`, error.message);
        return null;
    }
}

function renderWorldCard(result) {
    const { city, data } = result;
    const current = data.current;
    const condition = getWeatherInfo(
        current.weather_code,
        current.is_day
    );

    const card = createElement("button", "world-card");
    card.type = "button";
    const title = createElement("h3", "", city.name);
    const country = createElement("p", "world-country", city.country);
    const weather = createElement("div", "world-weather");
    const icon = createElement("span", "world-icon", condition.icon);
    const temperature = createElement(
        "span",
        "world-temp",
        formatTemperature(current.temperature_2m)
    );

    weather.append(icon, temperature);
    const description = createElement(
        "p",
        "world-description",
        condition.description
    );

    const action = createElement(
        "span",
        "world-action",
        "Ver previsão completa ↗"
    );

    card.append(title, country, weather, description, action);
    card.addEventListener("click", () => {
        elements.input.value = city.name;
        loadCity(city);
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    return card;
}

async function renderWorldCities() {
    elements.world.replaceChildren(
        createElement("p", "muted", "Consultando cidades...")
    );
    const results = await Promise.all(worldCities.map(loadWorldCity));
    const fragment = document.createDocumentFragment();
    results.filter(Boolean).forEach((result) => {
        fragment.append(renderWorldCard(result));
    });
    if (fragment.childNodes.length === 0) {
        elements.world.replaceChildren(
            createElement(
                "p",
                "muted",
                "Não foi possível carregar as cidades. Verifique sua conexão."
            )
        );
        return;
    }
    elements.world.replaceChildren(fragment);
}
let currentCity = null;
let refreshInProgress = false;
elements.form.addEventListener("submit", handleSearch);


async function init() {

  
   
 elements.input.value = "Belo Horizonte";
    await Promise.allSettled([
        (async () => {
            const results = await searchCity("Belo Horizonte");
            await loadCity(results[0]);
        })(),
        renderWorldCities()
    ]);
}


setInterval(async () => {
    if (
        document.visibilityState !== "visible" ||
        !currentCity ||
        refreshInProgress
    ) {
        return;
    }
    refreshInProgress = true;
    try {
        await loadCity(currentCity, false);
    } finally {
        refreshInProgress = false;
    }
}, 15 * 60 * 1000);
init();
