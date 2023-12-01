// Fazer uma solicitação ao servidor
function solicitation(str, page, limit) {
    fetch(str+'?page='+page+'&limit='+limit)
        .then(response => response.json())
        .then(data => {
            // Limpar a lista de resultados
            const resultsList = document.getElementById('resultsList');
            resultsList.innerHTML = '';

            data.results.forEach(result => {
                // Criar o HTML para cada resultado
                let listItemHTML = `<li class="list-group-item">
                  <div class="card mb-2">
                    <div class="card-body">
                      <div class="row pb-2">
                        <div class="col-md-6">
                          <h5 class="text-start text-primary"><a href="/users/${result._id}">${result.username || 'N/A'}</a></h5>
                        </div>
                        <div class="text-end col-md-6">
                            <a class="mx-1" href="/users/${result.active ? 'disable' : 'enable'}/${result._id}">
                                <i class="fa-solid ${result.active ? 'fa-pause' : 'fa-play'}"></i>
                            </a>
                        </div>
                      </div>
                      <div class="row pb-2">
                        <div class="col-md-12">
                          <div class="text-start"><b>Username:</b> ${result.username || 'N/A'}</div>
                          <div class="text-start"><b>Email:</b> ${result.email || 'N/A'}</div>
                        </div>
                      </div>`;
              
              
              
                listItemHTML += `</div></div></div></li>`;
              
                // Adicionar o HTML à lista de resultados
                resultsList.innerHTML += listItemHTML;
              });
              

            const previous = document.getElementById('previous');
            
            if (data.previous) {
                previous.classList.remove('disabled');
                previous.setAttribute('page', data.previous.page);
                previous.setAttribute('limit', data.previous.limit);
            } else {
                console.log('No previous')
                previous.classList.add('disabled');
            }
            
            const next = document.getElementById('next');

            if (data.next) {
                next.classList.remove('disabled');
                next.setAttribute('page', data.next.page);
                next.setAttribute('limit', data.next.limit);
            } else {
                next.classList.add('disabled');
            }

        })
        .catch(error => {
            console.error('Erro na pesquisa:', error);
        });
}

solicitation(url,'1','15')