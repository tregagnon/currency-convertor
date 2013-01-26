(function(doc) {
    'use strict';

    var form = doc.getElementById('conversion-form'),
        apiKey = '6a37312591624da8943fffedc353919e',
        url = 'http://openexchangerates.org/api/latest.json?app_id=' + apiKey,
        currenciesURL = 'http://openexchangerates.org/api/currencies.json?app_id=' + apiKey,
        decimalSep = ',';



    // Returns the exchange rate to `target` currency from `base` currency
    // Inspired from money.js
    function getConversionRate(rates, from, to, base) {

        // Make sure the base rate is in the rates object:
        rates[base] = 1;

        // Throw an error if either rate isn't in the rates array
        if ( !rates[to] || !rates[from] ) {
            throw 'fx error';
        }

        // If `from` currency = `base` currency, return the basic exchange rate for the `to` currency
        if ( from === base ) {
            return rates[to];
        }

        // If `to` currency = `base` currency, return the basic inverse rate of the `from` currency
        if ( to === base ) {
            return 1 / rates[from];
        }

        // Otherwise, return the `to` rate multipled by the inverse of the `from` rate to get the
        // relative exchange rate between the two currencies
        return rates[to] * (1 / rates[from]);
    }



    // Clean a string from a user input and return a float
    // Remove space formatting and change , to . if the user use , as a decimal separator (check settings)
    function prepareNumber(str) {
        str = str.replace(/ /g, '');
        if (decimalSep === ',') {
            str = str.replace(/,/g, '.');
        }
        return parseFloat(str);
    }



    function getConversion(evt) {
        evt.preventDefault();

        var xhr = new XMLHttpRequest(),
            fromCurr = doc.getElementById('from-currency-select').value,
            fromAmount = doc.getElementById('from-amount').value,
            toCurr = doc.getElementById('to-currency-select').value,
            toAmountEl = doc.getElementById('to-amount'),
            response,
            submitButton = doc.querySelector('input[type="submit"]');

        fromAmount = prepareNumber(fromAmount);

        console.log('Amount to convert: ' + fromAmount);

        submitButton.setAttribute('disabled', 'disabled');

        function transferComplete(evt) {
            var xhr = evt.target;
            if (xhr.status === 200 || xhr.status === 304) {
              response = JSON.parse(xhr.responseText);

              var conversionRate = getConversionRate(response.rates, fromCurr, toCurr, response.base);

              console.log('Conversion Rate between ' + fromCurr + ' and ' + toCurr + ' = ' + conversionRate);

              var result = fromAmount * conversionRate;
              toAmountEl.value = result.toFixed(3);

            } else {
                throw 'AJAX error';
            }

            submitButton.removeAttribute('disabled');
        }

        xhr.addEventListener('load', transferComplete, false);

        xhr.open('GET', url , true);
        xhr.send();
    }

    // Get up to date list of currencies from openexchanges rates and create currencies dropdown in the form
    function setupCurrenciesSelect(containers) {
        var xhr = new XMLHttpRequest(),
            selectEl,
            optionEl,
            optionTxt,
            currencies,
            currency,
            i,
            currenciesList;

        xhr.open('GET', currenciesURL, false);
        xhr.send(); // because of "false" above, will block until the request is done and status is available. Not recommended, however it works for simple cases.

        if (xhr.status === 200) {
            currencies = JSON.parse(xhr.responseText);

            currenciesList = doc.createElement('select');

            for ( currency in currencies ) {

                    optionEl = doc.createElement('option');
                    optionTxt = doc.createTextNode(currency + ' - ' + currencies[currency]);
                    optionEl.value = currency;
                    optionEl.appendChild(optionTxt);
                    currenciesList.appendChild(optionEl);
            }

            var currenciesList2 = currenciesList.cloneNode(true);

            currenciesList.id = containers[0].id + '-select';
            containers[0].appendChild(currenciesList);

            currenciesList2.id = containers[0].id + '-select';
            containers[0].appendChild(currenciesList2);

            for (i = 0 ; i < containers.length ; i += 1) {
                console.log(containers[i]);
                currenciesList.id = containers[i].id + '-select';
                containers[i].appendChild(currenciesList);
            }
        }
    }

setupCurrenciesSelect(
    [
        doc.getElementById('from-currency'),
        doc.getElementById('to-currency')
    ]);

form.addEventListener('submit', getConversion, false);

})(document);
