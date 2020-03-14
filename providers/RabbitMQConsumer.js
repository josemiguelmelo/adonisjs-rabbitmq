const RabbitMQService = require('./RabbitMQService')

class RabbitMQConsumer extends RabbitMQService {
  constructor(Config, logger) {
    super(Config, logger, 'Consumer')
    this.listeners = Config.get('queues.rabbitmq.consumers')
  }

  startConsumer() {
    if (!this._connection) { return setTimeout(() => this.startConsumer(), 1000) }

    this._connection.createChannel((err, ch) => {
      if (this.closeOnErr(err)) return
      ch.on('error', (err) => {
        this.logger.error('[AMQP Consumer] channel error', err.message)
      })
      ch.on('close', () => {
        this.logger.info('[AMQP Consumer] channel closed')
      })

      this._channel = ch

      this._channel.prefetch(10)
      this.listeners.forEach(l => {
        this._channel.assertExchange(l.exchange, 'fanout', {
          durable: false
        })

        this._channel.assertQueue(l.queueName, { durable: true }, (err, _q) => {
          if (this.closeOnErr(err)) return

          this._channel.bindQueue(l.queueName, l.exchange, l.queueName)
          this._channel.consume(l.queueName, l.handler, { noAck: true })
          this.logger.info('[AMQP Consumer] Worker is started')
        })
      })
    })
  }
}

module.exports = RabbitMQConsumer
