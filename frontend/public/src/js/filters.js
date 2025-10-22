document.addEventListener("categories:ready", () => {
    const catList = document.querySelector(".Categories > ul");
    if (catList) {
        catList.dataset.filters = JSON.stringify([]);
        catList.addEventListener("click", async function (e) {
            const a = e.target.closest("a");
            if (!a) return;
            e.preventDefault();

            if (!window.location.pathname.includes("posts.html")) {
                window.location.assign("/src/html/posts.html");
                return;
            }

            const token = localStorage.getItem("token");
            if (!token) {
                window.location.assign("/src/html/index.html");
                return;
            }

            if (!window.location.pathname.includes("posts.html")) {
                window.location.assign("/src/html/posts.html");
            }

            const res = await fetch("/api/posts/my-posts", {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error("Error fetching posts");

            let posts = await res.json();
            let filters = JSON.parse(catList.dataset.filters || "[]");

            if (!filters.includes(a.textContent)) {
                a.style.backgroundColor = "#8fcdddff";
                filters.push(a.textContent);

            } else {
                a.style.backgroundColor = "";
                filters = filters.filter(f => f !== a.textContent);
            }
            catList.dataset.filters = JSON.stringify(filters);

            if (filters.length > 0) {
                posts = posts.filter(post => {
                    return post.categories && filters.every(cat => post.categories.some(c => c.title === cat));
                });
            }
            window.renderPosts(posts);
        });
    }
});