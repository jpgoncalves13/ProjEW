/**
 * Module to add and update documents in the databases
 */

// Model that makes the connection with the mongoDB database
var Judgment = require('../models/acordao')

// Controller that provides functionality to connect with the algolia database
var Algolia = require('./algolia.js')

// Module fs - for I/O operations
const fs = require('fs');

// Function from the search used used to update the search structures
const { addToTaxonomyTree } = require('../search/search');

/**
 * Mapping the court acronyms to their names
 */
var nomesTribunais = {
  'atco1': 'Tribunal Constitucional',
  'jcon': 'Tribunal dos Conflitos',
  'jdgpj': 'Cláusulas Abusivas julgadas pelos Tribunais',
  'jsta': 'Supremo Tribunal Administrativo',
  'jstj': 'Supremo Tribunal de Justiça',
  'jtca': 'Tribunal Central Administrativo Sul',
  'jtcampca': 'Pareceres do MP do Tribunal Central Administrativo Sul - Contencioso Administrativo',
  'jtcampct': 'Pareceres do MP do Tribunal Central Administrativo Sul - Contencioso Tributário',
  'jtcn': 'Tribunal Central Administrativo Norte',
  'jtrc': 'Tribunal da Relação de Coimbra',
  'jtre': 'Tribunal da Relação de Évora',
  'jtrg': 'Tribunal da Relação de Guimarães',
  'jtrl': 'Tribunal da Relação de Lisboa',
  'jtrp': 'Tribunal da Relação do Porto'
}

/**
 * Retrieve all judgments from the BD
 * RETRIEVE
 * @returns The judgments or an error
 */
module.exports.list = () => {
  return Judgment
          .find() // No filters
          .then(resp => {
            return resp
          })
          .catch(error => {
            console.log("Controller mongoDB: " + error)
            return error
          })
}

/**
 * Retrieve a judgment from the BD given its id
 * RETRIEVE
 * @param {*} id - the id of the judgment
 * @returns The judgment or an error
 */
module.exports.getAcordao = id => {
  return Judgment
          .find({_id: id})
          .then(resp => {
            return resp
          })
          .catch(error => {
            console.log("Controller mongoDB: " + error)
            return error
          })
}

/**
 * Retrieve a list of judgments from the BD given its process 
 * RETRIEVE
 * @param {*} process - the process id of the judgments
 * @returns The judgments or an error
 */
module.exports.getDoMesmoProcesso = process => {
  return Judgment
          .find({Processo: process})
          .then(resp => {
            return resp
          })
          .catch(error => {
            console.log("Controller mongoDB: " + error)
            return error
          })
}

/**
 * Retrieve all distinct courts
 * @returns an object that relates each acronym in the db to its name
 */
module.exports.getTribunais = () => {
  return Judgment
        .distinct('tribunal')
        .then(resp => {
          var tribunais = {}    
          
          // Foreach court acronym, add their complete name
          for(var i = 0; i < resp.length; i++) {
            tribunais[resp[i]] = nomesTribunais[resp[i]]
          }
          return tribunais
        })
        .catch(error => {
          console.log("Controller mongoDB: " + error)
          return error
        })
}

/**
 * Retrieve all judgments from a specific court
 * @param {*} tribunal - the acronym of the court
 * @returns a list of ids of the judgments from that court
 */
module.exports.getAcordaosDoTribunal = tribunal => {
  return Judgment
          .find({tribunal: tribunal})
          .then(resp => {
            return resp
          })
          .catch(error => {
            console.log("Controller mongoDB: " + error)
            return error
          })
}

/**
 * Get the next id to be used in the database
 * @returns the next id to be used
 */
module.exports.getCurrentId = () => {
  return Judgment
          .find({}, {_id: 1})
          .sort({_id: -1}) // Sort descending
          .limit(1) // Only the maximum
          .then(resp => {
            // If there are no judgments in the database, start in 0
            if (resp.length == 0){
              return {_id: 0}
            }
            else{
              // Else return the maximum id +1
              return {_id: resp[0]._id+1}
            }
          })
          .catch(error => {
            console.log("Controller mongoDB: " + error)
            return error
          })
}

// For PUT, POST and DELETE operations, we must update also in the algolia database

/**
 * Creates a new judgment in the BDs
 * CREATE
 * @param {judgment} judgment 
 * @returns the created judgment or an error
 */
module.exports.addAcordao = async (judgment, taxonomyTree, pesquisaLivre) => {
  try {
    let fullTextFields = ['Relator', 'tribunal']
    // If the judgment does not have an id, get the next id to be used
    if (!judgment._id) {
      const data = await this.getCurrentId();
      judgment._id = data._id;
      
    }
    console.log(judgment)
    // Insert it in the database
    const resp = await Judgment.create(judgment);
    await Algolia.add([judgment]);

    // Update the taxonomy tree
    for (let descritor of judgment.Descritores) {
      addToTaxonomyTree(taxonomyTree, descritor, [judgment._id]);
    }

    for(let field of fullTextFields){
      const fieldText = judgment[field];
      if(fieldText){
        const fieldWords = fieldText.split(/\s+/);
        for(const word of fieldWords){
          const treatedWord = word.trim().toLowerCase();

          if (pesquisaLivre[field][treatedWord]) {
            pesquisaLivre[field][treatedWord].push(judgment._id)
          } else {
            pesquisaLivre[field][treatedWord] = [judgment._id]
          }
        }
      }
    }

    return resp;
  } catch (error) {
    console.log("Controller mongoDB: " + error);
    return error;
  }
};


/**
 * Updates a judgment in the BD
 * UPDATE
 * @param {judgment} judgment 
 * @returns the updated judgment or an error
 */
module.exports.updateAcordao = async (judgment, id) => {
  try {
    await Judgment.updateOne({ _id: id }, judgment);
    judgment._id = id;
    await Algolia.update(judgment);
    return judgment;
  } catch (error) {
    console.log("Controller mongoDB: " + error)
    return error;
  }
};

/**
 * Deletes a judgment from the BDs
 * DELETE
 * @param {int} id 
 * @returns the deleted judgment or an error
 */
module.exports.deleteAcordao = async (id) => {
  try {
    await Judgment.deleteOne({ _id: id });
    await Algolia.remove(id);
    return { success: true };
  } catch (error) {
    return error;
  }
};

/**
 * Add a list of documents to the databases
 * For efficiency purposes and to be used after processing uploaded files
 * @param {*} documents 
 * @returns an acknowledgment or an error
 */
module.exports.postDocuments = async (documents) => {
  try {
    const resp = await Judgment.insertMany(documents);
    await Algolia.add(documents);
    return resp;
  } catch (error) {
    console.log(error);
    return error;
  }
};