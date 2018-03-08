'use strict'

exports.up = function(knex, Promise) {
  return knex.schema.createTable('greetingQueue', (table) => {
    table.increments()
    table.string('message').notNullable()
    table.dateTime('createdAt')
    table.dateTime('playedAt')
    table.boolean('played').defaultTo(false)
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('greetingQueue')
}
