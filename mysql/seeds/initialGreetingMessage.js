'use strict'

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('greetingTemplate').del()
    .then(function () {
      // Inserts seed entries
      return knex('greetingTemplate').insert([
        { template: 'Nice to meet you, {name}, Welcome to the PwC tech lab！' },
        { template: 'How are you, {name}, Glad to see you here' },
      ]);
    });
};
