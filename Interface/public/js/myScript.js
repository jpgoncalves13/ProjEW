
if (document.getElementById('searchLivre')) document.getElementById('searchLivre').addEventListener('input', search);
if (document.getElementById('searchProcesso')) document.getElementById('searchProcesso').addEventListener('input', search);
if (document.getElementById('searchRelator')) document.getElementById('searchRelator').addEventListener('input', search);
if (document.getElementById('searchDescritores')) document.getElementById('searchDescritores').addEventListener('input', search);
if (document.getElementById('selectElement')) document.getElementById('selectElement').addEventListener('change', search);

let l, s, p, r, d;

function truncateText(text, maxLength) {
    if (text) {
        if (text.length > maxLength) {
            return text.slice(0, maxLength) + '...';
        }
        return text;
    } else {
        return 'N/A'
    }
}

function popup(link, idName){
    return `
<div class="modal fade" id="${idName}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <p>Tem a certeza de que pretende eliminar o registo?</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Não</button>
        <button class="btn btn-secondary" type="button" data-bs-dismiss="modal"><a href="${link}">Sim</a></button>
      </div>
    </div>
  </div>
</div>
    `
}


// Fazer uma solicitação ao servidor
function solicitation(str, page, limit) {
    fetch(str+'&page='+page+'&limit='+limit)
        .then(response => response.json())
        .then(data => {
            // Limpar a lista de resultados
            const resultsList = document.getElementById('resultsList');
            resultsList.innerHTML = '';
            let ind = 0
            data.results.forEach(result => {
                // Criar o HTML para cada resultado
                let listItemHTML = `<li class="list-group-item">
                <div class="card mb -2"> <div class="card-body">
                <div class="row pb-2">
                <div class="col-md-6">
                <h5 class="text-start text-primary"><a href="/acordaos/${result._id}">${result.Processo || 'N/A'}</a></h1>
                </div>`
                
                if (favorites) {
                    listItemHTML += ` <div class="row">
                <div class="text-start"><b>Descrição: </b>${favorites[result._id] || 'N/A'}</div>
                </div>`
                }

                listItemHTML += `<div class="col-md-6">`
                if (editable){
                    listItemHTML += popup('/acordaos/delete/'+result._id, `confirm${ind}`)
                    listItemHTML += `<div class="text-end h5"><a class="mx-1" type="button" data-bs-toggle='modal', data-bs-target='#confirm${ind}'"><i class="fa-solid fa-trash"></i></a>    `
                    listItemHTML += `<a class="mx-1" href="/acordaos/edit/${result._id}"><i class="fa-solid fa-pen-to-square"></i></a></div>`
                }
                listItemHTML +=`</div></div>
                <div class="row pb-2">
                    <div class="col-md-4"> 
                        <div class="text-start"> <b>Tribunal:</b> ${result.tribunal || 'N/A'}</div>
                    </div>
                    <div class="col-md-4"> 
                        <div class="text-start"> <b>Relator:</b> ${result.Relator || 'N/A'}</div>
                    </div>
                    <div class="col-md-4"> 
                        <div class="text-start"> <b>Data do Acordão:</b> ${(result['Data do Acordão']) ? result['Data do Acordão'].slice(0,10) : 'N/A'}</div>
                    </div>
                </div>
                <div class="text-start pb-2"> <b>Área Temática:</b> ${result['Área Temática'] || 'N/A'}</div>
                <div class="text-start pb-2"> <b>Descritores:</b> ${result['Descritores'] || 'N/A'}</div>
                <div class="text-start pb-2">
                    <b>Sumário:</b> ${truncateText(result['Sumário'], 500) || 'N/A'}
                    <!-- Button trigger modal -->
                    <a href="#" class="p-1 rounded" data-bs-toggle="modal" data-bs-target="#staticBackdrop${result._id}">    Ver mais </a>
                    <div class="modal fade" id="staticBackdrop${result._id}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                        <div class="modal-header">
                            <h1 class="modal-title fs-5" id="staticBackdropLabel"><a href="/acordaos/${result._id}">${result.Processo || 'N/A'}</a>- Sumário</h1>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="close"></button>
                        </div>
                        <div class="modal-body">
                            ${result['Sumário'] || 'N/A'}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
                </div>`;

                // Adicionar o HTML à lista de resultados
                resultsList.innerHTML += listItemHTML;
                ind++
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

document.getElementById('previous').addEventListener('click', (e) => {
    var str = url

    l = document.getElementById('searchLivre').value;
    if (l !== '') {
      str += '&livre=' + l; 
    }
    p = document.getElementById('searchProcesso').value;
    if (p !== '') {
        str += '&processo=' + p; 
    }
    r = document.getElementById('searchRelator').value;
    if (r !== '') {
        str += '&relator=' + r; 
    }
    d = document.getElementById('searchDescritores').value;
    if (d !== '') {
        str += '&descritor=' + d; 
    }
    s = document.getElementById('selectElement').value;
    if (s !== '') {
        str += '&sortBy=' + s; 
    }

    solicitation(str,e.target.getAttribute('page'),e.target.getAttribute('limit'))
});

document.getElementById('next').addEventListener('click', (e) => {
    var str = url
    l = document.getElementById('searchLivre').value;
    if (l !== '') {
      str += '&livre=' + l; 
    }
    p = document.getElementById('searchProcesso').value;
    if (p !== '') {
        str += '&processo=' + p; 
    }
    r = document.getElementById('searchRelator').value;
    if (r !== '') {
        str += '&relator=' + r; 
    }
    d = document.getElementById('searchDescritores').value;
    if (d !== '') {
        str += '&descritor=' + d; 
    }
    s = document.getElementById('selectElement').value;
    if (s !== '') {
        str += '&sortBy=' + s; 
    }

    solicitation(str,e.target.getAttribute('page'),e.target.getAttribute('limit'))
});



function search() {
    var str = url
    
    l = document.getElementById('searchLivre').value;
    if (l !== '') {
      str += '&livre=' + l; 
    }
    p = document.getElementById('searchProcesso').value;
    if (p !== '') {
        str += '&processo=' + p; 
    }
    r = document.getElementById('searchRelator').value;
    if (r !== '') {
        str += '&relator=' + r; 
    }
    d = document.getElementById('searchDescritores').value;
    if (d !== '') {
        str += '&descritor=' + d; 
    }
    s = document.getElementById('selectElement').value;
    console.log("S: " + s)
    if (s !== '') {
        str += '&sortBy=' + s; 
    }
    solicitation(str,'1','15');
}

solicitation(url,'1','15')