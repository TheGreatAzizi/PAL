document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const resultsList = document.getElementById("resultsList");
    const resultsContainer = document.getElementById("results");
    const themeToggle = document.getElementById("themeToggle");

    let isDarkMode = false;

    themeToggle.addEventListener("click", () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle("dark-mode", isDarkMode);
    });

    searchButton.addEventListener("click", async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        const searchResults = await fetchAnimeList(query);
        displaySearchResults(searchResults);
    });

    async function fetchAnimeList(query) {
        try {
            const response = await fetch("https://graphql.anilist.co", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `
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
                                        medium
                                    }
                                }
                            }
                        }
                    `,
                    variables: { search: query },
                }),
            });
            const data = await response.json();
            return data.data.Page.media;
        } catch (error) {
            console.error("Error fetching anime list:", error);
            return [];
        }
    }

    function displaySearchResults(animeList) {
        resultsList.innerHTML = "";
        resultsList.style.display = animeList.length ? "block" : "none";

        animeList.forEach((anime) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <img src="${anime.coverImage.medium}" alt="${anime.title.romaji}">
                <span>${anime.title.romaji}</span>
            `;
            listItem.addEventListener("click", () => {
                fetchAnimeDetails(anime.id);
                resultsList.style.display = "none";
            });
            resultsList.appendChild(listItem);
        });
    }

    async function fetchAnimeDetails(id) {
        try {
            const response = await fetch("https://graphql.anilist.co", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `
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
                                episodes
                                startDate {
                                    year
                                    month
                                }
                                studios(isMain: true) {
                                    nodes {
                                        name
                                    }
                                }
                                averageScore
                                popularity
                                rankings {
                                    rank
                                    type
                                    context
                                }
                                description(asHtml: false)
                                trailer {
                                    site
                                    id
                                }
                            }
                        }
                    `,
                    variables: { id },
                }),
            });
            const data = await response.json();
            displayAnimeDetails(data.data.Media);
        } catch (error) {
            console.error("Error fetching anime details:", error);
        }
    }

    function displayAnimeDetails(anime) {
        resultsContainer.innerHTML = `
            <div class="anime-card">
                <div class="anime-header">
                    <img class="anime-cover" src="${anime.coverImage.large}" alt="${anime.title.romaji}">
                    <div class="anime-title-section">
                        <h2 class="anime-title">${anime.title.romaji}</h2>
                        <p class="anime-title-english">${anime.title.english || "ناموجود"}</p>
                        <p class="anime-title-native">${anime.title.native || "ناموجود"}</p>
                    </div>
                </div>
                <div class="anime-details">
                    <p><strong>تعداد قسمت‌ها:</strong> ${anime.episodes || "نامشخص"}</p>
                    <p><strong>سال و فصل:</strong> ${anime.startDate.year || "نامشخص"} / ${anime.startDate.month || "نامشخص"}</p>
                    <p><strong>استودیو سازنده:</strong> ${anime.studios.nodes.map((studio) => studio.name).join(", ") || "نامشخص"}</p>
                    <p><strong>امتیاز:</strong> ${anime.averageScore || "ناموجود"} (${anime.popularity || "0"} رای)</p>
                    <p><strong>رتبه:</strong> ${anime.rankings.length > 0 ? anime.rankings[0].rank : "ناموجود"}</p>
                    <p class="anime-description">${anime.description || "توضیحات موجود نیست."}</p>
                </div>
                ${anime.trailer && anime.trailer.site === "youtube" ? `
                    <div class="anime-trailer">
                        <iframe src="https://www.youtube.com/embed/${anime.trailer.id}" frameborder="0" allowfullscreen></iframe>
                    </div>
                ` : ""}
            </div>
        `;
    }
});
