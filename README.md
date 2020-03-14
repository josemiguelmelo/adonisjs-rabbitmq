# adonisjs-rabbitmq

## Installation

In order to install, run the following command:

    adonis install adonisjs-rabbitmq

After that, add RabbitMQProvider to the list of providers on `start/app.js`:

    const providers = [
        ....,
        'adonisjs-rabbitmq/providers/RabbitMQProvider'
    ]

You also need to add a configuration to `config/queues.js`:

    'use strict'

    const Env = use('Env')

    module.exports = {
      driver: 'rabbitmq',
      rabbitmq: {
        url: Env.get('RABBIT_MQ_URL', 'amqp://<username>:<password>@<host>:<port>/<vhost>'),
        consumers: []
      }
    }

## Usage

### Producer

In order to use the producer, you must require it on the code:

    const RabbitMQProducer = use('RabbitMQ/Queue/Producer')

To publish something to Rabbit:

    RabbitMQProducer.publish(exchange, routingKey, content)

### Consumer

Consumers are defined on `config/queues.js`:

    url: Env.get('RABBIT_MQ_URL', 'amqp://rabbitmq:rabbitmq@localhost:5672/'),
        consumers: [
          {
            queueName: 'example-queue',
            exchange: 'example-exchange',
            handler: (content) => console.log(content.content.toString())
          }
        ]

In order to consume messages from RabbitMQ, you must start the consumers on startup:

    const rabbimqConsumer = use('RabbitMQ/Queue/Consumer')
    rabbimqConsumer.startConsumer()
