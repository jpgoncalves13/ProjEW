// Obter referência para o botão de favoritos
const favoriteButton = document.querySelector('#fav-button');

// Obter referência para o elemento de ícone
const favIcon = document.getElementById('fav-icon');

const description = document.querySelector('#description');

const descriptionDiv = document.querySelector('.description');

// Adicionar evento de clique ao botão de favoritos
favoriteButton.addEventListener('click', () => {
  // Alterar a classe do ícone para estilizar como favorito selecionado
  favIcon.classList.toggle('fa-regular');
  favIcon.classList.toggle('fa-solid')

  // Exibir ou ocultar o container da descrição
  const descriptionContainer = document.querySelector('.description');
  descriptionContainer.style.display = favIcon.classList.contains('fa-solid') ? 'block' : 'none';
});

// Adicionar evento de clique ao botão de adicionar descrição
const addDescriptionButton = document.querySelector('.add-description-button');
addDescriptionButton.addEventListener('click', () => {
  const description = document.querySelector('.description-input').value;
  console.log('Descrição:', description);
});

let flag = false
for(let i = 0; i <favoritos.length; i++) {
    if (favoritos[i].id === acordaoId){
        const descriptionInput = document.querySelector('.description-input');
        descriptionInput.value = favoritos[i].description;
        favIcon.classList = 'fa-solid fa-star fa-lg';
        descriptionDiv.style.display = 'block';
        flag = true
    }
}
if (flag === false){
    favIcon.classList = 'fa-regular fa-star fa-lg';
    descriptionDiv.style.display = 'none';
}

window.addEventListener('beforeunload', event => {
    let fav = {}
    fav.id = acordaoId
    let config={
        headers: {'Content-Type' : 'application/x-www-form-urlencoded'}
    }
    if (favIcon.classList.contains('fa-solid')){ // Favorite
        const description = document.querySelector('.description-input').value;
        fav.description = description
        axios.put("http://localhost:8002/users" + '/' + user.id + '/favorites', fav, config)
        .then(response => {
        })
        .catch(error => {});

    }
    else if (favIcon.classList.contains('fa-regular')){ // No favorite
        axios.put("http://localhost:8002/users" + '/' + user.id + '/removeFavorite', fav, config)
        .then(response => {
        })
        .catch(error => {});
    }
})