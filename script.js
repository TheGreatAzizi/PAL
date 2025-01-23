const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resultsList = document.getElementById("resultsList");
const resultsSection = document.getElementById("results");


async function searchAnime(query) {
    const queryString = `
        query ($search: String) {
            Page(page: 1, perPage: 10) {
                media(search: $search, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        large
                    }
                }
            }
        }
    `;
    const variables = { search: query };
    const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: queryString, variables }),
    });
    const data = await response.json();
    return data.data.Page.media;
}

function displaySearchResults(animeList) {
    resultsList.innerHTML = "";
    animeList.forEach((anime) => {
        const li = document.createElement("li");
        li.textContent = anime.title.romaji || anime.title.english || "بدون عنوان";
        li.addEventListener("click", () => fetchAnimeDetails(anime.id));
        resultsList.appendChild(li);
    });
    resultsList.style.display = "block";
}

async function fetchAnimeDetails(id) {
    const queryString = `
        query ($id: Int) {
            Media(id: $id, type: ANIME) {
                title {
                    romaji
                    english
                    native
                }
                coverImage {
                    large
                }
                description
                episodes
                season
                seasonYear
                studios {
                    nodes {
                        name
                    }
                }
                trailer {
                    id
                    site
                }
                synonyms
            }
        }
    `;
    const variables = { id };
    const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: queryString, variables }),
    });
    const data = await response.json();
    displayAnimeDetails(data.data.Media);
    resultsList.style.display = "none";
}

function displayAnimeDetails(anime) {
    const studios = anime.studios.nodes.map((studio) => studio.name).join(", ") || "نامشخص";

    let trailerHTML = "";
    if (anime.trailer && anime.trailer.site === "youtube") {
        trailerHTML = `
            <div class="anime-trailer">
                <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/${anime.trailer.id}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                ></iframe>
            </div>
        `;
    }

    resultsSection.innerHTML = `
        <div class="anime-card">
            <div class="anime-header">
                <img class="anime-cover" src="${anime.coverImage.large}" alt="${anime.title.romaji}">
                <div class="anime-title-section">
                    <h1 class="anime-title">${anime.title.romaji || "بدون عنوان"}</h1>
                    <h2 class="anime-title-english">${anime.title.english || ""}</h2>
                    <h3 class="anime-title-native">${anime.title.native || ""}</h3>
                </div>
            </div>
            <div class="anime-details">
                <p><strong>نام‌های دیگر:</strong> ${anime.synonyms.join(", ") || "ندارد"}</p>
                <p><strong>تعداد قسمت‌ها:</strong> ${anime.episodes || "نامشخص"}</p>
                <p><strong>سال ساخت:</strong> ${anime.seasonYear || "نامشخص"}</p>
                <p><strong>فصل:</strong> ${anime.season || "نامشخص"}</p>
                <p><strong>استودیو سازنده:</strong> ${studios}</p>
                <p class="anime-description">${anime.description || "خلاصه داستان موجود نیست."}</p>
            </div>
            ${trailerHTML}
        </div>
    `;
}

searchButton.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (query) {
        const animeList = await searchAnime(query);
        displaySearchResults(animeList);
    }
});

document.addEventListener("click", (event) => {
    if (!resultsList.contains(event.target) && event.target !== searchInput) {
        resultsList.style.display = "none";
    }
});
