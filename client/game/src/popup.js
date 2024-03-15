let understoodButton = document.getElementById("understoodButton");
let main = document.getElementsByTagName("main")[0];
let howToPlayPopup = document.getElementById("howToPlay-popup");

understoodButton?.addEventListener("click", () => {
  howToPlayPopup?.classList.remove("fadeFromTopOpacity");
  howToPlayPopup?.classList.add("fadeFromBottomOpacity");
  main.classList.remove("darken");
});
