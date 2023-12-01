var express = require('express');
var router = express.Router();

// Controller to the dbs
var Judgment = require('../controllers/acordao')

var Acordao = require('../models/acordao')

var PreProcessing = require('../pre-processing/pre-processing')

// Functionality related to search
var Taxonomy = require('../search/search')

let taxonomyTree;
let fullTextObject;
let response

// To be executed asynchronously in the start of the program
// Creates the taxonomy tree and the full text object
async function getTaxonomyTree() {
  try {
    [response, fullTextObject] = await Taxonomy.createDescriptorMap();
    taxonomyTree = await Taxonomy.createTaxonomyTree(response);
    console.log("Tree set up")

  } catch (error) {
    console.error('Error:', error);
  }
}

getTaxonomyTree();

/**
 * Function for getting the results for a single page. 
 */
function paginatedResults(model) {
  return async (req, res, next) => {
    const queries = []
    const match = {
      $match : {}
    }
    const sort = {
      $sort : {}
    }
    queries.push(match)

    if (req.query && req.query.ids){
      let processIds = req.query.ids.split(',').map(id => parseInt(id));
      if (req.query.ids === 'none') {
        processIds = []
      }
      queries.push({ $match: { _id: { $in: processIds } } });
    }

    if (req.query && req.query.tribunal) {
      match.$match['tribunal'] = req.query.tribunal
    }
  
    if (req.query && req.query.processo) {
      match.$match['Processo'] = { $regex : new RegExp('^' + req.query.processo, 'i') };
    }
    
    if (req.query && req.query.relator) {
      match.$match['Relator'] = { $regex : new RegExp('^' + req.query.relator, 'i') };
    }

    if (req.query && req.query.descritor) {
      console.log(req.query.descritor.trim().toLowerCase())  
      const processosComDescritor = Taxonomy.getProcessos(req.query.descritor.trim().toLowerCase(), taxonomyTree);
      queries.push({ $match: { _id: { $in: processosComDescritor } } });
      
    }

    if (req.query && req.query.producerId){
      match.$match['producerId'] = req.query.producerId
    }

    if (req.query && req.query.livre) {
      let matchedProcessos = []
      for(key in fullTextObject){
        matchedProcessos = matchedProcessos.concat(fullTextObject[key][req.query.livre.trim().toLowerCase()])
      }
      console.log(matchedProcessos)
      queries.push({ $match: { _id: { $in: matchedProcessos } } });
    }

    if (req.query && req.query.sortBy) {
      if (req.query.sortBy === 'Data asc') {
        sort.$sort['Data do Acordão'] = 1
        queries.push(sort)
      }
      else if (req.query.sortBy === 'Data desc') {
        sort.$sort['Data do Acordão'] = -1
        queries.push(sort)
      }
      else if(req.query.sortBy === 'Relator asc') {
        sort.$sort['Relator'] = 1
        queries.push(sort)
      }
      else if(req.query.sortBy === 'Relator desc') {
        sort.$sort['Relator'] = -1
        queries.push(sort)
      }
    }

    console.log(queries)
  
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = {};
    
    try {
      res.paginatedResults = results;

      const aggregation = model.aggregate(queries);
      var total = await model.aggregate([...queries, { $count: 'count' }]).exec();
      total = total.length > 0 ? total[0].count : 0
      results.results = await aggregation.skip(startIndex).limit(limit).exec();
      
      if (endIndex < total) {
          results.next = { 
            page: page + 1,
            limit: limit
          }      
      }

      if (startIndex > 0) {
          results.previous = { 
            page: page - 1,
            limit: limit
          }
      }

      next();
    } catch (error) {
      res.status(500).json({error: error, message: error.message});
    }
  }
}

/**
 * GET all the judgments
 */
router.get('/acordaos', paginatedResults(Acordao), function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(res.paginatedResults);
});

/**
 * GET all the courts
 */
router.get('/acordaos/tribunais', (req, res) => {
  Judgment.getTribunais()
    .then(data => res.status(200).json(data))
    .catch(error => res.status(525).json({error: error, message: "Could not retreive the courts list"}))
})

/**
 * GET judgment given the ID
 */
router.get('/acordaos/:id', (req,res) => {
  Judgment.getAcordao(req.params.id)
    .then(data => res.status(200).json(data))
    .catch(error => res.status(521).json({error: error, message: "Could not obtain the judgment"}))
})

/**
 * Get all the judgments with the same process id
 */
router.get('/acordaos/apensos/:n_processo', (req,res) => {
  Judgment.getDoMesmoProcesso(req.params.n_processo.replace(',', '/'))
  .then(data => res.status(200).json(data))
  .catch(error => res.status(521).json({error: error, message: "Could not obtain the judgments with same process id"}))
})

/**
 * GET the current maximum ID
 */
router.get('/currentId', (req, res) => {
  Judgment.getCurrentId()
  .then(data => res.status(200).json(data))
  .catch(error => res.status(522).json({error: error, message: "Could not obtain the current id"}))
})

/**
 * Route for posting a file
 */
router.get('/postFile/:file_name', (req, res) => {
  Judgment.getCurrentId()
    .then(data => {
      PreProcessing.processFile(taxonomyTree, req.params.file_name, data._id)
    })
    .catch(error => {
      console.log(error);
      res.status(521).json({ error: error, message: error });
    });
});

/**
 * POST a judgment
 */
router.post('/acordaos', (req,res) => {
  Judgment.addAcordao(req.body, taxonomyTree, fullTextObject)
    .then(data => res.status(201).json(data))
    .catch(error => res.status(526).json({error: error, message: "Could not insert the judgment"}))
})

/**
 * PUT a judgment
 */
router.put('/acordaos/:id', (req,res) => {
  Judgment.updateAcordao(req.body, req.params.id)
    .then(data => res.status(200).json(data))
    .catch(error => res.status(527).json({error: error, message: "Could not update the judgment"}))
})

/**
 * DELETE a judgment
 */
router.delete('/acordaos/:id', (req,res) => {
  Judgment.deleteAcordao(req.params.id)
    .then(data => res.status(200).json(data))
    .catch(error => res.status(528).json({error: error, message: "Could not delete the judgment"}))
})

module.exports = router;