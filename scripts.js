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
