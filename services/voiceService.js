'use strict'

const config = require('config')
const programConfig = config.get('programConfig')
const Promise = require('bluebird')
const knex = require('../mysql/connection.js')
const moment = require('moment')
const _ = require('lodash')
const googleTTS = require('google-tts-api');

// Query db to check if any queue message
function queryQueueAudio() {

  return new Promise((resolve, reject) => {

    knex.from('greetingQueue').select('*').where({
        played: false
      }).orderBy('id', 'desc').limit(1)
      .then((greeting) => {

        if (greeting && greeting.length === 1) {

          text2Audio(greeting[0].message).then((audioUrl) => {
            knex.from('greetingQueue').where({
                id: greeting[0].id
              }).update({
                played: true,
                playedAt: new Date()
              })
              .then(() => {
                resolve(audioUrl)
              })
          })
        } else {
          reject('No unplayed messages')
        }
      })
      .catch(function (err) {
        reject(err)
      })
  })
}

function filterRecentGreeted(users) {

  return new Promise((resolve, reject) => {

    if (users === null || users.length <= 0) {
      reject('No face found from DB')
    }

    let customerIdArr = []
    users.forEach(u => {
      customerIdArr.push(u.id)
    })

    knex.from('greetingQueue').whereIn('customerId', customerIdArr)
      .andWhere('createdAt', '>', moment().subtract(programConfig.recoInterval, 'seconds').format('YYYY-MM-DD HH:mm:ss')).then((result) => {

        let recentPlayedCustomerId = []
        result.forEach(r => {

          recentPlayedCustomerId.push(r.customerId)
        })

        resolve(_.reject(users, function (o) {
          return recentPlayedCustomerId.indexOf(o.id) >= 0
        }))
      })
  })
}

// TODO: 随机生成问候内容
function composeGreeting(users) {

  return new Promise(function (resolve, reject) {

    if (users === null || users.length <= 0) {
      reject('No users not greeted lately')
    }

    let names = []
    users.forEach(u => {
      names.push(u.fullName)
    })

    let content = ''
    if (users.length > 1) {
      content = `Nice to meet you, ${names.join('，')}`
    } else if (users.length === 1) {
      content = `Glad to see you here, ${names[0]}`
    }

    resolve({
      content: content,
      users: users
    })
  })
}

function queueAudioMessage(content, users) {

  return new Promise((resolve, reject) => {

    let newUsers = []
    users.forEach(u => {
      newUsers.push({
        message: content,
        createdAt: new Date(),
        customerId: u.id,
        played: true
      })
    })
    newUsers[0].played = false

    knex('greetingQueue').insert(newUsers).then(() => {
      resolve()
    }).catch((err) => {
      reject(err)
    })
  })
}

// BAIDU API compose audio
function text2Audio(content) {

  return new Promise(function (resolve, reject) {
    console.log(content)
    googleTTS(content, 'en', 1) // speed normal = 1 (default), slow = 0.24
      .then(function (url) {

        resolve(url)
      })
      .catch(function (err) {
        console.error(err.stack);
        reject(err)
      });
  })
}

module.exports = {
  composeGreeting: composeGreeting,
  text2Audio: text2Audio,
  queryQueueAudio: queryQueueAudio,
  queueAudioMessage: queueAudioMessage,
  filterRecentGreeted: filterRecentGreeted
}