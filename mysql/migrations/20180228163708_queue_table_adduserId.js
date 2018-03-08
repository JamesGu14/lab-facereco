'use strict'

exports.up = function(knex, Promise) {
  
  return knex.schema.alterTable('greetingQueue',(table) => {
    table.integer('customerId').unsigned()
    table.foreign('customerId').references('customer.id')
  })
}

exports.down = function(knex, Promise) {
  
}
