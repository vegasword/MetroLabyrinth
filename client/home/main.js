document.addEventListener("DOMContentLoaded", function () {
    window.onbeforeunload = function () {
        window.scrollTo(0, 0);
    };

    window.addEventListener("scroll", function () {
        let firstContainer = document.querySelector("section#second .firstContainer");
        let secondContainer = document.querySelector("section#second .secondContainer");

        let scrollPositionY = window.scrollY;
        let firstContainerPosition = firstContainer.offsetTop;
        let secondContainerPosition = secondContainer.offsetTop;

        if (scrollPositionY > firstContainerPosition - 700) {
            firstContainer.firstElementChild.classList.add("fadeToLeftOpacity")
            firstContainer.lastElementChild.classList.add("fadeToRightOpacity")
        }
        if (scrollPositionY > secondContainerPosition - 700) {
            secondContainer.firstElementChild.classList.add("fadeToLeftOpacity")
            secondContainer.lastElementChild.classList.add("fadeToRightOpacity")
        }
    });

    let popUp = document.querySelector("popup.more");
    let closePopUp = document.querySelector("popup.more i.fa-xmark");
    let main = document.querySelector("main");
    let button = document.querySelector("div.button");

    button.addEventListener("click", function () {
        main.classList.add("darken");
        popUp.classList.remove("fadeFromBottomOpacity")
        popUp.classList.add("fadeFromTopOpacity");
        popUp.classList.remove("hidden");
    });

    closePopUp.addEventListener("click", function () {
        popUp.classList.remove("fadeFromTopOpacity");
        popUp.classList.add("fadeFromBottomOpacity");
        main.classList.remove("darken");
    });
})