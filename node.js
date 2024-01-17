

//fetching card data and rendering it to DOM
const getData = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw Error("This url is not available in the server:404");
  }
  const json = await response.json();
  return json;
};

try {
  const data = await getData(url);
  const html = data
    .map(
      (card) => {
         const bigCard = card.writeup.length > 300
        return `<div class="cards">
  <h1><a href=./cards.html?id=${card.id}>${card.title}</a></h1>
  <p class="cards--salutation">${card.salutation},</p>
  <div class="cards--para">
  <p>${bigCard ? card.writeup.substring(0,300) : card.writeup} ${bigCard ? `<a style="color:#66a80f"" href=./cards.html?id=${card.id}>read more...</a>` : '<span></span>'}</p>
  </div>
  <p class="cards--closing">${card.closing},</p>
  <p class="cards--from">${card.from}</p>
</div>`}
    )
    .join("");
  document
    .querySelector(".display--section--cards--wrapper")
    .insertAdjacentHTML("afterbegin", html);
} catch (error) {
  console.log(error);
}

//form post request
const postData = async (url) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // "secret": secret
    },
    body: JSON.stringify({ a: 1, b: "Textual content" }),
  });
  const json = await response.json();
  return json;
};

//quill code
var container = document.getElementById("editor");
var quill = new Quill(container, {
  modules: {
    toolbar: [["bold", "italic", "underline"], ["blockquote"], ["link"]],
  },
  placeholder: "Compose an epic...",
  theme: "snow", // or 'bubble'
});


// updating input disabled value to quill data
let input = document.querySelector('.quill-data-input')

quill.on('text-change', function() {
  let justHtml =  quill.root.innerHTML;
  input.value = justHtml;
})

// inject date in form's input value
const currentDateAndTime = new Date();

const options = { year: 'numeric', month: 'long', day: 'numeric' };
const formattedDate = currentDateAndTime.toLocaleDateString(undefined, options);

const dateInput = document.querySelector('#date')
dateInput.value = formattedDate