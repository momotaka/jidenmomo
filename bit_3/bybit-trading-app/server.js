const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const ccxt = require('ccxt');
require('dotenv').config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;
const WS_PORT = 3001;

// Initialize Bybit exchange
const exchange = new ccxt.bybit({
  apiKey: process.env.BYBIT_API_KEY,
  secret: process.env.BYBIT_API_SECRET,
  enableRateLimit: true,
  options: {
    defaultType: 'future',
  }
});

if (process.env.BYBIT_TESTNET === 'true') {
  exchange.urls.api = {
    public: 'https://api-testnet.bybit.com',
    private: 'https://api-testnet.bybit.com',
  };
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });

  // WebSocket server
  const wsServer = createServer();
  const io = new Server(wsServer, {
    cors: {
      origin: `http://localhost:${PORT}`,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    // Subscribe to price updates
    socket.on('subscribe', async (symbol) => {
      console.log(`Subscribing to ${symbol}`);
      
      const sendTicker = async () => {
        try {
          const ticker = await exchange.fetchTicker(symbol);
          socket.emit('ticker', {
            symbol: ticker.symbol,
            bid: ticker.bid || 0,
            ask: ticker.ask || 0,
            last: ticker.last || 0,
            timestamp: new Date(ticker.timestamp),
            volume24h: ticker.quoteVolume || 0,
            change24h: ticker.percentage || 0,
          });
        } catch (error) {
          console.error('Error fetching ticker:', error);
        }
      };

      // Send initial data
      await sendTicker();

      // Send updates every second
      const interval = setInterval(sendTicker, 1000);

      socket.on('unsubscribe', () => {
        clearInterval(interval);
      });

      socket.on('disconnect', () => {
        clearInterval(interval);
      });
    });
  });

  // アラート通知用のグローバルイベントエミッター
  global.alertEmitter = io;

  wsServer.listen(WS_PORT, () => {
    console.log(`> WebSocket server ready on ws://localhost:${WS_PORT}`);
  });
});