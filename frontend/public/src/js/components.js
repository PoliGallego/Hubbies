document.addEventListener('DOMContentLoaded', () => {
    fetch('components/navbar.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('navbar').innerHTML = html;
        });

    fetch('components/sidebar.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('sidebar').innerHTML = html;
        });
});