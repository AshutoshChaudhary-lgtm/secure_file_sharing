// app/static/js/scripts.js

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
});