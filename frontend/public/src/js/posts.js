document.addEventListener('DOMContentLoaded', function() {
    // Toggle View More
    const viewMoreBtn = document.querySelector('.ViewMoreButton');
    const extraItems = document.querySelectorAll('.extra-item');
    let expanded = false;
    viewMoreBtn.addEventListener('click', function() {
        expanded = !expanded;
        extraItems.forEach(function(item) {
            item.style.display = expanded ? 'list-item' : 'none';
        });
        viewMoreBtn.querySelector('span').textContent = expanded ? 'expand_less' : 'expand_more';
        viewMoreBtn.childNodes[0].textContent = expanded ? 'View less' : 'View more';
    });

    // Ocultar Tag al presionar close
    document.querySelectorAll('.Tag .material-icons').forEach(function(closeBtn) {
        closeBtn.addEventListener('click', function() {
            this.closest('.Tag').style.display = 'none';
        });
    });
});