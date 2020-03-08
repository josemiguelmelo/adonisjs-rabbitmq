const { ServiceProvider } = require('@adonisjs/fold')
const RabbitMQConsumer = require('./RabbitMQConsumer')
const RabbitMQProducer = require('./RabbitMQProducer')

class RabbitMQProvider extends ServiceProvider {
  register() {
    this.app.singleton('RabbitMQ/Queue/Consumer', () => {
      const Config = this.app.use('Adonis/Src/Config')
      const Logger = this.app.use('Logger')

      const consumer = new RabbitMQConsumer(Config, Logger)

      consumer.connect(() => { })

      return consumer
    })

    this.app.singleton('RabbitMQ/Queue/Producer', () => {
      const Config = this.app.use('Adonis/Src/Config')
      const Logger = this.app.use('Logger')

      const producer = new RabbitMQProducer(Config, Logger)

      producer.connect(async() => { await producer.startPublisher() })

      return producer
    })
  }
}

module.exports = RabbitMQProvider
