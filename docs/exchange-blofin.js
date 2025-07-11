const axios = require('axios');
const crypto = require('crypto');
const config = {
  mode: 'demo', // 'demo' or 'live'
  api: {
    demo: {
      apiKey: 'd7312008a8554691aaff26c78aef1dab',
      secret: 'af11f5b887c3404e82bd8b44aafac8a9',
      passphrase: 'wXWooNka4vWNq1',
    },
    live: {
      apiKey: 'YOUR_LIVE_API_KEY',
      secret: 'YOUR_LIVE_API_SECRET',
      passphrase: 'YOUR_LIVE_API_PASSPHRASE',
    },
  },
  risk: {
    perTrade: 0.05, // 5% of available balance per trade
    trailingStop: 0.04, // 4% trailing stop
    leverage: 5, // Default leverage
  },
  strategy: {
    minVolume: 100, //100000, // Minimum 24h volume to consider a pair
    candleInterval: '1h', // Timeframe to scan
    lookback: 50, // Number of candles to fetch for analysis
  },
  polling: {
    intervalMs: 60 * 1000, // 1 minute between scans
  },
};

class BloFinExchange {
  constructor() {
    this.apiKey = config.apiKey;
    this.secret = config.secret; 
    this.passphrase = config.passphrase;

    this.baseUrl = config.live
      ? 'https://openapi.blofin.com'
      : 'https://demo-trading-openapi.blofin.com';
  }

  generateNonce() {
    return crypto.randomBytes(16).toString('hex'); // Generates a 32-character hexadecimal string
  }

  generateSignature(path, method, timestamp, nonce, body = '') {
    // Ensure the body is a compact JSON string
    const compactBody = body ? JSON.stringify(JSON.parse(body)) : '';
    const prehash = `${path}${method}${timestamp}${nonce}${compactBody}`;
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(prehash);
    const hexSignature = hmac.digest('hex');
    return Buffer.from(hexSignature).toString('base64');
  }

  async request(method, path, params = {}, data = {}) {
    try {
      const timestamp = Date.now().toString();
      const nonce = this.generateNonce();
      let fullPath = path;
      let body = '';

      if (method === 'GET' && Object.keys(params).length) {
        const query = new URLSearchParams(params).toString();
        fullPath += `?${query}`;
      } else if (method !== 'GET') {
        body = JSON.stringify(data);
      }

      const signature = this.generateSignature(fullPath, method, timestamp, nonce, body);
      const headers = {
        'ACCESS-KEY': this.apiKey,
        'ACCESS-SIGN': signature,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-NONCE': nonce,
        'ACCESS-PASSPHRASE': this.passphrase,
        'Content-Type': 'application/json',
      };

      const url = `${this.baseUrl}${fullPath}`;
      const response = await axios({
        method,
        url,
        headers,
        params: method === 'GET' ? params : undefined,
        data: method !== 'GET' ? data : undefined,
      });

      return response.data;
    } catch (error) {
      console.error(`Error in ${path}:`, error.response?.data || error.message);
      return null;
    }
  }

  // Get instrument details for a given symbol
  async getInstruments(symbol) {
    const instId = symbol.replace('/', '-');
    const path = '/api/v1/market/instruments';
    const params = { instId };
    const response = await this.request('GET', path, params);
    if (response && response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  }

  // Convert an asset amount (in base asset units) to the number of contracts.
  // Uses the contractValue field (BTC per contract) and checks against minSize.
  async convertAssetToContracts(symbol, assetAmount) {
    const instrument = await this.getInstruments(symbol);
    if (!instrument) {
      throw new Error(`Instrument ${symbol} not found`);
    }
    const contractValue = parseFloat(instrument.contractValue); // e.g., 0.001 BTC per contract
    const minSize = parseFloat(instrument.minSize); // minimum contracts, e.g., 0.1
    // Calculate the number of contracts required for the provided asset amount.

    const contracts = assetAmount / contractValue;
    
    console.log(`assetAmount: ${assetAmount} contractValue: ${contractValue} minSize: ${minSize} contracts: ${contracts}`);

    if (contracts < minSize) {
      throw new Error(
        `Asset amount too low: minimum order size is ${minSize * contractValue} ${instrument.baseCurrency}`
      );
    }
    // Optionally, adjust to lot size if provided (falling back to minSize if not)
    const lotSize = instrument.lotSize ? parseFloat(instrument.lotSize) : minSize;
    // Round down to nearest multiple of lotSize:
    const adjustedContracts = Math.floor(contracts / lotSize) * lotSize;
    // Ensure the adjusted value is not less than minSize:
    const decimalPlaces = (minSize.toString().split('.')[1] || '').length;
    return parseFloat((adjustedContracts < minSize ? minSize : adjustedContracts).toFixed(decimalPlaces));

    //return adjustedContracts < minSize ? minSize : adjustedContracts;
  }

  // Convert an asset amount (in base asset units) to the number of contracts.
  // Uses the contractValue field (BTC per contract) and checks against minSize.
  async convertContractsToAsset(symbol, contractsAmount) {
    const instrument = await this.getInstruments(symbol);
    if (!instrument) {
      throw new Error(`Instrument ${symbol} not found`);
    }
    const contractValue = parseFloat(instrument.contractValue); // e.g., 0.001 BTC per contract
    const minSize = parseFloat(instrument.minSize); // minimum contracts, e.g., 0.1
    // Calculate the number of contracts required for the provided asset amount.
    const assetAmount = contractsAmount * contractValue;
    
    return assetAmount;
  }

  // Get current price using the Tickers endpoint.
  // Returns a number (parsed from string).
  async getCurrentPrice(symbol) {
    const instId = symbol.replace('/', '-');
    const path = '/api/v1/market/tickers';
    const params = { instId };
    const data = await this.request('GET', path, params);
    if (data && data.data && data.data.length > 0) {
      return parseFloat(data.data[0].last);
    }
    return null;
  }

  // Place a market order.
  // The 'amount' parameter is in the base asset (e.g., BTC). It is converted to contract size.
  async placeOrder(symbol, side, assetAmount) {
    try {
        const instId = symbol.replace('/', '-');
        // Convert asset amount (e.g., in BTC) to number of contracts.
        const sizeContracts = await this.convertAssetToContracts(symbol, assetAmount);
        const lowerSide = side.toLowerCase();

        const orderPath = '/api/v1/trade/order';
        const orderData = {
            instId,
            marginMode: 'isolated',    // or 'cross' based on your account preference
            positionSide: 'net',       // use 'net' unless using Hedge Mode
            side: lowerSide,
            orderType: 'market',
            size: sizeContracts.toString(),
        };

        const orderResponse = await this.request('POST', orderPath, {}, orderData);
        
        // Check if order was successful
        if (orderResponse && orderResponse.code === "0" && orderResponse.data && orderResponse.data.length > 0 && orderResponse.data[0].orderId) {
            orderResponse.success = true;
            return orderResponse;
        } else {
            orderResponse.success = false;
            return null;
        }
    } catch (error) {
        console.error('Error placing order:', error.message);
        return null;
    }
  }

  async closePosition(symbol, side, quantity) {
    try {
      const instId = symbol.replace('/', '-');
      const path = '/api/v1/trade/close-position';
      
      // Convert asset quantity to contracts
      const sizeContracts = await this.convertAssetToContracts(symbol, quantity);

      const closeData = {
        instId,
        marginMode: 'isolated',
        positionSide: 'net',
        side: side.toLowerCase() === 'buy' ? 'sell' : 'buy', // Opposite side to close
        size: sizeContracts.toString()
      };

      console.log('Closing position with data:', JSON.stringify(closeData, null, 2));
      const response = await this.request('POST', path, {}, closeData);

      if (response && response.code === "0") {
        return { 
          success: true,
          data: response.data };
      }
      return { success: false, error: response?.msg || 'Unknown error' };
    } catch (error) {
      console.error('Error closing position:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Set leverage using the '/api/v1/account/set-leverage' endpoint.
  async setLeverage(symbol, leverage, marginMode = 'isolated', positionSide = 'net') {
    try {
      const instId = symbol.replace('/', '-');
      const path = '/api/v1/account/set-leverage';
      const data = {
        instId,
        leverage: leverage.toString(),
        marginMode,
        positionSide,
      };
      const response = await this.request('POST', path, {}, data);
      return response;
    } catch (error) {
      console.error('Error setting leverage:', error.message);
      return null;
    }
  }

  // Get position for a given symbol.
  async getPositions() {
    try {
      //const instId = symbol.replace('/', '-');
      const path = '/api/v1/account/positions';
      //const data = { instId };
      const response = await this.request('GET', path, {}, {});

      if (response && response.code === "0" && response.data && response.data.length > 0) {
        /*const result = response.data[0];

        if (parseFloat(result.positions) > 0)
          result['side'] = 'BUY';
        else
          result['side'] = 'SELL';

        result['quantity'] = await this.convertContractsToAsset(instId, result.positions);
        result.averagePrice = parseFloat(result.averagePrice);

        return result;*/
        return response.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching positions:', error.message);
      return null;
    }
  }

  async getOrderExecutionPrice(symbol) {
    try {
      const instId = symbol.replace('/', '-');
      const path = `/api/v1/trade/fills-history?instId=${instId}&limit=1`;
      const data = { 
        instId
      };
      const response = await this.request('GET', path, {}, {});

      if (response?.code === "0" && response.data?.length > 0) {
        // Extract filled price from the first fill (adjust based on API response structure)
        return parseFloat(response.data[0].fillPrice);
      }
      return null;
    } catch (error) {
      console.error('Error fetching order details:', error.message);
      return null;
    }
  }
}

function generateOrderId() {
  // Generate 4 random bytes (32 bits) and convert to 8-digit number
  const buffer = crypto.randomBytes(4);
  const number = buffer.readUInt32BE(0); // 0 to 4294967295
  return String(number).padStart(8, '0').slice(-8); // Ensure 8 digits
}

module.exports = new BloFinExchange();
