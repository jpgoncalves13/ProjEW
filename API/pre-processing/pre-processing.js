const fs = require('fs')

const Search = require('../search/search')
const Judgment = require('../controllers/acordao')

/**
 * Synonyms for the fields of the documents
 * There are repeated fields
 */
let synonyms = {
    'Processo': 'Processo',
    'url': 'url',
    'tribunal': 'tribunal',
    'Data do Acordão': 'Data do Acordão',
    'Descritores': 'Descritores',
    'Relator': 'Relator',
    'Votação': 'Votação',
    'Texto Integral': 'Texto Integral',
    'Decisão': 'Decisão',
    'Meio Processual': 'Meio Processual',
    'Nº do Documento': 'Nº do Documento',
    'Nº Convencional': 'Nº Convencional',
    'Sumário': 'Sumário',
    'Privacidade': 'Privacidade',
    'Legislação Nacional': 'Legislação Nacional',
    'Decisão Texto Integral': 'Decisão Texto Integral',
    'Área Temática': 'Área Temática',
    'Tribunal': 'Tribunal',
    'Recorrente': 'Recorrente',
    'Recorrido 1': 'Recorrido 1',
    'Data de Entrada': 'Data de Entrada',
    'Jurisprudência Nacional': 'Jurisprudência Nacional',
    'Área Temática 1': 'Área Temática 1',
    'Objecto': 'Objecto',
    'Reclamações': 'Reclamações',
    'Ano da Publicação': 'Ano da Publicação',
    'Indicações Eventuais': 'Indicações Eventuais',
    'Tribunal Recurso': 'Tribunal Recurso',
    'Data': 'Data',
    'Secção': 'Juízo ou Secção',
    'Tribunal Recorrido': 'Tribunal Recorrido',
    'Processo no Tribunal Recurso': 'Processo no Tribunal Recurso',
    '1ª Pág. de Publicação do Acordão': '1ª Pág. de Publicação do Acordão',
    'Apêndice': 'Apêndice',
    'Data do Apêndice': 'Data do Apêndice',
    'Processo no Tribunal Recorrido': 'Processo no Tribunal Recorrido',
    'Referência a Doutrina': 'Referência a Doutrina',
    'Área Temática 2': 'Área Temática 2',
    'Data Dec. Recorrida': 'Data Dec. Recorrida',
    'Página': 'Página',
    'Referência de Publicação': 'Referência de Publicação',
    'Texto Parcial': 'Texto Parcial',
    'Parecer Ministério Público': 'Parecer Ministério Público',
    'Referência Publicação 1': 'Referência Publicação 1',
    'Doutrina': 'Referência a Doutrina',
    'Espécie': 'Espécie',
    'Acordão': 'Acordão',
    'Requerente': 'Requerente',
    'Requerido': 'Requerido',
    'Nº do Volume': 'Nº do Volume',
    'Magistrado': 'Magistrado',
    'Contencioso': 'Contencioso',
    'Nº Processo/TAF': 'Nº Processo/TAF',
    'Sub-Secção': 'Sub-Secção',
    'Normas Apreciadas': 'Normas Apreciadas',
    'Constituição': 'Constituição',
    'Nº do Diário da República': 'Nº do Diário da República',
    'Série do Diário da República': 'Série do Diário da República',
    'Data do Diário da República': 'Data do Diário da República',
    'Página do Diário da República': 'Página do Diário da República',
    'Referência a Pareceres': 'Referência a Pareceres',
    'Disponível na JTCA': 'Disponível na JTCA',
    'Legislação Comunitária': 'Legislação Comunitária',
    'Referências Internacionais': 'Referências Internacionais',
    'Normas Julgadas Inconst.': 'Normas Declaradas Inconst.',
    'Recorrido 2': 'Recorrido 2',
    'Normas Suscitadas': 'Normas Suscitadas',
    'Voto Vencido': 'Voto Vencido',
    'Apenso': 'Apenso',
    'Jurisprudência Internacional': 'Jurisprudência Internacional',
    'Legislação Estrangeira': 'Legislação Estrangeira',
    'Recusa Aplicação': 'Recusa Aplicação',
    'Declaração de Voto': 'Declaração de Voto',
    'Tribunal 1ª Instância': 'Tribunal 1ª Instância',
    'Data da Decisão': 'Data da Decisão',
    'Texto das Cláusulas Abusivas': 'Texto das Cláusulas Abusivas',
    'Recursos': 'Recurso',
    'Autor': 'Autor',
    'Réu': 'Réu',
    'Juízo ou Secção': 'Juízo ou Secção',
    'Tipo de Contrato': 'Tipo de Contrato',
    'Tipo de Ação': 'Tipo de Ação',
    'Volume dos Acordãos do T.C.': 'Volume dos Acordãos do T.C.',
    'Página do Volume': 'Página do Volume',
    'Página do Boletim do M.J.': 'Página do Boletim do M.J.',
    'Nº do Boletim do M.J.': 'Nº do Boletim do M.J.',
    'Jurisprudência Constitucional': 'Jurisprudência Constitucional',
    'Normas Declaradas Inconst.': 'Normas Declaradas Inconst.',
    'Nº Único do Processo': 'Nº Único do Processo',
    'Data do Acórdão': 'Data do Acordão',
    'Recurso': 'Recurso',
    'Observações': 'Observações',
    'Data da Decisão Sumária': 'Data da Decisão Sumária',
    'Jurisprudência Estrangeira': 'Jurisprudência Estrangeira',
    'Outras Publicações': 'Outras Publicações',
    'Referência Processo': 'Referência Processo',
    'Outra Jurisprudência': 'Outra Jurisprudência',
    'Referência Publicação 2': 'Referência Publicação 2',
    'Data da Reclamação': 'Data da Reclamação',
    'Peça Processual': 'Peça Processual',
    'Tema': 'Tema',
    'Data da Decisão Singular': 'Data da Decisão Singular',
}

/**
 * Process a file uploaded to the server
 * We read the file in chunks because it is too big to be read at once
 * @param {*} taxonomyTree - search tree for the taxonomy
 * @param {*} file_name - the name of the file to parse
 * @param {*} current_id - the id of the first document in the file
 */
exports.processFile = (taxonomyTree, file_name, current_id) => {
    const StreamArray = require('stream-json/streamers/StreamArray');
    const stream = fs.createReadStream('../Interface/fileProcessing/raw_files/' + file_name).pipe(StreamArray.withParser());
    let chunks = [];
    return stream
      // When a chunk is read
      .on('data', ({ value }) => {
        processDocument(value) // Process that document
        value._id = current_id; // Add the id
        current_id++; // Increment the id
        for(let descritor of value.Descritores){ // Add the descriptor to the taxonomy tree
          Search.addToTaxonomyTree(taxonomyTree, descritor, [value._id])
        }
        chunks.push(value);

        // If the chunk is big enough, send it to the database
        if (chunks.length === 5) {
          stream.pause();
          Judgment.postDocuments(chunks)
            .then(() => {
              chunks = [];
              stream.resume();
            })
            .catch(error => {
              console.log(error);
              stream.resume();
            });
        }
    })
    // When the file is completely read
    .on('end', () => {
        console.log('All done!')
        if (chunks.length) {
          // Send the last chunk to the database
          Judgment.postDocuments(chunks)
            .catch(error => console.log(error));
        }
    })
    .on('error', err => console.error(err));
    console.log(chunks)
  };
  
  
  /**
   * Processes a document, adding new fields, removing other, formatting, etc
   */
  let processDocument = (document) => {
    // Iterate over the keys of the document
    const entries = Object.entries(document);
    // Campos unificados para listas
    document['Recorridos'] = []
    document['Áreas Temáticas'] = []
    document['Referências de Publicação'] = []
    let descritores = []

    if (!document['Descritores']){
      document['Descritores'] = []
    }
  
    for (let [key, value] of entries){
      // Quando há unificação de um campo para outro
      if (key in synonyms){
        if (key != synonyms[key]){
          document[synonyms[key]] = value
          delete document[key]
        }
        if (value == ""){ // Remover os valores nulos
          delete document[key]
          continue;
        }
        if (key.startsWith('Data')){
          const d = new Date(value)
          try{
            document[key] = d.toISOString();
          }
          catch(err){
            delete document[key]
          }
        }
        // Parsing de cada descritor (Separar por ;)
        if (key === 'Descritores'){
          for(desc in document['Descritores']){
            let novosDescritores = document['Descritores'][desc].split(';')
            for(descritor in novosDescritores){
              descritores.push(novosDescritores[descritor].trim())
            }
          }
          document['Descritores'] = descritores
        }
        if (key.startsWith('Recorrido')){
          document['Recorridos'].push(value)
          delete document[key]
        }
        if (key.startsWith('Área Temática') && typeof document[key] === 'string'){
          let novasAreasTematicas = document[key].split(';')
          for(novaAreaTematica in novasAreasTematicas){
            document['Áreas Temáticas'].push(novasAreasTematicas[novaAreaTematica].trim())
          }
          delete document[key]
        }
        if (key.startsWith('Referência de Publicação') || key.startsWith('Referência Publicação')){
          document['Referências de Publicação'].push(value)
          delete document[key]
        }
        // Casos em que a "Data da Decisão Sumária" é igual à "Data do Acordão" e o "Nº Único do Processo" é igual ao "Processo
        if (key === 'Data da Decisão Sumária'){
          if (value === document['Data do Acordão']){
            delete document[key]
          }
        }
        // Casos em que o "Nº Único do Processo" é igual ao "Processo"
        if (key === 'Nº Único do Processo'){
          if (value === document['Processo']){
            delete document[key]
          }
        }
      } // Caso essa chave não conste da lista
      else {
        delete document[key]
      }
    }
  }