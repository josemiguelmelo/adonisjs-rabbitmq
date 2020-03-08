'use strict'
const { Config, Logger } = require('@adonisjs/sink')
const { ioc } = require('@adonisjs/fold')
const RabbitMQProvider = require('../providers/RabbitMQProvider.js')
const RabbitMQConsumer = require('../providers/RabbitMQConsumer.js')
const RabbitMQProducer = require('../providers/RabbitMQProducer.js')

const amqplib = require('amqplib/callback_api')
const fakeAmqp = require('exp-fake-amqplib')
amqplib.connect = fakeAmqp.connect

const { assert } = require('chai')
let producer, consumer

/* eslint-disable no-undef */
before(function() {
  ioc.singleton('Adonis/Src/Config', () => {
    const config = new Config()
    config.set('queues.rabbitmq.url', 'amqp://rabbitmq:rabbitmq@localhost:5672/')
    return config
  })

  ioc.singleton('Exception', () => {
    return {
      handlers: {},
      reporters: {},
      handle(errName, errHandler) {
        this.handlers[errName] = errHandler
      },
      report(errName, errReporter) {
        this.reporters[errName] = errReporter
      }
    }
  })

  ioc.singleton('Logger', () => {
    return new Logger()
  })

  ioc.singleton('Adonis/Src/HttpContext', () => {
    return {
      request: {},
      response: {},
      params: {},
      getter(name, callback) {
        this[name] = callback()
      }
    }
  })

  const provider = new RabbitMQProvider(ioc)
  provider.register()

  producer = ioc.use('RabbitMQ/Queue/Producer')
  consumer = ioc.use('RabbitMQ/Queue/Consumer')
})

describe('RabbitMQ', function() {
  it('queue provider instance registers instance(s) as expected', (done) => {
    assert.instanceOf(consumer, RabbitMQConsumer)
    assert.instanceOf(producer, RabbitMQProducer)
    done()
  })

  it('should send data over the queue', function(done) {
    const contentToSend = 'testing content'
    const exchange = 'test'

    consumer.startConsumer([
      {
        queueName: 'test',
        exchange,
        handler: (content) => {
          assert.equal(content.content.toString(), contentToSend)
          done()
        }
      }
    ])

    setTimeout(() => done('Timeout exceeded'), 1000)

    producer.publish(exchange, 'test', contentToSend)
  })
})
