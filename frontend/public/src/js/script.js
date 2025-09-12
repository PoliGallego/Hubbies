document.addEventListener('DOMContentLoaded', () => {
    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('show');
        }, index * 200); 
    });
});