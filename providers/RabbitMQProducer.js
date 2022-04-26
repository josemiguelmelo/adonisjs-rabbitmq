const RabbitMQService = require('./RabbitMQService')

class RabbitMQProducer extends RabbitMQService {
  constructor(Config, logger) {
    super(Config, logger, 'Producer')
    this._offlinePubQueue = []
  }

  publish(
    exchange,
    routingKey,
    content,
    options = {}
  ) {
    const { type = 'fanout', durable = false } = options

    try {
      this._pubChannel.assertExchange(exchange, type, {
        durable
      })

      this._pubChannel.publish(
        exchange,
        routingKey,
        Buffer.from(content),
        { persistent: true },
        (err, _ok) => {
          if (err) {
            this.logger.error('[AMQP Producer] publish error:', err)
            this._offlinePubQueue.push([exchange, routingKey, content])
            this._pubChannel.connection.close()
          }
        }
      )
    } catch (e) {
      this.logger.error('[AMQP Producer] channel publish failure: ', e.message)
      this._offlinePubQueue.push([exchange, routingKey, content, options])
    }
  }

  sendPending() {
    if (this._offlinePubQueue.length > 0) {
      var [exchange, routingKey, content, options] = this._offlinePubQueue.shift()
      this.publish(exchange, routingKey, content, options)
    }

    setTimeout(() => this.sendPending(), 5000)
  }

  async startPublisher() {
    this._connection.createConfirmChannel((err, ch) => {
      if (this.closeOnErr(err)) return
      ch.on('error', (err) => {
        this.logger.error('[AMQP Producer] channel error', err.message)
      })
      ch.on('close', () => {
        this.logger.info('[AMQP Producer] channel closed')
      })

      this._pubChannel = ch

      this.sendPending()
    })
  }
}

module.exports = RabbitMQProducer
