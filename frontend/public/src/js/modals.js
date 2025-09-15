function OpenModal(Type) {
    var Modal;
    const NotifBtn = document.getElementById('NotifBtn').getBoundingClientRect();
    const NotifDiv = document.getElementsByClassName('Notifications')[0];

    if (Type === 'Notif') {
        Modal = document.getElementById('NotifModal');
        NotifDiv.style.top = NotifBtn.bottom + "px";
        NotifDiv.style.right = '120px';
    } else if (Type === 'Options') {
        Modal = document.getElementById('OptionsModal');
    }
    Modal.style.display = 'block';
    window.onclick = function (event) {
        if (event.target == Modal) {
            Modal.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.Notification .material-icons').forEach(function (closeBtn) {
        closeBtn.addEventListener('click', function () {
            this.closest('.Notification').style.display = 'none';
        });
    });

    const ToggleContainer = document.querySelector('.ToggleContainer');
    let IsToggledOn = false;

    ToggleContainer.addEventListener('click', () => {
        IsToggledOn = !IsToggledOn;
        ToggleContainer.classList.toggle('on');
        if (IsToggledOn) {
            //accion
        } else {
            //otra accion
        }
    });
});
