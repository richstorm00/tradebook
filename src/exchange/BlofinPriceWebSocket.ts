import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import { priceStore } from './PriceStore';

const BLOFIN_WS_URL = 'wss://openapi.blofin.com/ws/public';

export class BlofinPriceWebSocket {
  private ws: ReconnectingWebSocket | null = null;
  private symbols: string[];

  constructor(symbols: string[]) {
    this.symbols = symbols;
  }

  start() {
    if (this.ws) return;
    this.ws = new ReconnectingWebSocket(BLOFIN_WS_URL, [], { WebSocket: WS });
    this.ws.addEventListener('open', () => {
      console.log('[BlofinPriceWebSocket] Connected to Blofin public WebSocket');
      this.subscribeToTickers();
    });
    this.ws.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });
  }

  private subscribeToTickers() {
    if (!this.ws) return;
    for (const symbol of this.symbols) {
      // Blofin uses e.g. BTC-USDT format
      const instId = symbol.replace('USDT', '-USDT');
      const msg = {
        op: 'subscribe',
        args: [
          {
            channel: 'tickers',
            instId,
          },
        ],
      };
      console.log(`[BlofinPriceWebSocket] Subscribing to ticker: ${instId}`);
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(data: any) {
    try {
      const msg = JSON.parse(data);
      if (msg.event === 'subscribe' || msg.event === 'pong') return;
      if (msg.arg && msg.arg.channel === 'tickers' && Array.isArray(msg.data)) {
        for (const ticker of msg.data) {
          const instId: string = ticker.instId; // e.g. BTC-USDT
          const symbol = instId.replace('-USDT', 'USDT');
          const price = parseFloat(ticker.last);
          if (!isNaN(price)) {
            console.log(`[BlofinPriceWebSocket] Price update: ${symbol} = ${price}`);
            priceStore.updatePrice(symbol, price);
          }
        }
      }
    } catch (err) {
      console.error('[BlofinPriceWebSocket] Error handling message:', err);
    }
  }
} 