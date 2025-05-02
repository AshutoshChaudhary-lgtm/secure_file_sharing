// static/js/script.js

// Example: Confirm before deleting a file
document.addEventListener('DOMContentLoaded', function () {
    const deleteButtons = document.querySelectorAll('.btn-danger');

    deleteButtons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            const confirmDelete = confirm('Are you sure you want to delete this file?');
            if (!confirmDelete) {
                event.preventDefault();
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) { // Check if navbar exists
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) { // Add class after scrolling 50px
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }
});