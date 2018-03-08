'use strict'

exports.up = function(knex, Promise) {
  return knex.schema.createTable('customer', (table) => {
    table.increments()
    table.string('fullName', 100).notNullable(),
    table.string('uid', 100).notNullable().comment('uid refers to the unique key in BaiduCloud under groupId')
    table.dateTime('dob')
    table.string('gender', 1)
    table.string('imgPath', 255),
    table.string('comment')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('customer')
};
