export function redirectIfLoggedIn(target = "/src/html/posts.html") {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp > now) {
      window.location.href = target;
    } else {
      localStorage.removeItem("token");
    }
  } catch (e) {
    localStorage.removeItem("token");
  }
}
