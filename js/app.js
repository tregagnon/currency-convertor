(function(doc) {
    'use strict';

    var form = doc.getElementById('conversion-form'),
        apiKey = '6a37312591624da8943fffedc353919e',
        ratesUrl = 'http://openexchangerates.org/api/latest.json?app_id=' + apiKey,
        currenciesURL = 'http://openexchangerates.org/api/currencies.json?app_id=' + apiKey,
        decimalSep = ',';


    // Returns the exchange rate to `target` currency from `base` currency
    // Inspired from money.js
    var getConversionRate = function (rates, from, to, base) {

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
    };


    // Clean a string from a user input and return a float
    // Remove space formatting and change , to . if the user use , as a decimal separator (check settings)
    var prepareNumber = function (str) {
        str = str.replace(/ /g, '');
        if (decimalSep === ',') {
            str = str.replace(/,/g, '.');
        }
        return parseFloat(str);
    };


    var convertAmount = function (fromAmount, conversionRate) {
        return fromAmount * conversionRate;
    };

    // get stored rates
    var getRates = function () {
        var key = 'rates',
            data;

        console.log('Get rates from localStorage');

        data = readData(key);

        return JSON.parse(data);
    };

    // get stored currencies
    var getCurrencies = function () {
        var key = 'currencies',
            data;

        console.log('Get currencies from localStorage');

        data = readData(key);

        return JSON.parse(data);
    };

    /********* Cache Data functions *********/

    // Retrieve Data stored for later use (simple function for now, should be improved for no localStorage support)
    var readData = function(key) {
        return localStorage.getItem(key);
    };
    // Store Data for later retrieval (simple function for now, should be improved for no localStorage support)
    var storeData = function(key, data) {
        var date = Date();

        localStorage.setItem(key, data);
        localStorage.setItem(key + '-date', date.toString());
    };


    /********* Fetching Fresh Data functions *********/

    var fetchRates = function(callback) {
        var xhr = new XMLHttpRequest(),
            response;

        function transferComplete(evt) {
            var xhr = evt.target;
            if (xhr.status === 200 || xhr.status === 304) {
                response = JSON.parse(xhr.responseText);

                console.log('Rates retrieved from Web Service');

                if (typeof callback === 'function') {
                    callback('rates', xhr.responseText);
                }

            } else {
                throw 'AJAX error';
            }
        }

        xhr.addEventListener('load', transferComplete, false);

        console.log('Start XHR for Rates');
        xhr.open('GET', ratesUrl , true);
        xhr.send();
    };

    var fetchCurrencies = function(callback) {
        var xhr = new XMLHttpRequest(),
            response;

        function transferComplete(evt) {
            var xhr = evt.target;
            if (xhr.status === 200 || xhr.status === 304) {
                response = JSON.parse(xhr.responseText);

                console.log('Currencies retrieved from Web Service');

                if (typeof callback === 'function') {
                    callback('currencies', xhr.responseText);
                }

            } else {
                throw 'AJAX error';
            }
        }

        xhr.addEventListener('load', transferComplete, false);

        console.log('Start XHR for Currencies');
        xhr.open('GET', currenciesURL , true);
        xhr.send();
    };

    /********* View Related Functions *********/

    var processForm = function (evt) {
        evt.preventDefault();

        var form = evt.target,
            fromCurr = doc.getElementById('from-currency-select').value,
            toCurr = doc.getElementById('to-currency-select').value,
            fromAmount = doc.getElementById('from-amount').value,
            submitButton = form.querySelector('input[type="submit"]'),
            toAmountEl = doc.getElementById('to-amount'),
            conversionRate,
            rates,
            result;

        submitButton.setAttribute('disabled', 'disabled');

        fromAmount = prepareNumber(fromAmount);
        console.log('Amount to convert: ' + fromAmount);

        rates = getRates();

        conversionRate = getConversionRate(rates.rates, fromCurr, toCurr, rates.base);
        console.log('Conversion Rate between ' + fromCurr + ' and ' + toCurr + ' = ' + conversionRate);

        result = convertAmount(fromAmount, conversionRate);

        // Display converted amount
        toAmountEl.value = result.toFixed(3);

        submitButton.removeAttribute('disabled');
    };

    var setupCurrenciesHtml = function (key, data) {

        var currencies,
            containers = [
                doc.getElementById('from-currency'),
                doc.getElementById('to-currency')
            ],
            currenciesList,
            currency,
            optionEl,
            optionTxt,
            i;

        if (typeof key !== 'undefined' && typeof data !== 'undefined') {
            storeData(key, data);
        }

        currencies = getCurrencies();

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
    };

    var init = function() {

        console.log('Init App');

        // set Rates
        var ratesDate = readData('rates-date'),
            currenciesDate = readData('currencies-date'),
            now = Date.now(),
            diffDateRates,
            diffDateCurrencies,
            cacheLimit = 86400000; // 1 day

        if (currenciesDate) {
            currenciesDate = Date.parse(currenciesDate);
            diffDateCurrencies =  now - currenciesDate.value;

            if (diffDateCurrencies > cacheLimit) {
                console.log('Cached currencies too old, retrieving fresh currencies from Web service');
                fetchCurrencies(setupCurrenciesHtml);
            } else {
                setupCurrenciesHtml();
            }
        } else {
            console.log('Currencies never cached, retrieving currencies from Web service');
            fetchCurrencies(setupCurrenciesHtml);
        }

        if (ratesDate) {
            ratesDate = Date.parse(ratesDate);
            diffDateRates =  now - ratesDate.value;

            if (diffDateRates > cacheLimit) {
                console.log('Cached rates too old, retrieving fresh rates from Web service');
                fetchRates(storeData);
            }
        } else {
            console.log('Rates never cached, retrieving rates from Web service');
            fetchRates(storeData);
        }
    };

    doc.addEventListener('DOMContentLoaded', init, false);

    form.addEventListener('submit', processForm, false);

})(document);
