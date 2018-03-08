'use strict'

const express = require('express')
const router = express.Router()
const multer = require('multer');
const upload = multer({ dest: 'public/faces/group/user' })
const uuidv1 = require('uuid/v1')
const fs = require('fs')
const faceService = require('../services/faceService')
const pinyin = require('pinyin')
const knex = require('../mysql/connection.js')
const config = require('config')
const programConfig = config.get('programConfig')
const _ = require('lodash')

router.get('/', function(req, res) {
  
  faceService.getUsers().then((users) => {

    res.render('system', {
      'title': 'PwC Emerging Tech Lab System',
      'users': users
    })
  })
})

router.post('/face', upload.single('avatar'), function(req, res) {

  var maxSize = 2 * 1000 * 1000 // 2mb max
  if (req.file.size > maxSize) {
    return res.send('Upload failed, file size exceeds 2MB')
  }

  let filename = req.file.filename
  let filepath = req.file.path
  let newname = 'img-' + uuidv1() + '.png'
  let newpath = filepath.replace(filename, newname)
  let personName = req.body.personName

  fs.renameSync(filepath, newpath)

  faceService.detect(newpath).then((result) => {

    if (result.length !== 1) {
      return res.json({
        'status': 'fail',
        'message': 'Nothing or more than one faces detected'
      })
    }

    if (result[0].age > programConfig.ageThreshold) {
      return res.json({
        'status': 'fail',
        'message': 'Are you sure this kid is less than 10 years old?'
      })
    }

    let uid = pinyin(personName, {
      style: pinyin.STYLE_NORMAL
    })

    uid = _.flattenDeep(uid).join('').replace(/ /g, '_')
    let newUid = ''

    // Save to db
    knex('customer')
      .returning('id')
      .insert({
        fullName: personName,
        imgPath: newpath,
        uid: ''
      })
      .then((id) => {
        
        newUid = `${uid}_${id}`
        knex('customer').update({
          uid: newUid
        })
        .where({ id: id })
        .then(() => {
          
          faceService.updateUser(newUid, personName, newpath).then(() => {
            res.send('Upload Successfully.')
          })
        })
      })
  })
})

module.exports = router