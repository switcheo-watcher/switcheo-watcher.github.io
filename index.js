const bs58 = require('bs58');
const https = require('https');

const defaultContractHash = 'a32bcf5d7082f740a4007b16e812cf66a457c3d4';

function getSwitcheoHexFromAddress(address) {
  if (address.substring(0,1) != 'A') {
    throw "Address has incorrect format!";
  }
  const bytes = bs58.decode(address);
  const bytesstr = bytes.reverse().toString('hex');
  if (bytesstr.length != 50) {
    throw "Address is incorrect!";
  }

  const swtchAdd = bytesstr.substring(8,48);

  return swtchAdd;
}

function getOrdersFromAddress(address) {
  swtchAdd = getSwitcheoHexFromAddress(address);
  const options = {
    host: 'api.switcheo.network',
    path: '/v2/orders?address=' + swtchAdd +
    '&contract_hash=' + defaultContractHash, // + '&order_status=open',
    method: 'GET'
  };

  return new Promise ((resolve, reject) => {
    var chunks = [];
    https.get(options, res => {
      
      res.on("data", function(chunk) {
        chunks.push(chunk);
      });
      res.on("end", function() {
            httpString = Buffer.concat(chunks).toString('utf-8');
            try {
              json = JSON.parse(httpString)
              resolve(json);
            } catch (e) {
              reject(e);
            }
          });
    }).on('error', function(e) {
      reject(e);
    });
  });
}


function formatOrdersToHTML(ordersJSON, orderStatus = null) {

  if (orderStatus != null) {
    ordersJSON = ordersJSON.filter((value, index, array) => {
      return value['order_status'].toLowerCase() == orderStatus.toLowerCase();
    });
  }

  var retString = '';

  for (var i = 0; i < ordersJSON.length; i++) {
    const thisOrder = ordersJSON[i];
    var pair = thisOrder['pair'];
    var side = thisOrder['side'];

    var currencyOffer, currencyWant;

    if (side == 'sell') {
      currencyOffer = thisOrder['pair'].split("_")[0];
      currencyWant  = thisOrder['pair'].split("_")[1];
    } else {
      currencyOffer = thisOrder['pair'].split("_")[1];
      currencyWant  = thisOrder['pair'].split("_")[0];
    }

    var currencyOffer_Quantity = parseInt(thisOrder['offer_amount']) / 100000000;
    var currencyWant_Quantity = parseInt(thisOrder['want_amount']) / 100000000;

    var filledOffer_Quantity = 0;
    var filledWant_Quantity = 0;
    for (var j = 0; j < thisOrder['fills'].length; j++) {
      var fill = thisOrder['fills'][j];
      filledOffer_Quantity += parseInt(fill['fill_amount']) / 100000000;
      filledWant_Quantity += parseInt(fill['want_amount']) / 100000000;
    }
    percentageFilled = filledOffer_Quantity * 100 / currencyOffer_Quantity

    retString += '<div class="col-sm-4 order">';
    retString += '<p><strong>Order ID:</strong> ' + thisOrder['id'] + '</p>';
    retString += '<p>Order Status: ' + thisOrder['order_status'] + '</p>';
    retString += '<p>' + currencyOffer + ' Filled / Offer: ' + filledOffer_Quantity.toLocaleString('en-US', { minimumFractionDigits: 5 }) + ' / ' + currencyOffer_Quantity.toLocaleString('en-US', { minimumFractionDigits: 5 }) + '</p>';
    retString += '<p>' + currencyWant + ' Filled / Want: ' + filledWant_Quantity.toLocaleString('en-US', { minimumFractionDigits: 5 }) + ' / ' + currencyWant_Quantity.toLocaleString('en-US', { minimumFractionDigits: 5 }) + '</p>';
    // retString += '<p>Currency Offer: ' + currencyOffer + '</p>';
    // retString += '<p>Currency Offer Quantity: ' + currencyOffer_Quantity + '</p>';
    // retString += '<p>Filled Offer Quantity: ' + filledOffer_Quantity + '</p>';
    retString += '<div class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="' + percentageFilled + '" aria-valuemin="0" aria-valuemax="100" style="width:' + percentageFilled + '%">' + percentageFilled + '%</div></div>'
    retString += '</div>';



    // console.log(ordersJSON[i]);
  }
  return retString;
}

window.getOrdersFromAddress = getOrdersFromAddress;
window.formatOrdersToHTML = formatOrdersToHTML;

