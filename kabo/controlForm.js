document.addEventListener("DOMContentLoaded", () => {
  loadImage();
});

document.getElementById("send-button").addEventListener("click", send);

function send() {
  var email = document.getElementById("email").value;
  var button = document.getElementById("send-button");

  if (email.trim() === "") {
    alert("Per favore inserisci un indirizzo email");
    return;
  }

  console.log(`New subscription ${email}`);

  // Fill the hidden form input and submit it
  document.getElementById("hidden-entry").value = email;
  document.getElementById("hidden-form").submit();

  button.textContent = "Inviata!";
  button.disabled = true;
}

function loadImage() {
  const images = ["elena.jpg", "luce.jpg", "luna.jpg", "bambino.jpg"];

  const randomImage = images[Math.floor(Math.random() * images.length)];

  document.getElementById("img").src = "images/" + randomImage;

  const imageName = randomImage.split(".")[0];

  document.body.classList.add(imageName);
}
