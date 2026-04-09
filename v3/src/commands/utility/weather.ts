import axios from "axios";

export const config = {
    name: "weather",
    aliases: ["w"],
    version: "1.0.0",
    hasPermission: 0,
    credits: "Grandpa Academy",
    description: "Get current weather for a city",
    commandCategory: "utility",
    usages: "[city name]",
    cooldowns: 10,
    usePrefix: true,
};

export async function run({ message, args }: any) {
    const city = args.join(" ").trim();
    if (!city) return message.reply("❓ Usage: !weather [city]\nExample: !weather Dhaka");

    try {
        // Uses wttr.in — no API key needed, returns JSON
        const res = await axios.get(
            `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
            { timeout: 10000 }
        );
        const d = res.data;
        const current = d.current_condition?.[0];
        const area = d.nearest_area?.[0];

        if (!current) return message.reply("❌ City not found.");

        const areaName = area?.areaName?.[0]?.value || city;
        const country  = area?.country?.[0]?.value || "";
        const temp_c   = current.temp_C;
        const feels    = current.FeelsLikeC;
        const desc     = current.weatherDesc?.[0]?.value || "";
        const humidity = current.humidity;
        const wind     = current.windspeedKmph;

        const weather_icons: Record<string, string> = {
            "Sunny": "☀️", "Clear": "🌙", "Partly cloudy": "⛅",
            "Cloudy": "☁️", "Overcast": "🌫️", "Mist": "🌫️",
            "Rain": "🌧️", "Heavy rain": "⛈️", "Thundery": "⛈️",
            "Snow": "❄️", "Blizzard": "🌨️", "Fog": "🌁",
            "Light rain": "🌦️", "Drizzle": "🌦️",
        };

        const icon = Object.entries(weather_icons).find(([k]) => desc.includes(k))?.[1] || "🌤️";

        const msg = (
            `${icon} *${areaName}${country ? `, ${country}` : ""}*\n` +
            `🌡️ ${temp_c}°C (feels like ${feels}°C)\n` +
            `💧 Humidity: ${humidity}%\n` +
            `💨 Wind: ${wind} km/h\n` +
            `📋 ${desc}`
        );

        message.reply(msg);
    } catch {
        message.reply("❌ Could not fetch weather. Check the city name and try again.");
    }
}
