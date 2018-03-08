'use strict'

exports.up = function(knex, Promise) {
  
  return knex.schema.createTable('greetingTemplate', (table) => {
    table.increments()
    table.string('template').notNullable()
  })
}

exports.down = function(knex, Promise) {
  
  return knex.schema.dropTable('greetingTemplate')
}
